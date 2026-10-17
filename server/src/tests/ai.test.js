import test from 'node:test';
import assert from 'node:assert/strict';
import { runIncidentDetectionAgent } from '../ai/agents/incidentDetectionAgent.js';
import { runSeverityAssessmentAgent } from '../ai/agents/severityAssessmentAgent.js';
import { calculateHaversineDistance, runLocationIntelligenceAgent } from '../ai/agents/locationIntelligenceAgent.js';
import { runDispatchOptimizationAgent } from '../ai/agents/dispatchOptimizationAgent.js';
import { runHospitalMatchingAgent } from '../ai/agents/hospitalMatchingAgent.js';
import { generateAiContent } from '../config/gemini.js';

test('IncidentDetectionAgent: rejects empty payload', async () => {
  const result = await runIncidentDetectionAgent({});
  assert.equal(result.status, 'FAILED');
  assert.ok(result.output.errors.length > 0);
});

test('IncidentDetectionAgent: accepts and normalizes valid incident', async () => {
  const valid = {
    title: 'Two car collision',
    description: 'Vehicle rolled over with patient trapped',
    location: { address: 'Market St & 5th St', coordinates: [37.78, -122.41] },
    category: 'TRAFFIC_COLLISION',
    source: '911_VOICE',
  };
  const result = await runIncidentDetectionAgent(valid);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.detectedCategory, 'TRAFFIC_COLLISION');
  assert.deepEqual(result.output.sanitizedPayload.location.coordinates, [37.78, -122.41]);
});

test('IncidentDetectionAgent: rejects out-of-bounds coordinates', async () => {
  const invalidCoords = {
    title: 'Off-grid incident',
    description: 'Reporting invalid satellite coordinates',
    location: { address: 'Null Island', coordinates: [999, -500] },
    category: 'OTHER',
  };
  const result = await runIncidentDetectionAgent(invalidCoords);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.output.errors.some((e) => e.includes('coordinate bounds')));
});

test('IncidentDetectionAgent: normalizes aliased category and source', async () => {
  const aliased = {
    title: 'Worker fell from scaffold',
    description: 'Worker fell 12 feet, possible leg fracture',
    location: { address: 'Construction Bay 4', coordinates: [37.78, -122.41] },
    category: 'TRAUMA_FALL', // Form alias
    source: 'VOICE_911',     // Form alias
  };
  const result = await runIncidentDetectionAgent(aliased);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.detectedCategory, 'FALL_INJURY');
  assert.equal(result.output.source, '911_VOICE');
});

test('SeverityAssessmentAgent: categorizes cardiac arrest as CRITICAL and attaches disclaimer', async () => {
  const incident = {
    title: 'Sudden collapse',
    description: 'Patient is unconscious, not breathing, pulseless',
    category: 'CARDIAC_ARREST',
  };
  const result = await runSeverityAssessmentAgent(incident);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.severity, 'CRITICAL');
  assert.ok(result.output.priorityScore >= 85);
  assert.ok(result.output.confidence >= 80);
  assert.ok(result.output.clinicalDisclaimer.includes('DECISION SUPPORT ONLY'));
});

test('SeverityAssessmentAgent: categorizes minor sprain as LOW', async () => {
  const incident = {
    title: 'Minor ankle twist',
    description: 'Patient twisted ankle walking down stairs, alert, minor pain',
    category: 'FALL_INJURY',
  };
  const result = await runSeverityAssessmentAgent(incident);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.severity, 'LOW');
  assert.ok(result.output.priorityScore <= 50);
});

test('LocationIntelligenceAgent: accurately computes Haversine distance', () => {
  // San Francisco City Hall to Ferry Building (~2.5 km)
  const dist = calculateHaversineDistance([37.7792, -122.4191], [37.7955, -122.3937]);
  assert.ok(dist >= 2.0 && dist <= 3.2, `Distance should be ~2.5km, got ${dist}`);
});

test('DispatchOptimizationAgent: refuses to assign busy ambulance and prioritizes closest available', async () => {
  const incident = {
    severity: 'CRITICAL',
    category: 'TRAFFIC_COLLISION',
  };

  const ambulances = [
    {
      vehicleId: 'AMB-BUSY',
      callsign: 'Busy-Unit',
      status: 'EN_ROUTE', // BUSY!
      type: 'ADVANCED_LIFE_SUPPORT',
      fuelLevel: 90,
      batteryLevel: 90,
    },
    {
      vehicleId: 'AMB-FAR',
      callsign: 'Far-Unit',
      status: 'AVAILABLE',
      type: 'ADVANCED_LIFE_SUPPORT',
      fuelLevel: 90,
      batteryLevel: 90,
    },
    {
      vehicleId: 'AMB-NEAR',
      callsign: 'Near-Unit',
      status: 'AVAILABLE',
      type: 'MOBILE_ICU',
      fuelLevel: 90,
      batteryLevel: 90,
    },
  ];

  const locationOutput = {
    rankedAmbulancesByDistance: [
      { vehicleId: 'AMB-BUSY', distanceKm: 0.5 },
      { vehicleId: 'AMB-NEAR', distanceKm: 1.2 },
      { vehicleId: 'AMB-FAR', distanceKm: 8.5 },
    ],
  };

  const result = await runDispatchOptimizationAgent(incident, ambulances, locationOutput);
  assert.equal(result.status, 'SUCCESS');
  // Busy unit must NOT be recommended!
  assert.notEqual(result.output.recommendedAmbulance.vehicleId, 'AMB-BUSY');
  // Near available unit must be recommended!
  assert.equal(result.output.recommendedAmbulance.vehicleId, 'AMB-NEAR');
});

test('HospitalMatchingAgent: diverts critical patient away from diverting hospitals to trauma center', async () => {
  const incident = {
    severity: 'CRITICAL',
    category: 'TRAFFIC_COLLISION',
  };

  const hospitals = [
    {
      hospitalId: 'HOSP-DIVERT',
      name: 'Diverting Community Clinic',
      status: 'DIVERTING_AMBULANCES', // Closed to ambulances!
      traumaLevel: 'Emergency Center',
      capacity: { availableBeds: 0, icuAvailable: 0 },
    },
    {
      hospitalId: 'HOSP-TRAUMA',
      name: 'Regional Level 1 Trauma Center',
      status: 'ACCEPTING_ALL',
      traumaLevel: 'Level 1 Trauma',
      specialties: ['Adult Level 1 Trauma', 'Comprehensive Stroke Center'],
      capacity: { availableBeds: 25, icuAvailable: 6 },
    },
  ];

  const locationOutput = {
    rankedHospitalsByDistance: [
      { hospitalId: 'HOSP-DIVERT', distanceKm: 1.0 },
      { hospitalId: 'HOSP-TRAUMA', distanceKm: 3.5 },
    ],
  };

  const result = await runHospitalMatchingAgent(incident, hospitals, locationOutput);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.output.recommendedHospital.hospitalId, 'HOSP-TRAUMA');
});

test('Gemini Fallback: returns clinical heuristic fallback on timeout', async () => {
  const fallback = 'Clinical heuristic fallback activated.';
  // Force a 1ms timeout to verify fallback trigger without network delay
  const output = await generateAiContent('Test prompt that should fallback', fallback, 1);
  assert.equal(output, fallback);
});
