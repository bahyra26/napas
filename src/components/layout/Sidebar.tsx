import React from 'react';
import { TabType } from '../../types';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const navItems: { id: TabType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'tren', label: 'Tren' },
    { id: 'deadline', label: 'Deadline' },
    { id: 'fokus', label: 'Fokus' },
    { id: 'laporan', label: 'Laporan' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        id="sidebarOverlay"
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-logo" title="NAPAS Health & Focus">
          <img
            src="/assets/logo_brain.png"
            alt="NAPAS Logo"
            className="sidebar-logo-img"
          />
          <span className="sidebar-logo-text">NAPAS</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onSelectTab(item.id);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
