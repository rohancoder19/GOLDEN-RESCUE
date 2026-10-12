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
          phone: callerPhone || '+1 (415) 555-0199',
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
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.92)' }}>
      <div
        className="modal-content-card"
        style={{ maxWidth: '640px', background: '#000000', border: '2px solid #2C3480', boxShadow: '0 0 30px rgba(44, 52, 128, 0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: '#000000', borderBottom: '1px solid rgba(44, 52, 128, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#ffffff" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
              REGISTER NEW EMERGENCY INCIDENT (ORIGINAL RECORD)
            </span>
          </div>
          <button className="icon-btn-utility" onClick={onClose} style={{ background: '#000000', border: '1px solid #2C3480' }}>
            <X size={16} color="#ffffff" />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(44, 52, 128, 0.5)',
            background: 'rgba(44, 52, 128, 0.15)',
            padding: '0 20px',
          }}
        >
          <button
            className={`nav-item ${activeTab === 'manual' ? 'active' : ''}`}
            style={{
              width: 'auto',
              borderRadius: '0',
              borderBottom: activeTab === 'manual' ? '2px solid #ffffff' : 'none',
              background: activeTab === 'manual' ? '#2C3480' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setActiveTab('manual')}
          >
            Manual Operator Input
          </button>
          <button
            className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
            style={{
              width: 'auto',
              borderRadius: '0',
              borderBottom: activeTab === 'voice' ? '2px solid #ffffff' : 'none',
              background: activeTab === 'voice' ? '#2C3480' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setActiveTab('voice')}
          >
            <Sparkles size={14} color="#ffffff" />
            <span>Voice-to-Dispatch AI</span>
          </button>
        </div>

        {/* Body */}
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

          {activeTab === 'voice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
              <button
                onClick={toggleRecording}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: isRecording ? 'rgba(239, 68, 68, 0.3)' : '#2C3480',
                  border: isRecording ? '2px solid #ef4444' : '2px solid #ffffff',
                  boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.7)' : '0 0 15px rgba(44, 52, 128, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isRecording ? <MicOff size={32} color="#ffffff" /> : <Mic size={32} color="#ffffff" />}
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {isRecording ? 'Listening for Emergency Voice Audio...' : 'Click to Speak 911 Call or Enter Audio Transcript'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Web Speech API + Google Gemini 2.5 Flash Clinical Extraction
                </div>
              </div>

              <textarea
                className="form-textarea"
                style={{ width: '100%', minHeight: '100px', background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                placeholder="Or type/paste 911 call audio transcript: e.g. 'We have a two-car collision at 4th and King St, one driver unconscious...'"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />

              <button
                className="btn-dispatch"
                onClick={handleParseVoice}
                disabled={isAiParsing || !transcript.trim()}
                style={{ width: '100%', justifyContent: 'center', background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
              >
                <Sparkles size={16} color="#ffffff" />
                <span>{isAiParsing ? 'AI PARSING TRANSCRIPT WITH GEMINI...' : 'EXTRACT INCIDENT DATA WITH GEMINI'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#ffffff' }}>INCIDENT TITLE:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Multi-Vehicle Collision with Rollover"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#ffffff' }}>CATEGORY:</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
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
                  <label className="form-label" style={{ color: '#ffffff' }}>SOURCE CHANNEL:</label>
                  <select
                    className="form-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
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
                <label className="form-label" style={{ color: '#ffffff' }}>INCIDENT DESCRIPTION & CLINICAL DETAILS:</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detail injuries, entrapment, airway status, conscious state, hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#ffffff' }}>LOCATION ADDRESS / CROSS STREET:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 550 Howard St & 2nd St, San Francisco"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#ffffff' }}>CALLER NAME:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Officer Daniel Miller"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#ffffff' }}>CALLBACK PHONE:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +1 (415) 555-0199"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    style={{ background: '#000000', border: '1px solid #2C3480', color: '#ffffff' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-dispatch"
                disabled={isSubmitting}
                style={{ justifyContent: 'center', padding: '12px', marginTop: '6px', background: '#2C3480', border: '1px solid #ffffff', color: '#ffffff' }}
              >
                <Send size={16} color="#ffffff" />
                <span>{isSubmitting ? 'TRIGGERING AI PIPELINE & SAVING...' : 'REGISTER ORIGINAL INCIDENT & INITIATE AI TRIAGE'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
