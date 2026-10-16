import React, { useState, useEffect } from 'react';
import { pwaService } from '../../services/pwaService';

interface PwaSettingsCardProps {
  onOpenInstallModal: () => void;
  onNotify: (message: string, icon?: string) => void;
}

export const PwaSettingsCard: React.FC<PwaSettingsCardProps> = ({
  onOpenInstallModal,
  onNotify,
}) => {
  const [canInstall, setCanInstall] = useState(pwaService.canInstall());
  const [isInstalled, setIsInstalled] = useState(pwaService.isInstalled());
  const [isOnline, setIsOnline] = useState(pwaService.isOnline());

  useEffect(() => {
    const unsub1 = pwaService.onInstallableChange((val) => {
      setCanInstall(val);
      setIsInstalled(pwaService.isInstalled());
    });
    const unsub2 = pwaService.onOnlineChange((val) => {
      setIsOnline(val);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <div className="settings-card pwa-settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>
        <div className="settings-card-title-group">
          <h3 className="settings-card-title">Aplikasi Mandiri (PWA) &amp; Offline</h3>
          <p className="settings-card-subtitle">
            Instalasi native ke Windows, Mac, Android, dan iPhone dengan dukungan offline penuh
          </p>
        </div>
      </div>

      <div className="settings-card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-bg-light, #f8fafc)',
            border: '1px solid rgba(0,0,0,0.06)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10b981' : '#f59e0b',
                boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              }}
            ></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
              Status Jaringan: {isOnline ? 'Online (Terkoneksi)' : 'Offline (Mode Lokal Aktif)'}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isInstalled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(10, 84, 69, 0.1)',
              color: isInstalled ? '#059669' : '#0a5445',
            }}
          >
            {isInstalled ? '✓ Terpasang sebagai PWA' : canInstall ? 'Siap Dipasang (1-Klik)' : 'Siap Diinstall'}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          NAPAS mendukung teknologi Progressive Web App (PWA). Anda dapat memasangnya langsung ke layar utama HP
          atau Taskbar laptop Anda tanpa melalui toko aplikasi pihak ketiga, hemat kuota, dan dapat diakses saat offline.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenInstallModal}
            style={{
              background: 'linear-gradient(135deg, #0a5445, #10b981)',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              padding: '9px 16px',
              fontWeight: 600,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{isInstalled ? 'Buka Pengaturan PWA' : 'Pasang Aplikasi NAPAS'}</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              onNotify('PWA Service Worker aktif memantau cache offline.', '⚡');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              padding: '9px 14px',
            }}
          >
            <span>Periksa Cache Offline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
