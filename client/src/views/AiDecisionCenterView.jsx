import React, { useState } from 'react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

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
    <div className="workspace-container">
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-tactical)',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>
              smart_toy
            </span>
            <span>AI MULTI-AGENT DECISION CENTER &amp; SIMULATION SUITE</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Multi-Agent clinical reasoning engine, Bayesian predictive spatial corridors, and dispatch sandboxing
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
              type="button"
              className={`layer-toggle-btn ${activeTab === tab.id ? 'active' : ''}`}
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
            style={{
              padding: '14px 18px',
              background: 'var(--surface-container-low)',
              border: '1px solid var(--border-tactical)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '3px' }}>
              AUTONOMOUS 7-STAGE EMERGENCY DISPATCH REASONING ARCHITECTURE
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--on-surface)' }}>
              Every incident is evaluated through a deterministic tactical pipeline paired with Google Gemini 2.5 Flash for clinical triage justification and corridor clearance.
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
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-tactical)',
                  borderTop: '3px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-tactical)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-telemetry)', color: 'var(--primary)', fontWeight: 800 }}>
                    {step.stage}
                  </span>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-telemetry)', background: 'var(--surface-container-highest)', color: 'var(--secondary)', padding: '2px 5px', borderRadius: '3px' }}>
                    {step.latency}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '13.5px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                  {step.agent}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--outline)', lineHeight: '1.5' }}>
                  {step.desc}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-tactical)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>check_circle</span>
                  <span style={{ fontSize: '10px', color: 'var(--on-surface)', fontFamily: 'var(--font-telemetry)', fontWeight: 700 }}>
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
            style={{
              padding: '14px 18px',
              background: 'var(--surface-container-low)',
              border: '1px solid var(--border-tactical)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '3px' }}>
              SPATIAL-TEMPORAL BAYESIAN ACCIDENT PREDICTIVE CORRIDORS
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--on-surface)' }}>
              Predictive risk corridors identify high-probability collision zones based on road curvature, rush-hour traffic volume, and real-time precipitation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-tactical)',
                  borderLeft: '4px solid var(--secondary)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-tactical)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--primary)', fontWeight: 800 }}>
                    {hs.id}
                  </span>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '10px', background: 'rgba(255, 189, 88, 0.2)', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '3px' }}>
                    {hs.riskLevel.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                  {hs.name}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--on-surface)' }}>
                  Historical Monthly Incident Frequency: <strong style={{ color: 'var(--primary)' }}>{hs.historicalIncidentsMonth} collisions</strong>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 700, fontFamily: 'var(--font-telemetry)' }}>
                    CONTRIBUTING RISK VECTORS:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {hs.primaryFactors?.map((f, i) => (
                      <span key={i} style={{ fontSize: '10px', fontFamily: 'var(--font-telemetry)', background: 'var(--surface-container-highest)', color: 'var(--on-surface)', padding: '2px 6px', borderRadius: '3px' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid var(--primary)',
                    fontSize: '11px',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-telemetry)',
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
            style={{
              padding: '14px 18px',
              background: 'var(--surface-container-low)',
              border: '1px solid var(--border-tactical)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '3px' }}>
              NON-OPERATIONAL WHAT-IF DISPATCH SIMULATOR
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--on-surface)' }}>
              Test hypothetical mass-casualty scenarios without altering active emergency operations. Compare response times and resource exhaustion limits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
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
                type="button"
                className="btn-command-gold"
                onClick={handleRunWhatIf}
                disabled={isSimulating}
                style={{ marginTop: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                <span>{isSimulating ? 'SIMULATING RESPONSE...' : 'EXECUTE WHAT-IF SIMULATION'}</span>
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                PROJECTED OPERATIONAL OUTCOME
              </div>

              {simulationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className={`incident-severity-badge badge-${simulationResult.triageSeverity === 'CRITICAL' ? 'crit' : 'high'}`}>
                      {simulationResult.triageSeverity}
                    </span>
                    <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.15)', padding: '2px 8px', borderRadius: '3px' }}>
                      AI CONFIDENCE: {simulationResult.confidence}%
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid var(--border-tactical)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                      RECOMMENDED AMBULANCE:
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 800 }}>
                      🚑 {simulationResult.recommendedAmbulance?.callsign || 'Mutual Aid Request Required'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px' }}>
                      ETA: {simulationResult.recommendedAmbulance?.etaMinutes || 4} mins • Base: {simulationResult.recommendedAmbulance?.baseStation}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid var(--border-tactical)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                      MATCHED HOSPITAL DESTINATION:
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: 800 }}>
                      🏥 {simulationResult.matchedHospital?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px' }}>
                      Available Beds: {simulationResult.matchedHospital?.availableBeds} • Level: {simulationResult.matchedHospital?.traumaLevel}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)', fontSize: '12px' }}>
                  Execute a scenario to preview AI multi-agent dispatch predictions and fleet routing.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Incident Replay */}
      {activeTab === 'replay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--surface-container-low)',
              border: '1px solid var(--border-tactical)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '3px' }}>
              CHRONOLOGICAL INCIDENT REPLAY &amp; AUDIT TRAIL
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--on-surface)' }}>
              Step backward and forward through past critical incidents to review triage timing, vehicle rollout, and patient arrival milestones.
            </p>
          </div>

          {selectedReplayIncident ? (
            <div
              style={{
                padding: '20px',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-tactical)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '16px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                    {selectedReplayIncident.title} ({selectedReplayIncident.incidentId})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                    {selectedReplayIncident.location?.address}
                  </div>
                </div>
                <span className={`incident-severity-badge badge-${selectedReplayIncident.severity === 'CRITICAL' ? 'crit' : 'high'}`}>
                  {selectedReplayIncident.severity}
                </span>
              </div>

              {/* Timeline Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedReplayIncident.timeline?.map((step, idx) => {
                  const isCurrent = idx === replayStepIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setReplayStepIndex(idx)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '4px',
                        background: isCurrent ? 'var(--surface-container-highest)' : 'var(--surface-container-lowest)',
                        border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border-tactical)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isCurrent ? 'var(--primary)' : 'var(--outline)' }}>
                          {isCurrent ? 'radio_button_checked' : 'check_circle'}
                        </span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                            {step.stage} • {step.actor}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                            {step.note}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--secondary)' }}>
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)' }}>
              No incidents with recorded timeline data for replay.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
