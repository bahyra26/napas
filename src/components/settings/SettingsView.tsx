import React, { useState, useEffect } from 'react';
import { api, getStoredUserId, StudentProfile } from '../../services/api';
import { googleCalendarService } from '../../services/googleCalendar';
import { StudentProfileHero } from './StudentProfileHero';
import { AcademicProfileCard } from './AcademicProfileCard';
import { CircadianRhythmCard } from './CircadianRhythmCard';
import { CalendarSyncCard } from './CalendarSyncCard';
import { NotificationPreferencesCard } from './NotificationPreferencesCard';
import { DataManagementCard } from './DataManagementCard';
import { GoogleCalendarModal } from '../modals/GoogleCalendarModal';
import { ManageDataModal } from '../modals/ManageDataModal';

interface SettingsViewProps {
  onNotify: (message: string, icon?: string) => void;
  onProfileUpdated?: (prof: StudentProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNotify, onProfileUpdated }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [userName, setUserName] = useState<string>('Mahasiswa');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);

  // Modals
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const loadData = async () => {
    const userId = getStoredUserId();
    if (!userId) return;

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

          <NotificationPreferencesCard onNotify={onNotify} />

          <DataManagementCard
            profile={profile}
            onOpenManageModal={() => setIsManageModalOpen(true)}
            onNotify={onNotify}
          />
        </div>
      </div>

      {/* Modals */}
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
