import React, { useState, useEffect } from 'react';
import {
  INITIAL_INTERVENTION_SETTINGS,
  INITIAL_SENSOR_PERMISSIONS,
  INITIAL_USER_PROFILE,
  INITIAL_WHITELIST_APPS,
} from '../../data/mockData';
import {
  InterventionSettingItem,
  SensorPermissionItem,
  UserProfileInfo,
} from '../../types';
import { PrivacyBanner } from './PrivacyBanner';
import { SensorPermissionCard } from './SensorPermissionCard';
import { InterventionSettingsCard } from './InterventionSettingsCard';
import { FocusAppsCard } from './FocusAppsCard';
import { DataAccountCard } from './DataAccountCard';
import { AddAppModal } from '../modals/AddAppModal';
import { ThresholdModal } from '../modals/ThresholdModal';
import { ProfileModal } from '../modals/ProfileModal';
import { api, getStoredUserId } from '../../services/api';

interface SettingsViewProps {
  onNotify: (message: string, icon?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNotify }) => {
  const [sensors, setSensors] = useState<SensorPermissionItem[]>(INITIAL_SENSOR_PERMISSIONS);
  const [interventions, setInterventions] = useState<InterventionSettingItem[]>(INITIAL_INTERVENTION_SETTINGS);
  const [thresholdMinutes, setThresholdMinutes] = useState(5);
  const [whitelistApps, setWhitelistApps] = useState<string[]>(INITIAL_WHITELIST_APPS);
  const [userProfile, setUserProfile] = useState<UserProfileInfo>(INITIAL_USER_PROFILE);

  // Modal states
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isThresholdOpen, setIsThresholdOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const userId = getStoredUserId();
      if (!userId) return;

      const user = await api.getUser(userId);
      if (user) {
        setUserProfile({
          name: user.nama,
          email: user.email,
          role: 'Mahasiswa',
        });
        setSensors((prev) =>
          prev.map((s) => {
            if (s.id === 'sensor-camera') {
              return { ...s, enabled: user.consent_camera };
            }
            if (s.id === 'sensor-window') {
              return { ...s, enabled: user.consent_window };
            }
            return s;
          })
        );
      }
    }

    loadUserData();
  }, []);

  const handleToggleSensor = async (id: string) => {
    const target = sensors.find((s) => s.id === id);
    if (!target) return;

    const newState = !target.enabled;
    setSensors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: newState } : s))
    );

    onNotify(
      `${target.title} sekarang ${newState ? 'diaktifkan' : 'dinonaktifkan'}.`,
      newState ? '🔒' : '⚪'
    );

    const userId = getStoredUserId();
    if (userId) {
      if (id === 'sensor-camera') {
        await api.updateUser(userId, { consent_camera: newState });
      } else if (id === 'sensor-window') {
        await api.updateUser(userId, { consent_window: newState });
      }
    }
  };

  const handleToggleIntervention = (id: string) => {
    setInterventions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.enabled;
          onNotify(
            `${item.title} ${newState ? 'diaktifkan' : 'dinonaktifkan'}.`,
            newState ? '✅' : '⏸️'
          );
          return { ...item, enabled: newState };
        }
        return item;
      })
    );
  };

  const handleSaveThreshold = (minutes: number) => {
    setThresholdMinutes(minutes);
    onNotify(`Batas distraksi diperbarui menjadi ${minutes} menit.`, '⏱️');
  };

  const handleAddApp = (appName: string) => {
    if (whitelistApps.includes(appName)) {
      onNotify(`${appName} sudah ada di daftar aplikasi fokus.`, '⚠️');
      return;
    }
    setWhitelistApps((prev) => [...prev, appName]);
    onNotify(`"${appName}" berhasil ditambahkan ke whitelist fokus.`, '🎯');
  };

  const handleRemoveApp = (appName: string) => {
    setWhitelistApps((prev) => prev.filter((app) => app !== appName));
    onNotify(`"${appName}" dihapus dari whitelist.`, '🗑️');
  };

  const handleExportData = () => {
    const exportPayload = {
      user: userProfile,
      sensors,
      interventions,
      thresholdMinutes,
      whitelistApps,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `napas-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Data berhasil diekspor ke format JSON!', '📥');
  };

  const handleManageData = () => {
    onNotify('Fitur manajemen penghapusan data aman siap digunakan.', '🛡️');
  };

  const handleSaveProfile = async (updated: UserProfileInfo) => {
    setUserProfile(updated);
    onNotify(`Profil ${updated.name} berhasil diperbarui!`, '👤');

    const userId = getStoredUserId();
    if (userId) {
      await api.updateUser(userId, {
        nama: updated.name,
        email: updated.email,
      });
    }
  };

  return (
    <div className="settings-container">
      {/* Subtitle */}
      <p className="settings-page-intro">
        Kelola privasi, intervensi, dan pengalaman NAPAS-mu.
      </p>

      {/* Full-width Privacy Banner */}
      <PrivacyBanner
        onLearnMore={() =>
          onNotify(
            'Semua komputasi sensor wajah & aplikasi dijalankan lokal di browser Anda (On-Device).',
            '🛡️'
          )
        }
      />

      {/* Middle Row: Izin Sensor (Left) & Intervensi (Right) */}
      <div className="settings-middle-grid">
        <SensorPermissionCard
          sensors={sensors}
          onToggleSensor={handleToggleSensor}
        />
        <InterventionSettingsCard
          settings={interventions}
          thresholdMinutes={thresholdMinutes}
          onToggleSetting={handleToggleIntervention}
          onEditThreshold={() => setIsThresholdOpen(true)}
        />
      </div>

      {/* Bottom Row: Aplikasi Fokus (Left) & Data/Akun (Right) */}
      <div className="settings-bottom-grid">
        <FocusAppsCard
          apps={whitelistApps}
          onAddApp={() => setIsAddAppOpen(true)}
          onRemoveApp={handleRemoveApp}
          onManageWhitelist={() =>
            onNotify(`Terdapat ${whitelistApps.length} aplikasi dalam whitelist produktivitas.`, '📋')
          }
        />
        <DataAccountCard
          user={userProfile}
          lastUpdated="hari ini, 09.22"
          onExportData={handleExportData}
          onManageData={handleManageData}
          onManageProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {/* Modals */}
      <AddAppModal
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onAddApp={handleAddApp}
      />

      <ThresholdModal
        isOpen={isThresholdOpen}
        currentThreshold={thresholdMinutes}
        onClose={() => setIsThresholdOpen(false)}
        onSaveThreshold={handleSaveThreshold}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        user={userProfile}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
};
