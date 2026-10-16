import React, { useState, useEffect } from 'react';
import { api, getStoredUserId, StudentProfile } from '../../services/api';
import { googleCalendarService } from '../../services/googleCalendar';
import { StudentProfileHero } from './StudentProfileHero';
import { AcademicProfileCard } from './AcademicProfileCard';
import { CircadianRhythmCard } from './CircadianRhythmCard';
import { CalendarSyncCard } from './CalendarSyncCard';
import { NotificationPreferencesCard } from './NotificationPreferencesCard';
import { DataManagementCard } from './DataManagementCard';
import { PwaSettingsCard } from './PwaSettingsCard';
import { GoogleCalendarModal } from '../modals/GoogleCalendarModal';
import { ManageDataModal } from '../modals/ManageDataModal';
import { PwaInstallModal } from '../modals/PwaInstallModal';
import { SkeletonProfile } from '../common/SkeletonLoader';

interface SettingsViewProps {
  onNotify: (message: string, icon?: string) => void;
  onProfileUpdated?: (prof: StudentProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNotify,
  onProfileUpdated,
  theme = 'light',
  onToggleTheme,
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [userName, setUserName] = useState<string>('Mahasiswa');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  const loadData = async () => {
    const userId = getStoredUserId();
    if (!userId) return;

    setIsLoading(true);
    try {
      // 1. Check Google Calendar connection
      setIsCalendarConnected(googleCalendarService.isGoogleConnected(userId));

      // 2. Fetch User & Profile
      const [userData, profileData] = await Promise.all([
        api.getUser(userId),
        api.getProfile(userId),
      ]);

      if (userData) {
        setUserName(userData.nama || 'Mahasiswa');
        setUserEmail(userData.email || '');
      }

      if (profileData) {
        setProfile({
          ...profileData,
          nama: profileData.nama || userData?.nama || 'Mahasiswa',
          email: profileData.email || userData?.email || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Academic Profile
  const handleSaveAcademicProfile = async (updated: Partial<StudentProfile>): Promise<boolean> => {
    const userId = getStoredUserId();
    if (!userId) return false;

    // Update in users table
    if (updated.nama || updated.email) {
      await api.updateUser(userId, {
        nama: updated.nama,
        email: updated.email,
      });
    }

    // Update in profile table
    const res = await api.updateProfile(userId, updated);
    if (res) {
      const merged = { ...(profile || {}), ...updated, ...res } as StudentProfile;
      setProfile(merged);
      if (updated.nama) {
        setUserName(updated.nama);
        localStorage.setItem('napas_user_name', updated.panggilan || updated.nama);
      }
      if (updated.email) setUserEmail(updated.email);
      onProfileUpdated?.(merged);
      return true;
    }
    return false;
  };

  // Save Circadian Rhythm
  const handleSaveCircadianRhythm = async (updated: Partial<StudentProfile>): Promise<boolean> => {
    const userId = getStoredUserId();
    if (!userId) return false;

    const res = await api.updateProfile(userId, updated);
    if (res) {
      setProfile((prev) => (prev ? { ...prev, ...updated } : (updated as StudentProfile)));
      return true;
    }
    return false;
  };

  // Quick Calendar Sync
  const handleQuickSyncCalendar = async () => {
    const userId = getStoredUserId();
    if (!userId) return;

    setIsSyncingCalendar(true);
    try {
      const res = await googleCalendarService.fetchAndSyncEvents(userId);
      if (res && res.success) {
        onNotify(`Sinkronisasi berhasil! ${res.count} agenda Google Calendar diselaraskan.`, '📅');
      } else {
        onNotify(res.message || 'Koneksi kalender memerlukan autentikasi.', 'ℹ️');
        setIsCalendarModalOpen(true);
      }
    } catch {
      onNotify('Koneksi kalender memerlukan autentikasi ulang.', '⚠️');
      setIsCalendarModalOpen(true);
    } finally {
      setIsSyncingCalendar(false);
      setIsCalendarConnected(googleCalendarService.isGoogleConnected(userId));
    }
  };

  const handleClearLocalData = () => {
    localStorage.removeItem('napas_focus_sessions');
    sessionStorage.clear();
    onNotify('Cache dan riwayat sesi lokal berhasil dibersihkan.', '🧹');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetPreferences = async () => {
    const userId = getStoredUserId();
    if (userId) {
      await api.updateProfile(userId, {
        jam_tidur: '23:00',
        jam_bangun: '06:00',
        kronotipe: 'pagi',
        target_fokus_jam: 4.0,
      });
      loadData();
    }
    localStorage.removeItem('napas_notif_burnout');
    localStorage.removeItem('napas_notif_checkin');
    localStorage.removeItem('napas_notif_chime');
    onNotify('Preferensi ritme dan notifikasi berhasil di-reset ke bawaan.', '🔄');
  };

  return (
    <div className="settings-container">
      {/* Intro Subtitle */}
      <p className="settings-page-intro">
        Kelola identitas akademik, ritme waktu belajar, integrasi Google Calendar, dan kedaulatan data Anda.
      </p>

      {isLoading && !profile ? (
        <SkeletonProfile />
      ) : (
        <>
          {/* 1. Hero Banner: Profil Mahasiswa & Status Koneksi */}
          <StudentProfileHero
            profile={profile}
            userName={userName}
            userEmail={userEmail}
            isCalendarConnected={isCalendarConnected}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          />

          {/* 2. Main 2-Column Balanced Grid */}
          <div className="settings-main-grid">
        {/* Kolom Kiri: Identitas Akademik & Ritme Harian */}
        <div className="settings-column">
          <AcademicProfileCard
            initialProfile={profile}
            onSaveProfile={handleSaveAcademicProfile}
            onNotify={onNotify}
          />

          <CircadianRhythmCard
            initialProfile={profile}
            onSaveRhythm={handleSaveCircadianRhythm}
            onNotify={onNotify}
          />
        </div>

        {/* Kolom Kanan: Google Calendar, Notifikasi, & Manajemen Data */}
        <div className="settings-column">
          <CalendarSyncCard
            isCalendarConnected={isCalendarConnected}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            onSyncNow={handleQuickSyncCalendar}
            isSyncing={isSyncingCalendar}
          />

          {/* Tema & Tampilan Visual */}
          <div className="settings-card appearance-card">
            <div className="settings-card-header">
              <div className="card-header-icon-title">
                <div className="card-icon-badge color-yellow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card-title">Tema &amp; Tampilan Visual</h2>
                  <p className="settings-card-subtitle">
                    Pilih mode tampilan siang atau malam untuk kenyamanan mata saat belajar.
                  </p>
                </div>
              </div>
            </div>

            <div className="theme-selector-grid">
              <button
                type="button"
                className={`theme-option-btn ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => theme !== 'light' && onToggleTheme?.()}
              >
                <div className="theme-preview light-preview">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-badge"></div>
                    <div className="preview-line"></div>
                  </div>
                </div>
                <div className="theme-option-label">
                  <span>☀️ Mode Terang (Siang)</span>
                  {theme === 'light' && <span className="theme-active-dot">✓</span>}
                </div>
              </button>

              <button
                type="button"
                className={`theme-option-btn ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => theme !== 'dark' && onToggleTheme?.()}
              >
                <div className="theme-preview dark-preview">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-badge"></div>
                    <div className="preview-line"></div>
                  </div>
                </div>
                <div className="theme-option-label">
                  <span>🌙 Mode Malam (Gelap)</span>
                  {theme === 'dark' && <span className="theme-active-dot">✓</span>}
                </div>
              </button>
            </div>
          </div>

          <NotificationPreferencesCard onNotify={onNotify} />

          {/* PWA & Offline Support Card */}
          <PwaSettingsCard
            onOpenInstallModal={() => setIsPwaModalOpen(true)}
            onNotify={onNotify}
          />

          <DataManagementCard
            profile={profile}
            onOpenManageModal={() => setIsManageModalOpen(true)}
            onNotify={onNotify}
          />
        </div>
      </div>
      </>
      )}

      {/* Modals */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onNotify={onNotify}
      />

      <GoogleCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => {
          setIsCalendarModalOpen(false);
          loadData();
        }}
        userId={getStoredUserId()}
        onSyncComplete={async () => {
          await loadData();
        }}
        showToast={onNotify}
      />

      <ManageDataModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onClearLocalData={handleClearLocalData}
        onResetPreferences={handleResetPreferences}
      />
    </div>
  );
};
