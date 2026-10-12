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
        inc.incidentId.toLowerCase().includes(term) ||
        inc.title.toLowerCase().includes(term) ||
        inc.description.toLowerCase().includes(term) ||
        (inc.location?.address && inc.location.address.toLowerCase().includes(term));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="workspace-container" style={{ background: '#000000' }}>
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
          background: '#000000',
          border: '1px solid #2C3480',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
            ORIGINAL LIVE INCIDENT DISPATCH QUEUE
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Deduplicated emergency records verified against MongoDB Atlas (Showing {filteredIncidents.length} original cases)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {toggleShowOriginalOnly && (
            <button
              className="btn-outline"
              onClick={toggleShowOriginalOnly}
              style={{
                background: showOriginalOnly ? '#2C3480' : 'transparent',
                borderColor: showOriginalOnly ? '#ffffff' : 'rgba(44, 52, 128, 0.6)',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={14} color="#ffffff" />
              <span>{showOriginalOnly ? 'Original Data Verified' : 'Show All Data'}</span>
            </button>
          )}

          <button
            className="btn-dispatch"
            onClick={onOpenNewIncident}
            style={{ background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
          >
            <PlusCircle size={16} color="#ffffff" />
            <span>Report New Incident</span>
          </button>
        </div>
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
          background: '#000000',
          border: '1px solid rgba(44, 52, 128, 0.4)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} className="search-icon" color="#ffffff" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, title, street, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 700 }}>SEVERITY:</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 700 }}>STATUS:</span>
          {['ALL', 'REPORTED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'].map((st) => (
            <button
              key={st}
              className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
              style={
                statusFilter === st
                  ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff', fontWeight: 800 }
                  : { background: 'rgba(44, 52, 128, 0.15)', color: '#cbd5e1' }
              }
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', background: '#000000', border: '1px solid #2C3480' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(44, 52, 128, 0.6)',
                background: '#2C3480',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 800,
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
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No original emergency incidents matching criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr
                  key={inc.incidentId}
                  style={{
                    borderBottom: '1px solid rgba(44, 52, 128, 0.25)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  className="incident-table-row"
                  onClick={() => onSelectIncident(inc)}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 800 }}>
                    {inc.incidentId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`severity-badge badge-${inc.severity}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{inc.title}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{inc.category}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {inc.location?.address}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="status-badge" style={{ background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {inc.assignedAmbulanceCallsign ? (
                      <span style={{ color: '#ffffff', fontWeight: 700, background: '#2C3480', padding: '2px 8px', borderRadius: '4px' }}>
                        🚑 {inc.assignedAmbulanceCallsign}
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: 600 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {new Date(inc.timestamps?.reportedAt || inc.createdAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 12px', fontSize: '11px', background: '#2C3480', borderColor: '#ffffff', color: '#ffffff' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc);
                      }}
                    >
                      <span>Dispatch</span>
                      <ChevronRight size={13} color="#ffffff" />
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
