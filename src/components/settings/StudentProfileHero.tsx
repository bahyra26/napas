import React, { useRef, useState } from 'react';
import { StudentProfile } from '../../services/api';

interface StudentProfileHeroProps {
  profile: StudentProfile | null;
  userEmail?: string;
  userName?: string;
  isCalendarConnected: boolean;
  onOpenCalendarModal: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void>;
  onNotify?: (msg: string, icon?: string) => void;
}

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }

        // Center crop bujur sangkar (rasio 1:1)
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        // Kompresi ke format JPEG 85% untuk efisiensi penyimpanan database
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

export const StudentProfileHero: React.FC<StudentProfileHeroProps> = ({
  profile,
  userEmail,
  userName,
  isCalendarConnected,
  onOpenCalendarModal,
  onUpdateAvatar,
  onNotify,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.nama || userName || 'Mahasiswa NAPAS';
  const displayEmail = profile?.email || userEmail || '';
  const campus = profile?.kampus || 'Perguruan Tinggi';
  const major = profile?.jurusan || 'Mahasiswa';
  const semester = profile?.semester || 1;

  // Initials for avatar
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'M';

  const handleTriggerUpload = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Mohon pilih file gambar yang valid (JPG, PNG, atau WebP)', '⚠️');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onNotify?.('Ukuran file maksimal 10 MB', '⚠️');
      return;
    }

    setIsUploading(true);
    try {
      const base64Url = await processImageFile(file);
      await onUpdateAvatar?.(base64Url);
      onNotify?.('Foto profil berhasil diperbarui!', '📸');
    } catch (err: any) {
      onNotify?.(err?.message || 'Gagal memperbarui foto profil', '❌');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url || isUploading) return;
    if (!window.confirm('Hapus foto profil dan kembali ke inisial nama?')) return;

    setIsUploading(true);
    try {
      await onUpdateAvatar?.('');
      onNotify?.('Foto profil berhasil dihapus.', '🗑️');
    } catch {
      onNotify?.('Gagal menghapus foto profil', '❌');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="settings-hero-card">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
      />

      <div className="hero-left">
        <div className="hero-avatar-wrapper">
          <div
            className={`hero-avatar hero-avatar-clickable ${isUploading ? 'loading' : ''}`}
            onClick={handleTriggerUpload}
            title="Klik untuk mengganti foto profil"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="hero-avatar-img" />
            ) : (
              <span className="hero-avatar-initials">{initials}</span>
            )}

            {isUploading && (
              <div className="hero-avatar-loading-overlay">
                <svg className="hero-spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
                </svg>
              </div>
            )}
          </div>

          {/* Tombol Kamera Kecil */}
          <button
            type="button"
            className="hero-avatar-camera-btn"
            onClick={handleTriggerUpload}
            title="Pilih foto profil baru"
            disabled={isUploading}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
        </div>

        <div className="hero-identity">
          <div className="hero-title-row">
            <h1 className="hero-name">{displayName}</h1>
            <span className="hero-semester-badge">Semester {semester}</span>
            {profile?.avatar_url && (
              <button
                type="button"
                className="hero-remove-avatar-btn"
                onClick={handleRemoveAvatar}
                title="Hapus foto profil"
                disabled={isUploading}
              >
                Hapus Foto
              </button>
            )}
          </div>
          <p className="hero-subtext">
            {major} · {campus}
          </p>
          <p className="hero-email-text">{displayEmail}</p>
        </div>
      </div>

      <div className="hero-right">
        {/* Google Calendar status pill */}
        <div
          className={`hero-status-pill ${isCalendarConnected ? 'connected' : 'disconnected'}`}
          onClick={onOpenCalendarModal}
          title="Klik untuk mengelola koneksi Google Calendar"
        >
          <span className="status-dot"></span>
          <span className="status-label">
            {isCalendarConnected ? 'Google Calendar Terhubung' : 'Google Calendar Belum Terhubung'}
          </span>
          <button type="button" className="hero-pill-action-btn">
            {isCalendarConnected ? 'Kelola' : 'Sambungkan'}
          </button>
        </div>

        {/* Local Security Badge */}
        <div className="hero-security-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Penyimpanan Aman &amp; Privat</span>
        </div>
      </div>
    </div>
  );
};
