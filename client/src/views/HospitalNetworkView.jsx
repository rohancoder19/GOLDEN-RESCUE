import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Activity,
  Bed,
  HeartPulse,
  Phone,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function HospitalNetworkView({ hospitals = [], onHospitalUpdated }) {
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [bedInput, setBedInput] = useState('');
  const [icuInput, setIcuInput] = useState('');

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
            <Building2 size={20} color="#10b981" />
            <span>REGIONAL HOSPITAL NETWORK & TRAUMA RESILIENCE</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Verified hospital capacities, ICU availability, designated trauma levels, and diversion statuses
          </p>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {hospitals.map((hosp) => {
          const isDiverting = hosp.status === 'DIVERTING_AMBULANCES';
          const isCriticalOnly = hosp.status === 'ACCEPTING_CRITICAL_ONLY';
          const isEditing = editingHospitalId === hosp.hospitalId;

          return (
            <div
              key={hosp.hospitalId}
              className="glass-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: isDiverting ? '4px solid #ef4444' : isCriticalOnly ? '4px solid #f59e0b' : '4px solid #10b981',
              }}
            >
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    {hosp.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--cyan-telemetry)', fontFamily: 'var(--font-mono)' }}>
                    {hosp.hospitalId} • {hosp.traumaLevel}
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: isDiverting ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isDiverting ? '#ef4444' : '#10b981',
                    border: isDiverting ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {hosp.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Location & Contact */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                📍 {hosp.location?.address}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={12} /> Direct ED Line: {hosp.contactPhone}
              </div>

              {/* Capacity Counters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AVAILABLE BEDS</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    {hosp.capacity?.availableBeds} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {hosp.capacity?.totalBeds}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ICU BEDS OPEN</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: (hosp.capacity?.icuAvailable || 0) > 2 ? '#10b981' : '#f59e0b' }}>
                    {hosp.capacity?.icuAvailable} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {hosp.capacity?.icuTotal}</span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CLINICAL SPECIALTIES:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hosp.specialties?.map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 240, 255, 0.05)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Edit Capacity Inputs if active */}
              {isEditing && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
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
                    className="btn-primary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => handleSaveCapacity(hosp.hospitalId)}
                  >
                    Save
                  </button>
                  <button
                    className="btn-outline"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setEditingHospitalId(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Actions Strip */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                <button
                  className="btn-outline"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderColor: isDiverting ? 'var(--green-ready)' : '#ef4444',
                    color: isDiverting ? 'var(--green-ready)' : '#ef4444',
                  }}
                  onClick={() => handleToggleDiversion(hosp)}
                >
                  {isDiverting ? 'Remove Diversion' : 'Toggle Diversion'}
                </button>

                {!isEditing && (
                  <button
                    className="btn-outline"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
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
