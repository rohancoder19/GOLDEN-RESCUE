import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  ShieldAlert,
  Cpu,
  ChevronRight,
  User,
  Phone,
  FileText,
  Activity,
} from 'lucide-react';
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

  // Filter available ambulances
  const availableAmbulances = ambulances.filter(
    (a) => a.status === 'AVAILABLE' || a.vehicleId === incident.assignedAmbulanceId
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
        `Status transitioned to ${nextStatus} by Operator Delta-7`
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cyan-telemetry)', fontWeight: 700 }}>
              {incident.incidentId}
            </span>
            <span className={`severity-badge badge-${incident.severity}`}>
              {incident.severity} PRIORITY ({incident.priorityScore || 50}/100)
            </span>
            <span className="status-badge">{incident.status}</span>
          </div>
          <button className="icon-btn-utility" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(10, 17, 32, 0.4)',
            padding: '0 20px',
          }}
        >
          <button
            className={`nav-item ${activeTab === 'dispatch' ? 'active' : ''}`}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'dispatch' ? '2px solid var(--cyan-telemetry)' : 'none' }}
            onClick={() => setActiveTab('dispatch')}
          >
            Operational Dispatch
          </button>
          <button
            className={`nav-item ${activeTab === 'ai-reasoning' ? 'active' : ''}`}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'ai-reasoning' ? '2px solid var(--cyan-telemetry)' : 'none' }}
            onClick={() => setActiveTab('ai-reasoning')}
          >
            AI Clinical Reasoning ({incident.aiTriage?.confidence || 90}%)
          </button>
          <button
            className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'timeline' ? '2px solid var(--cyan-telemetry)' : 'none' }}
            onClick={() => setActiveTab('timeline')}
          >
            Audit Trail ({incident.timeline?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Incident Overview Strip */}
          <div
            className="glass-panel"
            style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              {incident.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {incident.description}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} color="#00f0ff" />
                <span>{incident.location?.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} />
                <span>{incident.callerInfo?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} />
                <span>{incident.callerInfo?.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} />
                <span>Reported: {new Date(incident.timestamps?.reportedAt || incident.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: Dispatch Controls */}
          {activeTab === 'dispatch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* If Not Yet Dispatched: Show Selection Options */}
              {incident.status === 'REPORTED' || incident.status === 'TRIAGED' ? (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AmbulanceIcon size={14} color="#00f0ff" />
                      <span>SELECT EMERGENCY UNIT (RANKED BY PROXIMITY & CAPABILITY):</span>
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
                      <Building2 size={14} color="#10b981" />
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
                    className="btn-dispatch"
                    onClick={handleDispatch}
                    disabled={isSubmitting}
                    style={{ justifyContent: 'center', padding: '12px' }}
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'TRANSMITTING DISPATCH...' : 'CONFIRM DISPATCH & NOTIFY UNIT'}</span>
                  </button>
                </>
              ) : (
                /* Already Dispatched: Show Active Tracking & Progression Buttons */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    className="glass-panel"
                    style={{ padding: '16px', borderLeft: '4px solid var(--cyan-telemetry)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        ASSIGNED UNIT: {incident.assignedAmbulanceCallsign || incident.assignedAmbulanceId}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', fontSize: '12px' }}>
                        ETA: {incident.routeData?.etaMinutes || 4} MIN
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Destination: {incident.recommendedHospitalName || incident.recommendedHospitalId || 'Metro General Institute'}
                    </div>
                  </div>

                  {/* Lifecycle State Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      ADVANCE INCIDENT LIFECYCLE:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {incident.status === 'DISPATCHED' && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('EN_ROUTE')}
                          disabled={isSubmitting}
                        >
                          Mark Unit EN ROUTE
                        </button>
                      )}
                      {(incident.status === 'DISPATCHED' || incident.status === 'EN_ROUTE') && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('ON_SCENE')}
                          disabled={isSubmitting}
                        >
                          Mark Unit ON SCENE
                        </button>
                      )}
                      {incident.status === 'ON_SCENE' && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('TRANSPORTING')}
                          disabled={isSubmitting}
                        >
                          Mark TRANSPORTING to Hospital
                        </button>
                      )}
                      {incident.status !== 'RESOLVED' && incident.status !== 'CANCELLED' && (
                        <button
                          className="btn-outline"
                          style={{ borderColor: 'var(--green-ready)', color: 'var(--green-ready)' }}
                          onClick={() => handleStatusTransition('RESOLVED')}
                          disabled={isSubmitting}
                        >
                          <CheckCircle2 size={14} />
                          <span>Close & RESOLVE Incident</span>
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
                className="glass-panel"
                style={{ padding: '14px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 700, fontSize: '13px' }}>
                  <Cpu size={16} />
                  <span>GEMINI 2.5 FLASH CLINICAL TRIAGE JUSTIFICATION</span>
                </div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '8px', lineHeight: '1.6' }}>
                  "{incident.aiTriage?.clinicalRecommendation || incident.aiTriage?.summary || 'Standard protocol emergency triage.'}"
                </div>
              </div>

              {/* Factors Evaluated */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  CONTRIBUTING CLINICAL RISK FACTORS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {(incident.aiTriage?.factors || ['Standard emergency priority']).map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ChevronRight size={14} color="#00f0ff" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audit Trail */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(incident.timeline || []).map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan-telemetry)', minWidth: '70px' }}>
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{step.stage}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>• {step.actor}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {step.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
