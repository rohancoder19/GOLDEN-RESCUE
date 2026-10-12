import { calculateHaversineDistance } from './locationIntelligenceAgent.js';

/**
 * Generate interpolated waypoints along a grid path between two points
 */
function interpolatePath(start, end, steps = 6) {
  if (!start || !end) return [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add slight realistic street curve
    const jitterLat = Math.sin(t * Math.PI) * 0.0012;
    const jitterLng = Math.sin(t * Math.PI * 2) * 0.0015;
    const lat = lat1 + (lat2 - lat1) * t + jitterLat;
    const lng = lng1 + (lng2 - lng1) * t + jitterLng;
    points.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }
  return points;
}

/**
 * Agent 6: Route Optimization Agent
 * Generates route geometry, distance, and transit time calculation.
 */
export async function runRouteOptimizationAgent(ambCoords, incidentCoords, hospitalCoords) {
  const startTime = Date.now();

  const leg1Dist = calculateHaversineDistance(ambCoords, incidentCoords);
  const leg2Dist = hospitalCoords ? calculateHaversineDistance(incidentCoords, hospitalCoords) : 0;
  const totalDistanceKm = parseFloat((leg1Dist + leg2Dist).toFixed(2));

  // Traffic congestion multiplier (simulated rush hour vs clear corridor)
  const trafficDelayFactor = 1.15; // +15% urban delay
  const baseSpeedKmh = 48; // km/h emergency vehicle speed
  const leg1Minutes = Math.max(2, Math.round((leg1Dist / baseSpeedKmh) * 60 * trafficDelayFactor));
  const leg2Minutes = Math.max(3, Math.round((leg2Dist / baseSpeedKmh) * 60 * trafficDelayFactor));
  const totalEtaMinutes = leg1Minutes + leg2Minutes;

  // Build waypoints: Ambulance -> Incident -> Hospital
  const leg1Waypoints = interpolatePath(ambCoords, incidentCoords, 8);
  const leg2Waypoints = hospitalCoords ? interpolatePath(incidentCoords, hospitalCoords, 8) : [];
  const fullWaypoints = [...leg1Waypoints, ...leg2Waypoints.slice(1)];

  const durationMs = Date.now() - startTime;

  return {
    agent: 'RouteOptimizationAgent',
    stage: 'ROUTE_CALCULATION',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      totalDistanceKm,
      leg1DistanceKm: leg1Dist,
      leg2DistanceKm: leg2Dist,
      etaToSceneMinutes: leg1Minutes,
      etaToHospitalMinutes: leg2Minutes,
      totalEtaMinutes,
      trafficModel: 'Urban Emergency Priority Corridor (Simulated)',
      waypointsCount: fullWaypoints.length,
      waypoints: fullWaypoints,
    },
  };
}
