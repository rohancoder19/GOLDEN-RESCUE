/**
 * Golden Rescue REST API Client
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request('/auth/me'),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents${query ? `?${query}` : ''}`);
  },
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (payload) =>
    request('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  dispatchIncident: (id, payload) =>
    request(`/incidents/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIncidentStatus: (id, status, note) =>
    request(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  // Fleet
  getAmbulances: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/ambulances${query ? `?${query}` : ''}`);
  },
  updateAmbulanceStatus: (id, status) =>
    request(`/ambulances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Hospitals
  getHospitals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/hospitals${query ? `?${query}` : ''}`);
  },
  updateHospitalCapacity: (id, payload) =>
    request(`/hospitals/${id}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Analytics
  getAnalyticsKPIs: () => request('/analytics/kpis'),

  // AI Innovation
  parseVoiceTranscript: (transcript) =>
    request('/ai/parse-voice', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    }),
  getHotspots: () => request('/ai/hotspots'),
  runWhatIfSimulation: (payload) =>
    request('/ai/simulate-what-if', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit${query ? `?${query}` : ''}`);
  },

  // Simulation Mode Controls
  getSimulationStatus: () => request('/simulation/status'),
  toggleSimulation: (enable) =>
    request('/simulation/toggle', {
      method: 'POST',
      body: JSON.stringify({ enable }),
    }),
  injectSimulationIncident: () =>
    request('/simulation/inject', {
      method: 'POST',
    }),
  resetBaseline: () =>
    request('/simulation/reset', {
      method: 'POST',
    }),
  switchRegion: (region) =>
    request('/simulation/switch-region', {
      method: 'POST',
      body: JSON.stringify({ region }),
    }),
  scrapeIndiaHospitals: (city = 'New Delhi', limit = 6) =>
    request('/simulation/scrape-india', {
      method: 'POST',
      body: JSON.stringify({ city, limit }),
    }),

  // Health
  getHealth: () => request('/health'),
};
