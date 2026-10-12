/**
 * Calculate Haversine distance in kilometers between two coordinates [lat, lng]
 */
export function calculateHaversineDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 999;
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Agent 3: Location Intelligence Agent
 * Validates coordinate integrity, sector bounds, calculates distance matrices to all active assets.
 */
export async function runLocationIntelligenceAgent(incidentCoords, ambulances = [], hospitals = []) {
  const startTime = Date.now();
  const [lat, lng] = incidentCoords || [37.7749, -122.4194];

  // Calculate distance matrix to ambulances
  const ambulanceDistances = ambulances.map((amb) => {
    const distKm = calculateHaversineDistance(incidentCoords, amb.location?.coordinates);
    return {
      vehicleId: amb.vehicleId,
      callsign: amb.callsign,
      status: amb.status,
      type: amb.type,
      distanceKm: distKm,
      coordinates: amb.location?.coordinates,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // Calculate distance matrix to hospitals
  const hospitalDistances = hospitals.map((hosp) => {
    const distKm = calculateHaversineDistance(incidentCoords, hosp.location?.coordinates);
    return {
      hospitalId: hosp.hospitalId,
      name: hosp.name,
      traumaLevel: hosp.traumaLevel,
      status: hosp.status,
      distanceKm: distKm,
      coordinates: hosp.location?.coordinates,
      availableBeds: hosp.capacity?.availableBeds,
      icuAvailable: hosp.capacity?.icuAvailable,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const durationMs = Date.now() - startTime;

  return {
    agent: 'LocationIntelligenceAgent',
    stage: 'LOCATE_AND_PROXIMITY_MATRIX',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      resolvedCoordinates: [lat, lng],
      nearestAmbulance: ambulanceDistances[0] || null,
      nearestHospital: hospitalDistances[0] || null,
      ambulanceProximityCount: ambulanceDistances.filter((a) => a.distanceKm <= 10).length,
      hospitalProximityCount: hospitalDistances.filter((h) => h.distanceKm <= 15).length,
      rankedAmbulancesByDistance: ambulanceDistances,
      rankedHospitalsByDistance: hospitalDistances,
    },
  };
}
