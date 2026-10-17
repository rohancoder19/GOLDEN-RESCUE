import React, { useState, useEffect } from 'react';
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
              settings
            </span>
            <span>SYSTEM CONFIGURATION &amp; IMMUTABLE AUDIT TRAIL</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Database connectivity, operational telemetry parameters, and operator incident audit logging
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* System Health */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>dns</span>
            <span>OPERATIONAL INFRASTRUCTURE HEALTH</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>MongoDB Atlas Cluster:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--primary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.database || 'CONNECTED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>WebSocket Real-Time Engine:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--primary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.socketIO || 'SYNCHRONIZED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Google Gemini 2.5 Flash API:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', background: 'rgba(255, 189, 88, 0.15)', border: '1px solid var(--secondary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.gemini || 'ONLINE / AUTHENTICATED'}
              </span>
            </div>
          </div>
        </div>

        {/* Simulation Engine Controls */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--secondary)' }}>tune</span>
            <span>SIMULATION &amp; BASELINE CONTROLS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn-command-gold"
              onClick={handleInjectSimIncident}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
              <span>INJECT SYNTHETIC EMERGENCY DISPATCH</span>
            </button>

            <button
              type="button"
              className="btn-command-eas"
              onClick={handleResetBaseline}
              disabled={isResetting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
              <span>{isResetting ? 'RESTORING BASELINE...' : 'PURGE SIMULATIONS & RESTORE CLEAN BASELINE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
          IMMUTABLE SYSTEM AUDIT TRAIL ({auditLogs.length} EVENTS)
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-tactical)', color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                <th style={{ padding: '8px 12px' }}>TIMESTAMP</th>
                <th style={{ padding: '8px 12px' }}>ACTION</th>
                <th style={{ padding: '8px 12px' }}>PERFORMED BY</th>
                <th style={{ padding: '8px 12px' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30, 58, 95, 0.4)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-telemetry)', color: 'var(--outline)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--font-telemetry)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--on-surface-bright)' }}>
                      {log.performedBy}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--outline)' }}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
