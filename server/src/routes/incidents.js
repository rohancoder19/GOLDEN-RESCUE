import express from 'express';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { runEmergencyAiPipeline } from '../ai/pipeline.js';
import { broadcastEvent } from '../sockets/socketHandler.js';
import { CLINICAL_DECISION_SUPPORT_DISCLAIMER } from '../ai/agents/severityAssessmentAgent.js';

const router = express.Router();

/**
 * Generate a cryptographically random, collision-resistant Incident ID
 * Format: INC-2026-XXXX (or timestamp suffix)
 */
async function generateUniqueIncidentId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timeFragment = Date.now().toString().slice(-4);
    const candidateId = `INC-2026-${timeFragment}${randomSuffix}`;
    const exists = await Incident.exists({ incidentId: candidateId });
    if (!exists) return candidateId;
  }
  return `INC-2026-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * GET /api/incidents - List incidents with optional filters & pagination
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

    const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const parsedPage = Math.max(1, Number(page) || 1);

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.json({ success: true, count: incidents.length, total, page: parsedPage, incidents });
  } catch (error) {
    console.error('[Incidents API] Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/incidents/:id - Get single incident
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { $or: [{ incidentId: id }, { _id: id }] } : { incidentId: id };

    const incident = await Incident.findOne(query);

    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
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

    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Incident title is required (minimum 3 characters).' });
    }

    if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Incident description is required (minimum 5 characters).' });
    }

    if (!payload.location?.address) {
      return res.status(400).json({ success: false, error: 'Incident location address is required.' });
    }

    // Generate collision-resistant unique ID
    const incidentId = await generateUniqueIncidentId();

    // Fetch current fleet and hospitals for AI context
    const ambulances = await Ambulance.find();
    const hospitals = await Hospital.find();

    // Run modular 7-stage AI engine
    const aiResult = await runEmergencyAiPipeline(payload, ambulances, hospitals);

    const newIncident = new Incident({
      incidentId,
      title: (payload.title || '').trim(),
      category: aiResult.agentLogs?.[0]?.output?.detectedCategory || payload.category || 'OTHER',
      description: (payload.description || '').trim(),
      severity: aiResult.severity,
      priorityScore: aiResult.priorityScore,
      status: 'REPORTED',
      location: {
        address: (payload.location?.address || 'Metro Core Zone').trim(),
        coordinates: aiResult.agentLogs?.[0]?.output?.sanitizedPayload?.location?.coordinates || [37.7749, -122.4194],
        district: payload.location?.district || 'Central District',
      },
      source: aiResult.agentLogs?.[0]?.output?.source || 'OPERATOR_MANUAL',
      callerInfo: payload.callerInfo || { name: 'Anonymous', phone: 'N/A' },
      assignedAmbulanceId: null, // Awaiting operator dispatch confirmation
      recommendedHospitalId: aiResult.recommendedHospital?.hospitalId || null,
      recommendedHospitalName: aiResult.recommendedHospital?.name || null,
      routeData: aiResult.routeData,
      aiTriage: {
        summary: aiResult.clinicalRecommendation,
        confidence: aiResult.confidence,
        factors: aiResult.factors,
        agentsTrail: aiResult.agentLogs,
        clinicalRecommendation: aiResult.clinicalRecommendation,
        clinicalDisclaimer: aiResult.clinicalDisclaimer || CLINICAL_DECISION_SUPPORT_DISCLAIMER,
      },
      timeline: [
        {
          stage: 'REPORTED',
          timestamp: new Date(),
          actor: payload.source || 'Dispatch Ingestion Gateway',
          note: `Incident registered via ${payload.source || 'Operator Console'}`,
        },
        {
          stage: 'AI_TRIAGED',
          timestamp: new Date(),
          actor: 'AI Decision Engine (Gemini 2.5 Flash)',
          note: `Triage complete: ${aiResult.severity} (${aiResult.priorityScore}/100) with ${aiResult.confidence}% confidence`,
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
      details: { title: newIncident.title, severity: newIncident.severity, dataSource: newIncident.dataSource },
    });

    broadcastEvent('incident:created', newIncident);

    res.status(201).json({
      success: true,
      incident: newIncident,
      aiPipelineResult: aiResult,
    });
  } catch (error) {
    console.error('[Incidents API] Error creating incident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/incidents/:id/dispatch - Confirm or override dispatch
 * Prevents race condition via atomic Ambulance findOneAndUpdate
 */
router.post('/:id/dispatch', async (req, res) => {
  try {
    const { ambulanceId, hospitalId, operatorNote } = req.body;
    const incident = await Incident.findOne({ incidentId: req.params.id });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch ${incident.status.toLowerCase()} incident (${incident.incidentId}). Re-open incident first.`,
      });
    }

    // Determine target ambulance
    const targetAmbulanceId = ambulanceId || incident.assignedAmbulanceId;
    if (!targetAmbulanceId) {
      return res.status(400).json({ success: false, error: 'No ambulance specified for dispatch' });
    }

    // ATOMIC ACQUISITION: Only succeeds if ambulance is AVAILABLE or already assigned to THIS incident
    const ambulance = await Ambulance.findOneAndUpdate(
      {
        vehicleId: targetAmbulanceId,
        $or: [
          { status: 'AVAILABLE' },
          { assignedIncidentId: incident.incidentId },
        ],
      },
      {
        $set: {
          status: 'EN_ROUTE',
          assignedIncidentId: incident.incidentId,
          speedKmh: 58,
        },
      },
      { new: true }
    );

    if (!ambulance) {
      // Look up current status of unit to return helpful conflict details
      const busyUnit = await Ambulance.findOne({ vehicleId: targetAmbulanceId });
      if (!busyUnit) {
        return res.status(404).json({ success: false, error: `Ambulance ${targetAmbulanceId} not found` });
      }
      return res.status(409).json({
        success: false,
        error: `Dispatch Conflict: Unit ${busyUnit.callsign} (${busyUnit.vehicleId}) is currently ${busyUnit.status} on incident ${busyUnit.assignedIncidentId || 'active mission'}. Please select another available unit.`,
      });
    }

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
        operatorNote,
      },
    });

    // Broadcast WebSocket updates
    broadcastEvent('incident:dispatched', { incident, ambulance });
    broadcastEvent('ambulance:status_change', ambulance);

    res.json({ success: true, incident, ambulance });
  } catch (error) {
    console.error('[Incidents API] Error dispatching ambulance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/incidents/:id/status - Update incident lifecycle status with state validation
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validTransitions = [
      'REPORTED',
      'TRIAGED',
      'DISPATCHED',
      'EN_ROUTE',
      'ON_SCENE',
      'TRANSPORTING',
      'RESOLVED',
      'CANCELLED',
    ];

    if (!validTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: '${status}'. Allowed values: ${validTransitions.join(', ')}`,
      });
    }

    const incident = await Incident.findOne({ incidentId: req.params.id });
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // State machine check
    if ((incident.status === 'RESOLVED' || incident.status === 'CANCELLED') && status !== 'REPORTED' && status !== incident.status) {
      return res.status(400).json({
        success: false,
        error: `Cannot advance an incident that is already ${incident.status}. Re-open as REPORTED first.`,
      });
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
      note: note || `Status transitioned to ${status}`,
    });

    // Synchronize assigned ambulance status
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
