import React from 'react';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  onToggleSidebar: () => void;
}

const TAB_TITLES: Record<TabType, string> = {
  home: 'Profil Nama',
  tren: 'Tren Kesejahteraan',
  deadline: 'Deadline Radar',
  fokus: 'Ruang Fokus',
  laporan: 'Laporan Mingguan',
  settings: 'Pengaturan Sistem',
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onToggleSidebar }) => {
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
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span>Online</span>
        </div>
      </div>
    </header>
  );
};
