import React from 'react';
import { TabType } from '../../types';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onLogout,
}) => {
  const navItems: { id: TabType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'tren', label: 'Tren & Laporan' },
    { id: 'deadline', label: 'Deadline' },
    { id: 'fokus', label: 'Fokus' },
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
            src="./assets/logo_brain.png"
            alt="NAPAS Logo"
            className="sidebar-logo-img"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = './assets/napas.png';
            }}
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

        {onLogout && (
          <div className="sidebar-bottom-action">
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={() => {
                onLogout();
                onClose();
              }}
              title="Keluar dari akun NAPAS"
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Keluar Akun</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
