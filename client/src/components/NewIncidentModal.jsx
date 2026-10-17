import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { playVoiceRecordChirp, playTelemetryChirp, playAlertSiren } from '../services/audio';

export default function NewIncidentModal({ onClose, onIncidentCreated }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TRAFFIC_COLLISION');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState([37.7749, -122.4194]);
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [source, setSource] = useState('OPERATOR_MANUAL');

  // Speech Recognition setup if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    if (isRecording) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Failed to start recognition:', err);
      }
    } else {
      try {
        recognition.stop();
      } catch (err) {}
    }

    return () => {
      try {
        recognition.stop();
      } catch (err) {}
    };
  }, [isRecording]);

  const toggleRecording = () => {
    playVoiceRecordChirp();
    setIsRecording(!isRecording);
  };

  const handleParseVoice = async () => {
    if (!transcript.trim()) {
      setErrorMessage('Please speak or enter an emergency transcript to analyze.');
      return;
    }

    setIsAiParsing(true);
    setErrorMessage('');

    try {
      const res = await api.parseVoiceTranscript(transcript);
      if (res.parsedData) {
        setTitle(res.parsedData.title || 'Voice Emergency Alert');
        setCategory(res.parsedData.category || 'TRAFFIC_COLLISION');
        setDescription(res.parsedData.description || transcript);
        if (res.parsedData.address) setAddress(res.parsedData.address);
        setActiveTab('manual');
        playTelemetryChirp();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse voice transcript with Gemini.');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !address.trim()) {
      setErrorMessage('Please provide Title, Description, and Address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        location: {
          address: address.trim(),
          coordinates,
          district: 'Metro Operational Sector',
        },
        callerInfo: {
          name: callerName.trim() || '911 Reporter',
          phone: callerPhone.trim() || '+1 (415) 555-0199',
        },
        source,
      };

      const res = await api.createIncident(payload);
      playAlertSiren();
      if (onIncidentCreated) onIncidentCreated(res.incident);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>
              campaign
            </span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
              REGISTER NEW EMERGENCY INCIDENT
            </span>
          </div>
          <button type="button" className="icon-btn-tactical" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-tactical)',
            background: 'var(--surface-container-low)',
            padding: '0 16px',
            gap: '6px',
          }}
        >
          <button
            type="button"
            className={`layer-toggle-btn ${activeTab === 'manual' ? 'active' : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'manual' ? '2px solid var(--primary)' : 'none', padding: '8px 14px' }}
            onClick={() => setActiveTab('manual')}
          >
            Manual Operator Input
          </button>
          <button
            type="button"
            className={`layer-toggle-btn ${activeTab === 'voice' ? 'active' : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'voice' ? '2px solid var(--primary)' : 'none', padding: '8px 14px' }}
            onClick={() => setActiveTab('voice')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>mic</span>
            <span>Voice-to-Dispatch AI</span>
          </button>
        </div>

        {/* Body */}
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

          {activeTab === 'voice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '14px',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--border-tactical)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '3px' }}>
                  GOOGLE GEMINI VOICE-TO-DISPATCH EXTRACTION
                </div>
                <p style={{ fontSize: '12px', color: 'var(--on-surface)' }}>
                  Speak natural emergency dispatch transcript or paste 911 dispatch audio log. Gemini extracts location, severity, and mechanism of injury automatically.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={isRecording ? 'btn-command-eas' : 'btn-hud-tactical btn-hud-primary'}
                  onClick={toggleRecording}
                  style={{ padding: '8px 14px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {isRecording ? 'mic_off' : 'mic'}
                  </span>
                  <span>{isRecording ? 'Stop Recording' : 'Start Microphone'}</span>
                </button>
                {isRecording && (
                  <span style={{ fontSize: '11px', color: 'var(--error)', fontFamily: 'var(--font-telemetry)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="live-beacon-dot" style={{ width: '6px', height: '6px' }}>
                      <span className="ping-corona" style={{ background: 'var(--error)' }}></span>
                      <span className="solid-core" style={{ background: 'var(--error)', width: '6px', height: '6px' }}></span>
                    </span>
                    LISTENING...
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">AUDIO TRANSCRIPT / DISPATCH CALL LOG:</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="e.g. 911 dispatch, caller reporting multi-car rollover crash on Downtown Expressway near 4th street. 4 occupants injured, engine compartment smoking."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-command-gold"
                onClick={handleParseVoice}
                disabled={isAiParsing}
                style={{ justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
                <span>{isAiParsing ? 'PARSING WITH GEMINI 2.5 FLASH...' : 'PARSE WITH GEMINI AI & FILL FORM'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">INCIDENT TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Multi-Vehicle Collision & Fire"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="TRAFFIC_COLLISION">Traffic Collision</option>
                    <option value="CARDIAC_ARREST">Cardiac Arrest</option>
                    <option value="STROKE_NEURO">Stroke / Neurological</option>
                    <option value="RESPIRATORY_DISTRESS">Respiratory Distress</option>
                    <option value="INDUSTRIAL_FIRE">Industrial Fire</option>
                    <option value="HAZMAT_EXPOSURE">Hazardous Materials (HAZMAT)</option>
                    <option value="PEDIATRIC_TRAUMA">Pediatric Trauma</option>
                    <option value="FALL_INJURY">Fall / Musculoskeletal Injury</option>
                    <option value="OTHER">Other Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">REPORTING CHANNEL</label>
                  <select
                    className="form-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="OPERATOR_MANUAL">Operator Console</option>
                    <option value="911_VOICE">911 Voice Call</option>
                    <option value="CCTV_AI">Smart City CCTV AI</option>
                    <option value="IOT_SENSOR">IoT Crash Sensor</option>
                    <option value="CITIZEN_MOBILE">Citizen Mobile SOS</option>
                    <option value="VOICE_REPORT">Voice Audio Report</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">DETAILED CLINICAL DESCRIPTION *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe number of victims, trap status, conscious state, bleeding, or hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">INCIDENT LOCATION / ADDRESS *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Downtown Expressway (Mile 14.2)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">CALLER / REPORTING AGENT</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Officer Miller / Automated Feed"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CALLBACK PHONE</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1 (415) 555-0199"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Clinical Decision Support Disclaimer */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--outline)',
                  fontFamily: 'var(--font-telemetry)',
                  background: 'var(--surface-container-lowest)',
                  padding: '8px 12px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-tactical)',
                }}
              >
                ⚖️ <strong>Decision Support:</strong> Triage calculation and recommendations assist licensed dispatchers and paramedics. Not an automated medical diagnosis.
              </div>

              <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'transparent' }}>
                <button
                  type="button"
                  className="btn-hud-tactical"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-command-gold"
                  disabled={isSubmitting}
                  style={{ width: 'auto', padding: '8px 20px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                  <span>{isSubmitting ? 'DISPATCHING...' : 'REGISTER & RUN AI TRIAGE'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
