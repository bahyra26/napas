import React, { useState, useEffect } from 'react';
import { pwaService } from '../../services/pwaService';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (message: string, icon?: string) => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [canInstall, setCanInstall] = useState(pwaService.canInstall());
  const [isInstalled, setIsInstalled] = useState(pwaService.isInstalled());
  const [isInstalling, setIsInstalling] = useState(false);

  // Deteksi OS
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const isDesktop = !isIOS && !isAndroid;

  useEffect(() => {
    const unsub = pwaService.onInstallableChange((val) => {
      setCanInstall(val);
      setIsInstalled(pwaService.isInstalled());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const result = await pwaService.promptInstall();
    setIsInstalling(false);

    if (result === 'accepted') {
      onNotify('Aplikasi NAPAS berhasil dipasang ke perangkat Anda! 🎉', '📲');
      onClose();
    } else if (result === 'dismissed') {
      onNotify('Pemasangan aplikasi dibatalkan.', 'ℹ️');
    } else {
      // Browser belum memicu deferred prompt
      onNotify('Gunakan menu browser -> "Install NAPAS" atau "Tambahkan ke Layar Utama".', '💡');
    }
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card pwa-install-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0a5445, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <img
                src="./assets/napas_icon.svg"
                alt="NAPAS"
                style={{ width: '30px', height: '30px' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Pasang Aplikasi NAPAS
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Progressive Web App (PWA) Berstandar Modern
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 0 10px 0' }}>
          {/* Status Badge */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: isInstalled
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(10, 84, 69, 0.08)',
              border: `1px solid ${isInstalled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(10, 84, 69, 0.2)'}`,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>{isInstalled ? '✅' : '📲'}</span>
              <div>
                <strong style={{ fontSize: '0.9rem', color: isInstalled ? '#059669' : '#0a5445' }}>
                  {isInstalled ? 'Aplikasi Sudah Terpasang' : 'Tersedia untuk Perangkat Anda'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  {isInstalled
                    ? 'NAPAS berjalan dalam mode Standalone PWA.'
                    : isDesktop
                    ? 'Dapat dipasang di Windows, macOS, atau Linux.'
                    : isIOS
                    ? 'Dapat dipasang ke Home Screen iPhone / iPad.'
                    : 'Dapat dipasang di HP Android.'}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.06)',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              {isIOS ? 'iOS Safari' : isAndroid ? 'Android' : 'Desktop'}
            </span>
          </div>

          {/* Keunggulan PWA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-bg-light, #f8fafc)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>⚡</div>
              <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--color-text-main, #1e293b)' }}>Akses 1-Klik Instan</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Buka langsung dari Taskbar atau Homescreen tanpa buka browser.</span>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-bg-light, #f8fafc)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>📶</div>
              <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--color-text-main, #1e293b)' }}>Bekerja Offline</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Aplikasi tetap terbuka & responsif meski internet sedang terputus.</span>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-bg-light, #f8fafc)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>🎯</div>
              <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--color-text-main, #1e293b)' }}>Fokus Tanpa Distraksi</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Tampilan aplikasi bersih tanpa address bar atau tab lain.</span>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-bg-light, #f8fafc)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>💾</div>
              <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--color-text-main, #1e293b)' }}>Sangat Ringan</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Hemat ruang memori (&lt; 2 MB) dan otomatis terupdate.</span>
            </div>
          </div>

          {/* Panduan Khusus iOS Safari jika di perangkat Apple */}
          {isIOS && !isInstalled && (
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                marginBottom: '16px',
              }}
            >
              <strong style={{ fontSize: '0.85rem', color: '#1d4ed8', display: 'block', marginBottom: '6px' }}>
                📱 Cara Pasang di iPhone / iPad (Safari):
              </strong>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: '#334155', lineHeight: '1.6' }}>
                <li>Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah atas di bawah layar).</li>
                <li>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen ➕)</strong>.</li>
                <li>Tekan <strong>"Tambah"</strong> di pojok kanan atas. Selesai!</li>
              </ol>
            </div>
          )}

          {/* Panduan Browser Desktop jika prompt otomatis tidak muncul */}
          {isDesktop && !canInstall && !isInstalled && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                marginBottom: '16px',
                fontSize: '0.8rem',
                color: '#92400e',
              }}
            >
              💡 <strong>Tips Browser Desktop (Chrome / Edge / Brave):</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                Klik ikon <strong>Install ⤓</strong> di sebelah kanan bilah alamat (URL bar) browser Anda, atau buka menu titik tiga (⋮) lalu pilih <strong>"Install NAPAS"</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Tutup
          </button>

          {!isInstalled ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleInstallClick}
              disabled={isInstalling}
              style={{
                background: 'linear-gradient(135deg, #0a5445, #10b981)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontWeight: 600,
              }}
            >
              {isInstalling ? (
                <>Memproses...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Pasang Sekarang ke Perangkat</span>
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>✓ Terpasang sebagai PWA</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
