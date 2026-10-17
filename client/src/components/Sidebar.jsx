import React from 'react';

export default function Sidebar({ currentView, setView, incidents = [], onOpenNewIncident }) {
  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && (i.status === 'REPORTED' || i.status === 'TRIAGED' || i.status === 'ON_SCENE' || i.status === 'DISPATCHED')
  ).length;

  const navItems = [
    { id: 'command-center', label: 'Overview / Command Center', icon: 'grid_view' },
    { id: 'incidents', label: 'Live Incidents', icon: 'warning', badge: criticalCount },
    { id: 'map', label: 'Live Incident Map', icon: 'map' },
    { id: 'ai-decision', label: 'Smart Dispatch Center', icon: 'send_time_extension' },
    { id: 'hospitals', label: 'Hospital Network', icon: 'local_hospital' },
    { id: 'fleet', label: 'Responder Tracking', icon: 'near_me' },
    { id: 'emergency-reporting', label: 'Emergency Reporting', icon: 'assignment_late', isAction: true },
    { id: 'analytics', label: 'Analytics & Reports', icon: 'monitoring' },
    { id: 'multi-agent-ai', label: 'Multi-Agent AI Status', icon: 'smart_toy', viewTarget: 'ai-decision' },
  ];

  const handleNavClick = (item) => {
    if (item.isAction) {
      if (onOpenNewIncident) onOpenNewIncident();
      return;
    }
    const target = item.viewTarget || item.id;
    setView(target);
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              local_hospital
            </span>
          </div>
          <div className="brand-title">
            <span className="brand-name">GOLDEN RESCUE</span>
            <span className="brand-tagline">AI EMERGENCY OPS CENTER</span>
          </div>
        </div>

        {/* Section Label */}
        <div className="sidebar-section-header">
          Tactical Ops Matrix
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const activeId = item.viewTarget || item.id;
            const isActive = !item.isAction && currentView === activeId;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {item.icon}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>

                {item.badge > 0 && (
                  <span className="nav-badge" title={`${item.badge} Critical Incidents`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Telemetry Status */}
      <div className="sidebar-footer">
        <div className="telemetry-status-row">
          <span style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>Secure Link</span>
          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>EMERG-BAND 04 (SECURE)</span>
        </div>
        <div className="telemetry-status-row">
          <span style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>Telemetry</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>14ms | 99.98% Up</span>
        </div>
      </div>
    </aside>
  );
}
