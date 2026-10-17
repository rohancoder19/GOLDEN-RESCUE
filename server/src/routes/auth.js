import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  JWT_SECRET,
  COOKIE_NAME,
  requireAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from '../middleware/auth.js';

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register - Register a new dispatcher account
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // 3. Prevent duplicate registrations
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // 4. Securely hash password
    const hashedPassword = await User.hashPassword(password);

    // 5. Generate identifiers
    const userCount = await User.countDocuments();
    const userId = `USR-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
    const badgeId = `GR-${Math.floor(1000 + Math.random() * 9000)}`;

    // Safe default role: DISPATCHER (if first registered user in empty DB, promote to ADMIN for initial setup)
    const assignedRole = userCount === 0 ? 'ADMIN' : 'DISPATCHER';

    const newUser = new User({
      userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      badgeId,
      lastLoginAt: new Date(),
    });

    await newUser.save();

    // 6. Generate signed JWT session token
    const token = jwt.sign(
      {
        userId: newUser.userId,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        badgeId: newUser.badgeId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Set secure HTTP-only cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    // 8. Log registration in audit trail
    try {
      await AuditLog.create({
        operator: { name: newUser.name, role: newUser.role, badgeId: newUser.badgeId },
        action: 'USER_REGISTERED',
        targetEntity: { entityType: 'SYSTEM_CONFIG', entityId: newUser.userId },
        details: { email: newUser.email, role: newUser.role, badgeId: newUser.badgeId },
      });
    } catch (auditErr) {
      console.warn('[Auth] Audit log notice:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: newUser.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login - Authenticate with email & password
 */
router.post('/login', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    // 1. Check rate limit
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Query user including hashed password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      recordFailedLogin(clientIp);
      return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      recordFailedLogin(clientIp);
      return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact your dispatch administrator.',
      });
    }

    // 4. Reset failed login attempts on success
    clearLoginRateLimit(clientIp);

    // 5. Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // 6. Sign JWT session token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        badgeId: user.badgeId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Set secure HTTP-only cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    // 8. Log in audit trail
    try {
      await AuditLog.create({
        operator: { name: user.name, role: user.role, badgeId: user.badgeId },
        action: 'USER_LOGGED_IN',
        targetEntity: { entityType: 'SYSTEM_CONFIG', entityId: user.userId },
        details: { email: user.email, role: user.role, ip: clientIp },
      });
    } catch (auditErr) {
      console.warn('[Auth] Audit log notice:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Authentication successful.',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me - Verify session & fetch active user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session user no longer exists in database.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated.',
      });
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout - Clear session cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: 'Signed out successfully.',
  });
});

/**
 * Helper to ensure a baseline demo operator exists so user can log in immediately
 */
export async function seedDemoAccountsIfEmpty() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[Auth] 👤 No users found. Seeding initial baseline Dispatcher & Admin accounts...');

      const adminPassword = await User.hashPassword('GoldenAdmin2026!');
      const operatorPassword = await User.hashPassword('OperatorPass123!');

      await User.insertMany([
        {
          userId: 'USR-ADMIN-01',
          name: 'Cmdr. Sarah Thompson',
          email: 'admin@goldenrescue.org',
          password: adminPassword,
          role: 'ADMIN',
          badgeId: 'GR-8801',
          isActive: true,
        },
        {
          userId: 'USR-DISP-02',
          name: 'Officer Marcus Vance',
          email: 'dispatcher@goldenrescue.org',
          password: operatorPassword,
          role: 'DISPATCHER',
          badgeId: 'GR-8802',
          isActive: true,
        },
      ]);
      console.log('[Auth] ✅ Default accounts ready: admin@goldenrescue.org and dispatcher@goldenrescue.org');
    }
  } catch (err) {
    console.warn('[Auth] Seeding notice:', err.message);
  }
}

export default router;
