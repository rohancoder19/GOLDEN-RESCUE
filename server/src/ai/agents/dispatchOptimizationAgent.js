/**
 * Agent 4: Dispatch Optimization Agent
 * Multi-factor operational ranking of emergency vehicles.
 * Strictly enforces that busy or out-of-service vehicles cannot be dispatched.
 */
export async function runDispatchOptimizationAgent(incident, candidateAmbulances = [], locationOutput = {}) {
  const startTime = Date.now();
  const severity = incident.severity || 'MEDIUM';

  // 1. Strict operational availability filter: only 'AVAILABLE' vehicles
  const availableUnits = candidateAmbulances.filter((amb) => amb.status === 'AVAILABLE');

  if (availableUnits.length === 0) {
    return {
      agent: 'DispatchOptimizationAgent',
      stage: 'DISPATCH_RANKING',
      status: 'WARNING',
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
      output: {
        success: false,
        recommendedAmbulance: null,
        rankedCandidates: [],
        reason: 'Zero ambulances currently available in sector. Mutual aid alert recommended.',
      },
    };
  }

  // 2. Score each available unit
  const scoredUnits = availableUnits.map((amb) => {
    // Find distance from locationOutput or fallback
    const distInfo = locationOutput.rankedAmbulancesByDistance?.find((a) => a.vehicleId === amb.vehicleId);
    const distanceKm = distInfo ? distInfo.distanceKm : 5.0;

    let score = 100;

    // Distance penalty (closer is better: -6 points per km, max 60 penalty)
    score -= Math.min(60, distanceKm * 6);

    // Capability match bonus
    let capabilityBonus = 0;
    if (severity === 'CRITICAL') {
      if (amb.type === 'MOBILE_ICU') capabilityBonus = 25;
      else if (amb.type === 'ADVANCED_LIFE_SUPPORT') capabilityBonus = 20;
      else capabilityBonus = 5;
    } else if (severity === 'HIGH') {
      if (amb.type === 'ADVANCED_LIFE_SUPPORT') capabilityBonus = 20;
      else if (amb.type === 'RAPID_RESPONSE') capabilityBonus = 18;
      else capabilityBonus = 10;
    } else {
      if (amb.type === 'BASIC_LIFE_SUPPORT') capabilityBonus = 20;
      else capabilityBonus = 15;
    }
    score += capabilityBonus;

    // Fuel and battery health
    if ((amb.fuelLevel || 100) < 30) score -= 20;
    if ((amb.batteryLevel || 100) < 30) score -= 15;

    // Estimated response time (approx 45 km/h urban speed with sirens = ~1.33 min/km + 1.5 min chute time)
    const etaMinutes = Math.max(2, Math.round(1.5 + (distanceKm * 1.35)));

    return {
      vehicleId: amb.vehicleId,
      callsign: amb.callsign,
      type: amb.type,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      etaMinutes,
      fuelLevel: amb.fuelLevel,
      score: Math.round(score),
      rationale: `${amb.callsign} (${amb.type}) is ${distanceKm.toFixed(1)} km away. Estimated ETA: ${etaMinutes} mins. Capability match score: ${capabilityBonus} pts.`,
    };
  }).sort((a, b) => b.score - a.score);

  const bestUnit = scoredUnits[0];

  const durationMs = Date.now() - startTime;

  return {
    agent: 'DispatchOptimizationAgent',
    stage: 'DISPATCH_RANKING',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      success: true,
      recommendedAmbulance: bestUnit,
      rankedCandidates: scoredUnits,
      reason: `Ranked #${bestUnit.vehicleId} highest based on optimal ETA (${bestUnit.etaMinutes}m) and ${bestUnit.type} clinical readiness.`,
    },
  };
}
