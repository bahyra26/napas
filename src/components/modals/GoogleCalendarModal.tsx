import React, { useState } from 'react';
import { googleCalendarService } from '../../services/googleCalendar';
import { authService } from '../../services/supabase';
import { api } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSyncComplete: () => Promise<void>;
  showToast: (msg: string, icon?: string) => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSyncComplete,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'oauth' | 'ical'>('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [icalContent, setIcalContent] = useState('');
  const [icalUrl, setIcalUrl] = useState('');

  if (!isOpen) return null;

  const isConnected = googleCalendarService.isGoogleConnected(userId || undefined);

  // 1. Putuskan Koneksi
  const handleDisconnect = async () => {
    if (!userId) return;
    googleCalendarService.setGoogleConnected(userId, false);
    showToast('Koneksi Google Calendar diputuskan.', 'ℹ️');
    await onSyncComplete();
    onClose();
  };

  // 2. Uji Coba Instan (1-Klik Demo Akademik)
  const handleSampleSync = async () => {
    if (!userId) {
      showToast('ID pengguna tidak ditemukan. Silakan login terlebih dahulu.', '⚠️');
      return;
    }
    setIsLoading(true);
    try {
      const res = await googleCalendarService.syncSampleEvents(userId);
      setIsLoading(false);
      if (res.success) {
        showToast(res.message, '🎉');
        await onSyncComplete();
        onClose();
      } else {
        showToast(res.message, '⚠️');
      }
    } catch {
      setIsLoading(false);
      showToast('Gagal memuat agenda kalender uji coba.', '❌');
    }
  };

  // 3. Impor File / Link iCal
  const handleIcalSync = async () => {
    if (!userId) return;
    if (!icalContent.trim() && !icalUrl.trim()) {
      showToast('Masukkan link iCal atau unggah file .ics Google Calendar Anda.', '⚠️');
      return;
    }

    setIsLoading(true);
    try {
      // Jika URL iCal diisi, kirim ke backend (bebas batasan CORS)
      if (icalUrl.trim() && !icalContent.trim()) {
        try {
          const res = await api.syncGoogleCalendarIcalUrl(userId, icalUrl.trim());
          setIsLoading(false);
          if (res && res.status === 'ok') {
            googleCalendarService.setGoogleConnected(userId, true, res.synced);
            showToast(res.message, '📅');
            await onSyncComplete();
            onClose();
            return;
          }
        } catch (fetchErr: any) {
          setIsLoading(false);
          showToast(`Gagal menyinkronkan link kalender: ${fetchErr?.message || 'URL tidak valid'}`, '⚠️');
          return;
        }
      }

      // Jika konten file .ics diisi
      const res = await googleCalendarService.parseAndSyncIcs(userId, icalContent);
      setIsLoading(false);
      if (res.success) {
        showToast(res.message, '📅');
        await onSyncComplete();
        onClose();
      } else {
        showToast(res.message, '⚠️');
      }
    } catch {
      setIsLoading(false);
      showToast('Gagal memproses kalender iCal.', '❌');
    }
  };

  // File upload handler untuk file .ics
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setIcalContent(text);
        showToast(`File ${file.name} berhasil dibaca!`, '📄');
      }
    };
    reader.readAsText(file);
  };

  // 4. Login Akun Google Asli (OAuth)
  const handleOAuthLogin = async () => {
    showToast('Mengarahkan ke otorisasi Google...', '🔗');
    const res = await authService.signInWithGoogle();
    if (res?.error) {
      showToast(res.error, '⚠️');
    }
  };

  return (
    <div
      className="modal-overlay open"
      id="googleCalendarModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card gcal-modal-card">
        {/* Header Modal */}
        <div className="modal-header gcal-modal-header">
          <div className="gcal-modal-header-brand">
            <svg viewBox="0 0 48 48" width="32" height="32">
              <rect width="40" height="40" x="4" y="4" fill="#FFFFFF" rx="8" />
              <path fill="#1A73E8" d="M36 4H12C7.58 4 4 7.58 4 12v24c0 4.42 3.58 8 8 8h24c4.42 0 8-3.58 8-8V12c0-4.42-3.58-8-8-8z" />
              <path fill="#EA4335" d="M12 4c-4.42 0-8 3.58-8 8v4h40v-4c0-4.42-3.58-8-8-8H12z" />
              <path fill="#FBBC04" d="M4 36c0 4.42 3.58 8 8 8h4V28H4v8z" />
              <path fill="#34A853" d="M36 44c4.42 0 8-3.58 8-8v-8H32v16h4z" />
              <path fill="#1A73E8" d="M16 28h16v16H16z" />
              <text x="24" y="32" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle">
                {new Date().getDate()}
              </text>
            </svg>
            <div>
              <h3>Integrasi Google Calendar</h3>
              <p className="gcal-modal-subtext">Sinkronkan jadwal perkuliahan, deadline tugas, & evaluasi mahasiswa</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Status Indicator Bar */}
        <div className="gcal-modal-status-bar">
          <div className="status-label-group">
            <span className="status-title">Status Koneksi:</span>
            {isConnected ? (
              <span className="gcal-status-badge badge-connected">
                <span className="gcal-pulse-dot dot-online"></span>
                <span>Terhubung</span>
              </span>
            ) : (
              <span className="gcal-status-badge badge-disconnected">
                <span className="gcal-pulse-dot dot-offline"></span>
                <span>Belum Terhubung</span>
              </span>
            )}
          </div>
          {isConnected && (
            <button type="button" className="btn-gcal-disconnect-sm" onClick={handleDisconnect}>
              Putuskan Sambungan
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="gcal-modal-tabs">
          <button
            type="button"
            className={`gcal-tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            ⚡ Uji Coba Instan (1-Klik)
          </button>
          <button
            type="button"
            className={`gcal-tab-btn ${activeTab === 'oauth' ? 'active' : ''}`}
            onClick={() => setActiveTab('oauth')}
          >
            🔗 Login Google (OAuth)
          </button>
          <button
            type="button"
            className={`gcal-tab-btn ${activeTab === 'ical' ? 'active' : ''}`}
            onClick={() => setActiveTab('ical')}
          >
            📋 Impor Link / File (.ics)
          </button>
        </div>

        {/* Tab 1: Uji Coba Instan (Demo Akademik) */}
        {activeTab === 'demo' && (
          <div className="gcal-tab-panel">
            <div className="gcal-feature-box">
              <h4>⚡ Uji Coba Kalender Instan (Demo Akademik)</h4>
              <p>
                Fitur ini memuat <strong>5 agenda perkuliahan, praktikum, tugas, dan ujian semester</strong> secara otomatis ke dalam sistem NAPAS tanpa perlu konfigurasi Google Cloud Console.
              </p>
              <ul style={{ margin: '8px 0 0 16px', fontSize: '12px', color: '#374151' }}>
                <li>Praktikum Jaringan Komputer (Lab 3) — Besok</li>
                <li>Tugas Laporan Analisis Algoritma — 3 Hari Lagi</li>
                <li>Rapat Diskusi Proyek Capstone — 4 Hari Lagi</li>
                <li>UTS Metodologi Penelitian — 6 Hari Lagi</li>
                <li>Workshop AI & Deep Learning Mahasiswa — 8 Hari Lagi</li>
              </ul>
            </div>

            <div className="gcal-modal-actions" style={{ marginTop: 14 }}>
              <button
                type="button"
                className={`btn-gcal-primary ${isLoading ? 'loading' : ''}`}
                onClick={handleSampleSync}
                disabled={isLoading}
                style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Menyinkronkan Agenda...</span>
                  </>
                ) : (
                  '🚀 Muat 5 Agenda Kalender Uji Coba'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Impor iCal / .ics */}
        {activeTab === 'ical' && (
          <div className="gcal-tab-panel">
            <div className="gcal-feature-box">
              <h4>📅 Impor dari Google Calendar (iCal format)</h4>
              <p>
                Anda dapat mengimpor file ekspor <code>.ics</code> dari Google Calendar atau menempelkan link iCal rahasia Anda
                (buka <em>Google Calendar &gt; Setelan Kalender &gt; Integrasikan Kalender &gt; Alamat rahasia dalam format iCal</em>).
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Unggah File Kalender (.ics):</label>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                className="gcal-file-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Atau tempelkan URL Kalender iCal publik / rahasia:</label>
              <input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                className="gcal-textarea"
                style={{ height: 38 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Atau tempelkan isi data iCal (.ics text):</label>
              <textarea
                rows={3}
                value={icalContent}
                onChange={(e) => setIcalContent(e.target.value)}
                placeholder="BEGIN:VCALENDAR ... END:VCALENDAR atau tempelkan data iCal di sini"
                className="gcal-textarea"
              />
            </div>

            <div className="gcal-modal-actions">
              <button
                type="button"
                className={`btn-gcal-primary ${isLoading ? 'loading' : ''}`}
                onClick={handleIcalSync}
                disabled={isLoading || (!icalContent && !icalUrl)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Memproses Kalender...</span>
                  </>
                ) : (
                  '📥 Impor Agenda ke Kalender NAPAS'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: OAuth Google Asli */}
        {activeTab === 'oauth' && (
          <div className="gcal-tab-panel">
            <div className="gcal-feature-box gcal-notice-box">
              <h4>ℹ️ Integrasi Akun Google OAuth</h4>
              <p>
                Metode ini menghubungkan langsung akun Google Anda via login OAuth untuk membaca agenda dari Google Calendar API secara otomatis.
              </p>
              
              <div className="gcal-warning-banner">
                <strong>Catatan Konfigurasi Supabase:</strong>
                <p>
                  Jika muncul error <em>&quot;Unsupported provider: provider is not enabled&quot;</em>, artinya toggle Google Provider di dashboard Supabase belum diaktifkan:
                </p>
                <ol style={{ paddingLeft: 18, margin: '6px 0', fontSize: 11.5 }}>
                  <li>Buka <strong>Supabase Dashboard &gt; Authentication &gt; Providers</strong>.</li>
                  <li>Aktifkan toggle <strong>Google</strong>.</li>
                  <li>Masukkan <strong>Google Client ID</strong> & <strong>Client Secret</strong> dari Google Cloud Console.</li>
                </ol>
                <p style={{ margin: 0, fontSize: 11 }}>
                  💡 <em>Jika Anda belum mengatur Google Cloud Console, gunakan <strong>Tab &quot;⚡ Sinkronisasi Instan&quot;</strong> di atas untuk mencoba fitur ini langsung tanpa hambatan.</em>
                </p>
              </div>
            </div>

            <div className="gcal-modal-actions">
              <button type="button" className="btn-gcal-google-oauth" onClick={handleOAuthLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Masuk dengan Akun Google (OAuth)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
