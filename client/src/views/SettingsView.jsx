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
            <Settings size={20} color="#ffffff" />
            <span>SYSTEM CONFIGURATION & IMMUTABLE AUDIT LOGS</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Database connectivity, operational telemetry parameters, and operator audit trail
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* System Health */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#000000', border: '1px solid #2C3480' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={16} color="#ffffff" />
            <span>OPERATIONAL INFRASTRUCTURE HEALTH</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(44, 52, 128, 0.15)', borderRadius: '6px', border: '1px solid rgba(44, 52, 128, 0.3)' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>MongoDB Atlas Cluster:</span>
              <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', border: '1px solid #ffffff' }}>
                {healthData?.connections?.database || 'CONNECTED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(44, 52, 128, 0.15)', borderRadius: '6px', border: '1px solid rgba(44, 52, 128, 0.3)' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Gemini AI Triage Engine:</span>
              <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', border: '1px solid #ffffff' }}>
                {healthData?.connections?.geminiAiEngine || 'ACTIVE (gemini-2.5-flash)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(44, 52, 128, 0.15)', borderRadius: '6px', border: '1px solid rgba(44, 52, 128, 0.3)' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>WebSocket Telemetry:</span>
              <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', border: '1px solid #ffffff' }}>
                BIDIRECTIONAL (Socket.IO)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(44, 52, 128, 0.15)', borderRadius: '6px', border: '1px solid rgba(44, 52, 128, 0.3)' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>System Version:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff', fontWeight: 800 }}>
                v2.5.0-FUTURISTIC
              </span>
            </div>
          </div>
        </div>

        {/* Demo Mode & Drill Simulation Controls */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#000000', border: '1px solid #2C3480' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#ffffff" />
            <span>ORIGINAL DATA / SIMULATION CONTROLS</span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Clearly distinguish authentic original records from simulated drills.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-outline"
              style={{
                flex: 1,
                background: isDemoMode ? '#2C3480' : 'transparent',
                borderColor: '#ffffff',
                color: '#ffffff',
                fontWeight: 700,
              }}
              onClick={toggleDemoMode}
            >
              <Sparkles size={14} color="#ffffff" />
              <span>{isDemoMode ? 'Demo Active' : 'Live Active'}</span>
            </button>

            <button
              className="btn-primary"
              style={{ flex: 1, background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
              onClick={handleInjectSimIncident}
            >
              + Inject Drill Alert
            </button>
          </div>

          <button
            className="btn-outline"
            style={{ borderColor: 'rgba(239, 68, 68, 0.6)', color: '#ffffff', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.15)' }}
            onClick={handleResetBaseline}
            disabled={isResetting}
          >
            <RotateCcw size={14} color="#ffffff" />
            <span>{isResetting ? 'Resetting DB...' : 'Reset Database to Clean Baseline'}</span>
          </button>
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#000000', border: '1px solid #2C3480' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#ffffff" />
            <span>IMMUTABLE OPERATOR DISPATCH AUDIT LOG ({auditLogs.length} EVENTS)</span>
          </div>
          <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', border: '1px solid #ffffff' }}>
            TAMPER-EVIDENT
          </span>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {auditLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                background: 'rgba(44, 52, 128, 0.15)',
                border: '1px solid rgba(44, 52, 128, 0.35)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', minWidth: '70px', fontWeight: 800 }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ fontWeight: 800, color: '#ffffff' }}>
                  {log.action}
                </span>
                {log.incidentId && (
                  <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)', background: '#2C3480', padding: '1px 6px', borderRadius: '4px' }}>
                    [{log.incidentId}]
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
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
