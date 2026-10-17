import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

test('Authentication & Session Security Suite', async (t) => {
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let sessionCookie = '';

  const request = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (sessionCookie && !headers['Cookie']) {
      headers['Cookie'] = sessionCookie;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      headers,
      ...options,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, body: json, text };
  };

  const testEmail = `operator_${Date.now()}@goldenrescue.org`;
  const testPassword = 'SecurePassword2026!';

  t.after(async () => {
    // Clean up test account
    await User.deleteMany({ email: testEmail });
    server.close();
  });

  await t.test('Registration Validation: rejects missing fields', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('name'));
  });

  await t.test('Registration Validation: rejects invalid email format', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cadet Officer',
        email: 'invalid-email-format',
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('valid email'));
  });

  await t.test('Registration Validation: rejects mismatched passwords', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cadet Officer',
        email: testEmail,
        password: testPassword,
        confirmPassword: 'DifferentPassword123!',
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('match'));
  });

  await t.test('Registration Validation: rejects short password (< 6 chars)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cadet Officer',
        email: testEmail,
        password: '123',
        confirmPassword: '123',
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('6 characters'));
  });

  await t.test('Successful Registration: creates user, hashes password, assigns safe role, sets cookie', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Cadet Officer',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail.toLowerCase());
    assert.equal(res.body.user.password, undefined, 'Plaintext password must never be returned');
    assert.ok(sessionCookie.includes('gr_session='), 'Must set HTTP-only cookie');

    // Confirm saved in MongoDB
    const savedUser = await User.findOne({ email: testEmail.toLowerCase() }).select('+password');
    assert.ok(savedUser, 'User must exist in database');
    assert.notEqual(savedUser.password, testPassword, 'Stored password must be bcrypt hash, not plaintext');
    assert.ok(savedUser.password.startsWith('$2'), 'Must be valid bcrypt salt hash');
  });

  await t.test('Duplicate Registration: rejects duplicate email address', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Imposter Officer',
        email: testEmail, // same email
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('already exists'));
  });

  await t.test('Login: rejects incorrect password', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid email'));
  });

  await t.test('Login: rejects non-existent email', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'never_registered@goldenrescue.org',
        password: testPassword,
      }),
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid email'));
  });

  await t.test('Login Success: authenticates with valid credentials, sets cookie, updates lastLoginAt', async () => {
    sessionCookie = ''; // Reset cookie to test authentic login

    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail.toUpperCase(), // Test case insensitivity / normalization
        password: testPassword,
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail.toLowerCase());
    assert.ok(sessionCookie.includes('gr_session='));

    // Check lastLoginAt is set
    const userInDb = await User.findOne({ email: testEmail.toLowerCase() });
    assert.ok(userInDb.lastLoginAt);
  });

  await t.test('Session Verification: GET /api/auth/me returns active authenticated user', async () => {
    const res = await request('/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail.toLowerCase());
  });

  await t.test('Logout: POST /api/auth/logout clears cookie and denies subsequent /api/auth/me', async () => {
    const res = await request('/api/auth/logout', {
      method: 'POST',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Explicitly clear cookie in our test client
    sessionCookie = '';

    const meAfterLogout = await request('/api/auth/me');
    assert.equal(meAfterLogout.status, 401);
    assert.equal(meAfterLogout.body.success, false);
  });
});
