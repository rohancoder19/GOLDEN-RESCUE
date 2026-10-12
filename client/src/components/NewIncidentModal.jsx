import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Send,
  AlertTriangle,
  MapPin,
  FileText,
  User,
  Radio,
} from 'lucide-react';
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
        setActiveTab('manual'); // Switch to manual review so operator can inspect and confirm
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
    if (!title || !description || !address) {
      setErrorMessage('Please provide Title, Description, and Address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title,
        category,
        description,
        location: {
          address,
          coordinates,
          district: 'Metro Operational Sector',
        },
        callerInfo: {
          name: callerName || '911 Reporter',
          phone: callerPhone || '+1 (555) 019-2834',
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
            <Radio size={18} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              REGISTER NEW EMERGENCY INCIDENT
            </span>
          </div>
          <button className="icon-btn-utility" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(10, 17, 32, 0.4)',
            padding: '0 20px',
          }}
        >
          <button
            className={`nav-item ${activeTab === 'manual' ? 'active' : ''}`}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'manual' ? '2px solid var(--cyan-telemetry)' : 'none' }}
            onClick={() => setActiveTab('manual')}
          >
            Manual Operator Input
          </button>
          <button
            className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
            style={{ width: 'auto', borderRadius: '0', borderBottom: activeTab === 'voice' ? '2px solid var(--cyan-telemetry)' : 'none' }}
            onClick={() => setActiveTab('voice')}
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>Voice-to-Dispatch AI</span>
          </button>
        </div>

        {/* Body */}
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

          {activeTab === 'voice' ? (
            /* Voice Reporting Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
              <button
                onClick={toggleRecording}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: isRecording ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 240, 255, 0.15)',
                  border: isRecording ? '2px solid #ef4444' : '2px solid #00f0ff',
                  boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 15px rgba(0, 240, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isRecording ? <MicOff size={32} color="#ef4444" /> : <Mic size={32} color="#00f0ff" />}
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  {isRecording ? 'Listening for Emergency Voice Telemetry...' : 'Click to Speak 911 Call or Enter Transcript'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Web Speech API + Google Gemini 2.5 Flash Clinical Extraction
                </div>
              </div>

              <textarea
                className="form-textarea"
                style={{ width: '100%', minHeight: '100px' }}
                placeholder="Or type/paste 911 call audio transcript here: e.g. 'We have a two-car collision at 4th and King St, one victim unconscious...'"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />

              <button
                className="btn-dispatch"
                onClick={handleParseVoice}
                disabled={isAiParsing || !transcript.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={16} />
                <span>{isAiParsing ? 'AI PARSING TRANSCRIPT WITH GEMINI...' : 'EXTRACT INCIDENT DATA WITH GEMINI'}</span>
              </button>
            </div>
          ) : (
            /* Manual Form Mode */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">INCIDENT TITLE:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Multi-Vehicle Collision with Rollover"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">CATEGORY:</label>
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
                    <option value="HAZMAT_EXPOSURE">Hazmat Exposure</option>
                    <option value="PEDIATRIC_TRAUMA">Pediatric Trauma</option>
                    <option value="FALL_INJURY">Fall Injury</option>
                    <option value="OTHER">Other Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">SOURCE CHANNEL:</label>
                  <select
                    className="form-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="OPERATOR_MANUAL">Operator Manual Entry</option>
                    <option value="911_VOICE">911 Voice Call</option>
                    <option value="CITIZEN_MOBILE">Citizen SOS Beacon</option>
                    <option value="CCTV_AI">CCTV AI Vision Stream</option>
                    <option value="IOT_SENSOR">IoT Infrastructure Sensor</option>
                    <option value="VOICE_REPORT">Voice Speech-to-Dispatch</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">INCIDENT DESCRIPTION & CLINICAL DETAILS:</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detail injuries, entrapment, airway status, conscious state, fire hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">LOCATION ADDRESS / CROSS STREET:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 550 Howard St & 2nd St, San Francisco"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">CALLER NAME:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Officer Daniel Miller"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CALLBACK PHONE:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +1 (415) 555-0199"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-dispatch"
                disabled={isSubmitting}
                style={{ justifyContent: 'center', padding: '12px', marginTop: '6px' }}
              >
                <Send size={16} />
                <span>{isSubmitting ? 'TRIGGERING AI PIPELINE & SAVING...' : 'REGISTER INCIDENT & INITIATE AI TRIAGE'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
