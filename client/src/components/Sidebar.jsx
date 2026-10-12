import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  Ambulance as AmbulanceIcon,
  Building2,
  Cpu,
  BarChart3,
  Settings,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export default function Sidebar({ currentView, setView, incidents = [] }) {
  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED')
  ).length;

  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'incidents', label: 'Live Incidents', icon: AlertTriangle, badge: criticalCount },
    { id: 'map', label: 'Emergency Map', icon: MapPin },
    { id: 'fleet', label: 'Ambulance Fleet', icon: AmbulanceIcon },
    { id: 'hospitals', label: 'Hospital Network', icon: Building2 },
    { id: 'ai-decision', label: 'AI Decision Center', icon: Cpu, isNew: true },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Audit', icon: Settings },
  ];

  return (
    <aside className="app-sidebar" style={{ background: '#000000', borderRight: '1px solid rgba(44, 52, 128, 0.4)' }}>
      {/* Brand Identity */}
      <div className="sidebar-brand" style={{ background: 'rgba(44, 52, 128, 0.15)', borderBottom: '1px solid rgba(44, 52, 128, 0.4)' }}>
        <div
          className="brand-icon-wrapper"
          style={{ background: '#2C3480', border: '1px solid #ffffff', boxShadow: '0 0 12px rgba(44, 52, 128, 0.8)' }}
        >
          <ShieldCheck size={20} color="#ffffff" />
        </div>
        <div className="brand-title">
          <span style={{ color: '#ffffff' }}>GOLDEN RESCUE</span>
          <span className="brand-tagline" style={{ color: '#d1d5db' }}>Every Second Matters</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setView(item.id)}
              style={
                isActive
                  ? { background: '#2C3480', borderColor: '#ffffff', color: '#ffffff', boxShadow: '0 0 14px rgba(44, 52, 128, 0.6)' }
                  : { color: '#e2e8f0' }
              }
            >
              <Icon size={18} color={isActive ? '#ffffff' : '#cbd5e1'} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge" title="Critical Incidents Awaiting Dispatch">
                  {item.badge}
                </span>
              )}
              {item.isNew && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#2C3480',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 700,
                  }}
                >
                  AI CORE
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Telemetry Status */}
      <div className="sidebar-footer" style={{ background: '#000000', borderTop: '1px solid rgba(44, 52, 128, 0.4)' }}>
        <div className="system-status-indicator">
          <div className="pulse-dot" style={{ backgroundColor: '#2C3480', boxShadow: '0 0 8px #ffffff' }} />
          <span style={{ color: '#ffffff', fontWeight: 700 }}>REAL-TIME ENGINE LIVE</span>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#94a3b8',
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Radio size={10} color="#2C3480" />
          <span>WS SYNC: 100% OPERATIONAL</span>
        </div>
      </div>
    </aside>
  );
}
