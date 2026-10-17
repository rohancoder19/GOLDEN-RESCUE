import React, { useState } from 'react';

export default function LiveIncidentsView({
  incidents = [],
  showOriginalOnly = true,
  toggleShowOriginalOnly,
  onSelectIncident,
  onOpenNewIncident,
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Strict deduplication of incidents by incidentId
  const uniqueIncidents = Array.from(
    new Map(incidents.map((i) => [i.incidentId, i])).values()
  );

  const filteredIncidents = uniqueIncidents.filter((inc) => {
    if (showOriginalOnly && (inc.isSimulated === true || inc.dataSource === 'SIMULATED_DEMO')) return false;
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const match =
        inc.incidentId?.toLowerCase().includes(term) ||
        inc.title?.toLowerCase().includes(term) ||
        inc.description?.toLowerCase().includes(term) ||
        (inc.location?.address && inc.location.address.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="workspace-container">
      {/* Header and Controls */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-tactical)',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 700, color: 'var(--on-surface-bright)', letterSpacing: '-0.01em' }}>
            TACTICAL LIVE INCIDENT QUEUE
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Real-time verified emergency stream (Showing {filteredIncidents.length} active triage cases)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {toggleShowOriginalOnly && (
            <button
              type="button"
              className="btn-hud-tactical"
              onClick={toggleShowOriginalOnly}
              style={{
                background: showOriginalOnly ? 'var(--surface-container-high)' : 'transparent',
                borderColor: showOriginalOnly ? 'var(--primary)' : 'var(--border-tactical)',
                color: showOriginalOnly ? 'var(--primary)' : 'var(--outline)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>shield</span>
              <span>{showOriginalOnly ? 'Original Data Verified' : 'Show All Data'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-command-gold"
            onClick={onOpenNewIncident}
            style={{ width: 'auto', padding: '8px 16px', fontSize: '12.5px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>add_circle</span>
            <span>Report New Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '14px',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <span
            className="material-symbols-outlined"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--outline)' }}
          >
            search
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, title, street, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)', fontWeight: 700 }}>
            SEVERITY:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              className={`layer-toggle-btn ${severityFilter === sev ? 'active' : ''}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)', fontWeight: 700 }}>
            STATUS:
          </span>
          {['ALL', 'REPORTED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`layer-toggle-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <div
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-tactical)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-tactical)',
                background: 'var(--surface-container-highest)',
                color: 'var(--on-surface-bright)',
                fontFamily: 'var(--font-telemetry)',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <th style={{ padding: '12px 16px' }}>INCIDENT ID</th>
              <th style={{ padding: '12px 16px' }}>SEVERITY</th>
              <th style={{ padding: '12px 16px' }}>TITLE &amp; CATEGORY</th>
              <th style={{ padding: '12px 16px' }}>LOCATION</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
              <th style={{ padding: '12px 16px' }}>ASSIGNED UNIT</th>
              <th style={{ padding: '12px 16px' }}>REPORTED</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)' }}>
                  No emergency incidents matching criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr
                  key={inc.incidentId}
                  style={{
                    borderBottom: '1px solid rgba(30, 58, 95, 0.4)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => onSelectIncident(inc)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-container)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-telemetry)', color: 'var(--primary)', fontWeight: 700 }}>
                    {inc.incidentId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`incident-severity-badge badge-${inc.severity === 'CRITICAL' ? 'crit' : inc.severity === 'HIGH' ? 'high' : inc.severity === 'MEDIUM' ? 'med' : 'low'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--on-surface-bright)', fontFamily: 'var(--font-headline)' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--outline)' }}>
                      {inc.category}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--on-surface)' }}>
                    {inc.location?.address}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'var(--surface-container-high)',
                        color: 'var(--on-surface-bright)',
                        border: '1px solid var(--border-tactical)',
                      }}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {inc.assignedAmbulanceCallsign ? (
                      <span
                        style={{
                          color: 'var(--primary)',
                          fontFamily: 'var(--font-telemetry)',
                          fontWeight: 700,
                          background: 'rgba(0, 212, 255, 0.12)',
                          border: '1px solid var(--primary)',
                          padding: '2px 7px',
                          borderRadius: '3px',
                        }}
                      >
                        🚑 {inc.assignedAmbulanceCallsign}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--error)', fontStyle: 'italic', fontWeight: 600 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                    {new Date(inc.timestamps?.reportedAt || inc.createdAt || Date.now()).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-hud-tactical btn-hud-primary"
                      style={{ display: 'inline-flex', padding: '4px 10px', fontSize: '11px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc);
                      }}
                    >
                      <span>Dispatch</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
