import React from 'react';

interface CalendarSyncCardProps {
  isCalendarConnected: boolean;
  onOpenCalendarModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const CalendarSyncCard: React.FC<CalendarSyncCardProps> = ({
  isCalendarConnected,
  onOpenCalendarModal,
  onSyncNow,
  isSyncing,
}) => {
  return (
    <div className="settings-card calendar-sync-card">
      <div className="settings-card-header">
        <div className="card-header-icon-title">
          <div className="card-icon-badge color-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <h2 className="settings-card-title">Integrasi Google Calendar &amp; Jadwal</h2>
            <p className="settings-card-subtitle">
              Otomatis menyelaraskan kuliah, ujian, dan deadline tugas mahasiswa secara langsung.
            </p>
          </div>
        </div>
      </div>

      <div className="calendar-status-box">
        <div className="status-indicator-row">
          <span className={`status-bubble ${isCalendarConnected ? 'connected' : 'disconnected'}`}></span>
          <div className="status-meta">
            <span className="status-title">
              {isCalendarConnected ? 'Terkoneksi dengan Google Calendar' : 'Belum Terhubung ke Google Calendar'}
            </span>
            <span className="status-description">
              {isCalendarConnected
                ? 'Jadwal kuliah dan deadline tugas Anda disinkronkan langsung ke Radar Beban.'
                : 'Hubungkan akun Google Anda atau tempelkan tautan iCal agar jadwal otomatis terdeteksi.'}
            </span>
          </div>
        </div>

        <div className="calendar-action-buttons">
          <button
            type="button"
            className="btn-calendar-connect"
            onClick={onOpenCalendarModal}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>{isCalendarConnected ? 'Kelola / Ganti Akun Google' : 'Sambungkan Google Calendar'}</span>
          </button>

          {isCalendarConnected && (
            <button
              type="button"
              className="btn-calendar-refresh"
              onClick={onSyncNow}
              disabled={isSyncing}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isSyncing ? 'spin-icon' : ''}
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
