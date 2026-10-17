import { runIncidentDetectionAgent } from './agents/incidentDetectionAgent.js';
import { runSeverityAssessmentAgent } from './agents/severityAssessmentAgent.js';
import { runLocationIntelligenceAgent } from './agents/locationIntelligenceAgent.js';
import { runDispatchOptimizationAgent } from './agents/dispatchOptimizationAgent.js';
import { runHospitalMatchingAgent } from './agents/hospitalMatchingAgent.js';
import { runRouteOptimizationAgent } from './agents/routeOptimizationAgent.js';
import { runCoordinationAgent } from './agents/coordinationAgent.js';

/**
 * Full 7-Stage Multi-Agent Emergency AI Orchestration Pipeline:
 * DETECT → VALIDATE → ANALYZE → LOCATE → PRIORITIZE → DISPATCH → ROUTE → COORDINATE
 */
export async function runEmergencyAiPipeline(incidentData, ambulances = [], hospitals = []) {
  const totalStartTime = Date.now();
  const agentLogs = [];

  // 1. Detection & Validation
  const detectionStep = await runIncidentDetectionAgent(incidentData);
  agentLogs.push(detectionStep);

  const cleanIncident = {
    ...incidentData,
    ...detectionStep.output.sanitizedPayload,
  };

  // 2. Severity Assessment
  const severityStep = await runSeverityAssessmentAgent(cleanIncident);
  agentLogs.push(severityStep);

  cleanIncident.severity = severityStep.output.severity;
  cleanIncident.priorityScore = severityStep.output.priorityScore;

  // 3. Location Intelligence
  const locationStep = await runLocationIntelligenceAgent(
    cleanIncident.location.coordinates,
    ambulances,
    hospitals
  );
  agentLogs.push(locationStep);

  // 4. Dispatch Optimization
  const dispatchStep = await runDispatchOptimizationAgent(
    cleanIncident,
    ambulances,
    locationStep.output
  );
  agentLogs.push(dispatchStep);

  // 5. Hospital Matching
  const hospitalStep = await runHospitalMatchingAgent(
    cleanIncident,
    hospitals,
    locationStep.output
  );
  agentLogs.push(hospitalStep);

  // 6. Route Optimization
  const chosenAmb = dispatchStep.output.recommendedAmbulance;
  const chosenHosp = hospitalStep.output.recommendedHospital;

  const ambCoords = chosenAmb
    ? ambulances.find((a) => a.vehicleId === chosenAmb.vehicleId)?.location?.coordinates
    : cleanIncident.location.coordinates;
  const hospCoords = chosenHosp
    ? hospitals.find((h) => h.hospitalId === chosenHosp.hospitalId)?.location?.coordinates
    : null;

  const routeStep = await runRouteOptimizationAgent(
    ambCoords || cleanIncident.location.coordinates,
    cleanIncident.location.coordinates,
    hospCoords
  );
  agentLogs.push(routeStep);

  // 7. Coordination
  const coordinationStep = await runCoordinationAgent({
    incident: cleanIncident,
    detectionOutput: detectionStep,
    severityOutput: severityStep,
    locationOutput: locationStep,
    dispatchOutput: dispatchStep,
    hospitalOutput: hospitalStep,
    routeOutput: routeStep,
  });
  agentLogs.push(coordinationStep);

  const totalDurationMs = Date.now() - totalStartTime;

  return {
    pipelineStatus: 'COMPLETED',
    totalDurationMs,
    severity: severityStep.output.severity,
    priorityScore: severityStep.output.priorityScore,
    confidence: severityStep.output.confidence,
    clinicalRecommendation: severityStep.output.clinicalRecommendation,
    factors: severityStep.output.factors,
    recommendedAmbulance: chosenAmb,
    recommendedHospital: chosenHosp,
    routeData: {
      waypoints: routeStep.output.waypoints,
      distanceKm: routeStep.output.totalDistanceKm,
      etaMinutes: routeStep.output.etaToSceneMinutes,
    },
    decisionExplanation: coordinationStep.output.decisionExplanation,
    clinicalDisclaimer: coordinationStep.output.clinicalDisclaimer,
    agentLogs,
  };
}
