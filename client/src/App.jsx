import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import CommandCenterView from './views/CommandCenterView';
import LiveIncidentsView from './views/LiveIncidentsView';
import EmergencyMapView from './views/EmergencyMapView';
import AmbulanceFleetView from './views/AmbulanceFleetView';
import HospitalNetworkView from './views/HospitalNetworkView';
import AiDecisionCenterView from './views/AiDecisionCenterView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import IncidentDetailModal from './components/IncidentDetailModal';
import NewIncidentModal from './components/NewIncidentModal';
import { api } from './services/api';
import { initSocket } from './services/socket';
import { playAlertSiren, playTelemetryChirp } from './services/audio';

export default function App() {
  const [currentView, setView] = useState('command-center');
  const [incidents, setIncidents] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial datasets
  const fetchAllData = async () => {
    try {
      const [incRes, ambRes, hospRes, hotRes, anaRes, audRes] = await Promise.all([
        api.getIncidents(),
        api.getAmbulances(),
        api.getHospitals(),
        api.getHotspots(),
        api.getAnalyticsKPIs(),
        api.getAuditLogs(),
      ]);

      setIncidents(incRes.incidents || []);
      setAmbulances(ambRes.ambulances || []);
      setHospitals(hospRes.hospitals || []);
      setHotspots(hotRes.hotspots || []);
      setAnalytics(anaRes);
      setAuditLogs(audRes.logs || []);
    } catch (err) {
      console.warn('Initial data load warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Socket.IO real-time event listeners
    const socket = initSocket();

    socket.on('incident:created', (newInc) => {
      setIncidents((prev) => [newInc, ...prev.filter((i) => i.incidentId !== newInc.incidentId)]);
      if (newInc.severity === 'CRITICAL') playAlertSiren();
    });

    socket.on('incident:updated', (updatedInc) => {
      setIncidents((prev) =>
        prev.map((i) => (i.incidentId === updatedInc.incidentId ? updatedInc : i))
      );
      setSelectedIncident((current) =>
        current && current.incidentId === updatedInc.incidentId ? updatedInc : current
      );
    });

    socket.on('incident:dispatched', ({ incident: updatedInc, ambulance: updatedAmb }) => {
      setIncidents((prev) =>
        prev.map((i) => (i.incidentId === updatedInc.incidentId ? updatedInc : i))
      );
      setAmbulances((prev) =>
        prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a))
      );
      setSelectedIncident((current) =>
        current && current.incidentId === updatedInc.incidentId ? updatedInc : current
      );
    });

    socket.on('ambulance:location_update', (updatedAmb) => {
      setAmbulances((prev) =>
        prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a))
      );
    });

    socket.on('ambulance:status_change', (updatedAmb) => {
      setAmbulances((prev) =>
        prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a))
      );
    });

    socket.on('hospital:status_change', (updatedHosp) => {
      setHospitals((prev) =>
        prev.map((h) => (h.hospitalId === updatedHosp.hospitalId ? updatedHosp : h))
      );
    });

    socket.on('system:reset', () => {
      fetchAllData();
    });

    return () => {
      socket.off('incident:created');
      socket.off('incident:updated');
      socket.off('incident:dispatched');
      socket.off('ambulance:location_update');
      socket.off('ambulance:status_change');
      socket.off('hospital:status_change');
      socket.off('system:reset');
    };
  }, []);

  const toggleDemoMode = async () => {
    try {
      const next = !isDemoMode;
      await api.toggleSimulation(next);
      setIsDemoMode(next);
    } catch (err) {
      console.warn('Simulation toggle error:', err);
      setIsDemoMode(!isDemoMode);
    }
  };

  const handleIncidentUpdated = (updated) => {
    setIncidents((prev) =>
      prev.map((i) => (i.incidentId === updated.incidentId ? updated : i))
    );
    setSelectedIncident(updated);
    // Refresh analytics KPIs
    api.getAnalyticsKPIs().then(setAnalytics).catch(() => {});
  };

  const handleIncidentCreated = (newInc) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);
    api.getAnalyticsKPIs().then(setAnalytics).catch(() => {});
  };

  // Filtered dataset for global search
  const visibleIncidents = searchQuery.trim()
    ? incidents.filter(
        (i) =>
          i.incidentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.location?.address && i.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : incidents;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          playTelemetryChirp();
          setView(v);
        }}
        incidents={incidents}
      />

      {/* Main Workspace Layout */}
      <div className="main-wrapper">
        <TopNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDemoMode={isDemoMode}
          toggleDemoMode={toggleDemoMode}
          onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          incidents={incidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />

        {/* View Switcher */}
        {currentView === 'command-center' && (
          <CommandCenterView
            incidents={visibleIncidents}
            ambulances={ambulances}
            hospitals={hospitals}
            hotspots={hotspots}
            analytics={analytics}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          />
        )}

        {currentView === 'incidents' && (
          <LiveIncidentsView
            incidents={visibleIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          />
        )}

        {currentView === 'map' && (
          <EmergencyMapView
            incidents={visibleIncidents}
            ambulances={ambulances}
            hospitals={hospitals}
            hotspots={hotspots}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        )}

        {currentView === 'fleet' && (
          <AmbulanceFleetView
            ambulances={ambulances}
            onAmbulanceUpdated={(updated) =>
              setAmbulances((prev) =>
                prev.map((a) => (a.vehicleId === updated.vehicleId ? updated : a))
              )
            }
          />
        )}

        {currentView === 'hospitals' && (
          <HospitalNetworkView
            hospitals={hospitals}
            onHospitalUpdated={(updated) =>
              setHospitals((prev) =>
                prev.map((h) => (h.hospitalId === updated.hospitalId ? updated : h))
              )
            }
          />
        )}

        {currentView === 'ai-decision' && (
          <AiDecisionCenterView
            incidents={incidents}
            hotspots={hotspots}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            incidents={incidents}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            isDemoMode={isDemoMode}
            toggleDemoMode={toggleDemoMode}
            auditLogs={auditLogs}
            onRefreshData={fetchAllData}
          />
        )}
      </div>

      {/* Operational Incident Detail & Dispatch Drawer */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          ambulances={ambulances}
          hospitals={hospitals}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={handleIncidentUpdated}
        />
      )}

      {/* New Incident Registration Modal */}
      {isNewIncidentOpen && (
        <NewIncidentModal
          onClose={() => setIsNewIncidentOpen(false)}
          onIncidentCreated={handleIncidentCreated}
        />
      )}
    </div>
  );
}
