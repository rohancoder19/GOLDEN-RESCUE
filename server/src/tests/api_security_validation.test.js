import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';

test('API Security, Validation & Health Suite', async (t) => {
  await connectDB();

  // Spin up an ephemeral HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (path, options = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, body: json, text };
  };

  await t.test('GET /api/health: returns ONLINE status with security headers', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ONLINE');
    assert.equal(res.body.service, 'GOLDEN RESCUE OPERATIONAL ENGINE');
    assert.ok(res.body.connections.database);

    // Verify security headers
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  });

  await t.test('PATCH /api/ambulances/:id/status: rejects invalid status enum', async () => {
    const amb = await Ambulance.findOne();
    const ambId = amb?.vehicleId || 'AMB-101';
    const res = await request(`/api/ambulances/${ambId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INVALID_FLYING_STATUS' }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Invalid status'));
  });

  await t.test('PATCH /api/ambulances/:id/location: rejects out-of-bounds coordinates', async () => {
    const amb = await Ambulance.findOne();
    const ambId = amb?.vehicleId || 'AMB-101';
    const res = await request(`/api/ambulances/${ambId}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ coordinates: [180.5, -290.0] }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Latitude must be -90..90'));
  });

  await t.test('PATCH /api/hospitals/:id/capacity: rejects negative available beds', async () => {
    const hosp = await Hospital.findOne();
    const hospId = hosp?.hospitalId || 'HOSP-01';
    const res = await request(`/api/hospitals/${hospId}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify({ availableBeds: -5 }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('non-negative'));
  });

  await t.test('DELETE /api/audit: blocks modification of audit logs with 405 Method Not Allowed', async () => {
    const res = await request('/api/audit', {
      method: 'DELETE',
    });
    assert.equal(res.status, 405);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('not allowed on audit logs'));
  });

  await t.test('POST /api/incidents: rejects missing title and description', async () => {
    const res = await request('/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ title: 'A', description: 'B' }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // Shutdown ephemeral server
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});
