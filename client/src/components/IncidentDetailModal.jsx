import React, { useState } from 'react';
import { api } from '../services/api';
import { playAlertSiren, playTelemetryChirp } from '../services/audio';

export default function IncidentDetailModal({
  incident,
  ambulances = [],
  hospitals = [],
  onClose,
  onIncidentUpdated,
}) {
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState(
    incident.assignedAmbulanceId || ''
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState(
    incident.recommendedHospitalId || ''
  );
  const [operatorNote, setOperatorNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch', 'ai-reasoning', 'timeline'

  // Deduplicate available ambulances
  const availableAmbulances = Array.from(
    new Map(
      ambulances
        .filter((a) => a.status === 'AVAILABLE' || a.vehicleId === incident.assignedAmbulanceId)
        .map((a) => [a.vehicleId, a])
    ).values()
  );

  const handleDispatch = async () => {
    if (!selectedAmbulanceId) {
      setErrorMessage('Please select an available ambulance for dispatch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.dispatchIncident(incident.incidentId, {
        ambulanceId: selectedAmbulanceId,
        hospitalId: selectedHospitalId || undefined,
        operatorNote: operatorNote || 'Operator confirmed priority dispatch.',
      });

      playAlertSiren();
      if (onIncidentUpdated) onIncidentUpdated(res.incident);
    } catch (err) {
      setErrorMessage(err.message || 'Dispatch failed. Verify unit availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (nextStatus) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.updateIncidentStatus(
        incident.incidentId,
        nextStatus,
        `Status transitioned to ${nextStatus} by Operator`
      );
      playTelemetryChirp();
      if (onIncidentUpdated) onIncidentUpdated(res.incident);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>
              {incident.incidentId}
            </span>
            <span className={`incident-severity-badge badge-${incident.severity === 'CRITICAL' ? 'crit' : incident.severity === 'HIGH' ? 'high' : incident.severity === 'MEDIUM' ? 'med' : 'low'}`}>
              {incident.severity} PRIORITY ({incident.priorityScore || 50}/100)
            </span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '10.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: 'var(--surface-container-highest)',
                color: 'var(--on-surface-bright)',
                border: '1px solid var(--border-tactical)',
              }}
            >
              {incident.status}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '9.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: incident.isSimulated || incident.dataSource === 'SIMULATED_DEMO' ? 'rgba(255, 189, 88, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                color: incident.isSimulated || incident.dataSource === 'SIMULATED_DEMO' ? 'var(--secondary)' : 'var(--primary)',
                border: `1px solid ${incident.isSimulated || incident.dataSource === 'SIMULATED_DEMO' ? 'var(--secondary)' : 'var(--primary)'}`,
                fontWeight: 700,
              }}
            >
              {incident.dataSource || (incident.isSimulated ? 'SIMULATED_DEMO' : 'STORED_DATABASE')}
            </span>
          </div>
          <button
            type="button"
            className="icon-btn-tactical"
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-tactical)',
            background: 'var(--surface-container-low)',
            padding: '0 16px',
            gap: '6px',
          }}
        >
          {[
            { id: 'dispatch', label: 'Operational Dispatch' },
            { id: 'ai-reasoning', label: `AI Clinical Reasoning (${incident.aiTriage?.confidence || 90}%)` },
            { id: 'timeline', label: `Audit Trail (${incident.timeline?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`layer-toggle-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ borderRadius: '0', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : 'none', padding: '8px 12px' }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '4px',
                background: 'rgba(255, 77, 90, 0.2)',
                border: '1px solid var(--error)',
                color: 'var(--error-light)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Incident Overview Strip */}
          <div
            style={{
              padding: '14px',
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--border-tactical)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
              {incident.title}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--on-surface)' }}>
              {incident.description}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '4px', fontSize: '11px', color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>pin_drop</span>
                <span style={{ color: 'var(--on-surface-bright)' }}>{incident.location?.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                <span>{incident.callerInfo?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>phone</span>
                <span>{incident.callerInfo?.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                <span>Reported: {new Date(incident.timestamps?.reportedAt || incident.createdAt || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: Dispatch Controls */}
          {activeTab === 'dispatch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {incident.status === 'REPORTED' || incident.status === 'TRIAGED' ? (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>airport_shuttle</span>
                      <span>SELECT AVAILABLE EMERGENCY UNIT (RANKED):</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedAmbulanceId}
                      onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                    >
                      <option value="">-- Choose Unit --</option>
                      {availableAmbulances.map((amb) => (
                        <option key={amb.vehicleId} value={amb.vehicleId}>
                          {amb.callsign} ({amb.vehicleId}) — {amb.type} [{amb.status}] • Fuel: {amb.fuelLevel}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>local_hospital</span>
                      <span>RECOMMENDED RECEIVING HOSPITAL:</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                    >
                      <option value="">-- Choose Hospital --</option>
                      {hospitals.map((hosp) => (
                        <option key={hosp.hospitalId} value={hosp.hospitalId}>
                          {hosp.name} ({hosp.traumaLevel}) — ICU Beds: {hosp.capacity?.icuAvailable} [{hosp.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">OPERATOR DISPATCH ORDER / CLINICAL NOTES:</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Priority 1 response authorized. Trauma Bay pre-notified."
                      value={operatorNote}
                      onChange={(e) => setOperatorNote(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-command-dispatch"
                    onClick={handleDispatch}
                    disabled={isSubmitting}
                    style={{ padding: '10px', fontSize: '13px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                    <span>{isSubmitting ? 'TRANSMITTING DISPATCH...' : 'CONFIRM DISPATCH & NOTIFY UNIT'}</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid var(--border-tactical)',
                      borderLeft: '4px solid var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-headline)', fontSize: '14px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                        ASSIGNED UNIT: {incident.assignedAmbulanceCallsign || incident.assignedAmbulanceId}
                      </div>
                      <div style={{ fontFamily: 'var(--font-telemetry)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>
                        ETA: {incident.routeData?.etaMinutes || 4} MIN
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '4px' }}>
                      Destination: {incident.recommendedHospitalName || incident.recommendedHospitalId || 'Metro Central Institute'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                      ADVANCE INCIDENT LIFECYCLE:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {incident.status === 'DISPATCHED' && (
                        <button
                          type="button"
                          className="btn-hud-tactical btn-hud-primary"
                          onClick={() => handleStatusTransition('EN_ROUTE')}
                          disabled={isSubmitting}
                        >
                          Mark Unit EN ROUTE
                        </button>
                      )}
                      {(incident.status === 'DISPATCHED' || incident.status === 'EN_ROUTE') && (
                        <button
                          type="button"
                          className="btn-hud-tactical btn-hud-primary"
                          onClick={() => handleStatusTransition('ON_SCENE')}
                          disabled={isSubmitting}
                        >
                          Mark Unit ON SCENE
                        </button>
                      )}
                      {incident.status === 'ON_SCENE' && (
                        <button
                          type="button"
                          className="btn-hud-tactical btn-hud-primary"
                          onClick={() => handleStatusTransition('TRANSPORTING')}
                          disabled={isSubmitting}
                        >
                          Mark TRANSPORTING to Hospital
                        </button>
                      )}
                      {incident.status !== 'RESOLVED' && incident.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="btn-hud-tactical"
                          onClick={() => handleStatusTransition('RESOLVED')}
                          disabled={isSubmitting}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>check_circle</span>
                          <span>Close &amp; RESOLVE Incident</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI Clinical Reasoning */}
          {activeTab === 'ai-reasoning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--border-tactical)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-headline)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
                  <span>GEMINI 2.5 FLASH CLINICAL TRIAGE JUSTIFICATION</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--on-surface-bright)', marginTop: '8px', lineHeight: '1.6' }}>
                  "{incident.aiTriage?.clinicalRecommendation || incident.aiTriage?.summary || 'Standard protocol emergency triage.'}"
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                  CONTRIBUTING CLINICAL RISK FACTORS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {incident.aiTriage?.factors?.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--surface-container-lowest)',
                        border: '1px solid var(--border-tactical)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        color: 'var(--on-surface)',
                      }}
                    >
                      • {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Clinical Decision Support Disclaimer */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(5, 14, 28, 0.9)',
                  border: '1px solid var(--secondary)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }}>
                  gavel
                </span>
                <div style={{ fontSize: '11px', color: 'var(--on-surface)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--secondary)' }}>DECISION SUPPORT ONLY: </strong>
                  {incident.aiTriage?.clinicalDisclaimer ||
                    'AI-generated clinical assessment is intended solely for emergency dispatch decision support and operational resource prioritization. It does NOT constitute an authoritative clinical diagnosis. Patient care remains subject to on-scene paramedic evaluation and authorized physician protocols.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audit Trail */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incident.timeline?.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid var(--border-tactical)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      check_circle
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                        {entry.stage} • {entry.actor}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                        {entry.note}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--secondary)' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
