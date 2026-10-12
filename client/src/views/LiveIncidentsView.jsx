import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  PlusCircle,
  Navigation,
  Clock,
  User,
  Phone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function LiveIncidentsView({
  incidents = [],
  onSelectIncident,
  onOpenNewIncident,
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const match =
        inc.incidentId.toLowerCase().includes(term) ||
        inc.title.toLowerCase().includes(term) ||
        inc.description.toLowerCase().includes(term) ||
        (inc.location?.address && inc.location.address.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="workspace-container">
      {/* Header and Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            LIVE INCIDENT DISPATCH QUEUE
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time emergency incident triage, validation, and multi-agency coordination
          </p>
        </div>

        <button className="btn-dispatch" onClick={onOpenNewIncident}>
          <PlusCircle size={16} />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, title, street, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SEVERITY:</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
          {['ALL', 'REPORTED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'].map((st) => (
            <button
              key={st}
              className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / Grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(10, 18, 32, 0.6)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>INCIDENT ID</th>
              <th style={{ padding: '12px 16px' }}>SEVERITY</th>
              <th style={{ padding: '12px 16px' }}>TITLE & CATEGORY</th>
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
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No emergency incidents matching criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr
                  key={inc.incidentId}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  className="incident-table-row"
                  onClick={() => onSelectIncident(inc)}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', fontWeight: 600 }}>
                    {inc.incidentId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`severity-badge badge-${inc.severity}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{inc.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inc.category}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {inc.location?.address}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="status-badge">{inc.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {inc.assignedAmbulanceCallsign ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        🚑 {inc.assignedAmbulanceCallsign}
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(inc.timestamps?.reportedAt || inc.createdAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc);
                      }}
                    >
                      <span>Dispatch</span>
                      <ChevronRight size={13} />
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
