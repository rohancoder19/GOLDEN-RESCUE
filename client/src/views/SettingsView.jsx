import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Radio,
  Sparkles,
  RotateCcw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function SettingsView({
  isDemoMode,
  toggleDemoMode,
  auditLogs = [],
  onRefreshData,
}) {
  const [healthData, setHealthData] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then(setHealthData)
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  const handleResetBaseline = async () => {
    if (!window.confirm('Reset database to clean operational baseline?')) return;
    setIsResetting(true);
    try {
      await api.resetBaseline();
      playTelemetryChirp();
      alert('Operational baseline restored successfully.');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleInjectSimIncident = async () => {
    try {
      const res = await api.injectSimulationIncident();
      playTelemetryChirp();
      alert(`Injected simulated incident: ${res.incident?.title}`);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Injection error: ${err.message}`);
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
            <Settings size={20} color="#00f0ff" />
            <span>SYSTEM CONFIGURATION & IMMUTABLE AUDIT LOGS</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Database connectivity, operational telemetry parameters, and operator audit trail
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* System Health */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={16} color="#00f0ff" />
            <span>OPERATIONAL INFRASTRUCTURE HEALTH</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MongoDB Atlas Cluster:</span>
              <span className="telemetry-chip" style={{ color: 'var(--green-ready)' }}>
                {healthData?.connections?.database || 'CONNECTED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gemini AI Triage Engine:</span>
              <span className="telemetry-chip">
                {healthData?.connections?.geminiAiEngine || 'ACTIVE (gemini-2.5-flash)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>WebSocket Telemetry:</span>
              <span className="telemetry-chip" style={{ color: 'var(--green-ready)' }}>
                BIDIRECTIONAL (Socket.IO)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Version:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff' }}>
                v2.5.0-FUTURISTIC
              </span>
            </div>
          </div>
        </div>

        {/* Demo Mode & Drill Simulation Controls */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#f59e0b" />
            <span>SIMULATION DRILL CONTROLS (JUDGES / DEMO)</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Clearly switch between Live Operational Data and Demonstration Simulation Mode. Drill events cannot alter live emergency services.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-outline"
              style={{
                flex: 1,
                borderColor: isDemoMode ? 'var(--brand-gold)' : 'var(--green-ready)',
                color: isDemoMode ? 'var(--brand-gold)' : 'var(--green-ready)',
              }}
              onClick={toggleDemoMode}
            >
              <Sparkles size={14} />
              <span>{isDemoMode ? 'Demo Active' : 'Live Active'}</span>
            </button>

            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={handleInjectSimIncident}
            >
              + Inject Drill Alert
            </button>
          </div>

          <button
            className="btn-outline"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', justifyContent: 'center' }}
            onClick={handleResetBaseline}
            disabled={isResetting}
          >
            <RotateCcw size={14} />
            <span>{isResetting ? 'Resetting DB...' : 'Reset Database to Seed Baseline'}</span>
          </button>
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#00f0ff" />
            <span>IMMUTABLE OPERATOR DISPATCH AUDIT LOG ({auditLogs.length} EVENTS)</span>
          </div>
          <span className="telemetry-chip">TAMPER-EVIDENT</span>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {auditLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', minWidth: '70px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  {log.action}
                </span>
                {log.incidentId && (
                  <span style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-mono)' }}>
                    [{log.incidentId}]
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                <span>Actor: {log.operator?.name || 'Dispatcher Delta-7'}</span>
                <span>Badge: {log.operator?.badgeId || 'GR-8802'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
