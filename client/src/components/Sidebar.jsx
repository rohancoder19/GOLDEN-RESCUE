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
    <aside className="app-sidebar">
      {/* Brand Identity */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <ShieldCheck size={20} color="#f59e0b" />
        </div>
        <div className="brand-title">
          <span>GOLDEN RESCUE</span>
          <span className="brand-tagline">Every Second Matters</span>
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
            >
              <Icon size={18} />
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
                    color: 'var(--cyan-telemetry)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'var(--cyan-subtle)',
                    border: '1px solid rgba(0,240,255,0.2)',
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
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <div className="pulse-dot" />
          <span>REAL-TIME ENGINE LIVE</span>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Radio size={10} color="#00f0ff" />
          <span>WS SYNC: 100% OPERATIONAL</span>
        </div>
      </div>
    </aside>
  );
}
