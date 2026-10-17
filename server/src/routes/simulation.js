import express from 'express';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { broadcastEvent } from '../sockets/socketHandler.js';
import { seedInitialData } from '../seed/seedData.js';

const router = express.Router();

let simulationInterval = null;
let isSimulationActive = false;

/**
 * Step active moving ambulances slightly along their route
 */
async function runSimulationTick() {
  try {
    const movingAmbulances = await Ambulance.find({ status: { $in: ['EN_ROUTE', 'TRANSPORTING'] } });

    for (const amb of movingAmbulances) {
      if (!amb.location?.coordinates || amb.location.coordinates.length !== 2) continue;

      // Realistic microscopic heading jitter to simulate vehicle navigation
      const deltaLat = (Math.random() - 0.48) * 0.0006;
      const deltaLng = (Math.random() - 0.48) * 0.0006;

      const newLat = parseFloat((amb.location.coordinates[0] + deltaLat).toFixed(6));
      const newLng = parseFloat((amb.location.coordinates[1] + deltaLng).toFixed(6));

      amb.location.coordinates = [newLat, newLng];
      amb.location.speedKmh = Math.floor(45 + Math.random() * 20); // 45-65 km/h
      amb.location.heading = (amb.location.heading + Math.floor((Math.random() - 0.5) * 20) + 360) % 360;

      await amb.save();
      broadcastEvent('ambulance:location_update', amb);
    }
  } catch (err) {
    console.warn('[Simulation] Tick error:', err.message);
  }
}

/**
 * GET /api/simulation/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isSimulationActive,
    mode: 'DEMONSTRATION_TELEMETRY_ENGINE',
    tickIntervalMs: 3000,
  });
});

/**
 * POST /api/simulation/toggle
 */
router.post('/toggle', (req, res) => {
  const { enable } = req.body;
  const shouldEnable = enable !== undefined ? Boolean(enable) : !isSimulationActive;

  if (shouldEnable && !simulationInterval) {
    simulationInterval = setInterval(runSimulationTick, 3000);
    isSimulationActive = true;
    console.log('[Simulation] 🟢 Live GPS telemetry simulation started');
  } else if (!shouldEnable && simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    isSimulationActive = false;
    console.log('[Simulation] 🛑 Simulation paused');
  }

  broadcastEvent('simulation:status_change', { isSimulationActive });
  res.json({ success: true, isSimulationActive });
});

/**
 * POST /api/simulation/inject - Create realistic simulated emergency scenario
 */
router.post('/inject', async (req, res) => {
  try {
    const scenarioPresets = [
      {
        title: 'SIMULATED: Multi-Vehicle Expressway Collision',
        category: 'TRAFFIC_COLLISION',
        description: 'Simulated 3-car pileup with reported entrapment. Airbag deployment confirmed by telematics.',
        address: 'Bayshore Fwy & 7th St Overpass (Simulated Grid)',
        coordinates: [37.7712, -122.4035],
        district: 'South Highway Corridor',
      },
      {
        title: 'SIMULATED: Acute STEMI Cardiac Distress',
        category: 'CARDIAC_ARREST',
        description: 'Simulated 62yo patient in acute cardiogenic shock. Bystander CPR initiated.',
        address: '840 Market Street, Suite 300 (Simulated Grid)',
        coordinates: [37.7852, -122.4065],
        district: 'Downtown Financial',
      },
      {
        title: 'SIMULATED: Commercial Structure Alarm & Smoke',
        category: 'INDUSTRIAL_FIRE',
        description: 'Simulated electrical vault fire in manufacturing plant. Thermal imaging reports smoke.',
        address: '1200 Illinois St Dock 4 (Simulated Grid)',
        coordinates: [37.7615, -122.3885],
        district: 'Mission Bay Industrial',
      },
    ];

    const pick = scenarioPresets[Math.floor(Math.random() * scenarioPresets.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `SIM-2026-${randomSuffix}`;

    const newSimIncident = new Incident({
      incidentId,
      title: pick.title,
      category: pick.category,
      description: pick.description,
      severity: 'CRITICAL',
      priorityScore: 92,
      status: 'REPORTED',
      location: {
        address: pick.address,
        coordinates: pick.coordinates,
        district: pick.district,
      },
      source: 'IOT_SENSOR',
      callerInfo: { name: 'Automated Telematics Node', phone: '+1 (800) SIM-NODE' },
      isSimulated: true,
      dataSource: 'SIMULATED_DEMO',
      aiTriage: {
        summary: 'Simulated drill scenario injected for live operator response training.',
        confidence: 96,
        factors: ['High speed collision', 'Autonomous sensor telemetry confirmed'],
        clinicalRecommendation: 'Immediate ALS deployment required. Divert to Level 1 Trauma Center.',
        clinicalDisclaimer: 'SIMULATED DRILL: Synthetic scenario for training.',
      },
      timeline: [
        {
          stage: 'INJECTED',
          timestamp: new Date(),
          actor: 'Simulation Engine',
          note: 'Realistic emergency drill injected into dispatch queue.',
        },
      ],
      timestamps: { reportedAt: new Date() },
    });

    await newSimIncident.save();
    broadcastEvent('incident:created', newSimIncident);

    res.status(201).json({ success: true, incident: newSimIncident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/simulation/reset - Re-seed fresh realistic baseline
 */
router.post('/reset', async (req, res) => {
  try {
    const result = await seedInitialData();
    broadcastEvent('system:reset', { timestamp: new Date() });
    res.json({ success: true, message: 'Database reset to verified operational baseline.', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
