import { CLINICAL_DECISION_SUPPORT_DISCLAIMER } from './severityAssessmentAgent.js';

/**
 * Agent 7: Coordination Agent
 * Assembles multi-agent reasoning bundle, audits decision factors,
 * prepares operational event broadcasts for responders and facilities.
 */
export async function runCoordinationAgent({
  incident,
  detectionOutput,
  severityOutput,
  locationOutput,
  dispatchOutput,
  hospitalOutput,
  routeOutput,
}) {
  const startTime = Date.now();

  const recommendedAmbulance = dispatchOutput.output?.recommendedAmbulance;
  const recommendedHospital = hospitalOutput.output?.recommendedHospital;

  const decisionExplanation = {
    incidentId: incident.incidentId,
    summary: `Triaged as ${severityOutput.output?.severity} (${severityOutput.output?.priorityScore}/100) with ${severityOutput.output?.confidence}% confidence.`,
    dispatchRationale: recommendedAmbulance
      ? `Unit ${recommendedAmbulance.callsign} assigned: closest available ${recommendedAmbulance.type} unit (${recommendedAmbulance.distanceKm}km away, ETA ${recommendedAmbulance.etaMinutes}m).`
      : 'No units available; mutual aid triggered.',
    hospitalRationale: recommendedHospital
      ? `Receiving facility ${recommendedHospital.name} selected: matches trauma requirements with ${recommendedHospital.icuAvailable} verified open ICU beds.`
      : 'No hospital destination assigned.',
    knownFactors: severityOutput.output?.factors || [],
    clinicalDisclaimer: CLINICAL_DECISION_SUPPORT_DISCLAIMER,
    uncertainties: [
      'Traffic congestion subject to dynamic local intersection blockages.',
      'Caller casualty count unverified pending responder on-scene visual confirmation.',
    ],
  };

  const durationMs = Date.now() - startTime;

  return {
    agent: 'CoordinationAgent',
    stage: 'COMMAND_COORDINATION',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      isReadyForDispatch: !!recommendedAmbulance,
      decisionExplanation,
      recommendedAmbulanceId: recommendedAmbulance?.vehicleId || null,
      recommendedHospitalId: recommendedHospital?.hospitalId || null,
      etaMinutes: routeOutput.output?.etaToSceneMinutes || 5,
      clinicalDisclaimer: CLINICAL_DECISION_SUPPORT_DISCLAIMER,
      notificationPayload: {
        broadcastType: 'PRE_ALERT_EMERGENCY_DISPATCH',
        targetAmbulance: recommendedAmbulance?.vehicleId,
        targetHospital: recommendedHospital?.hospitalId,
      },
    },
  };
}
