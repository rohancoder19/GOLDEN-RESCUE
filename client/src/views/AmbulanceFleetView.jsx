import React, { useState } from 'react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function AmbulanceFleetView({ ambulances = [], onAmbulanceUpdated }) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Strict deduplication of fleet by vehicleId
  const uniqueAmbulances = Array.from(
    new Map(ambulances.map((a) => [a.vehicleId, a])).values()
  );

  const filtered = uniqueAmbulances.filter((amb) => {
    if (statusFilter !== 'ALL' && amb.status !== statusFilter) return false;
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
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-tactical)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-tactical)',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>
              near_me
            </span>
            <span>TACTICAL FLEET &amp; RESPONDER TRACKING</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Active verified mobile units, telemetry sensors, and ALS life-support crew complements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'AVAILABLE', 'EN_ROUTE', 'AT_SCENE', 'OUT_OF_SERVICE'].map((st) => (
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

      {/* Fleet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {filtered.map((amb) => {
          const isAvail = amb.status === 'AVAILABLE';
          const isEnRoute = amb.status === 'EN_ROUTE' || amb.status === 'TRANSPORTING';

          return (
            <div
              key={amb.vehicleId}
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-tactical)',
                borderLeft: `4px solid ${isAvail ? 'var(--primary)' : isEnRoute ? 'var(--secondary)' : 'var(--outline)'}`,
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-tactical)',
              }}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '16px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                    {amb.callsign}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-telemetry)', color: 'var(--outline)' }}>
                    {amb.vehicleId} • {amb.type.replace(/_/g, ' ')}
                  </div>
                </div>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-telemetry)',
                    background: isAvail ? 'rgba(0, 212, 255, 0.15)' : 'var(--surface-container-high)',
                    color: isAvail ? 'var(--primary)' : 'var(--secondary)',
                    border: `1px solid ${isAvail ? 'var(--primary)' : 'var(--secondary)'}`,
                  }}
                >
                  {amb.status}
                </span>
              </div>

              {/* Telemetry info */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', fontFamily: 'var(--font-telemetry)', color: 'var(--on-surface)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>local_gas_station</span>
                  Fuel: {amb.fuelLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>battery_charging_full</span>
                  Battery: {amb.batteryLevel}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>speed</span>
                  {amb.location?.speedKmh || 0} km/h
                </span>
              </div>

              {/* Location & Incident */}
              <div style={{ fontSize: '11.5px', color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>pin_drop</span>
                <span>{amb.location?.address}</span>
              </div>

              {amb.assignedIncidentId && (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid var(--primary)',
                    fontSize: '11px',
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-telemetry)',
                    fontWeight: 700,
                  }}
                >
                  ASSIGNED INCIDENT: {amb.assignedIncidentId}
                </div>
              )}

              {/* Crew Roster */}
              <div style={{ borderTop: '1px solid var(--border-tactical)', paddingTop: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)', marginBottom: '4px' }}>
                  PARAMEDIC CREW COMPLEMENT:
                </div>
                {amb.paramedicCrew?.map((member, i) => (
                  <div key={i} style={{ fontSize: '11px', color: 'var(--on-surface)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--on-surface-bright)' }}>{member.name} ({member.role})</span>
                    <span style={{ color: 'var(--outline)', fontSize: '10px', fontFamily: 'var(--font-telemetry)' }}>{member.certification}</span>
                  </div>
                ))}
              </div>

              {/* Equipment Tags */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)', marginBottom: '4px' }}>
                  ADVANCED LIFE SUPPORT EQUIPMENT:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {amb.equipment?.map((eq, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'var(--surface-container-highest)',
                        border: '1px solid var(--border-tactical)',
                        color: 'var(--on-surface)',
                        fontFamily: 'var(--font-telemetry)',
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ borderTop: '1px solid var(--border-tactical)', paddingTop: '8px', display: 'flex', gap: '6px' }}>
                {amb.status !== 'AVAILABLE' && (
                  <button
                    type="button"
                    className="btn-hud-tactical btn-hud-primary"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '11px', justifyContent: 'center' }}
                    onClick={() => handleStatusChange(amb.vehicleId, 'AVAILABLE')}
                  >
                    Set Available
                  </button>
                )}
                {amb.status !== 'OUT_OF_SERVICE' && (
                  <button
                    type="button"
                    className="btn-hud-tactical"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '11px', justifyContent: 'center' }}
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
