import React from 'react';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  onToggleSidebar: () => void;
  onSelectTab?: (tab: TabType) => void;
}

const TAB_TITLES: Record<TabType, string> = {
  home: 'Profil Raka',
  tren: 'Tren Kesejahteraan',
  deadline: 'Deadline Radar',
  fokus: 'Fokus & Distraksi',
  laporan: 'Laporan & Rekomendasi',
  settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleSidebar,
  onSelectTab,
}) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          id="mobileMenuBtn"
          aria-label="Buka Menu"
          onClick={onToggleSidebar}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="header-title" id="pageHeaderTitle">
          {TAB_TITLES[activeTab]}
        </h1>
      </div>

      <div className="header-right">
        {/* Settings button on top like modern mobile apps */}
        <button
          type="button"
          className={`header-settings-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab?.(activeTab === 'settings' ? 'home' : 'settings')}
          aria-label="Pengaturan Sistem"
          title={activeTab === 'settings' ? 'Kembali ke Home' : 'Pengaturan'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
  );
};
