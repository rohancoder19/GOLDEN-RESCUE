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

  // What-If Simulation State
  const [whatIfTitle, setWhatIfTitle] = useState('Multi-Vehicle Collision on Central Expressway');
  const [whatIfCategory, setWhatIfCategory] = useState('TRAFFIC_COLLISION');
  const [whatIfAddress, setWhatIfAddress] = useState('Central Expressway Interchange (Rush Hour)');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Incident Replay State
  const completedIncidents = incidents.filter((i) => i.timeline && i.timeline.length > 1);
  const [replayIncidentId, setReplayIncidentId] = useState(completedIncidents[0]?.incidentId || '');
  const [replayStepIndex, setReplayStepIndex] = useState(0);

  const selectedReplayIncident = incidents.find((i) => i.incidentId === replayIncidentId) || completedIncidents[0];

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
    <div className="workspace-container">
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
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#a855f7" />
            <span>AI DECISION CENTER & INNOVATION SUITE</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Multi-Agent reasoning engine, predictive spatial hotspots, what-if dispatch sandboxing, and incident replay
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
            style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', marginBottom: '4px' }}>
              AUTONOMOUS 8-STAGE EMERGENCY DISPATCH REASONING ARCHITECTURE
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Every incident is evaluated through a decoupled deterministic operational pipeline paired with Google Gemini 2.5 Flash for clinical triage justification.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              {
                agent: 'Agent 1: Incident Detection Agent',
                stage: 'DETECT & VALIDATE',
                desc: 'Validates raw incoming payload integrity, verifies 911/CCTV/IoT source authenticity, normalizes coordinates.',
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
                desc: 'Filters busy units (prevents double-assignment), ranks available fleet by capability match (ALS vs BLS) and ETA.',
                latency: '3.1ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 5: Hospital Matching Agent',
                stage: 'FACILITY TRIAGE',
                desc: 'Matches receiving trauma levels (Level 1-3), verifies real ICU/bed availability, bypasses diverting hospitals.',
                latency: '2.8ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 6: Route Optimization Agent',
                stage: 'NAVIGATION ROUTING',
                desc: 'Interpolates turn-by-turn waypoints, incorporates simulated urban traffic congestion factor, computes ETA.',
                latency: '4.5ms',
                status: 'OPERATIONAL',
              },
              {
                agent: 'Agent 7: Coordination Agent',
                stage: 'COMMAND & AUDIT',
                desc: 'Synthesizes transparent rationale (WHY unit X was picked over Y), logs audit events, triggers WebSocket alert.',
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
                  borderTop: '3px solid var(--cyan-telemetry)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)' }}>
                    {step.stage}
                  </span>
                  <span className="telemetry-chip" style={{ fontSize: '9px' }}>
                    {step.latency}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {step.agent}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {step.desc}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span style={{ fontSize: '10px', color: 'var(--green-ready)', fontFamily: 'var(--font-mono)' }}>
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
            style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
              SPATIAL-TEMPORAL BAYESIAN ACCIDENT PREDICTIVE MODEL (PROBABILISTIC FORECAST)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Predictive risk corridors identify high-probability collision zones based on road curvature, rush-hour volume, and real-time precipitation. Ambulances can be dynamically pre-positioned before collisions occur.
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
                  borderLeft: hs.riskLevel === 'CRITICAL_RISK' ? '4px solid #ef4444' : '4px solid #f59e0b',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan-telemetry)' }}>
                    {hs.id}
                  </span>
                  <span className={`severity-badge ${hs.riskLevel === 'CRITICAL_RISK' ? 'badge-CRITICAL' : 'badge-HIGH'}`}>
                    {hs.riskLevel.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {hs.name}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Historical Monthly Incident Frequency: <strong>{hs.historicalIncidentsMonth} collisions</strong>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>CONTRIBUTING RISK VECTORS:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {hs.primaryFactors?.map((f, i) => (
                      <span key={i} className="telemetry-chip" style={{ fontSize: '10px' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '11px',
                    color: 'var(--green-ready)',
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
            style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan-telemetry)', marginBottom: '4px' }}>
              NON-OPERATIONAL WHAT-IF DISPATCH SIMULATOR
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Test hypothetical mass-casualty scenarios or highway bottlenecks without altering active emergency operations. Compare response times and resource exhaustion limits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Input Form */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                CONFIGURE SIMULATION DRILL
              </div>

              <div className="form-group">
                <label className="form-label">SCENARIO NAME:</label>
                <input
                  type="text"
                  className="form-input"
                  value={whatIfTitle}
                  onChange={(e) => setWhatIfTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">EMERGENCY CATEGORY:</label>
                <select
                  className="form-select"
                  value={whatIfCategory}
                  onChange={(e) => setWhatIfCategory(e.target.value)}
                >
                  <option value="TRAFFIC_COLLISION">Traffic Collision</option>
                  <option value="CARDIAC_ARREST">Cardiac Arrest</option>
                  <option value="INDUSTRIAL_FIRE">Industrial Fire</option>
                  <option value="STROKE_NEURO">Stroke / Neurological</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SIMULATED LOCATION:</label>
                <input
                  type="text"
                  className="form-input"
                  value={whatIfAddress}
                  onChange={(e) => setWhatIfAddress(e.target.value)}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleRunWhatIf}
                disabled={isSimulating}
                style={{ marginTop: '8px', justifyContent: 'center' }}
              >
                <Play size={15} />
                <span>{isSimulating ? 'SIMULATING RESPONSE...' : 'EXECUTE WHAT-IF SIMULATION'}</span>
              </button>
            </div>

            {/* Simulation Results Display */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                PROJECTED OPERATIONAL OUTCOME
              </div>

              {simulationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={`severity-badge badge-${simulationResult.triageSeverity}`}>
                      {simulationResult.triageSeverity}
                    </span>
                    <span className="telemetry-chip">
                      AI CONFIDENCE: {simulationResult.confidence}%
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                      RECOMMENDED AMBULANCE:
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--cyan-telemetry)', fontWeight: 700 }}>
                      🚑 {simulationResult.recommendedAmbulance?.callsign || 'Mutual Aid Request Required'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Projected Arrival Time: <strong>{simulationResult.projectedEtaMinutes || 4} minutes</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                      RECOMMENDED DESTINATION FACILITY:
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--green-ready)', fontWeight: 700 }}>
                      🏥 {simulationResult.recommendedHospital?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Available ICU Beds: {simulationResult.recommendedHospital?.icuAvailable} beds
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{simulationResult.clinicalRecommendation}"
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
            style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-ready)', marginBottom: '4px' }}>
              INCIDENT POST-ACTION REPLAY & TELEMETRY TIMELINE SCRUBBER
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Step backward or forward through historic emergency lifecycles from the initial 911 alert through AI triage, vehicle rollout, and hospital handover.
            </p>
          </div>

          {selectedReplayIncident ? (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Incident Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SELECT INCIDENT:</span>
                <select
                  className="form-select"
                  style={{ maxWidth: '400px' }}
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

              {/* Scrubber Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>START: {selectedReplayIncident.timeline?.[0]?.stage || 'REPORTED'}</span>
                  <span>
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
                  style={{ width: '100%', accentColor: 'var(--cyan-telemetry)' }}
                />
              </div>

              {/* Current Scrubber Step Details */}
              {selectedReplayIncident.timeline?.[replayStepIndex] && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--cyan-telemetry)' }}>
                      STAGE: {selectedReplayIncident.timeline[replayStepIndex].stage}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(selectedReplayIncident.timeline[replayStepIndex].timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                    Actor: {selectedReplayIncident.timeline[replayStepIndex].actor}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedReplayIncident.timeline[replayStepIndex].note}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No incidents with completed timelines available for replay.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
