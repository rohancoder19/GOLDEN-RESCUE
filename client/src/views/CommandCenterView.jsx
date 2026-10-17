import React, { useState } from 'react';
import EmergencyMap from '../components/EmergencyMap';

export default function CommandCenterView({
  incidents = [],
  ambulances = [],
  hospitals = [],
  hotspots = [],
  analytics = null,
  selectedIncident,
  onSelectIncident,
  onOpenNewIncident,
  onNavigateView,
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [mapLayers, setMapLayers] = useState({
    incidents: true,
    fleet: true,
    hospitals: true,
    hotspots: true,
    routes: true,
  });

  const mergedIncidents = incidents;

  // Active focused incident (default to first or selected)
  const activeFocus = selectedIncident || mergedIncidents[0] || null;

  // Filtering
  const filteredList = mergedIncidents.filter((inc) => {
    if (filterType === 'CRIT' && inc.severity !== 'CRITICAL') return false;
    if (filterType === 'HIGH' && inc.severity !== 'HIGH') return false;
    if (filterType === 'DISP' && inc.status !== 'DISPATCHED' && inc.status !== 'EN_ROUTE') return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        inc.incidentId?.toLowerCase().includes(q) ||
        inc.title?.toLowerCase().includes(q) ||
        inc.location?.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalActiveCount = analytics?.metrics?.activeIncidents ?? mergedIncidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED').length;

  const toggleLayer = (key) => {
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectIncident = (inc) => {
    if (onSelectIncident) {
      onSelectIncident(inc);
    }
  };

  return (
    <div className="workspace-container">
      {/* =====================================================================
          TOP SECTION: MISSION KPI TELEMETRY BAR (5 Columns)
          ===================================================================== */}
      <section className="mission-kpi-bar">
        {/* KPI 1: Active Incidents */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">
              <span className="live-beacon-dot" style={{ width: '6px', height: '6px' }}>
                <span className="ping-corona" style={{ background: 'var(--error)' }}></span>
                <span className="solid-core" style={{ background: 'var(--error)', width: '6px', height: '6px' }}></span>
              </span>
              Active Incidents
            </span>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
              (Simulated)
            </span>
          </div>

          <div className="kpi-value-row">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="kpi-value">{totalActiveCount}</span>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '11px',
                  color: 'var(--error)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_drop_up</span>
                +3 / 10m
              </span>
            </div>

            {/* Sparkline SVG */}
            <svg style={{ width: '64px', height: '26px', overflow: 'visible' }} viewBox="0 0 60 25" fill="none">
              <path
                d="M 0 18 L 10 16 L 20 22 L 30 10 L 40 12 L 50 4 L 60 7"
                stroke="#00d4ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="60" cy="7" r="2.5" fill="#ff4d5a" />
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              background: 'rgba(5, 14, 28, 0.6)',
              padding: '3px 6px',
              borderRadius: '3px',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '10.5px',
            }}
          >
            <span style={{ color: 'var(--error)', fontWeight: 700 }}>● 4 CRIT</span>
            <span style={{ color: 'var(--outline)' }}>/</span>
            <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>● 7 MOD</span>
            <span style={{ color: 'var(--outline)' }}>/</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>● 3 LOW</span>
          </div>
        </div>

        {/* KPI 2: Ambulance Fleet */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                airport_shuttle
              </span>
              Ambulance Fleet
            </span>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
              73% READY
            </span>
          </div>

          <div className="kpi-value-row">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span className="kpi-value" style={{ color: 'var(--primary)' }}>38</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '14px', color: 'var(--outline)' }}>
                / 52
              </span>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--secondary)' }}>
                8 En Route
              </span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '10px', color: 'var(--outline)' }}>
                6 Maintenance
              </span>
            </div>
          </div>

          {/* Tri-color Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '5px',
              background: 'var(--surface-container-highest)',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              marginTop: '6px',
            }}
          >
            <div style={{ width: '73%', background: 'var(--primary)' }} />
            <div style={{ width: '15%', background: 'var(--secondary)' }} />
            <div style={{ width: '12%', background: 'var(--outline-variant)' }} />
          </div>
        </div>

        {/* KPI 3: Active Deployments */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--secondary)' }}>
                near_me
              </span>
              Active Deployments
            </span>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
              48 km/h AVG
            </span>
          </div>

          <div className="kpi-value-row">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="kpi-value" style={{ color: 'var(--secondary)' }}>22</span>
              <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Crews</span>
            </div>

            {/* Vertical Animated Bar Chart Graphic */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              <span style={{ width: '5px', height: '12px', background: 'rgba(255, 189, 88, 0.4)', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '18px', background: 'rgba(255, 189, 88, 0.6)', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '24px', background: 'var(--secondary)', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '15px', background: 'rgba(255, 189, 88, 0.7)', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '20px', background: 'rgba(255, 189, 88, 0.5)', borderRadius: '1px' }}></span>
            </div>
          </div>

          <div className="kpi-footer-row">
            <span>Metro N: 9</span>
            <span>Central: 8</span>
            <span>Bayside: 5</span>
          </div>
        </div>

        {/* KPI 4: Hospital Network */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary-light)' }}>
                local_hospital
              </span>
              Hospital Network
            </span>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
              9 / 12 GREEN
            </span>
          </div>

          <div className="kpi-value-row">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span className="kpi-value">142</span>
              <span style={{ fontSize: '12px', color: 'var(--outline)' }}>ICU/ER Beds</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }} title="Trauma 1 Ready"></span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }} title="Mercy Gen Ready"></span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--secondary)' }} title="St. Jude Surge"></span>
            </div>
          </div>

          <div className="kpi-footer-row">
            <span style={{ color: 'var(--primary)' }}>Trauma: 18 Beds</span>
            <span style={{ color: 'var(--error)' }}>1 On Divert</span>
          </div>
        </div>

        {/* KPI 5: Golden Hour Index */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                timer
              </span>
              Golden Hour Index
            </span>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
              96.4%
            </span>
          </div>

          <div className="kpi-value-row">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="kpi-value" style={{ color: 'var(--primary)' }}>
                5<span style={{ fontSize: '18px' }}>m</span> 42<span style={{ fontSize: '18px' }}>s</span>
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                color: 'var(--primary)',
                background: 'rgba(0, 212, 255, 0.15)',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              -38s opt
            </span>
          </div>

          <div className="kpi-footer-row">
            <span>Target: &lt; 7m 00s</span>
            <span style={{ color: 'var(--on-surface-bright)', fontWeight: 600 }}>Urban P1 SLA: 98%</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CENTRAL COMMAND GRID (3 Columns: 320px | Fluid | 340px)
          ===================================================================== */}
      <section className="tactical-command-grid">
        {/* ===================================================================
            LEFT COLUMN: LIVE INCIDENT FEED (3 cols)
            =================================================================== */}
        <aside className="tactical-column-left">
          <div className="feed-header-section">
            <div className="feed-title-row">
              <div className="feed-title">
                <span className="live-beacon-dot" style={{ width: '8px', height: '8px' }}>
                  <span className="ping-corona" style={{ background: 'var(--error)' }}></span>
                  <span className="solid-core" style={{ background: 'var(--error)', width: '8px', height: '8px' }}></span>
                </span>
                <span>Live Incident Feed</span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--surface-container-high)',
                  color: 'var(--primary)',
                  padding: '2px 7px',
                  borderRadius: '3px',
                }}
              >
                {filteredList.length} QUEUED
              </span>
            </div>

            {/* Quick Filters */}
            <div className="filter-tab-bar">
              <button
                type="button"
                className={`filter-tab-btn ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                ALL ({mergedIncidents.length})
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${filterType === 'CRIT' ? 'active' : ''}`}
                onClick={() => setFilterType('CRIT')}
                style={{ color: filterType === 'CRIT' ? 'var(--on-primary-container)' : 'var(--error)' }}
              >
                CRIT
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${filterType === 'HIGH' ? 'active' : ''}`}
                onClick={() => setFilterType('HIGH')}
                style={{ color: filterType === 'HIGH' ? 'var(--on-primary-container)' : 'var(--secondary)' }}
              >
                HIGH
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${filterType === 'DISP' ? 'active' : ''}`}
                onClick={() => setFilterType('DISP')}
              >
                DISP
              </button>
            </div>

            {/* Filter Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <span
                className="material-symbols-outlined"
                style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--outline)' }}
              >
                filter_list
              </span>
              <input
                type="text"
                className="feed-search-input"
                placeholder="Filter ID, hazard type, sector..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Scrollable Incident Cards */}
          <div className="incident-card-scroll-list">
            {filteredList.length === 0 ? (
              <div
                style={{
                  padding: '30px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '12px',
                  color: 'var(--outline)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--primary)' }}>
                  task_alt
                </span>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                  NO INCIDENTS IN QUEUE
                </div>
                <p style={{ fontSize: '11.5px', maxWidth: '200px' }}>
                  All sectors clear or filters returned 0 matching incidents.
                </p>
                {onOpenNewIncident && (
                  <button
                    type="button"
                    className="btn-command-gold"
                    onClick={onOpenNewIncident}
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '11px', marginTop: '6px' }}
                  >
                    + Report Incident
                  </button>
                )}
              </div>
            ) : (
              filteredList.map((inc) => {
                const isSelected = activeFocus?.incidentId === inc.incidentId;
                const severity = inc.severity || 'MEDIUM';

                return (
                  <div
                    key={inc.incidentId || inc._id}
                    className={`incident-feed-card severity-${severity} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectIncident(inc)}
                  >
                    <div className="incident-card-top">
                      <span
                        className="incident-card-id"
                        style={{ color: severity === 'CRITICAL' ? 'var(--error)' : severity === 'HIGH' ? 'var(--secondary)' : 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          {severity === 'CRITICAL' ? 'e911_emergency' : 'warning'}
                        </span>
                        {inc.incidentId}
                      </span>
                      <span className={`incident-severity-badge badge-${severity === 'CRITICAL' ? 'crit' : severity === 'HIGH' ? 'high' : severity === 'MEDIUM' ? 'med' : 'low'}`}>
                        {severity} {inc.priorityScore ? `${inc.priorityScore}%` : ''}
                      </span>
                    </div>

                    <h3 className="incident-card-title">{inc.title}</h3>

                    <div className="incident-card-address">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>
                        pin_drop
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.location?.address || 'Metro Sector'}
                      </span>
                    </div>

                    {/* Telemetry snippet box */}
                    <div className="incident-telemetry-box">
                      <div className="telemetry-row">
                        <span style={{ color: 'var(--outline)' }}>Assigned Unit:</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                          {inc.assignedAmbulanceCallsign || inc.assignedAmbulanceId || 'Pending Dispatch'}
                        </span>
                      </div>
                      <div className="telemetry-row">
                        <span style={{ color: 'var(--outline)' }}>Status:</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="telemetry-row">
                        <span style={{ color: 'var(--outline)' }}>Receiving Hospital:</span>
                        <span style={{ color: 'var(--on-surface-bright)' }}>
                          {inc.recommendedHospitalName || 'Metro General Trauma'}
                        </span>
                      </div>
                    </div>

                    <div className="incident-card-footer">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                        {new Date(inc.timestamps?.reportedAt || inc.createdAt || Date.now()).toLocaleTimeString()}
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Focus File →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ===================================================================
            CENTER COLUMN: MASSIVE INTERACTIVE TACTICAL GIS MAP (6 cols)
            =================================================================== */}
        <main className="tactical-column-center">
          {/* Top Map Controls Bar */}
          <div className="map-top-control-bar">
            {/* Layer Toggles */}
            <div className="map-layer-pills">
              <button
                type="button"
                className={`layer-toggle-btn ${mapLayers.incidents ? 'active' : ''}`}
                onClick={() => toggleLayer('incidents')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--error)' }} />
                <span>Incidents ({mergedIncidents.length})</span>
              </button>
              <button
                type="button"
                className={`layer-toggle-btn ${mapLayers.fleet ? 'active' : ''}`}
                onClick={() => toggleLayer('fleet')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }} />
                <span>Ambulances ({ambulances.length || 38})</span>
              </button>
              <button
                type="button"
                className={`layer-toggle-btn ${mapLayers.hospitals ? 'active' : ''}`}
                onClick={() => toggleLayer('hospitals')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--secondary)' }} />
                <span>Hospitals ({hospitals.length || 12})</span>
              </button>
              <button
                type="button"
                className={`layer-toggle-btn ${mapLayers.routes ? 'active' : ''}`}
                onClick={() => toggleLayer('routes')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>
                  alt_route
                </span>
                <span>Corridors</span>
              </button>
            </div>

            {/* GPS Coordinates & Recenter */}
            <div className="map-nav-cluster">
              <div className="gps-readout-pill">
                <span style={{ color: 'var(--primary)' }}>37°46'29"N</span>
                <span style={{ color: 'var(--outline)' }}>122°25'09"W</span>
              </div>
              <div className="zoom-controls-group">
                <button
                  type="button"
                  className="zoom-btn"
                  title="Tactical GPS Recenter"
                  onClick={() => handleSelectIncident(activeFocus)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>crop_free</span>
                </button>
              </div>
            </div>
          </div>

          {/* Leaflet Interactive Map Viewport */}
          <div className="map-canvas-container">
            <EmergencyMap
              incidents={mergedIncidents}
              ambulances={ambulances}
              hospitals={hospitals}
              hotspots={hotspots}
              selectedIncident={activeFocus}
              onSelectIncident={handleSelectIncident}
              layers={mapLayers}
            />
          </div>

          {/* Tactical HUD Overlay Graphics (Radar Grid & Glow) */}
          <div className="tactical-hud-overlay">
            <svg style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="tactical-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00d4ff" strokeWidth="0.4" strokeOpacity="0.18" />
                </pattern>
                <radialGradient id="radar-glow-grad" cx="50%" cy="48%" r="45%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#tactical-grid-pattern)" />
              <circle cx="50%" cy="48%" r="200" fill="url(#radar-glow-grad)" />
              <circle cx="50%" cy="48%" r="160" fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.3" />
              <circle cx="50%" cy="48%" r="80" fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.25" />
            </svg>
          </div>

          {/* Watermark Sector Labels */}
          <span className="sector-label-north">SECTOR: NORTH BAY DOCKS</span>
          <span className="sector-label-central">SECTOR: CENTRAL METRO CORE</span>
          <span className="sector-label-south">SECTOR: SOUTHERN EXPRESSWAYS</span>

          {/* BOTTOM FLOATING HUD CONTEXT CARD (Active Incident Focus) */}
          <div className="bottom-floating-hud-card">
            <div className="hud-focused-row">
              <div className="hud-focused-left">
                <div className="hud-incident-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    emergency_home
                  </span>
                </div>
                <div className="hud-incident-details">
                  <div className="hud-incident-headline">
                    <span>FOCUSED: {activeFocus?.incidentId} — {activeFocus?.title}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--error)',
                        background: 'rgba(255, 77, 90, 0.25)',
                        border: '1px solid var(--error)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      PRIORITY 1
                    </span>
                  </div>
                  <div className="hud-ai-route-note">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>psychology</span>
                    <span>{activeFocus?.aiRouteStatus || 'Autonomous AI Route Active: Signal Preemption Corridor A-4 enabled (+1m 24s saved)'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="hud-actions-row">
                <button
                  type="button"
                  className="btn-hud-tactical"
                  onClick={() => alert(`Autonomous Re-route recalculated for ${activeFocus?.incidentId}. Preemption signals updated.`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--secondary)' }}>
                    alt_route
                  </span>
                  <span>Re-Route Responders</span>
                </button>
                <button
                  type="button"
                  className="btn-hud-tactical"
                  onClick={() => alert(`Pre-arrival telemetry broadcast sent to Trauma ER for ${activeFocus?.incidentId}.`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                    notification_add
                  </span>
                  <span>Notify Trauma ER</span>
                </button>
                <button
                  type="button"
                  className="btn-hud-tactical btn-hud-crimson"
                  onClick={() => alert(`Incident ${activeFocus?.incidentId} escalated to Major Mass Casualty Level 3.`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    warning
                  </span>
                  <span>Escalate Level 3</span>
                </button>
                <button
                  type="button"
                  className="btn-hud-tactical btn-hud-primary"
                  onClick={() => handleSelectIncident(activeFocus)}
                >
                  <span>Full Incident File</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    open_in_new
                  </span>
                </button>
              </div>
            </div>

            {/* Subordinate Legend & Telemetry */}
            <div className="hud-footer-legend">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--error)' }} />
                  Critical Triage
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--secondary)' }} />
                  High Priority
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }} />
                  Responders En Route
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary-light)' }} />
                  Receiving Trauma Hub
                </span>
              </div>
              <span style={{ color: 'var(--primary)' }}>
                RADAR SCAN: 3.2s REFRESH · SAT-NAV 99.8%
              </span>
            </div>
          </div>
        </main>

        {/* ===================================================================
            RIGHT COLUMN: AI MULTI-AGENT STATUS & HOSPITALS (3 cols)
            =================================================================== */}
        <aside className="tactical-column-right">
          {/* Card 1: AI Multi-Agent Pipeline */}
          <div className="agent-pipeline-card">
            <div className="pipeline-header">
              <div className="pipeline-title">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                  smart_toy
                </span>
                <span>Multi-Agent Pipeline</span>
              </div>
              <span className="autonomous-tag">AUTONOMOUS</span>
            </div>
            <p className="pipeline-subtext">
              Real-time incident orchestration for {activeFocus?.incidentId || 'INC-8942'}
            </p>

            {/* Stepper Pipeline */}
            <div className="pipeline-stepper-list">
              <div className="pipeline-continuous-line"></div>

              {/* Step 1: Complete */}
              <div className="stepper-item">
                <div className="stepper-icon-circle complete">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', fontWeight: 'bold' }}>check</span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name">1. Incident Detection</span>
                  <span className="stepper-desc">911 Audio + CCTV Triangulation (Verified)</span>
                </div>
              </div>

              {/* Step 2: Complete */}
              <div className="stepper-item">
                <div className="stepper-icon-circle complete">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', fontWeight: 'bold' }}>check</span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name">2. Severity Analysis</span>
                  <span className="stepper-desc" style={{ color: 'var(--error)', fontWeight: 600 }}>
                    Critical Priority Tag {activeFocus?.priorityScore || 94}/100
                  </span>
                </div>
              </div>

              {/* Step 3: Complete */}
              <div className="stepper-item">
                <div className="stepper-icon-circle complete">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', fontWeight: 'bold' }}>check</span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name">3. Location Intelligence</span>
                  <span className="stepper-desc">Geofence Locked: Downtown Mile 14.2</span>
                </div>
              </div>

              {/* Step 4: Active Pulse */}
              <div className="stepper-item">
                <div className="stepper-icon-circle active">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '12px' }}>sync</span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name" style={{ color: 'var(--secondary)' }}>
                    4. Dispatch Optimization
                  </span>
                  <span className="stepper-desc" style={{ color: 'var(--on-surface-bright)' }}>
                    Dual-Dispatch: MED-04 &amp; FIRE-12
                  </span>
                </div>
              </div>

              {/* Step 5: Locked */}
              <div className="stepper-item">
                <div className="stepper-icon-circle complete">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', fontWeight: 'bold' }}>check</span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name">5. Hospital Match</span>
                  <span className="stepper-desc" style={{ color: 'var(--primary)' }}>
                    Metro Central Trauma (4 ICU Reserved)
                  </span>
                </div>
              </div>

              {/* Step 6: Active Streaming */}
              <div className="stepper-item">
                <div className="stepper-icon-circle complete" style={{ boxShadow: '0 0 10px #00d4ff' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0a1422' }}></span>
                </div>
                <div className="stepper-content">
                  <span className="stepper-name" style={{ color: 'var(--primary)' }}>
                    6. Dynamic Green Corridor
                  </span>
                  <span className="stepper-desc">Traffic light sequencing active on Corridor A-4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Hospital ER Readiness Monitor */}
          <div className="hospital-readiness-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--primary)' }}>
                  local_hospital
                </span>
                <span style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 600, color: 'var(--on-surface-bright)' }}>
                  Hospital ER Readiness
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: '11px',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigateView && onNavigateView('hospitals')}
              >
                View All (12)
              </span>
            </div>

            {/* Hospital 1 */}
            <div className="hospital-mini-item">
              <div className="hospital-mini-top">
                <span className="hospital-mini-name">Metro Central Trauma</span>
                <span className="hospital-status-pill" style={{ background: 'rgba(0, 212, 255, 0.15)', color: 'var(--primary)' }}>
                  READY · L1
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
                <span>Available Trauma Beds: <strong style={{ color: 'var(--on-surface-bright)' }}>8</strong></span>
                <span style={{ color: 'var(--primary)' }}>ETA: 6m</span>
              </div>
              <div className="hospital-capacity-bar">
                <div style={{ width: '78%', height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>

            {/* Hospital 2 */}
            <div className="hospital-mini-item">
              <div className="hospital-mini-top">
                <span className="hospital-mini-name">Mercy General Hospital</span>
                <span className="hospital-status-pill" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
                  NORMAL · L2
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
                <span>Available ER Beds: <strong style={{ color: 'var(--on-surface-bright)' }}>14</strong></span>
                <span>ETA: 11m</span>
              </div>
              <div className="hospital-capacity-bar">
                <div style={{ width: '45%', height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>

            {/* Hospital 3 */}
            <div className="hospital-mini-item">
              <div className="hospital-mini-top">
                <span className="hospital-mini-name">St. Jude Memorial</span>
                <span className="hospital-status-pill" style={{ background: 'rgba(255, 189, 88, 0.25)', color: 'var(--secondary)' }}>
                  SURGE ALERT
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
                <span>Available Beds: <strong style={{ color: 'var(--error)' }}>2</strong></span>
                <span style={{ color: 'var(--secondary)' }}>ETA: 15m</span>
              </div>
              <div className="hospital-capacity-bar">
                <div style={{ width: '92%', height: '100%', background: 'var(--error)' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Command Quick Actions Bar */}
          <div className="quick-command-actions-card">
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                color: 'var(--outline)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Command Quick Actions
            </span>

            <button
              type="button"
              className="btn-command-gold"
              onClick={onOpenNewIncident}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
              <span>REPORT NEW EMERGENCY</span>
            </button>

            <button
              type="button"
              className="btn-command-eas"
              onClick={() => alert('🚨 Emergency Alert System (EAS) Regional Broadcast Activated!')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>campaign</span>
              <span>EMERGENCY BROADCAST (EAS)</span>
            </button>

            <button
              type="button"
              className="btn-command-dispatch"
              onClick={() => onNavigateView && onNavigateView('ai-decision')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>send_time_extension</span>
              <span>OPEN SMART DISPATCH</span>
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
