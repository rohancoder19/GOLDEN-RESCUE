import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Stitch Tactical Markers
const createTacticalIncidentMarker = (incident) => {
  const isCritical = incident.severity === 'CRITICAL';
  const isHigh = incident.severity === 'HIGH';
  const color = isCritical ? '#ff4d5a' : isHigh ? '#ffbd58' : '#00d4ff';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
      ${isCritical ? `
        <span style="position: absolute; top: -6px; width: 44px; height: 44px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.5s infinite;"></span>
        <span style="position: absolute; top: 0px; width: 32px; height: 32px; border-radius: 50%; background: ${color}; opacity: 0.55; animation: pulse 2s infinite;"></span>
      ` : ''}
      <div style="position: relative; width: ${isCritical ? '26px' : '22px'}; height: ${isCritical ? '26px' : '22px'}; border-radius: 50%; background: ${color}; color: #0a1422; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${color}; border: 2px solid #f4f7fb;">
        <span style="font-family: 'Material Symbols Outlined'; font-size: 14px; font-weight: bold; line-height: 1;">priority_high</span>
      </div>
      <div style="margin-top: 4px; background: rgba(5, 14, 28, 0.92); border: 1px solid ${color}; border-radius: 3px; padding: 2px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); white-space: nowrap; text-align: center;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: ${color}; line-height: 1.1;">
          ${incident.incidentId || 'INC'}
        </div>
        <div style="font-family: 'Inter', sans-serif; font-size: 9px; color: #859398; line-height: 1;">
          ${incident.location?.address ? incident.location.address.slice(0, 18) : 'Sector Alpha'}
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [60, 60],
    iconAnchor: [30, 15],
  });
};

const createTacticalAmbulanceMarker = (ambulance) => {
  const callsign = ambulance.callsign || ambulance.vehicleId || 'AMB';
  const speed = ambulance.location?.speedKmh || 48;
  const isEnRoute = ambulance.status === 'EN_ROUTE' || ambulance.status === 'TRANSPORTING';

  const html = `
    <div style="display: flex; align-items: center; gap: 4px; background: rgba(5, 14, 28, 0.92); border: 1px solid #00d4ff; border-radius: 9999px; padding: 3px 8px; box-shadow: 0 0 12px rgba(0, 212, 255, 0.45); cursor: pointer; user-select: none;">
      <span style="position: relative; display: flex; width: 7px; height: 7px;">
        ${isEnRoute ? '<span style="position: absolute; inset: 0; border-radius: 50%; background: #00d4ff; opacity: 0.75; animation: ping 1.5s infinite;"></span>' : ''}
        <span style="position: relative; width: 7px; height: 7px; border-radius: 50%; background: #00d4ff;"></span>
      </span>
      <span style="font-family: 'Material Symbols Outlined'; font-size: 14px; color: #00d4ff; line-height: 1;">airport_shuttle</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #00d4ff;">
        ${callsign}
      </span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; color: #ffbd58;">
        ${speed} km/h
      </span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [110, 30],
    iconAnchor: [55, 15],
  });
};

const createTacticalHospitalMarker = (hospital) => {
  const beds = hospital.capacity?.availableBeds ?? 8;
  const isTrauma = hospital.traumaLevel?.includes('1');

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
      <div style="width: 28px; height: 28px; border-radius: 6px; background: ${isTrauma ? '#00d4ff' : '#16202f'}; color: ${isTrauma ? '#050e1c' : '#00d4ff'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(0, 212, 255, 0.45); border: 1px solid #00d4ff;">
        <span style="font-family: 'Material Symbols Outlined'; font-size: 18px; font-weight: bold; line-height: 1;">local_hospital</span>
      </div>
      <div style="margin-top: 3px; background: rgba(5, 14, 28, 0.92); border: 1px solid #1e3a5f; border-radius: 3px; padding: 2px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); text-align: center; white-space: nowrap;">
        <span style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5px; font-weight: 600; color: #f4f7fb; display: block; line-height: 1.1;">
          ${hospital.name ? hospital.name.split(' ')[0] : 'Central'} (L1)
        </span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 700; color: #00d4ff; line-height: 1;">
          ${beds} Beds Ready
        </span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [90, 52],
    iconAnchor: [45, 14],
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
  layers = { incidents: true, fleet: true, hospitals: true, hotspots: true, routes: true },
}) {
  const defaultCenter = [37.7749, -122.4194]; // San Francisco Core
  const rawCenter = selectedIncident?.location?.coordinates || defaultCenter;
  const mapCenter = Array.isArray(rawCenter) && rawCenter.length === 2 && !isNaN(rawCenter[0]) && !isNaN(rawCenter[1])
    ? rawCenter
    : defaultCenter;

  // Verified route waypoints from selected incident (never invent fake paths)
  const hasRealRoute =
    selectedIncident?.routeData?.waypoints &&
    Array.isArray(selectedIncident.routeData.waypoints) &&
    selectedIncident.routeData.waypoints.length >= 2;
  const routeWaypoints = hasRealRoute ? selectedIncident.routeData.waypoints : [];

  // Hazard perimeter around selected critical incident
  const hasHazardPerimeter =
    selectedIncident &&
    selectedIncident.severity === 'CRITICAL' &&
    Array.isArray(mapCenter) &&
    mapCenter.length === 2;
  const hazardPerimeter = hasHazardPerimeter
    ? [
        [mapCenter[0] + 0.003, mapCenter[1] - 0.004],
        [mapCenter[0] + 0.005, mapCenter[1] + 0.003],
        [mapCenter[0] - 0.002, mapCenter[1] + 0.005],
        [mapCenter[0] - 0.004, mapCenter[1] - 0.002],
      ]
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#050e1c', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#050e1c' }}
      >
        <MapController center={mapCenter} zoom={selectedIncident ? 14 : 13} />

        {/* Tactical Dark OSM Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="tactical-dark-tiles"
          maxZoom={19}
        />

        {/* Hotspots Risk Buffers */}
        {layers.hotspots &&
          hotspots.map((hs, index) => (
            <Circle
              key={hs.id || hs._id || `hotspot-${index}`}
              center={hs.coordinates}
              radius={hs.radiusMeters || 500}
              pathOptions={{
                color: '#ffbd58',
                fillColor: '#ffbd58',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '3, 6',
              }}
            />
          ))}

        {/* Verified Priority Emergency Corridor Polyline */}
        {layers.routes && hasRealRoute && (
          <Polyline
            positions={routeWaypoints}
            pathOptions={{
              color: '#00d4ff',
              weight: 3.5,
              opacity: 0.9,
              dashArray: '8, 6',
            }}
          />
        )}

        {/* Tactical Hazard Exclusion Perimeter */}
        {layers.routes && hasHazardPerimeter && (
          <Polygon
            positions={hazardPerimeter}
            pathOptions={{
              color: '#ff4d5a',
              fillColor: '#93000a',
              fillOpacity: 0.22,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Tactical Incident Markers */}
        {layers.incidents &&
          incidents.map((inc) => {
            const coords = inc.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={inc.incidentId || inc._id}
                position={coords}
                icon={createTacticalIncidentMarker(inc)}
                eventHandlers={{
                  click: () => onSelectIncident && onSelectIncident(inc),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '2px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>
                      {inc.incidentId} • {inc.severity}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f4f7fb', marginTop: '2px' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#859398', marginTop: '2px' }}>
                      {inc.location?.address}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectIncident && onSelectIncident(inc)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        background: '#00d4ff',
                        color: '#003642',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Focus Incident File →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Tactical Ambulance Fleet Markers */}
        {layers.fleet &&
          ambulances.map((amb) => {
            const coords = amb.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={amb.vehicleId || amb._id}
                position={coords}
                icon={createTacticalAmbulanceMarker(amb)}
              >
                <Popup>
                  <div style={{ padding: '2px', minWidth: '150px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#00d4ff', fontWeight: 700 }}>
                      {amb.callsign || amb.vehicleId}
                    </div>
                    <div style={{ fontSize: '11px', color: '#859398' }}>
                      Status: <strong style={{ color: '#f4f7fb' }}>{amb.status}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#ffbd58', fontFamily: 'JetBrains Mono, monospace' }}>
                      Speed: {amb.location?.speedKmh || 0} km/h • Fuel: {amb.fuelLevel}%
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Tactical Hospital Markers */}
        {layers.hospitals &&
          hospitals.map((hosp) => {
            const coords = hosp.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;

            return (
              <Marker
                key={hosp.hospitalId || hosp._id}
                position={coords}
                icon={createTacticalHospitalMarker(hosp)}
              >
                <Popup>
                  <div style={{ padding: '2px', minWidth: '160px' }}>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: '#f4f7fb', fontWeight: 700 }}>
                      {hosp.name}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00d4ff' }}>
                      {hosp.traumaLevel || 'Level 1 Trauma'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#859398', marginTop: '2px' }}>
                      Available Beds: <strong style={{ color: '#f4f7fb' }}>{hosp.capacity?.availableBeds || 0}</strong> (ICU: {hosp.capacity?.icuAvailable || 0})
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
