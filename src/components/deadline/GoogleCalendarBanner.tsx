import React from 'react';

interface GoogleCalendarBannerProps {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncText: string | null;
  syncedCount: number;
  onSync: () => void;
  onConnectGoogle: () => void;
  onAddManualDeadline: () => void;
}

export const GoogleCalendarBanner: React.FC<GoogleCalendarBannerProps> = ({
  isConnected,
  isSyncing,
  lastSyncText,
  syncedCount,
  onSync,
  onConnectGoogle,
  onAddManualDeadline,
}) => {
  return (
    <div className="google-calendar-banner-card">
      <div className="gcal-banner-left">
        {/* Google Calendar Brand Icon */}
        <div className="gcal-logo-wrapper">
          <svg className="gcal-svg-icon" viewBox="0 0 48 48" width="38" height="38">
            <rect width="40" height="40" x="4" y="4" fill="#FFFFFF" rx="8" />
            <path fill="#1A73E8" d="M36 4H12C7.58 4 4 7.58 4 12v24c0 4.42 3.58 8 8 8h24c4.42 0 8-3.58 8-8V12c0-4.42-3.58-8-8-8z" />
            <path fill="#EA4335" d="M12 4c-4.42 0-8 3.58-8 8v4h40v-4c0-4.42-3.58-8-8-8H12z" />
            <path fill="#FBBC04" d="M4 36c0 4.42 3.58 8 8 8h4V28H4v8z" />
            <path fill="#34A853" d="M36 44c4.42 0 8-3.58 8-8v-8H32v16h4z" />
            <path fill="#1A73E8" d="M16 28h16v16H16z" />
            <text
              x="24"
              y="32"
              fill="#FFFFFF"
              fontFamily="system-ui, sans-serif"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
            >
              {new Date().getDate()}
            </text>
          </svg>
        </div>

        {/* Text Details & Status Badge */}
        <div className="gcal-info-content">
          <div className="gcal-title-row">
            <h2 className="gcal-heading">Integrasi Google Calendar</h2>
            {isConnected ? (
              <span className="gcal-status-badge badge-connected" title="Akun Google aktif tersinkronisasi">
                <span className="gcal-pulse-dot dot-online"></span>
                <span>Terhubung</span>
              </span>
            ) : (
              <span className="gcal-status-badge badge-disconnected" title="Hubungkan akun Google untuk impor kalender otomatis">
                <span className="gcal-pulse-dot dot-offline"></span>
                <span>Belum Terhubung</span>
              </span>
            )}
          </div>

          <p className="gcal-subtitle">
            Selaraskan jadwal kuliah, deadline tugas, dan agenda ujian secara real-time dari Google Calendar ke kalender 14 hari NAPAS.
          </p>

          {isConnected && lastSyncText && (
            <div className="gcal-sync-meta">
              <span className="meta-icon">🕒</span>
              <span>Terakhir disinkronkan: <strong>{lastSyncText}</strong></span>
              {syncedCount > 0 && (
                <span className="meta-count"> · {syncedCount} agenda aktif</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="gcal-banner-actions">
        {isConnected ? (
          <button
            type="button"
            className={`btn-gcal-sync ${isSyncing ? 'loading' : ''}`}
            onClick={onSync}
            disabled={isSyncing}
            title="Tarik event terbaru dari Google Calendar"
          >
            <svg
              className={`btn-icon-spin ${isSyncing ? 'spinning' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Kalender'}</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-gcal-connect"
            onClick={onConnectGoogle}
            title="Masuk dengan akun Google untuk mengimpor kalender"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Hubungkan Google Calendar</span>
          </button>
        )}

        {/* Tombol Tambah Deadline Manual */}
        <button
          type="button"
          className="btn-gcal-add-manual"
          onClick={onAddManualDeadline}
          title="Tambah deadline atau tugas baru secara manual"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Deadline</span>
        </button>
      </div>
    </div>
  );
};
