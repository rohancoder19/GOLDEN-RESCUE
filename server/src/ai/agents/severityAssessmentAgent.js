import { generateAiContent } from '../../config/gemini.js';

/**
 * Agent 2: Severity Assessment Agent
 * Combines clinical heuristic rule engine with Google Gemini 2.5 Flash
 * to determine urgency, clinical factors, priority score (1-100), and rationale.
 */
export async function runSeverityAssessmentAgent(incident) {
  const startTime = Date.now();
  const text = `${incident.title} ${incident.description} ${incident.category}`.toLowerCase();

  const factors = [];
  let score = 40; // baseline

  // Critical factors
  if (text.match(/unconscious|unresponsive|not breathing|cardiac arrest|pulseless|asphyxi/)) {
    score += 45;
    factors.push('Compromised airway/breathing/circulation (Immediate Life Threat)');
  }
  if (text.match(/severe bleed|hemorrhage|arterial|amputation/)) {
    score += 40;
    factors.push('Uncontrolled severe blood loss / major trauma');
  }
  if (text.match(/pinned|trapped|entrapment|rollover|crush|ejected/)) {
    score += 35;
    factors.push('Mechanical entrapment requiring extrication protocol');
  }
  if (text.match(/pediatric|child|infant|baby/)) {
    score += 20;
    factors.push('Vulnerable pediatric patient involved');
  }
  if (text.match(/stroke|facial droop|slurred speech|hemiparesis|numbness/)) {
    score += 35;
    factors.push('Suspected acute ischemic/hemorrhagic cerebrovascular event');
  }
  if (text.match(/chest pain|cardiac|myocardial|stemi/)) {
    score += 35;
    factors.push('Acute coronary syndrome presentation');
  }
  if (text.match(/fire|flames|smoke inhalation|explosion|hazmat/)) {
    score += 30;
    factors.push('Active thermal/chemical/respiratory hazard on scene');
  }

  // Low acuity indicators
  if (text.match(/minor|sprain|abrasion|walking|alert|stable|isolated extremity/)) {
    score -= 15;
    factors.push('Non-life-threatening low acuity presentation');
  }

  // Category adjustments
  if (incident.category === 'CARDIAC_ARREST') score = Math.max(score, 95);
  if (incident.category === 'STROKE_NEURO') score = Math.max(score, 88);
  if (incident.category === 'TRAFFIC_COLLISION' && factors.length === 0) {
    score = Math.max(score, 65);
    factors.push('Multi-vehicle kinetics on active roadway');
  }
  if (incident.category === 'INDUSTRIAL_FIRE') score = Math.max(score, 80);
  if (incident.category === 'FALL_INJURY' && factors.length <= 1) {
    score = Math.min(score, 35);
  }

  // Bound score
  score = Math.min(99, Math.max(15, score));

  // Determine severity tier
  let severity = 'MEDIUM';
  if (score >= 85) severity = 'CRITICAL';
  else if (score >= 65) severity = 'HIGH';
  else if (score <= 35) severity = 'LOW';

  if (factors.length === 0) {
    factors.push('Standard non-critical medical triage assessment');
  }

  // Calibrate confidence
  const confidence = Math.min(98, 80 + (factors.length * 4));

  // Generate concise clinical explanation with Gemini
  const prompt = `You are the Golden Rescue Chief Triage AI. Provide a concise 2-sentence clinical emergency justification for:
Incident: "${incident.title}"
Category: "${incident.category}"
Description: "${incident.description}"
Assigned Severity: ${severity} (Score: ${score}/100)
Contributing Factors: ${factors.join(', ')}
State the primary clinical danger and the mandatory response standard.`;

  const fallbackReasoning = `${severity} priority assigned (Score ${score}/100). Primary danger: ${factors[0]}. Requires immediate ALS intervention and rapid stabilization.`;

  const clinicalRecommendation = await generateAiContent(prompt, fallbackReasoning);

  const durationMs = Date.now() - startTime;

  return {
    agent: 'SeverityAssessmentAgent',
    stage: 'ANALYZE_AND_PRIORITIZE',
    status: 'SUCCESS',
    durationMs,
    timestamp: new Date(),
    output: {
      severity,
      priorityScore: score,
      confidence,
      factors,
      clinicalRecommendation: clinicalRecommendation.trim(),
      canOverride: true,
    },
  };
}
