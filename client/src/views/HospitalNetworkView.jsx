import React, { useState } from 'react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function HospitalNetworkView({ hospitals = [], onHospitalUpdated }) {
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [bedInput, setBedInput] = useState('');
  const [icuInput, setIcuInput] = useState('');

  // Strict deduplication of hospitals by hospitalId
  const uniqueHospitals = Array.from(
    new Map(hospitals.map((h) => [h.hospitalId, h])).values()
  );

  const handleToggleDiversion = async (hospital) => {
    const nextStatus = hospital.status === 'DIVERTING_AMBULANCES' ? 'ACCEPTING_ALL' : 'DIVERTING_AMBULANCES';
    try {
      const res = await api.updateHospitalCapacity(hospital.hospitalId, { status: nextStatus });
      playTelemetryChirp();
      if (onHospitalUpdated) onHospitalUpdated(res.hospital);
    } catch (err) {
      alert(`Error toggling diversion: ${err.message}`);
    }
  };

  const handleSaveCapacity = async (hospitalId) => {
    try {
      const payload = {};
      if (bedInput !== '') payload.availableBeds = Number(bedInput);
      if (icuInput !== '') payload.icuAvailable = Number(icuInput);

      const res = await api.updateHospitalCapacity(hospitalId, payload);
      playTelemetryChirp();
      if (onHospitalUpdated) onHospitalUpdated(res.hospital);
      setEditingHospitalId(null);
      setBedInput('');
      setIcuInput('');
    } catch (err) {
      alert(`Error updating capacity: ${err.message}`);
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
              local_hospital
            </span>
            <span>REGIONAL HOSPITAL NETWORK &amp; ER RESILIENCE</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Designated trauma centers, active ICU bed surge capacities, and diversion status controls
          </p>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {uniqueHospitals.map((hosp) => {
          const isDiverting = hosp.status === 'DIVERTING_AMBULANCES';
          const isCriticalOnly = hosp.status === 'ACCEPTING_CRITICAL_ONLY';
          const isEditing = editingHospitalId === hosp.hospitalId;

          return (
            <div
              key={hosp.hospitalId}
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-tactical)',
                borderLeft: `4px solid ${isDiverting ? 'var(--error)' : isCriticalOnly ? 'var(--secondary)' : 'var(--primary)'}`,
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-tactical)',
              }}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '16px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                    {hosp.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                    {hosp.hospitalId} • {hosp.traumaLevel}
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-telemetry)',
                    background: isDiverting ? 'rgba(255, 77, 90, 0.2)' : 'rgba(0, 212, 255, 0.12)',
                    color: isDiverting ? 'var(--error-light)' : 'var(--primary)',
                    border: `1px solid ${isDiverting ? 'var(--error)' : 'var(--primary)'}`,
                  }}
                >
                  {hosp.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Location & Contact */}
              <div style={{ fontSize: '11.5px', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--secondary)' }}>pin_drop</span>
                <span>{hosp.location?.address}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-telemetry)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>phone_in_talk</span>
                <span>Direct ED: {hosp.contactPhone}</span>
              </div>

              {/* Capacity Counters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'var(--surface-container-lowest)',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-tactical)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 600, fontFamily: 'var(--font-telemetry)' }}>
                    AVAILABLE BEDS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-telemetry)', color: 'var(--on-surface-bright)' }}>
                    {hosp.capacity?.availableBeds}{' '}
                    <span style={{ fontSize: '11px', color: 'var(--outline)' }}>/ {hosp.capacity?.totalBeds}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 600, fontFamily: 'var(--font-telemetry)' }}>
                    ICU BEDS OPEN
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-telemetry)', color: 'var(--primary)' }}>
                    {hosp.capacity?.icuAvailable}{' '}
                    <span style={{ fontSize: '11px', color: 'var(--outline)' }}>/ {hosp.capacity?.icuTotal}</span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)', marginBottom: '4px' }}>
                  CLINICAL SPECIALTIES:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hosp.specialties?.map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'var(--surface-container-highest)',
                        border: '1px solid var(--border-tactical)',
                        color: 'var(--on-surface)',
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Edit Capacity Inputs if active */}
              {isEditing && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Beds"
                    style={{ width: '80px', padding: '4px 8px' }}
                    value={bedInput}
                    onChange={(e) => setBedInput(e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="ICU"
                    style={{ width: '80px', padding: '4px 8px' }}
                    value={icuInput}
                    onChange={(e) => setIcuInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-hud-tactical btn-hud-primary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => handleSaveCapacity(hosp.hospitalId)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-hud-tactical"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setEditingHospitalId(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Actions Strip */}
              <div style={{ borderTop: '1px solid var(--border-tactical)', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-hud-tactical"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    borderColor: isDiverting ? 'var(--primary)' : 'var(--error)',
                    color: isDiverting ? 'var(--primary)' : 'var(--error-light)',
                  }}
                  onClick={() => handleToggleDiversion(hosp)}
                >
                  {isDiverting ? 'Remove Diversion' : 'Declare Diversion'}
                </button>

                {!isEditing && (
                  <button
                    type="button"
                    className="btn-hud-tactical btn-hud-primary"
                    style={{ padding: '5px 14px', fontSize: '11px' }}
                    onClick={() => {
                      setEditingHospitalId(hosp.hospitalId);
                      setBedInput(String(hosp.capacity?.availableBeds || ''));
                      setIcuInput(String(hosp.capacity?.icuAvailable || ''));
                    }}
                  >
                    Update Beds
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
