/**
 * Agent 5: Hospital Matching Agent
 * Evaluates receiving hospital capability, verified ICU/bed availability,
 * trauma level ratings, and transit distance.
 */
export async function runHospitalMatchingAgent(incident, candidateHospitals = [], locationOutput = {}) {
  const startTime = Date.now();
  const category = incident.category || 'OTHER';
  const severity = incident.severity || 'MEDIUM';

  // 1. Filter out hospitals currently on total diversion
  const acceptingHospitals = candidateHospitals.filter((h) => h.status !== 'DIVERTING_AMBULANCES');

  if (acceptingHospitals.length === 0) {
    return {
      agent: 'HospitalMatchingAgent',
      stage: 'HOSPITAL_TRIAGE_MATCHING',
      status: 'WARNING',
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
      output: {
        success: false,
        recommendedHospital: null,
        rankedHospitals: [],
        reason: 'All regional facilities on diversion. Emergency override routing required.',
      },
    };
  }

  // 2. Score each hospital
  const scoredHospitals = acceptingHospitals.map((hosp) => {
    const distInfo = locationOutput.rankedHospitalsByDistance?.find((h) => h.hospitalId === hosp.hospitalId);
    const distanceKm = distInfo ? distInfo.distanceKm : 8.0;

    let score = 100;

    // Distance penalty
    score -= Math.min(50, distanceKm * 3.5);

    // Specialty matching
    let specialtyBonus = 0;
    const specialties = (hosp.specialties || []).map((s) => s.toLowerCase());

    if (category === 'CARDIAC_ARREST' || category === 'CHEST_PAIN') {
      if (specialties.some((s) => s.includes('stemi') || s.includes('cardiac') || s.includes('cath'))) {
        specialtyBonus += 30;
      }
    } else if (category === 'STROKE_NEURO') {
      if (specialties.some((s) => s.includes('stroke') || s.includes('neuro'))) {
        specialtyBonus += 30;
      }
    } else if (severity === 'CRITICAL' || category === 'TRAFFIC_COLLISION') {
      if (hosp.traumaLevel === 'Level 1 Trauma') specialtyBonus += 35;
      else if (hosp.traumaLevel === 'Level 2 Trauma') specialtyBonus += 20;
    } else if (category === 'PEDIATRIC_TRAUMA') {
      if (specialties.some((s) => s.includes('pediatric'))) specialtyBonus += 30;
    } else if (category === 'INDUSTRIAL_FIRE' || category === 'HAZMAT_EXPOSURE') {
      if (specialties.some((s) => s.includes('burn') || s.includes('toxicology'))) specialtyBonus += 25;
    }

    score += specialtyBonus;

    // ICU and bed availability factor
    const icuAvail = hosp.capacity?.icuAvailable || 0;
    const bedAvail = hosp.capacity?.availableBeds || 0;

    if (severity === 'CRITICAL' && icuAvail < 1) {
      score -= 30; // Severe penalty if no ICU bed for critical patient
    } else if (icuAvail >= 3) {
      score += 10;
    }

    if (bedAvail < 5) score -= 15;

    // Estimated transit time (at emergency speeds ~ 50km/h)
    const etaMinutes = Math.max(3, Math.round(2.0 + (distanceKm * 1.2)));

    return {
      hospitalId: hosp.hospitalId,
      name: hosp.name,
      traumaLevel: hosp.traumaLevel,
      status: hosp.status,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      etaMinutes,
      icuAvailable: icuAvail,
      availableBeds: bedAvail,
      score: Math.round(score),
      specialtyMatched: specialtyBonus > 0,
      rationale: `${hosp.name} (${hosp.traumaLevel}) is ${distanceKm.toFixed(1)} km away. ICU beds: ${icuAvail}. Verified accepting status: ${hosp.status}.`,
    };
  }).sort((a, b) => b.score - a.score);

  const bestHospital = scoredHospitals[0];

  const durationMs = Date.now() - startTime;

  return {
    agent: 'HospitalMatchingAgent',
    stage: 'HOSPITAL_TRIAGE_MATCHING',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      success: true,
      recommendedHospital: bestHospital,
      rankedHospitals: scoredHospitals,
      reason: `Matched ${bestHospital.name} with score ${bestHospital.score} based on clinical specialty alignment and available ICU capacity (${bestHospital.icuAvailable} beds).`,
    },
  };
}
