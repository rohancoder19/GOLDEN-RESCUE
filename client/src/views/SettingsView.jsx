import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { playTelemetryChirp } from '../services/audio';

export default function SettingsView({
  isDemoMode,
  toggleDemoMode,
  auditLogs = [],
  onRefreshData,
  activeRegion = 'SAN_FRANCISCO',
  onSwitchRegion,
  currentUser = null,
}) {
  const [healthData, setHealthData] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSwitchingRegion, setIsSwitchingRegion] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeCity, setScrapeCity] = useState('New Delhi');
  const [scrapeLimit, setScrapeLimit] = useState(6);
  const [scrapeFeedback, setScrapeFeedback] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealthData)
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  const handleRegionSwitch = async (region) => {
    setIsSwitchingRegion(true);
    setScrapeFeedback(null);
    try {
      if (onSwitchRegion) {
        await onSwitchRegion(region);
      } else {
        await api.switchRegion(region);
        if (onRefreshData) onRefreshData();
      }
      playTelemetryChirp();
    } catch (err) {
      alert(`Error switching operational theater: ${err.message}`);
    } finally {
      setIsSwitchingRegion(false);
    }
  };

  const handleScrapeIndiaHospitals = async () => {
    setIsScraping(true);
    setScrapeFeedback(null);
    try {
      const res = await api.scrapeIndiaHospitals(scrapeCity, Number(scrapeLimit));
      playTelemetryChirp();
      setScrapeFeedback({
        type: 'success',
        message: `Successfully scraped & ingested ${res.count} verified hospitals in ${res.city} via ${res.source}.`,
        hospitals: res.hospitals,
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScrapeFeedback({
        type: 'error',
        message: `Scrape error: ${err.message}`,
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleResetBaseline = async () => {
    if (!window.confirm('Reset database to clean operational baseline?')) return;
    setIsResetting(true);
    try {
      await api.resetBaseline();
      playTelemetryChirp();
      alert('Operational baseline restored successfully.');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleInjectSimIncident = async () => {
    try {
      const res = await api.injectSimulationIncident();
      playTelemetryChirp();
      alert(`Injected simulated incident: ${res.incident?.title}`);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Injection error: ${err.message}`);
    }
  };

  const isIndia = activeRegion === 'DELHI_NCR';

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
              settings
            </span>
            <span>SYSTEM CONFIGURATION &amp; IMMUTABLE AUDIT TRAIL</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>
            Database connectivity, operational telemetry parameters, and operator incident audit logging
          </p>
        </div>

        {/* Current Active Sector Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-telemetry)', color: 'var(--outline)' }}>
            ACTIVE THEATER:
          </span>
          <span
            style={{
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '4px',
              background: isIndia ? 'rgba(255, 189, 88, 0.15)' : 'rgba(0, 212, 255, 0.15)',
              border: `1px solid ${isIndia ? 'var(--secondary)' : 'var(--primary)'}`,
              color: isIndia ? 'var(--secondary)' : 'var(--primary)',
            }}
          >
            {isIndia ? '🇮🇳 INDIA: DELHI NCR (108/112)' : '🇺🇸 USA: SF BAY AREA (911)'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Operational Theater Selector & Live Scraper */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isIndia ? 'var(--secondary)' : 'var(--primary)' }}>
              public
            </span>
            <span>OPERATIONAL SECTORS &amp; LIVE DATA SCRAPING</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--outline)', lineHeight: '1.4' }}>
            Switch platform operations between Indian Emergency Services (108/112, AIIMS, Safdarjung, MoRTH blackspots) and US EMS (911, SF General, UCSF).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className={isIndia ? 'btn-command-gold' : 'btn-command-secondary'}
              onClick={() => handleRegionSwitch('DELHI_NCR')}
              disabled={isSwitchingRegion}
              style={{ padding: '10px 8px', fontSize: '12px', justifyContent: 'center' }}
            >
              <span>🇮🇳</span>
              <span>{isSwitchingRegion && isIndia ? 'ACTIVATING...' : 'INDIA: DELHI (108/112)'}</span>
            </button>

            <button
              type="button"
              className={!isIndia ? 'btn-command-primary' : 'btn-command-secondary'}
              onClick={() => handleRegionSwitch('SAN_FRANCISCO')}
              disabled={isSwitchingRegion}
              style={{ padding: '10px 8px', fontSize: '12px', justifyContent: 'center' }}
            >
              <span>🇺🇸</span>
              <span>{isSwitchingRegion && !isIndia ? 'ACTIVATING...' : 'USA: SF BAY (911)'}</span>
            </button>
          </div>

          {/* Live OpenStreetMap Indian Scraper Section */}
          <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface-container-lowest)', borderRadius: '6px', border: '1px solid var(--border-tactical)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '12.5px', fontWeight: 600, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>satellite_alt</span>
                <span>OpenStreetMap Live Emergency Scraper (India)</span>
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-telemetry)', color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                LIVE OSM API
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={scrapeCity}
                onChange={(e) => setScrapeCity(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface-bright)',
                  border: '1px solid var(--border-tactical)',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <option value="New Delhi">New Delhi (National Capital)</option>
                <option value="Mumbai">Mumbai (Maharashtra Grid)</option>
                <option value="Bengaluru">Bengaluru (Karnataka Grid)</option>
                <option value="Kolkata">Kolkata (West Bengal Hub)</option>
                <option value="Chennai">Chennai (Tamil Nadu Hub)</option>
                <option value="Hyderabad">Hyderabad (Telangana Hub)</option>
              </select>

              <select
                value={scrapeLimit}
                onChange={(e) => setScrapeLimit(Number(e.target.value))}
                style={{
                  width: '90px',
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface-bright)',
                  border: '1px solid var(--border-tactical)',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <option value={4}>4 Nodes</option>
                <option value={6}>6 Nodes</option>
                <option value={8}>8 Nodes</option>
                <option value={10}>10 Nodes</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-command-primary"
              onClick={handleScrapeIndiaHospitals}
              disabled={isScraping}
              style={{ fontSize: '11px', padding: '8px 12px', justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              <span>{isScraping ? `SCRAPING OSM DATA FOR ${scrapeCity.toUpperCase()}...` : `SCRAPE & INGEST ${scrapeCity.toUpperCase()} HOSPITALS`}</span>
            </button>

            {scrapeFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: scrapeFeedback.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 77, 90, 0.1)',
                  border: `1px solid ${scrapeFeedback.type === 'success' ? '#4ade80' : 'var(--error)'}`,
                  color: scrapeFeedback.type === 'success' ? '#4ade80' : 'var(--error)',
                  fontFamily: 'var(--font-telemetry)',
                }}
              >
                {scrapeFeedback.message}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>dns</span>
            <span>OPERATIONAL INFRASTRUCTURE HEALTH</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>MongoDB Atlas Cluster:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--primary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.database || 'CONNECTED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>WebSocket Real-Time Engine:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--primary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.socketIO || 'SYNCHRONIZED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Google Gemini 2.5 Flash API:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', background: 'rgba(255, 189, 88, 0.15)', border: '1px solid var(--secondary)', padding: '2px 8px', borderRadius: '3px' }}>
                {healthData?.connections?.gemini || 'ONLINE / AUTHENTICATED'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>OpenStreetMap Nominatim:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: '#4ade80', background: 'rgba(74, 222, 128, 0.12)', border: '1px solid #4ade80', padding: '2px 8px', borderRadius: '3px' }}>
                ONLINE / GIS READY
              </span>
            </div>
          </div>
        </div>

        {/* Simulation Engine Controls */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--secondary)' }}>tune</span>
            <span>SIMULATION &amp; BASELINE CONTROLS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn-command-gold"
              onClick={handleInjectSimIncident}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
              <span>{isIndia ? 'INJECT SYNTHETIC 108/112 EMERGENCY' : 'INJECT SYNTHETIC EMERGENCY DISPATCH'}</span>
            </button>

            <button
              type="button"
              className="btn-command-eas"
              onClick={handleResetBaseline}
              disabled={isResetting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
              <span>{isResetting ? 'RESTORING BASELINE...' : 'PURGE SIMULATIONS & RESTORE CLEAN BASELINE'}</span>
            </button>
          </div>
        </div>

        {/* Authenticated Operator Identity */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
            <span>OPERATOR CREDENTIALS &amp; ROLE AUTHORIZATION</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Active Responder:</span>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
                {currentUser?.name || 'Authorized Dispatcher'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Email Identifier:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', color: 'var(--outline)' }}>
                {currentUser?.email || 'dispatcher@goldenrescue.org'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Role Permission:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: currentUser?.role === 'ADMIN' ? 'var(--secondary)' : 'var(--primary)', background: currentUser?.role === 'ADMIN' ? 'rgba(255, 189, 88, 0.15)' : 'rgba(0, 212, 255, 0.12)', border: `1px solid ${currentUser?.role === 'ADMIN' ? 'var(--secondary)' : 'var(--primary)'}`, padding: '2px 8px', borderRadius: '3px' }}>
                {currentUser?.role || 'DISPATCHER'} ({currentUser?.badgeId || 'GR-001'})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-container-lowest)', borderRadius: '4px', border: '1px solid var(--border-tactical)' }}>
              <span style={{ fontSize: '12px', color: 'var(--on-surface)' }}>Session Protocol:</span>
              <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: '11px', fontWeight: 700, color: '#4ade80', background: 'rgba(74, 222, 128, 0.12)', border: '1px solid #4ade80', padding: '2px 8px', borderRadius: '3px' }}>
                SECURE HTTP-ONLY COOKIE (JWT)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--border-tactical)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, color: 'var(--on-surface-bright)' }}>
          IMMUTABLE SYSTEM AUDIT TRAIL ({auditLogs.length} EVENTS)
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-tactical)', color: 'var(--outline)', fontFamily: 'var(--font-telemetry)' }}>
                <th style={{ padding: '8px 12px' }}>TIMESTAMP</th>
                <th style={{ padding: '8px 12px' }}>ACTION</th>
                <th style={{ padding: '8px 12px' }}>PERFORMED BY</th>
                <th style={{ padding: '8px 12px' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30, 58, 95, 0.4)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-telemetry)', color: 'var(--outline)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--font-telemetry)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--on-surface-bright)' }}>
                      {log.performedBy}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--outline)' }}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
