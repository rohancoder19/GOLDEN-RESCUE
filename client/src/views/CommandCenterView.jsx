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

  // Strict deduplication of incidents by incidentId
  const uniqueIncidents = Array.from(
    new Map(incidents.map((i) => [i.incidentId, i])).values()
  );

  // Filter incidents
  const filteredIncidents = uniqueIncidents.filter((inc) => {
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    return true;
  });

  const metrics = analytics?.metrics || {
    activeIncidents: uniqueIncidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED').length,
    criticalAwaitingDispatch: uniqueIncidents.filter((i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED')).length,
    availableAmbulances: ambulances.filter((a) => a.status === 'AVAILABLE').length,
    acceptingHospitals: hospitals.filter((h) => h.status !== 'DIVERTING_AMBULANCES').length,
    avgDispatchSeconds: 48,
    avgArrivalMinutes: 6.4,
  };

  return (
    <div className="workspace-container" style={{ background: '#000000' }}>
      {/* Metrics Ribbon */}
      <div className="metrics-ribbon">
        <div className="metric-card critical glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Critical Awaiting Dispatch</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>
              {metrics.criticalAwaitingDispatch}
            </span>
            <span className="metric-unit" style={{ color: '#f87171' }}>UNITS NEEDED</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Immediate intervention threshold</div>
        </div>

        <div className="metric-card glass-panel" style={{ background: 'rgba(44, 52, 128, 0.25)', border: '1px solid #2C3480' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Active Emergencies</span>
            <Activity size={16} color="#5866db" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>{metrics.activeIncidents}</span>
            <span className="metric-unit" style={{ color: '#cbd5e1' }}>ORIGINAL QUEUE</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Real-time coordinated incidents</div>
        </div>

        <div className="metric-card glass-panel" style={{ background: 'rgba(44, 52, 128, 0.25)', border: '1px solid #2C3480' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Available Ambulances</span>
            <AmbulanceIcon size={16} color="#ffffff" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>
              {metrics.availableAmbulances}
            </span>
            <span className="metric-unit" style={{ color: '#cbd5e1' }}>OF {ambulances.length} ROSTER</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Instant dispatch readiness</div>
        </div>

        <div className="metric-card green glass-panel" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Hospitals Accepting</span>
            <Building2 size={16} color="#10b981" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>
              {metrics.acceptingHospitals}
            </span>
            <span className="metric-unit" style={{ color: '#a7f3d0' }}>OF {hospitals.length} FACILITIES</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Regional ICU capacity verified</div>
        </div>

        <div className="metric-card glass-panel" style={{ background: 'rgba(44, 52, 128, 0.15)', border: '1px solid rgba(44, 52, 128, 0.4)' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Avg Dispatch Time</span>
            <Clock size={16} color="#ffffff" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>{metrics.avgDispatchSeconds}</span>
            <span className="metric-unit" style={{ color: '#94a3b8' }}>SECONDS</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Triage to vehicle rollout</div>
        </div>

        <div className="metric-card glass-panel" style={{ background: 'rgba(44, 52, 128, 0.15)', border: '1px solid rgba(44, 52, 128, 0.4)' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: '#ffffff' }}>Avg Incident Arrival</span>
            <Navigation size={16} color="#ffffff" />
          </div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: '#ffffff' }}>{metrics.avgArrivalMinutes}</span>
            <span className="metric-unit" style={{ color: '#94a3b8' }}>MINUTES</span>
          </div>
          <div className="metric-subtext" style={{ color: '#94a3b8' }}>Within Golden window</div>
        </div>
      </div>

      {/* Main Operational Grid: Map on Left, Incident Queue on Right */}
      <div className="dashboard-main-grid">
        {/* Map Centerpiece */}
        <div className="map-module-card glass-panel" style={{ background: '#000000', border: '1px solid #2C3480' }}>
          <div className="map-header-bar" style={{ background: '#000000', borderBottom: '1px solid rgba(44, 52, 128, 0.5)' }}>
            <div className="map-title-cluster">
              <span className="map-title" style={{ color: '#ffffff' }}>
                <Radio size={16} color="#ffffff" />
                <span>TACTICAL METROPOLITAN INCIDENT MAP</span>
              </span>
              <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', borderColor: '#5866db' }}>
                ORIGINAL GPS SYNC 100%
              </span>
            </div>
          </div>
          <div className="map-viewport" style={{ background: '#000000' }}>
            <EmergencyMap
              incidents={uniqueIncidents}
              ambulances={ambulances}
              hospitals={hospitals}
              hotspots={hotspots}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
            />
          </div>
        </div>

        {/* Live Incident Queue */}
        <div className="incident-feed-card glass-panel" style={{ background: '#000000', border: '1px solid #2C3480' }}>
          <div className="incident-feed-header" style={{ background: '#000000', borderBottom: '1px solid rgba(44, 52, 128, 0.5)' }}>
            <div className="feed-header-top">
              <span className="feed-title" style={{ color: '#ffffff' }}>
                <AlertTriangle size={16} color="#ffffff" />
                <span>ORIGINAL INCIDENT QUEUE ({filteredIncidents.length})</span>
              </span>
              <button
                className="btn-dispatch"
                onClick={onOpenNewIncident}
                style={{ padding: '4px 12px', fontSize: '11px', background: '#2C3480', border: '1px solid #ffffff' }}
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
                  style={
                    severityFilter === sev
                      ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff', fontWeight: 800 }
                      : { background: 'rgba(44, 52, 128, 0.15)', color: '#cbd5e1' }
                  }
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="incident-list-scroll" style={{ background: '#000000' }}>
            {filteredIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
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
                    style={{
                      background: isSelected ? 'rgba(44, 52, 128, 0.45)' : 'rgba(14, 18, 44, 0.6)',
                      border: isSelected ? '1px solid #ffffff' : '1px solid rgba(44, 52, 128, 0.4)',
                    }}
                  >
                    <div className="incident-item-top">
                      <span className="incident-id-badge" style={{ color: '#ffffff', fontWeight: 800 }}>
                        {inc.incidentId}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`severity-badge badge-${inc.severity}`}>
                          {inc.severity}
                        </span>
                        <span className="status-badge" style={{ background: '#2C3480', color: '#ffffff' }}>
                          {inc.status}
                        </span>
                      </div>
                    </div>

                    <div className="incident-title-text" style={{ color: '#ffffff' }}>
                      {inc.title}
                    </div>
                    <div className="incident-location-row" style={{ color: '#cbd5e1' }}>
                      <Navigation size={11} color="#ffffff" />
                      <span>{inc.location?.address}</span>
                    </div>

                    <div className="incident-footer-meta">
                      <span style={{ color: '#94a3b8' }}>Source: {inc.source}</span>
                      {inc.assignedAmbulanceCallsign ? (
                        <span style={{ color: '#ffffff', fontWeight: 700, background: '#2C3480', padding: '1px 6px', borderRadius: '4px' }}>
                          🚑 {inc.assignedAmbulanceCallsign}
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>
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
        <div className="glass-panel" style={{ padding: '16px', background: '#000000', border: '1px solid #2C3480' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AmbulanceIcon size={16} color="#ffffff" />
              <span>FLEET READINESS STATUS</span>
            </span>
            <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff' }}>
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
                  padding: '9px 12px',
                  background: 'rgba(44, 52, 128, 0.15)',
                  borderRadius: '6px',
                  border: '1px solid rgba(44, 52, 128, 0.4)',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    {amb.callsign}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                    [{amb.type.replace('_', ' ')}]
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: amb.status === 'AVAILABLE' ? '#ffffff' : '#5866db',
                    }}
                  >
                    {amb.status}
                  </span>
                  <span style={{ fontSize: '10px', color: '#d1d5db' }}>
                    ⛽ {amb.fuelLevel}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Capacity Gauge */}
        <div className="glass-panel" style={{ padding: '16px', background: '#000000', border: '1px solid #2C3480' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#ffffff" />
              <span>REGIONAL TRAUMA & ICU CAPACITY</span>
            </span>
            <span className="telemetry-chip" style={{ background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }}>
              ORIGINAL VERIFIED
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
                  padding: '9px 12px',
                  background: 'rgba(44, 52, 128, 0.15)',
                  borderRadius: '6px',
                  border: '1px solid rgba(44, 52, 128, 0.4)',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    {hosp.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {hosp.traumaLevel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                    ICU: {hosp.capacity?.icuAvailable} beds
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
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
