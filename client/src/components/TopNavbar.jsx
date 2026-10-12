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
  ShieldCheck,
  Filter,
} from 'lucide-react';
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

  const recentAlerts = incidents.slice(0, 5);

  return (
    <header className="top-navbar" style={{ background: '#000000', borderBottom: '1px solid rgba(44, 52, 128, 0.4)' }}>
      {/* Search Input */}
      <div className="search-box-wrapper">
        <Search size={16} className="search-icon" color="#ffffff" />
        <input
          type="text"
          className="search-input"
          placeholder="Search original incidents, fleet, hospitals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
        />
      </div>

      {/* Center Live Telemetry Clock */}
      <div className="time-hud-display">
        <div className="time-local" style={{ color: '#ffffff' }}>
          {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          <span style={{ fontSize: '10px', color: '#5866db', marginLeft: '6px', fontWeight: 800 }}>LIVE</span>
        </div>
        <div className="time-utc" style={{ color: '#94a3b8' }}>
          {currentTime.toUTCString().slice(17, 25)} UTC • {currentTime.toISOString().slice(0, 10)}
        </div>
      </div>

      {/* Actions & Operator Profile Cluster */}
      <div className="top-actions-cluster">
        {/* Toggle Original Datas Only */}
        <button
          className="demo-mode-pill"
          onClick={toggleShowOriginalOnly}
          title={showOriginalOnly ? 'Showing original authentic data only (click to include simulated)' : 'Showing all data (click to filter original only)'}
          style={{
            background: showOriginalOnly ? '#2C3480' : 'rgba(44, 52, 128, 0.2)',
            borderColor: showOriginalOnly ? '#ffffff' : 'rgba(44, 52, 128, 0.6)',
            color: '#ffffff',
            boxShadow: showOriginalOnly ? '0 0 10px rgba(44, 52, 128, 0.7)' : 'none',
          }}
        >
          <ShieldCheck size={14} color="#ffffff" />
          <span>{showOriginalOnly ? 'ORIGINAL DATA ONLY' : 'ALL DATA (INC. SIM)'}</span>
        </button>

        {/* Quick Report Emergency Button */}
        <button
          className="btn-dispatch"
          onClick={() => {
            playTelemetryChirp();
            onOpenNewIncident();
          }}
          style={{ padding: '6px 14px', fontSize: '12px', background: '#2C3480', border: '1px solid #ffffff' }}
        >
          <PlusCircle size={15} color="#ffffff" />
          <span style={{ color: '#ffffff', fontWeight: 800 }}>+ New Incident</span>
        </button>

        {/* Sound Toggle */}
        <button
          className="icon-btn-utility"
          onClick={handleMuteToggle}
          title={muted ? 'Unmute Audio HUD' : 'Mute Audio HUD'}
          style={{ background: '#000000', border: '1px solid #2C3480' }}
        >
          {muted ? <VolumeX size={16} color="#ef4444" /> : <Volume2 size={16} color="#ffffff" />}
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
            style={{ background: '#000000', border: '1px solid #2C3480' }}
          >
            <Bell size={16} color="#ffffff" />
            {recentAlerts.some((i) => i.severity === 'CRITICAL') && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
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
                border: '1px solid #2C3480',
                background: '#000000',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(44, 52, 128, 0.4)',
                  paddingBottom: '8px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>LIVE DISPATCH ALERTS</span>
                <span style={{ fontSize: '10px', color: '#5866db', fontFamily: 'var(--font-mono)' }}>
                  ACTIVE FEED
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      background: 'rgba(44, 52, 128, 0.15)',
                      border: '1px solid rgba(44, 52, 128, 0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#ffffff', fontWeight: 700 }}>
                        {alert.incidentId}
                      </span>
                      <span className={`severity-badge badge-${alert.severity}`} style={{ fontSize: '9px' }}>
                        {alert.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#ffffff' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      {alert.location?.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile */}
        <div className="operator-pill" style={{ background: 'rgba(44, 52, 128, 0.25)', border: '1px solid #2C3480' }}>
          <div className="operator-avatar" style={{ background: '#2C3480', border: '1px solid #ffffff' }}>
            D7
          </div>
          <div className="operator-meta">
            <span className="operator-name" style={{ color: '#ffffff' }}>Delta-7</span>
            <span className="operator-role" style={{ color: '#d1d5db' }}>L3 DISPATCHER</span>
          </div>
        </div>
      </div>
    </header>
  );
}
