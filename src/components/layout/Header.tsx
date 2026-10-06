import React, { useState, useEffect } from 'react';
import { TabType } from '../../types';
import { focusStore, FocusSessionState } from '../../services/focusSessionStore';

interface HeaderProps {
  activeTab: TabType;
  studentName?: string;
  avatarUrl?: string;
  onToggleSidebar: () => void;
  onSelectTab?: (tab: TabType) => void;
  onSyncCalendar?: () => void;
  isSyncingCalendar?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  studentName = 'Raka',
  avatarUrl,
  onToggleSidebar,
  onSelectTab,
  onSyncCalendar,
  isSyncingCalendar = false,
  onLogout,
}) => {
  const [focusState, setFocusState] = useState<FocusSessionState>(() => focusStore.getState());

  useEffect(() => {
    const unsub = focusStore.subscribe((st) => setFocusState({ ...st }));
    return () => unsub();
  }, []);

  const titles: Record<TabType, string> = {
    home: `Profil ${studentName}`,
    tren: 'Tren Kesejahteraan',
    deadline: 'Deadline Radar',
    fokus: 'Fokus & Distraksi',
    laporan: 'Laporan & Rekomendasi',
    settings: 'Settings & Profil',
  };

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

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
          {titles[activeTab] || 'NAPAS'}
        </h1>

        {/* Global Live Focus Badge */}
        {focusState.isRunning && (
          <div
            className="header-focus-live-badge"
            onClick={() => onSelectTab?.('fokus')}
            title="Sesi fokus sedang berjalan! Klik untuk melihat tab Fokus."
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '12px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              animation: 'pulse 2s infinite',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
              }}
            ></span>
            <span>🎯 {formatMinSec(focusState.secondsRemaining)}</span>
            <span
              style={{
                maxWidth: '120px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                opacity: 0.85,
              }}
            >
              · {focusState.taskName}
            </span>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Tombol Sinkron Google Calendar */}
        {onSyncCalendar && (
          <button
            type="button"
            className={`btn-header-sync ${isSyncingCalendar ? 'syncing' : ''}`}
            onClick={onSyncCalendar}
            title="Sinkronkan Google Calendar"
            disabled={isSyncingCalendar}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isSyncingCalendar ? 'spin-icon' : ''}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="sync-btn-text">
              {isSyncingCalendar ? 'Menyinkronkan...' : 'Google Calendar'}
            </span>
          </button>
        )}

        {/* Profil Mini Avatar / Inisial */}
        <div
          className="header-avatar-badge"
          onClick={() => onSelectTab?.('settings')}
          title={`Profil ${studentName} — Buka Pengaturan`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={studentName} className="header-avatar-img" />
          ) : (
            <span className="header-avatar-initial">{studentName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Settings button */}
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

        {/* Tombol Logout / Ganti Akun */}
        {onLogout && (
          <button
            type="button"
            className="btn-header-logout"
            onClick={onLogout}
            title="Keluar / Ganti Akun"
            aria-label="Logout"
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
          </button>
        )}
      </div>
    </header>
  );
};
