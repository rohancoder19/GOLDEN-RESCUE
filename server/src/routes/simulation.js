import express from 'express';
import { Incident } from '../models/Incident.js';
import { Ambulance } from '../models/Ambulance.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastEvent } from '../sockets/socketHandler.js';
import { seedInitialData } from '../seed/seedData.js';
import { INDIAN_REGIONS, scrapeOsmIndianHospitals } from '../scrapers/indiaEmergencyScraper.js';

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
router.get('/status', async (req, res) => {
  try {
    const sampleHosp = await Hospital.findOne();
    const isIndia = Boolean(
      sampleHosp?.location?.coordinates &&
      sampleHosp.location.coordinates[0] > 8 &&
      sampleHosp.location.coordinates[0] < 36 &&
      sampleHosp.location.coordinates[1] > 68 &&
      sampleHosp.location.coordinates[1] < 98
    );

    res.json({
      success: true,
      isSimulationActive,
      mode: 'DEMONSTRATION_TELEMETRY_ENGINE',
      tickIntervalMs: 3000,
      activeRegion: isIndia ? 'DELHI_NCR' : 'SAN_FRANCISCO',
      regionDetails: isIndia
        ? { name: 'National Capital Region (Delhi NCR)', emergencyNumber: '108 / 112', country: 'India' }
        : { name: 'San Francisco Bay Area', emergencyNumber: '911', country: 'United States' },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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
    const sampleHosp = await Hospital.findOne();
    const isIndia = Boolean(
      sampleHosp?.location?.coordinates &&
      sampleHosp.location.coordinates[0] > 8 &&
      sampleHosp.location.coordinates[0] < 36 &&
      sampleHosp.location.coordinates[1] > 68
    );

    const indiaPresets = [
      {
        title: 'SIMULATED: Multi-Vehicle Pileup on Yamuna Expressway',
        category: 'TRAFFIC_COLLISION',
        description: 'Simulated 3-vehicle pileup near Greater Noida cutoff with active passenger entrapment.',
        address: 'Yamuna Expressway Mile 14, Greater Noida Corridor',
        coordinates: [28.4744, 77.5040],
        district: 'NCR Expressway Grid',
        callerInfo: { name: 'Expressway Highway Patrol SOS Unit', phone: '+91 112' },
      },
      {
        title: 'SIMULATED: Acute STEMI Cardiac Distress in Chandni Chowk',
        category: 'CARDIAC_ARREST',
        description: 'Simulated 58yo male merchant collapsed in congested market alleyway. Bystander CPR initiated.',
        address: 'Chandni Chowk Main Road, near Gurdwara Sis Ganj Sahib',
        coordinates: [28.6558, 77.2325],
        district: 'Old Delhi Central',
        callerInfo: { name: 'Traders Association First Responder', phone: '+91 108' },
      },
      {
        title: 'SIMULATED: Warehouse Chemical Leak & Fire in Okhla Phase III',
        category: 'HAZMAT_EXPOSURE',
        description: 'Simulated hazardous solvent spill with chemical flash fire. 2 warehouse staff trapped.',
        address: 'Plot 44, Okhla Industrial Area Phase III, New Delhi 110020',
        coordinates: [28.5360, 77.2720],
        district: 'South Delhi Industrial Hub',
        callerInfo: { name: 'Industrial IoT Fire Sensor Node #09', phone: 'Automated Telemetry' },
      },
    ];

    const sfPresets = [
      {
        title: 'SIMULATED: Multi-Vehicle Expressway Collision',
        category: 'TRAFFIC_COLLISION',
        description: 'Simulated 3-car pileup with reported entrapment. Airbag deployment confirmed by telematics.',
        address: 'Bayshore Fwy & 7th St Overpass (Simulated Grid)',
        coordinates: [37.7712, -122.4035],
        district: 'South Highway Corridor',
        callerInfo: { name: 'Automated Telematics Node', phone: '+1 (800) SIM-NODE' },
      },
      {
        title: 'SIMULATED: Acute STEMI Cardiac Distress',
        category: 'CARDIAC_ARREST',
        description: 'Simulated 62yo patient in acute cardiogenic shock. Bystander CPR initiated.',
        address: '840 Market Street, Suite 300 (Simulated Grid)',
        coordinates: [37.7852, -122.4065],
        district: 'Downtown Financial',
        callerInfo: { name: 'Citizen Dispatch Beacon', phone: '+1 (415) 555-SIM1' },
      },
      {
        title: 'SIMULATED: Commercial Structure Alarm & Smoke',
        category: 'INDUSTRIAL_FIRE',
        description: 'Simulated electrical vault fire in manufacturing plant. Thermal imaging reports smoke.',
        address: '1200 Illinois St Dock 4 (Simulated Grid)',
        coordinates: [37.7615, -122.3885],
        district: 'Mission Bay Industrial',
        callerInfo: { name: 'Facility Thermal Sensor #18', phone: '+1 (415) 555-SIM2' },
      },
    ];

    const scenarioPresets = isIndia ? indiaPresets : sfPresets;
    const pick = scenarioPresets[Math.floor(Math.random() * scenarioPresets.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentId = isIndia ? `SIM-DEL-${randomSuffix}` : `SIM-2026-${randomSuffix}`;

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
      callerInfo: pick.callerInfo,
      isSimulated: true,
      dataSource: 'SIMULATED_DEMO',
      aiTriage: {
        summary: 'Simulated drill scenario injected for live operator response training.',
        confidence: 96,
        factors: ['High speed collision / acute kinetics', 'Autonomous sensor telemetry confirmed'],
        clinicalRecommendation: 'Immediate priority deployment required. Route to nearest Trauma Center.',
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
 * POST /api/simulation/switch-region - Switch between Indian (108/112) and US (911) operations
 */
router.post('/switch-region', async (req, res) => {
  try {
    const { region = 'DELHI_NCR' } = req.body;
    console.log(`[Simulation] 🔄 Switching operational theater to: ${region}`);

    if (region === 'DELHI_NCR') {
      const data = INDIAN_REGIONS.DELHI_NCR;

      await Incident.deleteMany({});
      await Ambulance.deleteMany({});
      await Hospital.deleteMany({});
      await AuditLog.deleteMany({});

      const hospitals = await Hospital.insertMany(data.hospitals);
      const ambulances = await Ambulance.insertMany(data.ambulances);
      const incidents = await Incident.insertMany(data.incidents);

      await AuditLog.insertMany([
        {
          operator: { name: 'National Health Mission 108/112 Hub', role: 'Regional Triage Commander', badgeId: 'IND-112-HQ' },
          action: 'THEATER_SWITCHED',
          targetEntity: { entityType: 'SYSTEM_CONFIG', entityId: 'DELHI_NCR' },
          details: {
            region: 'DELHI_NCR',
            emergencyNumbers: data.emergencyNumbers,
            hospitalsLoaded: hospitals.length,
            ambulancesLoaded: ambulances.length,
            note: 'Operational sector switched to Delhi NCR (108/112 Grid)',
          },
          severity: 'INFO',
        },
      ]);

      const payload = {
        region: 'DELHI_NCR',
        name: data.name,
        center: data.centerCoordinates,
        emergencyNumbers: data.emergencyNumbers,
      };

      broadcastEvent('system:reset', payload);
      broadcastEvent('region:changed', payload);

      return res.json({
        success: true,
        ...payload,
        counts: {
          hospitals: hospitals.length,
          ambulances: ambulances.length,
          incidents: incidents.length,
        },
      });
    } else {
      // Default to San Francisco
      const result = await seedInitialData();
      const payload = {
        region: 'SAN_FRANCISCO',
        name: 'San Francisco Bay Area',
        center: [37.7749, -122.4194],
        emergencyNumbers: { national: '911', ambulance: '911' },
      };

      broadcastEvent('system:reset', payload);
      broadcastEvent('region:changed', payload);

      return res.json({
        success: true,
        ...payload,
        result,
      });
    }
  } catch (err) {
    console.error('[Simulation] Switch region error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/simulation/scrape-india - Trigger live OSM Nominatim scraper for Indian cities
 */
router.post('/scrape-india', async (req, res) => {
  try {
    const { city = 'New Delhi', limit = 6 } = req.body;
    console.log(`[Scraper] 🔍 Live OpenStreetMap scraper triggered for Indian city: ${city}`);
    const scrapeResult = await scrapeOsmIndianHospitals(city, limit);

    const savedHospitals = [];
    if (scrapeResult.success && scrapeResult.hospitals.length > 0) {
      for (const h of scrapeResult.hospitals) {
        const saved = await Hospital.findOneAndUpdate(
          { name: h.name },
          h,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedHospitals.push(saved);
        broadcastEvent('hospital:status_change', saved);
      }
    } else {
      // Fallback to verified national registry
      console.log(`[Scraper] 🛡️ Using verified Indian registry fallback for ${city}`);
      for (const h of INDIAN_REGIONS.DELHI_NCR.hospitals) {
        const saved = await Hospital.findOneAndUpdate(
          { hospitalId: h.hospitalId },
          h,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        savedHospitals.push(saved);
        broadcastEvent('hospital:status_change', saved);
      }
    }

    await AuditLog.create({
      operator: { name: 'OSM Scraper Engine', role: 'GIS Ingestion Pipeline', badgeId: 'BOT-OSM-IND' },
      action: 'DATA_SCRAPED_INDIA',
      targetEntity: { entityType: 'HOSPITAL', entityId: `CITY-${city.toUpperCase()}` },
      details: {
        city,
        source: scrapeResult.success ? 'OPENSTREETMAP_NOMINATIM_LIVE' : 'VERIFIED_INDIAN_REGISTRY',
        count: savedHospitals.length,
      },
    });

    broadcastEvent('system:reset', { note: `Scraped hospitals updated for ${city}` });

    res.json({
      success: true,
      source: scrapeResult.success ? 'OPENSTREETMAP_NOMINATIM_LIVE' : 'VERIFIED_INDIAN_REGISTRY',
      city,
      count: savedHospitals.length,
      hospitals: savedHospitals,
    });
  } catch (err) {
    console.error('[Scraper] Scrape error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/simulation/reset - Re-seed fresh realistic baseline
 */
router.post('/reset', async (req, res) => {
  try {
    const result = await seedInitialData();
    broadcastEvent('system:reset', { timestamp: new Date(), region: 'SAN_FRANCISCO' });
    res.json({ success: true, message: 'Database reset to verified operational baseline.', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

