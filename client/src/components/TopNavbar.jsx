import React, { useState, useEffect } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  PlusCircle,
  Activity,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { toggleAudioMute, getAudioMuted, playTelemetryChirp } from '../services/audio';

export default function TopNavbar({
  searchQuery,
  setSearchQuery,
  isDemoMode,
  toggleDemoMode,
  onOpenNewIncident,
  incidents = [],
  onSelectIncident,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [muted, setMuted] = useState(getAudioMuted());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMuteToggle = () => {
    const next = toggleAudioMute();
    setMuted(next);
    if (!next) playTelemetryChirp();
  };

  const recentAlerts = incidents.slice(0, 5);

  return (
    <header className="top-navbar">
      {/* Search Input */}
      <div className="search-box-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search incidents, fleet, hospitals (e.g. INC-2026, AMB-101)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Center Live Telemetry Clock */}
      <div className="time-hud-display">
        <div className="time-local">
          {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          <span style={{ fontSize: '10px', color: 'var(--cyan-telemetry)', marginLeft: '4px' }}>LOCAL</span>
        </div>
        <div className="time-utc">
          {currentTime.toUTCString().slice(17, 25)} UTC • {currentTime.toISOString().slice(0, 10)}
        </div>
      </div>

      {/* Actions & Operator Profile Cluster */}
      <div className="top-actions-cluster">
        {/* Quick Report Emergency Button */}
        <button
          className="btn-dispatch"
          onClick={() => {
            playTelemetryChirp();
            onOpenNewIncident();
          }}
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          <PlusCircle size={15} />
          <span>New Incident</span>
        </button>

        {/* Demo Mode / Live Mode Indicator Pill */}
        <button
          className="demo-mode-pill"
          onClick={() => {
            playTelemetryChirp();
            toggleDemoMode();
          }}
          title={isDemoMode ? 'Click to toggle Live Verified mode' : 'Click to enable Simulation mode'}
          style={{
            background: isDemoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            borderColor: isDemoMode ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)',
            color: isDemoMode ? 'var(--brand-gold)' : 'var(--green-ready)',
          }}
        >
          <Sparkles size={13} />
          <span>{isDemoMode ? 'DEMO SIMULATION' : 'LIVE OPERATIONAL'}</span>
        </button>

        {/* Sound Toggle */}
        <button
          className="icon-btn-utility"
          onClick={handleMuteToggle}
          title={muted ? 'Unmute Audio HUD' : 'Mute Audio HUD'}
        >
          {muted ? <VolumeX size={16} color="#ef4444" /> : <Volume2 size={16} color="#00f0ff" />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn-utility"
            onClick={() => {
              playTelemetryChirp();
              setShowNotifications(!showNotifications);
            }}
            title="Dispatch Broadcast Notifications"
          >
            <Bell size={16} />
            {recentAlerts.some((i) => i.severity === 'CRITICAL') && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--red-critical)',
                  boxShadow: '0 0 6px var(--red-critical)',
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '320px',
                maxHeight: '380px',
                overflowY: 'auto',
                padding: '12px',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '8px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>LIVE DISPATCH ALERTS</span>
                <span style={{ fontSize: '10px', color: 'var(--cyan-telemetry)', fontFamily: 'var(--font-mono)' }}>
                  ACTIVE FEED
                </span>
              </div>
              <div style={{ display: 'flex', flexExpansion: 'column', flexDirection: 'column', gap: '8px' }}>
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.incidentId}
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectIncident(alert);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cyan-telemetry)' }}>
                        {alert.incidentId}
                      </span>
                      <span className={`severity-badge badge-${alert.severity}`} style={{ fontSize: '9px' }}>
                        {alert.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#fff' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {alert.location?.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile */}
        <div className="operator-pill">
          <div className="operator-avatar">D7</div>
          <div className="operator-meta">
            <span className="operator-name">Delta-7</span>
            <span className="operator-role">L3 DISPATCHER</span>
          </div>
        </div>
      </div>
    </header>
  );
}
