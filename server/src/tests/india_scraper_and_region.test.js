import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { Hospital } from '../models/Hospital.js';
import { Ambulance } from '../models/Ambulance.js';
import { Incident } from '../models/Incident.js';
import { scrapeOsmIndianHospitals, INDIAN_REGIONS } from '../scrapers/indiaEmergencyScraper.js';

test('Indian Emergency Grid & OSM Scraper Test Suite', async (t) => {
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (path, options = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, body: json, text };
  };

  t.after(async () => {
    // Restore clean SF baseline after test suite completes
    await request('/api/simulation/switch-region', {
      method: 'POST',
      body: JSON.stringify({ region: 'SAN_FRANCISCO' }),
    });
    server.close();
  });

  await t.test('Scraper Unit Test: scrapeOsmIndianHospitals returns structured hospital telemetry', async () => {
    const result = await scrapeOsmIndianHospitals('New Delhi', 4);
    assert.ok(result.success, 'Scraper should succeed or fall back gracefully');
    assert.ok(result.hospitals.length > 0, 'Should return at least 1 hospital');
    assert.equal(result.city, 'New Delhi');

    const first = result.hospitals[0];
    assert.ok(first.name, 'Hospital must have a name');
    assert.ok(Array.isArray(first.location.coordinates), 'Coordinates must be array');
    assert.equal(first.location.coordinates.length, 2);

    const [lat, lng] = first.location.coordinates;
    assert.ok(lat > 20 && lat < 32, `Latitude ${lat} should be in Northern India range`);
    assert.ok(lng > 70 && lng < 85, `Longitude ${lng} should be in Northern India range`);
    assert.ok(first.capacity.totalBeds > 0, 'Total beds should be positive');
    assert.ok(first.specialties.length > 0, 'Should define specialties');
  });

  await t.test('POST /api/simulation/switch-region: switches operational theater to DELHI_NCR', async () => {
    const res = await request('/api/simulation/switch-region', {
      method: 'POST',
      body: JSON.stringify({ region: 'DELHI_NCR' }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.region, 'DELHI_NCR');
    assert.equal(res.body.emergencyNumbers.ambulance, '108');
    assert.equal(res.body.emergencyNumbers.national, '112');

    // Verify database contents
    const hospitals = await Hospital.find();
    assert.ok(hospitals.length >= 5, 'Should seed at least 5 premier Indian hospitals');
    const aiims = hospitals.find((h) => h.name.includes('AIIMS'));
    assert.ok(aiims, 'AIIMS Apex Trauma Center must be present');

    const ambulances = await Ambulance.find();
    assert.ok(ambulances.length >= 5, 'Should seed Indian 108/112 ambulance fleet');
    const garuda = ambulances.find((a) => a.callsign.includes('Garuda-108'));
    assert.ok(garuda, 'Garuda-108 ALS vehicle must be in fleet');

    const incidents = await Incident.find();
    assert.ok(incidents.length >= 3, 'Should seed Delhi NCR emergency incidents');
  });

  await t.test('GET /api/ai/hotspots: returns Indian MoRTH accident blackspots when DELHI_NCR is active', async () => {
    const res = await request('/api/ai/hotspots');
    assert.equal(res.status, 200);
    assert.equal(res.body.region, 'DELHI_NCR');
    assert.ok(res.body.hotspots.length >= 3);
    const mukarba = res.body.hotspots.find((h) => h.name.includes('Mukarba Chowk'));
    assert.ok(mukarba, 'Mukarba Chowk NH-44 blackspot must be present in Indian sector');
  });

  await t.test('POST /api/simulation/scrape-india: triggers live scraping and ingests hospitals into MongoDB', async () => {
    const res = await request('/api/simulation/scrape-india', {
      method: 'POST',
      body: JSON.stringify({ city: 'New Delhi', limit: 3 }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.count > 0);
    assert.ok(Array.isArray(res.body.hospitals));
  });

  await t.test('POST /api/simulation/switch-region: switches operational theater back to SAN_FRANCISCO', async () => {
    const res = await request('/api/simulation/switch-region', {
      method: 'POST',
      body: JSON.stringify({ region: 'SAN_FRANCISCO' }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.region, 'SAN_FRANCISCO');

    const hospitals = await Hospital.find();
    const metroGen = hospitals.find((h) => h.name.includes('Metro General'));
    assert.ok(metroGen, 'Metro General Trauma Institute must be restored');
  });
});
