import express from 'express';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/audit - List audit logs with limit & filtering
 */
router.get('/', async (req, res) => {
  try {
    const { incidentId, limit = 50 } = req.query;
    const query = {};
    if (incidentId) query.incidentId = incidentId;

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
