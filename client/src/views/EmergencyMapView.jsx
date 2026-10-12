import React from 'react';
import EmergencyMap from '../components/EmergencyMap';
import { MapPin, Navigation, Radio, Flame, Building2, Ambulance as AmbulanceIcon } from 'lucide-react';

export default function EmergencyMapView({
  incidents = [],
  ambulances = [],
  hospitals = [],
  hotspots = [],
  selectedIncident,
  onSelectIncident,
}) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Map Banner */}
      <div
        className="glass-panel"
        style={{
          margin: '16px 20px 0 20px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} color="#00f0ff" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            FULL-SCREEN TACTICAL EMERGENCY MAP
          </span>
          <span className="telemetry-chip">CARTOGRAPHY ENGINE v2.5</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Critical Incident
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f0ff' }} /> Ambulance GPS
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Hospital Trauma Center
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Predictive Risk Hotspot
          </span>
        </div>
      </div>

      {/* Map Body */}
      <div style={{ flex: 1, padding: '16px 20px', position: 'relative' }}>
        <div className="glass-panel" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
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
