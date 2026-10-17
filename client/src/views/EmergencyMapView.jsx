import React from 'react';
import EmergencyMap from '../components/EmergencyMap';

export default function EmergencyMapView({
  incidents = [],
  ambulances = [],
  hospitals = [],
  hotspots = [],
  selectedIncident,
  onSelectIncident,
}) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      {/* Top Map Tactical Banner */}
      <div
        style={{
          margin: '16px 20px 0 20px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-tactical)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
            map
          </span>
          <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
            FULL-SCREEN TACTICAL GIS MATRIX
          </span>
          <span
            style={{
              fontFamily: 'var(--font-telemetry)',
              fontSize: '10px',
              fontWeight: 700,
              background: 'rgba(0, 212, 255, 0.12)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              padding: '2px 7px',
              borderRadius: '3px',
            }}
          >
            REAL-TIME SAT-NAV 99.8%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} /> Critical Beacon
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} /> Unit Telemetry
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-light)' }} /> Trauma Hospital
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }} /> Risk Corridor
          </span>
        </div>
      </div>

      {/* Map Body */}
      <div style={{ flex: 1, padding: '16px 20px', position: 'relative' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-tactical)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-tactical)',
            position: 'relative',
          }}
        >
          <EmergencyMap
            incidents={incidents}
            ambulances={ambulances}
            hospitals={hospitals}
            hotspots={hotspots}
            selectedIncident={selectedIncident}
            onSelectIncident={onSelectIncident}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
