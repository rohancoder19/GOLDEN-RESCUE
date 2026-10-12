import express from 'express';
import { Ambulance } from '../models/Ambulance.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastEvent } from '../sockets/socketHandler.js';

const router = express.Router();

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
 * PATCH /api/ambulances/:id/status - Update ambulance status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
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
 * PATCH /api/ambulances/:id/location - Update ambulance coordinates (simulated GPS ping)
 */
router.patch('/:id/location', async (req, res) => {
  try {
    const { coordinates, heading, speedKmh } = req.body;
    const ambulance = await Ambulance.findOne({ vehicleId: req.params.id });
    if (!ambulance) {
      return res.status(404).json({ success: false, error: 'Ambulance not found' });
    }

    if (coordinates && Array.isArray(coordinates)) {
      ambulance.location.coordinates = coordinates;
    }
    if (heading !== undefined) ambulance.location.heading = heading;
    if (speedKmh !== undefined) ambulance.location.speedKmh = speedKmh;

    await ambulance.save();
    broadcastEvent('ambulance:location_update', ambulance);

    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
