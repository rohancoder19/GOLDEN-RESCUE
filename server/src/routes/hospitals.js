import express from 'express';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastEvent } from '../sockets/socketHandler.js';

const router = express.Router();

const VALID_HOSPITAL_STATUSES = [
  'ACCEPTING_ALL',
  'ACCEPTING_CRITICAL_ONLY',
  'DIVERTING_AMBULANCES',
];

/**
 * GET /api/hospitals - List all hospitals
 */
router.get('/', async (req, res) => {
  try {
    const { status, traumaLevel } = req.query;
    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (traumaLevel && traumaLevel !== 'ALL') query.traumaLevel = traumaLevel;

    const hospitals = await Hospital.find(query).sort({ 'capacity.icuAvailable': -1 });
    res.json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hospitals/:id - Get single hospital details
 */
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/hospitals/:id/capacity - Update hospital capacity or status with validation
 */
router.patch('/:id/capacity', async (req, res) => {
  try {
    const { availableBeds, icuAvailable, status } = req.body;
    const hospital = await Hospital.findOne({ hospitalId: req.params.id });
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }

    if (status) {
      if (!VALID_HOSPITAL_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid hospital status: '${status}'. Allowed values: ${VALID_HOSPITAL_STATUSES.join(', ')}`,
        });
      }
      hospital.status = status;
    }

    if (availableBeds !== undefined) {
      const beds = Number(availableBeds);
      if (isNaN(beds) || beds < 0) {
        return res.status(400).json({ success: false, error: 'availableBeds must be a non-negative number' });
      }
      hospital.capacity.availableBeds = beds;
    }

    if (icuAvailable !== undefined) {
      const icu = Number(icuAvailable);
      if (isNaN(icu) || icu < 0) {
        return res.status(400).json({ success: false, error: 'icuAvailable must be a non-negative number' });
      }
      hospital.capacity.icuAvailable = icu;
    }

    hospital.lastCapacityUpdate = new Date();
    await hospital.save();

    await AuditLog.create({
      action: 'HOSPITAL_CAPACITY_UPDATE',
      targetEntity: { entityType: 'HOSPITAL', entityId: hospital.hospitalId },
      details: { availableBeds, icuAvailable, status: hospital.status },
    });

    broadcastEvent('hospital:status_change', hospital);

    res.json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
