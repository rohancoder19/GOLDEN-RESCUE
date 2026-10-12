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
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.92)' }}>
      <div
        className="modal-content-card"
        style={{ maxWidth: '780px', background: '#000000', border: '2px solid #2C3480', boxShadow: '0 0 30px rgba(44, 52, 128, 0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: '#000000', borderBottom: '1px solid rgba(44, 52, 128, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
              {incident.incidentId}
            </span>
            <span className={`severity-badge badge-${incident.severity}`}>
              {incident.severity} PRIORITY ({incident.priorityScore || 50}/100)
            </span>
            <span className="status-badge" style={{ background: '#2C3480', color: '#ffffff' }}>
              {incident.status}
            </span>
          </div>
          <button className="icon-btn-utility" onClick={onClose} style={{ background: '#000000', border: '1px solid #2C3480' }}>
            <X size={16} color="#ffffff" />
          </button>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(44, 52, 128, 0.5)',
            background: 'rgba(44, 52, 128, 0.15)',
            padding: '0 20px',
          }}
        >
          <button
            className={`nav-item ${activeTab === 'dispatch' ? 'active' : ''}`}
            style={{
              width: 'auto',
              borderRadius: '0',
              borderBottom: activeTab === 'dispatch' ? '2px solid #ffffff' : 'none',
              background: activeTab === 'dispatch' ? '#2C3480' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setActiveTab('dispatch')}
          >
            Operational Dispatch
          </button>
          <button
            className={`nav-item ${activeTab === 'ai-reasoning' ? 'active' : ''}`}
            style={{
              width: 'auto',
              borderRadius: '0',
              borderBottom: activeTab === 'ai-reasoning' ? '2px solid #ffffff' : 'none',
              background: activeTab === 'ai-reasoning' ? '#2C3480' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setActiveTab('ai-reasoning')}
          >
            AI Clinical Reasoning ({incident.aiTriage?.confidence || 90}%)
          </button>
          <button
            className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
            style={{
              width: 'auto',
              borderRadius: '0',
              borderBottom: activeTab === 'timeline' ? '2px solid #ffffff' : 'none',
              background: activeTab === 'timeline' ? '#2C3480' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setActiveTab('timeline')}
          >
            Audit Trail ({incident.timeline?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ background: '#000000' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} color="#ef4444" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Incident Overview Strip */}
          <div
            className="glass-panel"
            style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.15)', border: '1px solid rgba(44, 52, 128, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              {incident.title}
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {incident.description}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>{incident.location?.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} color="#cbd5e1" />
                <span>{incident.callerInfo?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} color="#cbd5e1" />
                <span>{incident.callerInfo?.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="#cbd5e1" />
                <span>Reported: {new Date(incident.timestamps?.reportedAt || incident.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: Dispatch Controls */}
          {activeTab === 'dispatch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {incident.status === 'REPORTED' || incident.status === 'TRIAGED' ? (
                <>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AmbulanceIcon size={14} color="#ffffff" />
                      <span>SELECT AVAILABLE EMERGENCY UNIT (RANKED):</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedAmbulanceId}
                      onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                      style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
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
                    <label className="form-label" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="#ffffff" />
                      <span>RECOMMENDED RECEIVING HOSPITAL:</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
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
                    <label className="form-label" style={{ color: '#ffffff' }}>OPERATOR DISPATCH ORDER / CLINICAL NOTES:</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Priority 1 response authorized. Trauma Bay pre-notified."
                      value={operatorNote}
                      onChange={(e) => setOperatorNote(e.target.value)}
                      style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                    />
                  </div>

                  <button
                    className="btn-dispatch"
                    onClick={handleDispatch}
                    disabled={isSubmitting}
                    style={{ justifyContent: 'center', padding: '12px', background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
                  >
                    <Send size={16} color="#ffffff" />
                    <span>{isSubmitting ? 'TRANSMITTING DISPATCH...' : 'CONFIRM DISPATCH & NOTIFY UNIT'}</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    className="glass-panel"
                    style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.2)', borderLeft: '4px solid #ffffff' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        ASSIGNED UNIT: {incident.assignedAmbulanceCallsign || incident.assignedAmbulanceId}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', fontSize: '12px', fontWeight: 800 }}>
                        ETA: {incident.routeData?.etaMinutes || 4} MIN
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                      Destination: {incident.recommendedHospitalName || incident.recommendedHospitalId || 'Metro General Institute'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      ADVANCE INCIDENT LIFECYCLE:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {incident.status === 'DISPATCHED' && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('EN_ROUTE')}
                          disabled={isSubmitting}
                          style={{ background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
                        >
                          Mark Unit EN ROUTE
                        </button>
                      )}
                      {(incident.status === 'DISPATCHED' || incident.status === 'EN_ROUTE') && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('ON_SCENE')}
                          disabled={isSubmitting}
                          style={{ background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
                        >
                          Mark Unit ON SCENE
                        </button>
                      )}
                      {incident.status === 'ON_SCENE' && (
                        <button
                          className="btn-primary"
                          onClick={() => handleStatusTransition('TRANSPORTING')}
                          disabled={isSubmitting}
                          style={{ background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
                        >
                          Mark TRANSPORTING to Hospital
                        </button>
                      )}
                      {incident.status !== 'RESOLVED' && incident.status !== 'CANCELLED' && (
                        <button
                          className="btn-outline"
                          style={{ background: '#2C3480', borderColor: '#ffffff', color: '#ffffff' }}
                          onClick={() => handleStatusTransition('RESOLVED')}
                          disabled={isSubmitting}
                        >
                          <CheckCircle2 size={14} color="#ffffff" />
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
                style={{ padding: '16px', background: 'rgba(44, 52, 128, 0.25)', border: '1px solid #2C3480' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}>
                  <Cpu size={16} color="#ffffff" />
                  <span>GEMINI 2.5 FLASH CLINICAL TRIAGE JUSTIFICATION</span>
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', marginTop: '8px', lineHeight: '1.6' }}>
                  "{incident.aiTriage?.clinicalRecommendation || incident.aiTriage?.summary || 'Standard protocol emergency triage.'}"
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  CONTRIBUTING CLINICAL RISK FACTORS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {(incident.aiTriage?.factors || ['Standard emergency priority']).map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(44, 52, 128, 0.15)',
                        border: '1px solid rgba(44, 52, 128, 0.4)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#ffffff',
                      }}
                    >
                      <ChevronRight size={14} color="#ffffff" />
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
                    background: 'rgba(44, 52, 128, 0.15)',
                    border: '1px solid rgba(44, 52, 128, 0.4)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff', minWidth: '70px', fontWeight: 700 }}>
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{step.stage}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>• {step.actor}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                      {step.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ background: '#000000', borderTop: '1px solid rgba(44, 52, 128, 0.5)' }}>
          <button className="btn-outline" onClick={onClose} style={{ background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
