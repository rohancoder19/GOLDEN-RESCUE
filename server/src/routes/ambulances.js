import express from 'express';
import { Ambulance } from '../models/Ambulance.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastEvent } from '../sockets/socketHandler.js';

const router = express.Router();

const VALID_AMBULANCE_STATUSES = [
  'AVAILABLE',
  'ASSIGNED',
  'EN_ROUTE',
  'AT_SCENE',
  'TRANSPORTING',
  'OUT_OF_SERVICE',
];

/**
 * GET /api/ambulances - List all ambulances
 */
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;

    const ambulances = await Ambulance.find(query).sort({ vehicleId: 1 });
    res.json({ success: true, count: ambulances.length, ambulances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ambulances/:id - Get ambulance details
 */
router.get('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findOne({ vehicleId: req.params.id });
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found' });
    }
    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/ambulances/:id/status - Update ambulance status with validation
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_AMBULANCE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: '${status}'. Allowed values: ${VALID_AMBULANCE_STATUSES.join(', ')}`,
      });
    }

    const ambulance = await Ambulance.findOne({ vehicleId: req.params.id });
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found' });
    }

    ambulance.status = status;
    if (status === 'AVAILABLE') {
      ambulance.assignedIncidentId = null;
      ambulance.speedKmh = 0;
    }
    await ambulance.save();

    await AuditLog.create({
      action: 'AMBULANCE_STATUS_UPDATE',
      targetEntity: { entityType: 'AMBULANCE', entityId: ambulance.vehicleId },
      details: { newStatus: status },
    });

    broadcastEvent('ambulance:status_change', ambulance);

    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/ambulances/:id/location - Update ambulance coordinates (simulated GPS ping) with bounds checking
 */
router.patch('/:id/location', async (req, res) => {
  try {
    const { coordinates, heading, speedKmh } = req.body;
    const ambulance = await Ambulance.findOne({ vehicleId: req.params.id });
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found' });
    }

    if (coordinates) {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return res.status(400).json({ success: false, error: 'Coordinates must be [latitude, longitude]' });
      }
      const lat = Number(coordinates[0]);
      const lng = Number(coordinates[1]);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ success: false, error: 'Latitude must be -90..90 and Longitude -180..180' });
      }
      ambulance.location.coordinates = [lat, lng];
    }

    if (heading !== undefined) {
      const h = Number(heading);
      if (!isNaN(h)) ambulance.location.heading = (h % 360 + 360) % 360;
    }
    if (speedKmh !== undefined) {
      const s = Number(speedKmh);
      if (!isNaN(s) && s >= 0) ambulance.location.speedKmh = Math.min(180, s);
    }

    await ambulance.save();
    broadcastEvent('ambulance:location_update', ambulance);

    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
