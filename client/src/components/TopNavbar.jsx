import React, { useState, useEffect } from 'react';
import { toggleAudioMute, getAudioMuted, playTelemetryChirp } from '../services/audio';

export default function TopNavbar({
  searchQuery,
  setSearchQuery,
  isDemoMode,
  toggleDemoMode,
  showOriginalOnly,
  toggleShowOriginalOnly,
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

  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED' || i.status === 'ON_SCENE')
  ).length;

  const zuluTimeStr = `${currentTime.getUTCHours().toString().padStart(2, '0')}:${currentTime.getUTCMinutes().toString().padStart(2, '0')}:${currentTime.getUTCSeconds().toString().padStart(2, '0')} UTC`;
  const localTimeStr = currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EST';

  return (
    <header className="top-navbar">
      {/* Search Input Box with Ctrl+K shortcut */}
      <div className="top-navbar-left">
        <div className="search-box-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search active incidents, triage tags, units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="search-kbd">Ctrl+K</kbd>
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div className="top-navbar-right">
        {/* Dual Clocks: ZULU & LOCAL */}
        <div className="dual-clock-cluster">
          <div className="clock-item" style={{ textAlign: 'right' }}>
            <span className="clock-label">ZULU / UTC</span>
            <span className="clock-val" style={{ color: 'var(--primary)' }}>
              {zuluTimeStr}
            </span>
          </div>
          <div className="clock-divider"></div>
          <div className="clock-item">
            <span className="clock-label">LOCAL (HQ)</span>
            <span className="clock-val" style={{ color: 'var(--secondary)' }}>
              {localTimeStr}
            </span>
          </div>
        </div>

        {/* Live Simulation / Ready Badge with Ping Dot */}
        <button
          type="button"
          className="live-badge-pill"
          onClick={() => {
            playTelemetryChirp();
            toggleDemoMode();
          }}
          title="Click to toggle Real-time Simulation Engine"
          style={{ cursor: 'pointer', background: 'var(--surface-container-low)' }}
        >
          <span className="live-beacon-dot">
            <span className="ping-corona"></span>
            <span className="solid-core"></span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {isDemoMode ? 'LIVE SIMULATION / STREAMING' : 'LIVE SIMULATION / READY'}
          </span>
        </button>

        {/* Sound Toggle Button */}
        <button
          type="button"
          className="icon-btn-tactical"
          onClick={handleMuteToggle}
          title={muted ? 'Unmute Emergency Audio' : 'Mute Emergency Audio'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {muted ? 'volume_off' : 'volume_up'}
          </span>
        </button>

        {/* Emergency Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-btn-tactical"
            onClick={() => {
              playTelemetryChirp();
              setShowNotifications(!showNotifications);
            }}
            title="Emergency Priority Notifications"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              notifications
            </span>
            {criticalCount > 0 && (
              <span className="notification-count-badge">
                {criticalCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '320px',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-tactical)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-tactical), var(--glow-cyan)',
                zIndex: 1000,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-tactical)', paddingBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-headline)', fontSize: '13px', fontWeight: 600, color: 'var(--on-surface-bright)' }}>
                  Active Priority Alerts
                </span>
                <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '10px', color: 'var(--primary)' }}>
                  {criticalCount} CRITICAL
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                {incidents.slice(0, 5).map((inc) => (
                  <div
                    key={inc.incidentId}
                    onClick={() => {
                      if (onSelectIncident) onSelectIncident(inc);
                      setShowNotifications(false);
                    }}
                    style={{
                      background: 'var(--surface-container-lowest)',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${inc.severity === 'CRITICAL' ? 'var(--error)' : 'var(--secondary)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-telemetry)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--on-surface-bright)' }}>{inc.incidentId}</span>
                      <span style={{ color: inc.severity === 'CRITICAL' ? 'var(--error)' : 'var(--secondary)' }}>{inc.severity}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-bright)', marginTop: '2px', fontWeight: 500 }}>
                      {inc.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dispatch Supervisor Profile */}
        <div className="supervisor-profile-chip">
          <div className="avatar-wrapper">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Dispatch Supervisor Cmdr. S. Thompson"
              className="avatar-img"
            />
            <span className="avatar-status-dot"></span>
          </div>
          <div className="supervisor-meta">
            <span className="supervisor-name">Cmdr. S. Thompson</span>
            <span className="supervisor-role">Dispatch Supervisor</span>
          </div>
        </div>
      </div>
    </header>
  );
}
