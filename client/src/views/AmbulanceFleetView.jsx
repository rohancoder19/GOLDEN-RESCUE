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

  const filtered = ambulances.filter((amb) => {
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
    <div className="workspace-container">
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
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AmbulanceIcon size={20} color="#00f0ff" />
            <span>AMBULANCE FLEET & RESPONDER TELEMETRY</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time vehicle readiness, paramedic crew certifications, and life-support capabilities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'AVAILABLE', 'EN_ROUTE', 'AT_SCENE', 'OUT_OF_SERVICE'].map((st) => (
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
                borderLeft: isAvail ? '4px solid var(--green-ready)' : isEnRoute ? '4px solid var(--cyan-telemetry)' : '4px solid #f59e0b',
              }}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    {amb.callsign}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)' }}>
                    {amb.vehicleId} • {amb.type.replace('_', ' ')}
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: isAvail ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                    color: isAvail ? 'var(--green-ready)' : 'var(--cyan-telemetry)',
                    border: isAvail ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
                  }}
                >
                  {amb.status}
                </span>
              </div>

              {/* Telemetry info */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Fuel size={13} color="#f59e0b" /> Fuel: {amb.fuelLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Battery size={13} color="#10b981" /> Battery: {amb.batteryLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Navigation size={13} color="#00f0ff" /> {amb.location?.speedKmh || 0} km/h
                </span>
              </div>

              {/* Location & Incident */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                📍 {amb.location?.address}
              </div>

              {amb.assignedIncidentId && (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    fontSize: '11px',
                    color: 'var(--cyan-telemetry)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ASSIGNED INCIDENT: {amb.assignedIncidentId}
                </div>
              )}

              {/* Crew Roster */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PARAMEDIC CREW COMPLEMENT:
                </div>
                {amb.paramedicCrew?.map((member, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{member.name} ({member.role})</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{member.certification}</span>
                  </div>
                ))}
              </div>

              {/* Equipment Tags */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
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
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', gap: '6px' }}>
                {amb.status !== 'AVAILABLE' && (
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderColor: 'var(--green-ready)', color: 'var(--green-ready)' }}
                    onClick={() => handleStatusChange(amb.vehicleId, 'AVAILABLE')}
                  >
                    Set Available
                  </button>
                )}
                {amb.status !== 'OUT_OF_SERVICE' && (
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderColor: 'var(--border-subtle)' }}
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
