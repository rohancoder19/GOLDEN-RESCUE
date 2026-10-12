import React, { useState } from 'react';
import {
  Cpu,
  Flame,
  Mic,
  MicOff,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Navigation,
  AlertTriangle,
  Building2,
  Ambulance as AmbulanceIcon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { playTelemetryChirp, playVoiceRecordChirp } from '../services/audio';

export default function AiDecisionCenterView({
  incidents = [],
  hotspots = [],
  onSelectIncident,
  onOpenNewIncident,
}) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'hotspots', 'what-if', 'replay'

  // Strict deduplication of incidents
  const uniqueIncidents = Array.from(
    new Map(incidents.map((i) => [i.incidentId, i])).values()
  );

  // What-If Simulation State
  const [whatIfTitle, setWhatIfTitle] = useState('Multi-Vehicle Collision on Central Expressway');
  const [whatIfCategory, setWhatIfCategory] = useState('TRAFFIC_COLLISION');
  const [whatIfAddress, setWhatIfAddress] = useState('Central Expressway Interchange (Rush Hour)');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Incident Replay State
  const completedIncidents = uniqueIncidents.filter((i) => i.timeline && i.timeline.length > 1);
  const [replayIncidentId, setReplayIncidentId] = useState(completedIncidents[0]?.incidentId || '');
  const [replayStepIndex, setReplayStepIndex] = useState(0);

  const selectedReplayIncident = uniqueIncidents.find((i) => i.incidentId === replayIncidentId) || completedIncidents[0];

  const handleRunWhatIf = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runWhatIfSimulation({
        scenarioTitle: whatIfTitle,
        category: whatIfCategory,
        address: whatIfAddress,
        coordinates: [37.7780, -122.4150],
      });
      playTelemetryChirp();
      setSimulationResult(res.simulatedOutcome);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="workspace-container" style={{ background: '#000000' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#000000',
          border: '1px solid #2C3480',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#ffffff" />
            <span>AI DECISION CENTER & INNOVATION SUITE</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Multi-Agent clinical reasoning engine, predictive spatial corridors, what-if dispatch sandboxing, and post-action replay
          </p>
        </div>

        {/* Feature Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'pipeline', label: '7-Agent Pipeline' },
            { id: 'hotspots', label: 'Accident Hotspots' },
            { id: 'what-if', label: 'What-If Simulation' },
            { id: 'replay', label: 'Incident Replay' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={
                activeTab === tab.id
                  ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff', fontWeight: 800 }
                  : { background: 'rgba(44, 52, 128, 0.15)', color: '#cbd5e1' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Multi-Agent Decision Pipeline */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.2)', border: '1px solid #2C3480' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              AUTONOMOUS 7-STAGE EMERGENCY DISPATCH REASONING ARCHITECTURE
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Every incident is evaluated through a decoupled deterministic operational pipeline paired with Google Gemini 2.5 Flash for clinical triage justification.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              {
                agent: 'Agent 1: Incident Detection Agent',
                stage: 'DETECT & VALIDATE',
                desc: 'Validates raw incoming payload integrity, verifies source authenticity, normalizes coordinates.',
                latency: '1.2ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 2: Severity Assessment Agent',
                stage: 'ANALYZE & TRIAGE',
                desc: 'Computes priority score (1-100) via clinical rule engine & generates physician-grade reasoning via Gemini 2.5 Flash.',
                latency: '450ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 3: Location Intelligence Agent',
                stage: 'LOCATE & GEO-MATRIX',
                desc: 'Resolves spatial sectors, validates coordinate geofences, computes Haversine distance matrices to all active units.',
                latency: '2.4ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 4: Dispatch Optimization Agent',
                stage: 'DISPATCH RANKING',
                desc: 'Filters busy units (prevents duplicate allocation), ranks available fleet by capability match (ALS vs BLS) and ETA.',
                latency: '3.1ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 5: Hospital Matching Agent',
                stage: 'FACILITY TRIAGE',
                desc: 'Matches receiving trauma levels (Level 1-3), verifies open ICU/bed availability, bypasses diverting hospitals.',
                latency: '2.8ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 6: Route Optimization Agent',
                stage: 'NAVIGATION ROUTING',
                desc: 'Interpolates turn-by-turn waypoints, incorporates urban congestion factors, computes accurate transit ETA.',
                latency: '4.5ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 7: Coordination Agent',
                stage: 'COMMAND & AUDIT',
                desc: 'Synthesizes transparent rationale (WHY unit X was picked over Y), logs audit events, triggers WebSocket broadcast.',
                latency: '1.8ms',
                status: 'OPERATIONAL',
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: 'rgba(14, 18, 44, 0.7)',
                  border: '1px solid rgba(44, 52, 128, 0.4)',
                  borderTop: '3px solid #2C3480',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 800 }}>
                    {step.stage}
                  </span>
                  <span className="telemetry-chip" style={{ fontSize: '9px', background: '#2C3480', color: '#ffffff' }}>
                    {step.latency}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  {step.agent}
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {step.desc}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(44, 52, 128, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#ffffff" />
                  <span style={{ fontSize: '10px', color: '#ffffff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    STATUS: {step.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Predictive Accident Hotspots */}
      {activeTab === 'hotspots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.2)', border: '1px solid #2C3480' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              SPATIAL-TEMPORAL BAYESIAN ACCIDENT PREDICTIVE CORRIDORS
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Predictive risk corridors identify high-probability collision zones based on road curvature, rush-hour traffic volume, and real-time precipitation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'rgba(14, 18, 44, 0.7)',
                  border: '1px solid rgba(44, 52, 128, 0.5)',
                  borderLeft: '4px solid #2C3480',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff', fontWeight: 800 }}>
                    {hs.id}
                  </span>
                  <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', border: '1px solid #ffffff' }}>
                    {hs.riskLevel.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                  {hs.name}
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Historical Monthly Incident Frequency: <strong>{hs.historicalIncidentsMonth} collisions</strong>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>CONTRIBUTING RISK VECTORS:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {hs.primaryFactors?.map((f, i) => (
                      <span key={i} className="telemetry-chip" style={{ fontSize: '10px', background: 'rgba(44, 52, 128, 0.25)', color: '#ffffff' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#2C3480',
                    border: '1px solid #ffffff',
                    fontSize: '11px',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  🎯 RECOMMENDED STAGING: {hs.recommendedPrePositionStation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: What-If Simulation Sandbox */}
      {activeTab === 'what-if' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.2)', border: '1px solid #2C3480' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              NON-OPERATIONAL WHAT-IF DISPATCH SIMULATOR
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Test hypothetical mass-casualty scenarios without altering active emergency operations. Compare response times and resource exhaustion limits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#000000', border: '1px solid #2C3480' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                CONFIGURE SIMULATION DRILL
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#ffffff' }}>SCENARIO NAME:</label>
                <input
                  type="text"
                  className="form-input"
                  value={whatIfTitle}
                  onChange={(e) => setWhatIfTitle(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#ffffff' }}>EMERGENCY CATEGORY:</label>
                <select
                  className="form-select"
                  value={whatIfCategory}
                  onChange={(e) => setWhatIfCategory(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                >
                  <option value="TRAFFIC_COLLISION">Traffic Collision</option>
                  <option value="CARDIAC_ARREST">Cardiac Arrest</option>
                  <option value="INDUSTRIAL_FIRE">Industrial Fire</option>
                  <option value="STROKE_NEURO">Stroke / Neurological</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#ffffff' }}>SIMULATED LOCATION:</label>
                <input
                  type="text"
                  className="form-input"
                  value={whatIfAddress}
                  onChange={(e) => setWhatIfAddress(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleRunWhatIf}
                disabled={isSimulating}
                style={{ marginTop: '8px', justifyContent: 'center', background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
              >
                <Play size={15} color="#ffffff" />
                <span>{isSimulating ? 'SIMULATING RESPONSE...' : 'EXECUTE WHAT-IF SIMULATION'}</span>
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#000000', border: '1px solid #2C3480' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                PROJECTED OPERATIONAL OUTCOME
              </div>

              {simulationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={`severity-badge badge-${simulationResult.triageSeverity}`}>
                      {simulationResult.triageSeverity}
                    </span>
                    <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff' }}>
                      AI CONFIDENCE: {simulationResult.confidence}%
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: 'rgba(44, 52, 128, 0.2)',
                      border: '1px solid rgba(44, 52, 128, 0.5)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      RECOMMENDED AMBULANCE:
                    </div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
                      🚑 {simulationResult.recommendedAmbulance?.callsign || 'Mutual Aid Request Required'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Projected Arrival Time: <strong>{simulationResult.projectedEtaMinutes || 4} minutes</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: 'rgba(44, 52, 128, 0.2)',
                      border: '1px solid rgba(44, 52, 128, 0.5)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      RECOMMENDED DESTINATION FACILITY:
                    </div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
                      🏥 {simulationResult.recommendedHospital?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Available ICU Beds: {simulationResult.recommendedHospital?.icuAvailable} beds
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                    "{simulationResult.clinicalRecommendation}"
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  Click Execute to model dispatch decisions, nearest vehicle selection, and transit times.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Incident Replay Engine */}
      {activeTab === 'replay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.2)', border: '1px solid #2C3480' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
              ORIGINAL INCIDENT POST-ACTION REPLAY & TIMELINE SCRUBBER
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Step backward or forward through authentic emergency lifecycles from initial 911 alert through AI triage, vehicle rollout, and hospital handover.
            </p>
          </div>

          {selectedReplayIncident ? (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#000000', border: '1px solid #2C3480' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>SELECT INCIDENT:</span>
                <select
                  className="form-select"
                  style={{ maxWidth: '400px', background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  value={replayIncidentId}
                  onChange={(e) => {
                    setReplayIncidentId(e.target.value);
                    setReplayStepIndex(0);
                  }}
                >
                  {completedIncidents.map((inc) => (
                    <option key={inc.incidentId} value={inc.incidentId}>
                      {inc.incidentId}: {inc.title} ({inc.status})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>START: {selectedReplayIncident.timeline?.[0]?.stage || 'REPORTED'}</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    STEP {replayStepIndex + 1} OF {selectedReplayIncident.timeline?.length || 1}
                  </span>
                  <span>END: {selectedReplayIncident.timeline?.[selectedReplayIncident.timeline.length - 1]?.stage || 'RESOLVED'}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={(selectedReplayIncident.timeline?.length || 1) - 1}
                  value={replayStepIndex}
                  onChange={(e) => setReplayStepIndex(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2C3480' }}
                />
              </div>

              {selectedReplayIncident.timeline?.[replayStepIndex] && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: '#2C3480',
                    border: '1px solid #ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                      STAGE: {selectedReplayIncident.timeline[replayStepIndex].stage}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1' }}>
                      {new Date(selectedReplayIncident.timeline[replayStepIndex].timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    Actor: {selectedReplayIncident.timeline[replayStepIndex].actor}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                    {selectedReplayIncident.timeline[replayStepIndex].note}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#000000' }}>
              No incidents with completed timelines available for replay.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
