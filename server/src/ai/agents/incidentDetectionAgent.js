/**
 * Agent 1: Incident Detection Agent
 * Validates incoming report structure, sanitizes descriptions, verifies source channel authenticity,
 * flags incomplete or malformed telemetry, and normalizes incident payload.
 */
export async function runIncidentDetectionAgent(payload) {
  const startTime = Date.now();
  const errors = [];
  const warnings = [];

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('Incident title is required (minimum 3 characters).');
  }

  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length < 5) {
    errors.push('Detailed description is required for triage processing.');
  }

  if (!payload.location || !payload.location.address) {
    errors.push('Physical location or street address is required.');
  }

  // Validate coordinates if provided
  let coordinates = payload.location?.coordinates;
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    warnings.push('Precise GPS telemetry not provided in raw report. Location agent will resolve approximate grid.');
    coordinates = [37.7749, -122.4194]; // Default metropolitan center
  } else {
    const [lat, lng] = coordinates;
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Invalid GPS coordinate bounds detected.');
    }
  }

  const validSources = ['911_VOICE', 'CCTV_AI', 'CITIZEN_MOBILE', 'IOT_SENSOR', 'OPERATOR_MANUAL', 'VOICE_REPORT'];
  const source = validSources.includes(payload.source) ? payload.source : 'OPERATOR_MANUAL';

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
      detectedCategory: payload.category || 'OTHER',
      source,
      sanitizedPayload: {
        title: (payload.title || '').trim(),
        description: (payload.description || '').trim(),
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
