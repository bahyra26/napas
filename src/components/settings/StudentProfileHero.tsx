import React from 'react';
import { StudentProfile } from '../../services/api';

interface StudentProfileHeroProps {
  profile: StudentProfile | null;
  userEmail?: string;
  userName?: string;
  isCalendarConnected: boolean;
  onOpenCalendarModal: () => void;
}

export const StudentProfileHero: React.FC<StudentProfileHeroProps> = ({
  profile,
  userEmail,
  userName,
  isCalendarConnected,
  onOpenCalendarModal,
}) => {
  const displayName = profile?.nama || userName || 'Mahasiswa NAPAS';
  const displayEmail = profile?.email || userEmail || 'mahasiswa@ugm.ac.id';
  const campus = profile?.kampus || 'Universitas Gadjah Mada';
  const major = profile?.jurusan || 'Ilmu Komputer';
  const semester = profile?.semester || 6;

  // Initials for avatar
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'M';

  return (
    <div className="settings-hero-card">
      <div className="hero-left">
        <div className="hero-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="hero-avatar-img" />
          ) : (
            <span className="hero-avatar-initials">{initials}</span>
          )}
        </div>
        <div className="hero-identity">
          <div className="hero-title-row">
            <h1 className="hero-name">{displayName}</h1>
            <span className="hero-semester-badge">Semester {semester}</span>
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
          <span>On-Device SQLite Local-First</span>
        </div>
      </div>
    </div>
  );
};
