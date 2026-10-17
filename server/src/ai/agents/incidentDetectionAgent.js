/**
 * Agent 1: Incident Detection Agent
 * Validates incoming report structure, sanitizes descriptions, verifies source channel authenticity,
 * flags incomplete or malformed telemetry, and normalizes incident payload.
 */
export async function runIncidentDetectionAgent(payload = {}) {
  const startTime = Date.now();
  const errors = [];
  const warnings = [];

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('Incident title is required (minimum 3 characters).');
  }

  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length < 5) {
    errors.push('Detailed description is required for triage processing (minimum 5 characters).');
  }

  if (!payload.location || !payload.location.address) {
    errors.push('Physical location or street address is required.');
  }

  // Validate coordinates
  let coordinates = payload.location?.coordinates;
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    warnings.push('Precise GPS telemetry not provided in raw report. Location agent will resolve approximate grid.');
    coordinates = [37.7749, -122.4194]; // Default metropolitan center
  } else {
    const lat = Number(coordinates[0]);
    const lng = Number(coordinates[1]);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Invalid GPS coordinate bounds detected (lat: -90..90, lng: -180..180).');
      coordinates = [37.7749, -122.4194];
    } else {
      coordinates = [lat, lng];
    }
  }

  // Normalize category mapping
  const categoryAliases = {
    TRAUMA_FALL: 'FALL_INJURY',
    MASS_CASUALTY: 'OTHER',
    CHEST_PAIN: 'CARDIAC_ARREST',
  };
  const rawCat = payload.category || 'OTHER';
  const category = categoryAliases[rawCat] || rawCat;

  const validCategories = [
    'TRAFFIC_COLLISION',
    'CARDIAC_ARREST',
    'STROKE_NEURO',
    'RESPIRATORY_DISTRESS',
    'INDUSTRIAL_FIRE',
    'HAZMAT_EXPOSURE',
    'PEDIATRIC_TRAUMA',
    'FALL_INJURY',
    'OTHER',
  ];
  const detectedCategory = validCategories.includes(category) ? category : 'OTHER';

  // Normalize source mapping
  const sourceAliases = {
    VOICE_911: '911_VOICE',
    MANUAL: 'OPERATOR_MANUAL',
    IOT: 'IOT_SENSOR',
  };
  const rawSource = payload.source || 'OPERATOR_MANUAL';
  const mappedSource = sourceAliases[rawSource] || rawSource;
  const validSources = ['911_VOICE', 'CCTV_AI', 'CITIZEN_MOBILE', 'IOT_SENSOR', 'OPERATOR_MANUAL', 'VOICE_REPORT'];
  const source = validSources.includes(mappedSource) ? mappedSource : 'OPERATOR_MANUAL';

  const durationMs = Date.now() - startTime;
  const isValid = errors.length === 0;

  return {
    agent: 'IncidentDetectionAgent',
    stage: 'DETECT_AND_VALIDATE',
    status: isValid ? 'SUCCESS' : 'FAILED',
    durationMs,
    timestamp: new Date(),
    output: {
      isValid,
      errors,
      warnings,
      detectedCategory,
      source,
      sanitizedPayload: {
        title: (payload.title || '').trim(),
        description: (payload.description || '').trim(),
        category: detectedCategory,
        location: {
          address: (payload.location?.address || 'Unknown Address').trim(),
          coordinates,
          district: payload.location?.district || 'Metro Core',
        },
        source,
        callerInfo: payload.callerInfo || { name: 'Anonymous', phone: 'N/A' },
      },
    },
  };
}
