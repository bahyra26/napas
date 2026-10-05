import React from 'react';
import { TabType } from '../../types';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi Utama">
      {/* Tab 1: Tren */}
      <button
        type="button"
        className={`bnav-item bnav-link ${activeTab === 'tren' ? 'active' : ''}`}
        onClick={() => onSelectTab('tren')}
        aria-label="Tren"
        aria-current={activeTab === 'tren' ? 'page' : undefined}
      >
        <div className="bnav-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <span className="bnav-label">Tren</span>
        <span className="bnav-indicator" />
      </button>

      {/* Tab 2: Deadline */}
      <button
        type="button"
        className={`bnav-item bnav-link ${activeTab === 'deadline' ? 'active' : ''}`}
        onClick={() => onSelectTab('deadline')}
        aria-label="Deadline"
        aria-current={activeTab === 'deadline' ? 'page' : undefined}
      >
        <div className="bnav-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <span className="bnav-label">Deadline</span>
        <span className="bnav-indicator" />
      </button>

      {/* Tab 3 (CENTER): Home */}
      <button
        type="button"
        className={`bnav-item bnav-link bnav-item-center ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
        aria-label="Home"
        aria-current={activeTab === 'home' ? 'page' : undefined}
      >
        <div className="bnav-center-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className="bnav-label">Home</span>
        <span className="bnav-indicator" />
      </button>

      {/* Tab 4: Fokus */}
      <button
        type="button"
        className={`bnav-item bnav-link ${activeTab === 'fokus' ? 'active' : ''}`}
        onClick={() => onSelectTab('fokus')}
        aria-label="Fokus"
        aria-current={activeTab === 'fokus' ? 'page' : undefined}
      >
        <div className="bnav-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <span className="bnav-label">Fokus</span>
        <span className="bnav-indicator" />
      </button>

      {/* Tab 5: Laporan */}
      <button
        type="button"
        className={`bnav-item bnav-link ${activeTab === 'laporan' ? 'active' : ''}`}
        onClick={() => onSelectTab('laporan')}
        aria-label="Laporan"
        aria-current={activeTab === 'laporan' ? 'page' : undefined}
      >
        <div className="bnav-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <span className="bnav-label">Laporan</span>
        <span className="bnav-indicator" />
      </button>
    </nav>
  );
};
