import express from 'express';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/audit - List audit logs with limit & filtering
 */
router.get('/', async (req, res) => {
  try {
    const { incidentId, limit = 50, page = 1 } = req.query;
    const query = {};
    if (incidentId) query.incidentId = incidentId;

    const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const parsedPage = Math.max(1, Number(page) || 1);

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.json({ success: true, count: logs.length, total, page: parsedPage, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Explicitly reject modification or deletion of operational audit logs
router.all('*', (req, res, next) => {
  if (req.method === 'GET') return next();
  res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed on audit logs. Operational audit trail is write-restricted to authorized internal system events.`,
  });
});

export default router;
