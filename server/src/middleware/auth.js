import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'golden_rescue_jwt_secure_session_key_2026';
export const COOKIE_NAME = 'gr_session';

/**
 * Authentication Middleware:
 * Inspects HTTP-only cookie first, then Authorization: Bearer header.
 * Attaches decoded user payload to req.user.
 */
export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    // 2. Fallback to Authorization: Bearer header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If token is invalid or expired, clear req.user
    req.user = null;
    next();
  }
}

/**
 * Require valid authenticated user
 */
export function requireAuth(req, res, next) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access emergency response operations.',
    });
  }
  next();
}

/**
 * Require specific role or roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
}

/**
 * In-Memory Sliding Window Login Rate Limiter
 * Protects against brute-force attacks without requiring external Redis cache
 */
const loginAttemptMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

export function checkLoginRateLimit(ip) {
  const now = Date.now();
  const clientData = loginAttemptMap.get(ip);

  if (!clientData) {
    return { isAllowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Filter out attempts older than the window
  const activeAttempts = clientData.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  loginAttemptMap.set(ip, activeAttempts);

  if (activeAttempts.length >= MAX_ATTEMPTS) {
    const oldest = activeAttempts[0];
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return { isAllowed: false, retryAfterSeconds };
  }

  return { isAllowed: true, remainingAttempts: MAX_ATTEMPTS - activeAttempts.length };
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  const current = loginAttemptMap.get(ip) || [];
  current.push(now);
  loginAttemptMap.set(ip, current);
}

export function clearLoginRateLimit(ip) {
  loginAttemptMap.delete(ip);
}
