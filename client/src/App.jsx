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

// Helper to strictly prevent duplicate items from ever appearing
const deduplicateBy = (list, key) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter((item) => {
    const val = item[key] || item._id;
    if (!val || seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

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
  const [showOriginalOnly, setShowOriginalOnly] = useState(true); // Default to showing original verified data only
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState('SAN_FRANCISCO');
  const [regionCenter, setRegionCenter] = useState([37.7749, -122.4194]);

  // Fetch initial datasets with strict deduplication
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

      setIncidents(deduplicateBy(incRes.incidents || [], 'incidentId'));
      setAmbulances(deduplicateBy(ambRes.ambulances || [], 'vehicleId'));
      setHospitals(deduplicateBy(hospRes.hospitals || [], 'hospitalId'));
      setHotspots(hotRes.hotspots || []);
      setAnalytics(anaRes);
      setAuditLogs(audRes.logs || []);

      // Auto-detect regional sector from active hospital coordinates
      const firstHosp = hospRes.hospitals?.[0];
      if (firstHosp?.location?.coordinates) {
        const [lat, lng] = firstHosp.location.coordinates;
        if (lat > 8 && lat < 36 && lng > 68 && lng < 98) {
          setActiveRegion('DELHI_NCR');
          setRegionCenter([28.6139, 77.2090]);
        } else {
          setActiveRegion('SAN_FRANCISCO');
          setRegionCenter([37.7749, -122.4194]);
        }
      }
    } catch (err) {
      console.warn('Initial data load warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Socket.IO real-time event listeners with deduplication
    const socket = initSocket();

    socket.on('incident:created', (newInc) => {
      setIncidents((prev) =>
        deduplicateBy([newInc, ...prev.filter((i) => i.incidentId !== newInc.incidentId)], 'incidentId')
      );
      if (newInc.severity === 'CRITICAL') playAlertSiren();
    });

    socket.on('incident:updated', (updatedInc) => {
      setIncidents((prev) =>
        deduplicateBy(
          prev.map((i) => (i.incidentId === updatedInc.incidentId ? updatedInc : i)),
          'incidentId'
        )
      );
      setSelectedIncident((current) =>
        current && current.incidentId === updatedInc.incidentId ? updatedInc : current
      );
    });

    socket.on('incident:dispatched', ({ incident: updatedInc, ambulance: updatedAmb }) => {
      setIncidents((prev) =>
        deduplicateBy(
          prev.map((i) => (i.incidentId === updatedInc.incidentId ? updatedInc : i)),
          'incidentId'
        )
      );
      setAmbulances((prev) =>
        deduplicateBy(
          prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a)),
          'vehicleId'
        )
      );
      setSelectedIncident((current) =>
        current && current.incidentId === updatedInc.incidentId ? updatedInc : current
      );
    });

    socket.on('ambulance:location_update', (updatedAmb) => {
      setAmbulances((prev) =>
        deduplicateBy(
          prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a)),
          'vehicleId'
        )
      );
    });

    socket.on('ambulance:status_change', (updatedAmb) => {
      setAmbulances((prev) =>
        deduplicateBy(
          prev.map((a) => (a.vehicleId === updatedAmb.vehicleId ? updatedAmb : a)),
          'vehicleId'
        )
      );
    });

    socket.on('hospital:status_change', (updatedHosp) => {
      setHospitals((prev) =>
        deduplicateBy(
          prev.map((h) => (h.hospitalId === updatedHosp.hospitalId ? updatedHosp : h)),
          'hospitalId'
        )
      );
    });

    socket.on('system:reset', () => {
      fetchAllData();
    });

    socket.on('region:changed', (data) => {
      if (data?.region) {
        setActiveRegion(data.region);
        if (data.center) setRegionCenter(data.center);
        fetchAllData();
      }
    });

    return () => {
      socket.off('incident:created');
      socket.off('incident:updated');
      socket.off('incident:dispatched');
      socket.off('ambulance:location_update');
      socket.off('ambulance:status_change');
      socket.off('hospital:status_change');
      socket.off('system:reset');
      socket.off('region:changed');
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

  const handleSwitchRegion = async (region) => {
    try {
      setIsLoading(true);
      const res = await api.switchRegion(region);
      setActiveRegion(res.region || region);
      if (res.center) setRegionCenter(res.center);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to switch region:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncidentUpdated = (updated) => {
    setIncidents((prev) =>
      deduplicateBy(
        prev.map((i) => (i.incidentId === updated.incidentId ? updated : i)),
        'incidentId'
      )
    );
    setSelectedIncident(updated);
    api.getAnalyticsKPIs().then(setAnalytics).catch(() => {});
  };

  const handleIncidentCreated = (newInc) => {
    setIncidents((prev) =>
      deduplicateBy([newInc, ...prev.filter((i) => i.incidentId !== newInc.incidentId)], 'incidentId')
    );
    setSelectedIncident(newInc);
    api.getAnalyticsKPIs().then(setAnalytics).catch(() => {});
  };

  // Filtered datasets: eliminate duplicates, respect showOriginalOnly, and apply search
  const visibleIncidents = deduplicateBy(
    incidents.filter((i) => {
      if (showOriginalOnly && (i.isSimulated === true || i.dataSource === 'SIMULATED_DEMO')) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          i.incidentId?.toLowerCase().includes(query) ||
          i.title?.toLowerCase().includes(query) ||
          i.location?.address?.toLowerCase().includes(query)
        );
      }
      return true;
    }),
    'incidentId'
  );

  const visibleAmbulances = deduplicateBy(
    ambulances.filter((a) => {
      if (showOriginalOnly && a.isSimulated === true) return false;
      return true;
    }),
    'vehicleId'
  );

  const visibleHospitals = deduplicateBy(
    hospitals.filter((h) => {
      if (showOriginalOnly && h.isSimulated === true) return false;
      return true;
    }),
    'hospitalId'
  );

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          playTelemetryChirp();
          setView(v);
        }}
        incidents={visibleIncidents}
        onOpenNewIncident={() => setIsNewIncidentOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="main-wrapper">
        <TopNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDemoMode={isDemoMode}
          toggleDemoMode={toggleDemoMode}
          showOriginalOnly={showOriginalOnly}
          toggleShowOriginalOnly={() => {
            playTelemetryChirp();
            setShowOriginalOnly(!showOriginalOnly);
          }}
          onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          incidents={visibleIncidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          activeRegion={activeRegion}
          onSwitchRegion={handleSwitchRegion}
        />

        {/* View Switcher */}
        {currentView === 'command-center' && (
          <CommandCenterView
            incidents={visibleIncidents}
            ambulances={visibleAmbulances}
            hospitals={visibleHospitals}
            hotspots={hotspots}
            analytics={analytics}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
            onNavigateView={(v) => {
              playTelemetryChirp();
              setView(v);
            }}
          />
        )}

        {currentView === 'incidents' && (
          <LiveIncidentsView
            incidents={visibleIncidents}
            showOriginalOnly={showOriginalOnly}
            toggleShowOriginalOnly={() => setShowOriginalOnly(!showOriginalOnly)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          />
        )}

        {currentView === 'map' && (
          <EmergencyMapView
            incidents={visibleIncidents}
            ambulances={visibleAmbulances}
            hospitals={visibleHospitals}
            hotspots={hotspots}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        )}

        {currentView === 'fleet' && (
          <AmbulanceFleetView
            ambulances={visibleAmbulances}
            onAmbulanceUpdated={(updated) =>
              setAmbulances((prev) =>
                deduplicateBy(
                  prev.map((a) => (a.vehicleId === updated.vehicleId ? updated : a)),
                  'vehicleId'
                )
              )
            }
          />
        )}

        {currentView === 'hospitals' && (
          <HospitalNetworkView
            hospitals={visibleHospitals}
            onHospitalUpdated={(updated) =>
              setHospitals((prev) =>
                deduplicateBy(
                  prev.map((h) => (h.hospitalId === updated.hospitalId ? updated : h)),
                  'hospitalId'
                )
              )
            }
          />
        )}

        {currentView === 'ai-decision' && (
          <AiDecisionCenterView
            incidents={visibleIncidents}
            hotspots={hotspots}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenNewIncident={() => setIsNewIncidentOpen(true)}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            incidents={visibleIncidents}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            isDemoMode={isDemoMode}
            toggleDemoMode={toggleDemoMode}
            auditLogs={auditLogs}
            onRefreshData={fetchAllData}
            activeRegion={activeRegion}
            onSwitchRegion={handleSwitchRegion}
          />
        )}
      </div>

      {/* Operational Incident Detail & Dispatch Drawer */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          ambulances={visibleAmbulances}
          hospitals={visibleHospitals}
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
