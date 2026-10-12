import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Building2,
  Navigation,
  Layers,
  Crosshair,
  Flame,
  Radio,
} from 'lucide-react';

// Center helper component
function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcons using SVGs with #000000, #FFFFFF, #2C3480
const createIncidentIcon = (severity) => {
  const colors = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#2C3480',
    LOW: '#10b981',
  };
  const color = colors[severity] || '#2C3480';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.3; animation: pulseAnimation 1.8s infinite;"></div>
        <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: ${color}; box-shadow: 0 0 10px ${color}; border: 2px solid #ffffff;"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const createAmbulanceIcon = (status, callsign) => {
  const isEnRoute = status === 'EN_ROUTE' || status === 'TRANSPORTING';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: #000000; border: 2px solid #ffffff; border-radius: 8px; box-shadow: 0 0 12px rgba(44, 52, 128, 0.8);">
        <div style="position: absolute; inset: 0; background: #2C3480; border-radius: 6px; opacity: ${isEnRoute ? '0.9' : '0.6'};"></div>
        <svg style="position: relative; z-index: 2;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 10h4M12 8v4M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9h1"/>
          <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

const createHospitalIcon = (traumaLevel, availableBeds) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #000000; border: 2px solid #2C3480; border-radius: 50%; box-shadow: 0 0 12px rgba(44, 52, 128, 0.6);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12M6 12h12"/>
        </svg>
        <span style="position: absolute; bottom: -6px; right: -4px; background: #2C3480; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 99px; border: 1px solid #ffffff;">
          ${availableBeds}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function EmergencyMap({
  incidents = [],
  ambulances = [],
  hospitals = [],
  hotspots = [],
  selectedIncident = null,
  onSelectIncident,
  height = '100%',
}) {
  // Strict deduplication of arrays
  const uniqueIncidents = Array.from(new Map(incidents.map((i) => [i.incidentId, i])).values());
  const uniqueAmbulances = Array.from(new Map(ambulances.map((a) => [a.vehicleId, a])).values());
  const uniqueHospitals = Array.from(new Map(hospitals.map((h) => [h.hospitalId, h])).values());

  // Layer visibility state
  const [layers, setLayers] = useState({
    incidents: true,
    fleet: true,
    hospitals: true,
    hotspots: true,
    routes: true,
  });

  const defaultCenter = [37.7749, -122.4194]; // San Francisco Metro
  const mapCenter = selectedIncident?.location?.coordinates || defaultCenter;

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: '#000000' }}>
      {/* Map Control HUD Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          gap: '6px',
          background: '#000000',
          padding: '6px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          border: '1px solid #2C3480',
          boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
        }}
      >
        <button
          className={`layer-btn ${layers.incidents ? 'active' : ''}`}
          onClick={() => toggleLayer('incidents')}
          title="Toggle Incident Markers"
          style={
            layers.incidents
              ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }
              : { background: 'transparent', color: '#cbd5e1', borderColor: 'rgba(44, 52, 128, 0.4)' }
          }
        >
          <AlertTriangle size={13} color="#ffffff" />
          <span>Incidents ({uniqueIncidents.length})</span>
        </button>
        <button
          className={`layer-btn ${layers.fleet ? 'active' : ''}`}
          onClick={() => toggleLayer('fleet')}
          title="Toggle Fleet Telemetry"
          style={
            layers.fleet
              ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }
              : { background: 'transparent', color: '#cbd5e1', borderColor: 'rgba(44, 52, 128, 0.4)' }
          }
        >
          <AmbulanceIcon size={13} color="#ffffff" />
          <span>Fleet ({uniqueAmbulances.length})</span>
        </button>
        <button
          className={`layer-btn ${layers.hospitals ? 'active' : ''}`}
          onClick={() => toggleLayer('hospitals')}
          title="Toggle Hospital Network"
          style={
            layers.hospitals
              ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }
              : { background: 'transparent', color: '#cbd5e1', borderColor: 'rgba(44, 52, 128, 0.4)' }
          }
        >
          <Building2 size={13} color="#ffffff" />
          <span>Hospitals ({uniqueHospitals.length})</span>
        </button>
        <button
          className={`layer-btn ${layers.hotspots ? 'active' : ''}`}
          onClick={() => toggleLayer('hotspots')}
          title="Toggle Accident Hotspots"
          style={
            layers.hotspots
              ? { background: '#2C3480', color: '#ffffff', borderColor: '#ffffff' }
              : { background: 'transparent', color: '#cbd5e1', borderColor: 'rgba(44, 52, 128, 0.4)' }
          }
        >
          <Flame size={13} color="#ffffff" />
          <span>Hotspots</span>
        </button>
      </div>

      {/* Selected Incident Telemetry Banner */}
      {selectedIncident && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 1000,
            background: '#000000',
            border: '2px solid #2C3480',
            borderRadius: '8px',
            padding: '12px 18px',
            backdropFilter: 'blur(12px)',
            maxWidth: '380px',
            boxShadow: '0 0 20px rgba(44, 52, 128, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff', fontWeight: 800 }}>
              TARGET: {selectedIncident.incidentId}
            </span>
            <span className={`severity-badge badge-${selectedIncident.severity}`} style={{ fontSize: '9px' }}>
              {selectedIncident.severity}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
            {selectedIncident.title}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {selectedIncident.location?.address}
          </div>
          {selectedIncident.assignedAmbulanceCallsign && (
            <div style={{ fontSize: '10px', color: '#ffffff', marginTop: '6px', fontFamily: 'var(--font-mono)', background: '#2C3480', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
              🚑 ASSIGNED: {selectedIncident.assignedAmbulanceCallsign} • ETA: {selectedIncident.routeData?.etaMinutes || 4}m
            </div>
          )}
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#000000' }}
      >
        <MapController center={mapCenter} zoom={selectedIncident ? 14 : 13} />

        {/* Tactical Dark OSM Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="tactical-dark-tiles"
          maxZoom={19}
        />

        {/* Hotspot Circles */}
        {layers.hotspots &&
          hotspots.map((hs) => (
            <Circle
              key={hs.id}
              center={hs.coordinates}
              radius={hs.radiusMeters || 600}
              pathOptions={{
                color: '#2C3480',
                fillColor: '#2C3480',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '4, 6',
              }}
            >
              <Popup>
                <div style={{ color: '#000000', fontSize: '11px' }}>
                  <strong>{hs.name}</strong>
                  <br />
                  Risk: {hs.riskLevel}
                  <br />
                  Est. Incidents/Mo: {hs.historicalIncidentsMonth}
                </div>
              </Popup>
            </Circle>
          ))}

        {/* Active Rescue Route Polyline */}
        {layers.routes && selectedIncident?.routeData?.waypoints?.length > 0 && (
          <Polyline
            positions={selectedIncident.routeData.waypoints}
            pathOptions={{
              color: '#ffffff',
              weight: 4,
              opacity: 0.95,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Deduplicated Incident Markers */}
        {layers.incidents &&
          uniqueIncidents.map((inc) => {
            const coords = inc.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={inc.incidentId}
                position={coords}
                icon={createIncidentIcon(inc.severity)}
                eventHandlers={{
                  click: () => onSelectIncident && onSelectIncident(inc),
                }}
              >
                <Popup>
                  <div style={{ color: '#000000', fontSize: '11px', minWidth: '180px' }}>
                    <strong>{inc.incidentId}</strong>: {inc.title}
                    <br />
                    Severity: <strong>{inc.severity}</strong> | Status: {inc.status}
                    <br />
                    Location: {inc.location?.address}
                    <br />
                    <button
                      onClick={() => onSelectIncident && onSelectIncident(inc)}
                      style={{
                        marginTop: '6px',
                        background: '#2C3480',
                        color: '#ffffff',
                        border: '1px solid #000000',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        width: '100%',
                      }}
                    >
                      Open Operational Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Deduplicated Ambulance Markers */}
        {layers.fleet &&
          uniqueAmbulances.map((amb) => {
            const coords = amb.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={amb.vehicleId}
                position={coords}
                icon={createAmbulanceIcon(amb.status, amb.callsign)}
              >
                <Popup>
                  <div style={{ color: '#000000', fontSize: '11px' }}>
                    <strong>{amb.callsign}</strong> ({amb.vehicleId})
                    <br />
                    Type: {amb.type}
                    <br />
                    Status: <strong>{amb.status}</strong>
                    <br />
                    Speed: {amb.location?.speedKmh || 0} km/h | Fuel: {amb.fuelLevel}%
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Deduplicated Hospital Markers */}
        {layers.hospitals &&
          uniqueHospitals.map((hosp) => {
            const coords = hosp.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={hosp.hospitalId}
                position={coords}
                icon={createHospitalIcon(hosp.traumaLevel, hosp.capacity?.availableBeds || 0)}
              >
                <Popup>
                  <div style={{ color: '#000000', fontSize: '11px' }}>
                    <strong>{hosp.name}</strong>
                    <br />
                    Rating: {hosp.traumaLevel}
                    <br />
                    Status: <strong>{hosp.status}</strong>
                    <br />
                    Available Beds: {hosp.capacity?.availableBeds} | ICU Beds: {hosp.capacity?.icuAvailable}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
