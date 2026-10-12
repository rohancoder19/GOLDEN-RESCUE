import React, { useState } from 'react';
import {
  Ambulance as AmbulanceIcon,
  ShieldCheck,
  Battery,
  Fuel,
  Users,
  Wrench,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function AmbulanceFleetView({ ambulances = [], onAmbulanceUpdated }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Strict deduplication of fleet by vehicleId
  const uniqueAmbulances = Array.from(
    new Map(ambulances.map((a) => [a.vehicleId, a])).values()
  );

  const filtered = uniqueAmbulances.filter((amb) => {
    if (statusFilter !== 'ALL' && amb.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && amb.type !== typeFilter) return false;
    return true;
  });

  const handleStatusChange = async (vehicleId, nextStatus) => {
    try {
      const res = await api.updateAmbulanceStatus(vehicleId, nextStatus);
      playTelemetryChirp();
      if (onAmbulanceUpdated) onAmbulanceUpdated(res.ambulance);
    } catch (err) {
      alert(`Error updating unit status: ${err.message}`);
    }
  };

  return (
    <div className="workspace-container" style={{ background: '#000000' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#000000',
          border: '1px solid #2C3480',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AmbulanceIcon size={20} color="#ffffff" />
            <span>ORIGINAL AMBULANCE FLEET & RESPONDER TELEMETRY</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Active verified emergency vehicles, certifications, and advanced life-support capabilities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'AVAILABLE', 'EN_ROUTE', 'AT_SCENE', 'OUT_OF_SERVICE'].map((st) => (
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

      {/* Fleet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {filtered.map((amb) => {
          const isAvail = amb.status === 'AVAILABLE';
          const isEnRoute = amb.status === 'EN_ROUTE' || amb.status === 'TRANSPORTING';

          return (
            <div
              key={amb.vehicleId}
              className="glass-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(14, 18, 44, 0.7)',
                border: '1px solid rgba(44, 52, 128, 0.5)',
                borderLeft: isAvail ? '4px solid #ffffff' : isEnRoute ? '4px solid #2C3480' : '4px solid #f59e0b',
              }}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                    {amb.callsign}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                    {amb.vehicleId} • {amb.type.replace(/_/g, ' ')}
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: isAvail ? '#2C3480' : 'rgba(44, 52, 128, 0.3)',
                    color: '#ffffff',
                    border: '1px solid #ffffff',
                  }}
                >
                  {amb.status}
                </span>
              </div>

              {/* Telemetry info */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Fuel size={13} color="#ffffff" /> Fuel: {amb.fuelLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Battery size={13} color="#ffffff" /> Battery: {amb.batteryLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Navigation size={13} color="#ffffff" /> {amb.location?.speedKmh || 0} km/h
                </span>
              </div>

              {/* Location & Incident */}
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                📍 {amb.location?.address}
              </div>

              {amb.assignedIncidentId && (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#2C3480',
                    border: '1px solid #ffffff',
                    fontSize: '11px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                >
                  ASSIGNED INCIDENT: {amb.assignedIncidentId}
                </div>
              )}

              {/* Crew Roster */}
              <div style={{ borderTop: '1px solid rgba(44, 52, 128, 0.4)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  PARAMEDIC CREW COMPLEMENT:
                </div>
                {amb.paramedicCrew?.map((member, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ffffff' }}>{member.name} ({member.role})</span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>{member.certification}</span>
                  </div>
                ))}
              </div>

              {/* Equipment Tags */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  ADVANCED LIFE SUPPORT EQUIPMENT:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {amb.equipment?.map((eq, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(44, 52, 128, 0.25)',
                        border: '1px solid rgba(44, 52, 128, 0.5)',
                        color: '#ffffff',
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ borderTop: '1px solid rgba(44, 52, 128, 0.4)', paddingTop: '10px', display: 'flex', gap: '6px' }}>
                {amb.status !== 'AVAILABLE' && (
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '11px', background: '#2C3480', borderColor: '#ffffff', color: '#ffffff', fontWeight: 700 }}
                    onClick={() => handleStatusChange(amb.vehicleId, 'AVAILABLE')}
                  >
                    Set Available
                  </button>
                )}
                {amb.status !== 'OUT_OF_SERVICE' && (
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '11px', borderColor: 'rgba(44, 52, 128, 0.5)', color: '#cbd5e1' }}
                    onClick={() => handleStatusChange(amb.vehicleId, 'OUT_OF_SERVICE')}
                  >
                    Maintenance
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
