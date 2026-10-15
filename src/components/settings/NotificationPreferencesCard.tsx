import React, { useState } from 'react';

interface NotificationPreferencesCardProps {
  onNotify: (msg: string, icon?: string) => void;
}

export const NotificationPreferencesCard: React.FC<NotificationPreferencesCardProps> = ({
  onNotify,
}) => {
  const [alertBurnout, setAlertBurnout] = useState<boolean>(() => {
    return localStorage.getItem('napas_notif_burnout') !== 'false';
  });

  const [alertCheckIn, setAlertCheckIn] = useState<boolean>(() => {
    return localStorage.getItem('napas_notif_checkin') !== 'false';
  });

  const [alertAudioChime, setAlertAudioChime] = useState<boolean>(() => {
    return localStorage.getItem('napas_notif_chime') !== 'false';
  });

  const handleToggle = (
    key: 'burnout' | 'checkin' | 'chime',
    current: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    label: string
  ) => {
    const nextVal = !current;
    setter(nextVal);
    localStorage.setItem(`napas_notif_${key}`, String(nextVal));
    onNotify(
      `${label} sekarang ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}.`,
      nextVal ? '🔔' : '🔕'
    );
  };

  return (
    <div className="settings-card notification-card">
      <div className="settings-card-header">
        <div className="card-header-icon-title">
          <div className="card-icon-badge color-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div>
            <h2 className="settings-card-title">Preferensi Notifikasi &amp; Peringatan</h2>
            <p className="settings-card-subtitle">
              Atur notifikasi pengingat kesehatan mental dan jadwal belajar Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="notification-items-list">
        {/* Item 1: Peringatan Beban Kritis */}
        <div className="notif-item-row">
          <div className="notif-meta">
            <h4 className="notif-title">Peringatan Beban Kritis (Zona Merah)</h4>
            <p className="notif-desc">
              Kirimkan peringatan dini saat skor burnout harian Anda melampaui ambang batas 60%.
            </p>
          </div>
          <button
            type="button"
            className={`settings-toggle-switch ${alertBurnout ? 'active' : ''}`}
            onClick={() => handleToggle('burnout', alertBurnout, setAlertBurnout, 'Peringatan beban kritis')}
            aria-label="Toggle Peringatan Beban Kritis"
          >
            <span className="toggle-switch-thumb"></span>
          </button>
        </div>

        {/* Item 2: Pengingat Refleksi Sore */}
        <div className="notif-item-row">
          <div className="notif-meta">
            <h4 className="notif-title">Pengingat Refleksi Harian (Sore / Malam)</h4>
            <p className="notif-desc">
              Pemberitahuan lembut setiap pukul 17:00 untuk mencatat suasana hati dan energi harian.
            </p>
          </div>
          <button
            type="button"
            className={`settings-toggle-switch ${alertCheckIn ? 'active' : ''}`}
            onClick={() => handleToggle('checkin', alertCheckIn, setAlertCheckIn, 'Pengingat refleksi')}
            aria-label="Toggle Pengingat Refleksi"
          >
            <span className="toggle-switch-thumb"></span>
          </button>
        </div>

        {/* Item 3: Audio Chime Sesi Fokus */}
        <div className="notif-item-row">
          <div className="notif-meta">
            <h4 className="notif-title">Suara Lonceng Sesi Fokus Selesai</h4>
            <p className="notif-desc">
              Mainkan nada lonceng relaksasi saat waktu Pomodoro atau jeda istirahat tercapai.
            </p>
          </div>
          <button
            type="button"
            className={`settings-toggle-switch ${alertAudioChime ? 'active' : ''}`}
            onClick={() => handleToggle('chime', alertAudioChime, setAlertAudioChime, 'Lonceng sesi fokus')}
            aria-label="Toggle Lonceng Sesi Fokus"
          >
            <span className="toggle-switch-thumb"></span>
          </button>
        </div>
      </div>
    </div>
  );
};
