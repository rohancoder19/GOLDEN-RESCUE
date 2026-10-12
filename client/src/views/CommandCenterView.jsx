import React, { useState } from 'react';
import {
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Building2,
  Clock,
  Activity,
  Send,
  ShieldCheck,
  Radio,
  ChevronRight,
  Flame,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
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
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Filter incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    return true;
  });

  const metrics = analytics?.metrics || {
    activeIncidents: incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED').length,
    criticalAwaitingDispatch: incidents.filter((i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED')).length,
    availableAmbulances: ambulances.filter((a) => a.status === 'AVAILABLE').length,
    acceptingHospitals: hospitals.filter((h) => h.status !== 'DIVERTING_AMBULANCES').length,
    avgDispatchSeconds: 48,
    avgArrivalMinutes: 6.4,
  };

  return (
    <div className="workspace-container">
      {/* Metrics Ribbon */}
      <div className="metrics-ribbon">
        <div className="metric-card critical glass-panel">
          <div className="metric-header">
            <span className="metric-label">Critical Awaiting Dispatch</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ef4444' }}>
              {metrics.criticalAwaitingDispatch}
            </span>
            <span className="metric-unit">UNITS NEEDED</span>
          </div>
          <div className="metric-subtext">Immediate intervention threshold</div>
        </div>

        <div className="metric-card gold glass-panel">
          <div className="metric-header">
            <span className="metric-label">Active Emergencies</span>
            <Activity size={16} color="#f59e0b" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{metrics.activeIncidents}</span>
            <span className="metric-unit">ACTIVE QUEUE</span>
          </div>
          <div className="metric-subtext">Real-time coordinated incidents</div>
        </div>

        <div className="metric-card cyan glass-panel">
          <div className="metric-header">
            <span className="metric-label">Available Ambulances</span>
            <AmbulanceIcon size={16} color="#00f0ff" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#00f0ff' }}>
              {metrics.availableAmbulances}
            </span>
            <span className="metric-unit">OF {ambulances.length} ROSTER</span>
          </div>
          <div className="metric-subtext">Instant dispatch readiness</div>
        </div>

        <div className="metric-card green glass-panel">
          <div className="metric-header">
            <span className="metric-label">Hospitals Accepting</span>
            <Building2 size={16} color="#10b981" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#10b981' }}>
              {metrics.acceptingHospitals}
            </span>
            <span className="metric-unit">OF {hospitals.length} FACILITIES</span>
          </div>
          <div className="metric-subtext">Regional ICU capacity verified</div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-label">Avg Dispatch Time</span>
            <Clock size={16} color="#94a3b8" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{metrics.avgDispatchSeconds}</span>
            <span className="metric-unit">SECONDS</span>
          </div>
          <div className="metric-subtext">Triage to vehicle rollout</div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-label">Avg Incident Arrival</span>
            <Navigation size={16} color="#94a3b8" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{metrics.avgArrivalMinutes}</span>
            <span className="metric-unit">MINUTES</span>
          </div>
          <div className="metric-subtext">Within Golden Hour window</div>
        </div>
      </div>

      {/* Main Operational Grid: Map on Left, Incident Queue on Right */}
      <div className="dashboard-main-grid">
        {/* Map Centerpiece */}
        <div className="map-module-card glass-panel">
          <div className="map-header-bar">
            <div className="map-title-cluster">
              <span className="map-title">
                <Radio size={16} color="#00f0ff" />
                <span>TACTICAL METROPOLITAN INCIDENT MAP</span>
              </span>
              <span className="telemetry-chip">GPS SYNC 100%</span>
            </div>
          </div>
          <div className="map-viewport">
            <EmergencyMap
              incidents={incidents}
              ambulances={ambulances}
              hospitals={hospitals}
              hotspots={hotspots}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
            />
          </div>
        </div>

        {/* Live Incident Queue */}
        <div className="incident-feed-card glass-panel">
          <div className="incident-feed-header">
            <div className="feed-header-top">
              <span className="feed-title">
                <AlertTriangle size={16} color="#f59e0b" />
                <span>LIVE INCIDENT QUEUE ({filteredIncidents.length})</span>
              </span>
              <button
                className="btn-primary"
                onClick={onOpenNewIncident}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                + Alert
              </button>
            </div>

            {/* Severity Filter Chips */}
            <div className="feed-filters">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  className={`filter-chip ${severityFilter === sev ? 'active' : ''}`}
                  onClick={() => setSeverityFilter(sev)}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="incident-list-scroll">
            {filteredIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                No active incidents matching selected severity filter.
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                return (
                  <div
                    key={inc.incidentId}
                    className={`incident-item-card severity-${inc.severity} ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectIncident(inc)}
                  >
                    <div className="incident-item-top">
                      <span className="incident-id-badge">{inc.incidentId}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`severity-badge badge-${inc.severity}`}>
                          {inc.severity}
                        </span>
                        <span className="status-badge">{inc.status}</span>
                      </div>
                    </div>

                    <div className="incident-title-text">{inc.title}</div>
                    <div className="incident-location-row">
                      <Navigation size={11} color="#00f0ff" />
                      <span>{inc.location?.address}</span>
                    </div>

                    <div className="incident-footer-meta">
                      <span>Source: {inc.source}</span>
                      {inc.assignedAmbulanceCallsign ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                          🚑 {inc.assignedAmbulanceCallsign}
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                          Awaiting Dispatch
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sub-Grid: Fleet Telemetry & Hospital Capacity Gauges */}
      <div className="dashboard-sub-grid">
        {/* Fleet Strip */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AmbulanceIcon size={16} color="#00f0ff" />
              <span>FLEET READINESS STATUS</span>
            </span>
            <span className="telemetry-chip">
              {metrics.availableAmbulances} / {ambulances.length} READY
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ambulances.slice(0, 4).map((amb) => (
              <div
                key={amb.vehicleId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                    {amb.callsign}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                    [{amb.type.replace('_', ' ')}]
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: amb.status === 'AVAILABLE' ? 'var(--green-ready)' : 'var(--cyan-telemetry)',
                    }}
                  >
                    {amb.status}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    ⛽ {amb.fuelLevel}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Capacity Gauge */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#10b981" />
              <span>REGIONAL TRAUMA & ICU BED CAPACITY</span>
            </span>
            <span className="telemetry-chip" style={{ color: 'var(--green-ready)', borderColor: 'rgba(16,185,129,0.3)' }}>
              VERIFIED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hospitals.slice(0, 4).map((hosp) => (
              <div
                key={hosp.hospitalId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                    {hosp.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {hosp.traumaLevel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: hosp.capacity?.icuAvailable > 2 ? 'var(--green-ready)' : '#f59e0b' }}>
                    ICU: {hosp.capacity?.icuAvailable} beds
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Beds: {hosp.capacity?.availableBeds} avail
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
