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
  activeRegion = 'SAN_FRANCISCO',
  onSwitchRegion,
  currentUser = null,
  onLogout = null,
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

  const isIndia = activeRegion === 'DELHI_NCR';

  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED' || i.status === 'ON_SCENE')
  ).length;

  const zuluTimeStr = `${currentTime.getUTCHours().toString().padStart(2, '0')}:${currentTime.getUTCMinutes().toString().padStart(2, '0')}:${currentTime.getUTCSeconds().toString().padStart(2, '0')} UTC`;
  const localTimeStr = isIndia
    ? currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST'
    : currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' PST';

  return (
    <header className="top-navbar">
      {/* Search Input Box with Ctrl+K shortcut */}
      <div className="top-navbar-left">
        <div className="search-box-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder={isIndia ? "Search 108/112 incidents, AIIMS, Safdarjung..." : "Search active incidents, triage tags, units..."}
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
            <span className="clock-label">{isIndia ? 'LOCAL (DELHI IST)' : 'LOCAL (SF HQ)'}</span>
            <span className="clock-val" style={{ color: isIndia ? 'var(--secondary)' : 'var(--primary)' }}>
              {localTimeStr}
            </span>
          </div>
        </div>

        {/* Regional Sector Switcher: INDIA 108/112 vs USA 911 */}
        {onSwitchRegion && (
          <button
            type="button"
            className="live-badge-pill"
            onClick={() => {
              playTelemetryChirp();
              onSwitchRegion(isIndia ? 'SAN_FRANCISCO' : 'DELHI_NCR');
            }}
            title="Click to toggle Regional Sector (India 108/112 vs US 911)"
            style={{
              cursor: 'pointer',
              background: isIndia ? 'rgba(255, 189, 88, 0.12)' : 'rgba(0, 212, 255, 0.12)',
              border: `1px solid ${isIndia ? 'var(--secondary)' : 'var(--primary)'}`,
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px' }}>{isIndia ? '🇮🇳' : '🇺🇸'}</span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                fontWeight: 700,
                color: isIndia ? 'var(--secondary)' : 'var(--primary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {isIndia ? 'INDIA: DELHI (108/112)' : 'USA: SF BAY (911)'}
            </span>
          </button>
        )}

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

        {/* Dispatch Operator Profile */}
        <div className="supervisor-profile-chip" title={`Authenticated as ${currentUser?.email || 'Dispatcher'}`}>
          <div className="avatar-wrapper">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: currentUser?.role === 'ADMIN' ? 'rgba(255, 189, 88, 0.2)' : 'rgba(0, 212, 255, 0.2)',
                border: `1.5px solid ${currentUser?.role === 'ADMIN' ? '#ffbd58' : '#00d4ff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentUser?.role === 'ADMIN' ? '#ffbd58' : '#00d4ff',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <span className="avatar-status-dot"></span>
          </div>
          <div className="supervisor-meta">
            <span className="supervisor-name">{currentUser?.name || 'Authorized Dispatcher'}</span>
            <span className="supervisor-role">
              {currentUser?.role || 'DISPATCHER'} • {currentUser?.badgeId || 'GR-001'}
            </span>
          </div>
        </div>

        {/* Tactical Sign Out Button */}
        {onLogout && (
          <button
            type="button"
            className="icon-btn-tactical"
            onClick={onLogout}
            title="Sign Out of Golden Rescue Terminal"
            style={{
              color: 'var(--error, #ff4d5a)',
              background: 'rgba(255, 77, 90, 0.08)',
              border: '1px solid rgba(255, 77, 90, 0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              logout
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
