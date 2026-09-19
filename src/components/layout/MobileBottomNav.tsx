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

      {/* Tab 5: Settings */}
      <button
        type="button"
        className={`bnav-item bnav-link ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onSelectTab('settings')}
        aria-label="Settings"
        aria-current={activeTab === 'settings' ? 'page' : undefined}
      >
        <div className="bnav-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>
        <span className="bnav-label">Settings</span>
        <span className="bnav-indicator" />
      </button>
    </nav>
  );
};
