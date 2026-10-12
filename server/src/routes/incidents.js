import express from 'express';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { runEmergencyAiPipeline } from '../ai/pipeline.js';
import { broadcastEvent } from '../sockets/socketHandler.js';

const router = express.Router();

/**
 * GET /api/incidents - List incidents with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { severity, status, category, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (severity && severity !== 'ALL') query.severity = severity;
    if (status && status !== 'ALL') query.status = status;
    if (category && category !== 'ALL') query.category = category;

    if (search && search.trim() !== '') {
      const term = search.trim();
      query.$or = [
        { incidentId: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { 'location.address': { $regex: term, $options: 'i' } },
      ];
    }

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: incidents.length, total, incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/incidents/:id - Get single incident
 */
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findOne({
      $or: [{ incidentId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // Fetch related ambulance and hospital if assigned
    let assignedAmbulance = null;
    let recommendedHospital = null;

    if (incident.assignedAmbulanceId) {
      assignedAmbulance = await Ambulance.findOne({ vehicleId: incident.assignedAmbulanceId });
    }
    if (incident.recommendedHospitalId) {
      recommendedHospital = await Hospital.findOne({ hospitalId: incident.recommendedHospitalId });
    }

    res.json({ success: true, incident, assignedAmbulance, recommendedHospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/incidents - Create new emergency report & run AI pipeline
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    // Generate unique Incident ID e.g. INC-2026-XXXX
    const count = await Incident.countDocuments();
    const incidentId = `INC-2026-${String(count + 1001).padStart(4, '0')}`;

    // Fetch current fleet and hospitals for AI context
    const ambulances = await Ambulance.find();
    const hospitals = await Hospital.find();

    // Run modular 7-stage AI engine
    const aiResult = await runEmergencyAiPipeline(payload, ambulances, hospitals);

    const newIncident = new Incident({
      incidentId,
      title: payload.title || 'Reported Emergency Incident',
      category: payload.category || 'OTHER',
      description: payload.description || 'Emergency alert received at dispatch center.',
      severity: aiResult.severity,
      priorityScore: aiResult.priorityScore,
      status: 'REPORTED',
      location: {
        address: payload.location?.address || 'Metro Downtown Sector 4',
        coordinates: payload.location?.coordinates || [37.7749, -122.4194],
        district: payload.location?.district || 'Central District',
      },
      source: payload.source || 'OPERATOR_MANUAL',
      callerInfo: payload.callerInfo || { name: 'Anonymous', phone: '+1 (555) 000-0000' },
      assignedAmbulanceId: null, // Awaiting operator confirmation
      recommendedHospitalId: aiResult.recommendedHospital?.hospitalId || null,
      recommendedHospitalName: aiResult.recommendedHospital?.name || null,
      routeData: aiResult.routeData,
      aiTriage: {
        summary: aiResult.clinicalRecommendation,
        confidence: aiResult.confidence,
        factors: aiResult.factors,
        agentsTrail: aiResult.agentLogs,
        clinicalRecommendation: aiResult.clinicalRecommendation,
      },
      timeline: [
        {
          stage: 'REPORTED',
          timestamp: new Date(),
          actor: payload.source || 'Dispatch Ingestion',
          note: `Incident registered via ${payload.source || 'Terminal'}`,
        },
        {
          stage: 'AI_TRIAGED',
          timestamp: new Date(),
          actor: 'AI Decision Engine',
          note: `Triage complete: ${aiResult.severity} (${aiResult.priorityScore}/100)`,
        },
      ],
      timestamps: {
        reportedAt: new Date(),
        triagedAt: new Date(),
      },
      dataSource: payload.isSimulated ? 'SIMULATED_DEMO' : 'USER_SUBMITTED',
      isSimulated: !!payload.isSimulated,
    });

    await newIncident.save();

    // Log audit
    await AuditLog.create({
      action: 'INCIDENT_CREATED',
      incidentId: newIncident.incidentId,
      targetEntity: { entityType: 'INCIDENT', entityId: newIncident.incidentId },
      details: { title: newIncident.title, severity: newIncident.severity },
    });

    broadcastEvent('incident:created', newIncident);

    res.status(201).json({
      success: true,
      incident: newIncident,
      aiPipelineResult: aiResult,
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/incidents/:id/dispatch - Confirm or override dispatch
 */
router.post('/:id/dispatch', async (req, res) => {
  try {
    const { ambulanceId, hospitalId, operatorNote } = req.body;
    const incident = await Incident.findOne({ incidentId: req.params.id });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cannot dispatch resolved or cancelled incident' });
    }

    // Verify ambulance availability
    const targetAmbulanceId = ambulanceId || incident.assignedAmbulanceId;
    if (!targetAmbulanceId) {
      return res.status(400).json({ success: false, error: 'No ambulance specified for dispatch' });
    }

    const ambulance = await Ambulance.findOne({ vehicleId: targetAmbulanceId });
    if (!ambulance) {
      return res.status(404).json({ success: false, error: `Ambulance ${targetAmbulanceId} not found` });
    }

    // Check if ambulance is already assigned to a DIFFERENT active incident
    if (ambulance.status !== 'AVAILABLE' && ambulance.assignedIncidentId !== incident.incidentId) {
      return res.status(409).json({
        success: false,
        error: `Unit ${ambulance.callsign} (${ambulance.vehicleId}) is currently ${ambulance.status} on incident ${ambulance.assignedIncidentId}. Please select an available unit.`,
      });
    }

    // Update Ambulance to EN_ROUTE
    ambulance.status = 'EN_ROUTE';
    ambulance.assignedIncidentId = incident.incidentId;
    ambulance.speedKmh = 58; // In transit
    await ambulance.save();

    // Update Incident
    incident.status = 'DISPATCHED';
    incident.assignedAmbulanceId = ambulance.vehicleId;
    incident.assignedAmbulanceCallsign = ambulance.callsign;
    if (hospitalId) {
      const hospital = await Hospital.findOne({ hospitalId });
      if (hospital) {
        incident.recommendedHospitalId = hospital.hospitalId;
        incident.recommendedHospitalName = hospital.name;
      }
    }
    incident.timestamps.dispatchedAt = new Date();
    incident.timeline.push({
      stage: 'DISPATCHED',
      timestamp: new Date(),
      actor: 'Authorized Operator (Delta-7)',
      note: operatorNote || `Dispatched unit ${ambulance.callsign} (${ambulance.type}) to ${incident.location.address}`,
    });

    await incident.save();

    // Audit log
    await AuditLog.create({
      action: 'AMBULANCE_DISPATCHED',
      incidentId: incident.incidentId,
      severity: 'CRITICAL_DISPATCH',
      targetEntity: { entityType: 'AMBULANCE', entityId: ambulance.vehicleId },
      details: {
        ambulanceId: ambulance.vehicleId,
        callsign: ambulance.callsign,
        hospitalId: incident.recommendedHospitalId,
      },
    });

    // Broadcast WebSocket updates
    broadcastEvent('incident:dispatched', { incident, ambulance });
    broadcastEvent('ambulance:status_change', ambulance);

    res.json({ success: true, incident, ambulance });
  } catch (error) {
    console.error('Error dispatching ambulance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/incidents/:id/status - Update incident lifecycle status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validTransitions = ['REPORTED', 'TRIAGED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'RESOLVED', 'CANCELLED'];

    if (!validTransitions.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
    }

    const incident = await Incident.findOne({ incidentId: req.params.id });
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    incident.status = status;
    const now = new Date();

    if (status === 'EN_ROUTE') incident.timestamps.enRouteAt = now;
    if (status === 'ON_SCENE') incident.timestamps.arrivedAt = now;
    if (status === 'TRANSPORTING') incident.timestamps.transportingAt = now;
    if (status === 'RESOLVED') incident.timestamps.resolvedAt = now;

    incident.timeline.push({
      stage: status,
      timestamp: now,
      actor: 'Paramedic Field Unit / Dispatcher',
      note: note || `Status updated to ${status}`,
    });

    // Sync ambulance status
    if (incident.assignedAmbulanceId) {
      const amb = await Ambulance.findOne({ vehicleId: incident.assignedAmbulanceId });
      if (amb) {
        if (status === 'ON_SCENE') {
          amb.status = 'AT_SCENE';
          amb.speedKmh = 0;
        } else if (status === 'TRANSPORTING') {
          amb.status = 'TRANSPORTING';
          amb.speedKmh = 52;
        } else if (status === 'RESOLVED' || status === 'CANCELLED') {
          amb.status = 'AVAILABLE';
          amb.assignedIncidentId = null;
          amb.speedKmh = 0;
        }
        await amb.save();
        broadcastEvent('ambulance:status_change', amb);
      }
    }

    await incident.save();

    await AuditLog.create({
      action: `INCIDENT_STATUS_${status}`,
      incidentId: incident.incidentId,
      targetEntity: { entityType: 'INCIDENT', entityId: incident.incidentId },
      details: { newStatus: status, note },
    });

    broadcastEvent('incident:updated', incident);

    res.json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
