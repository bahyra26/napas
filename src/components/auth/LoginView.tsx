import React, { useState } from 'react';
import { authService } from '../../services/supabase';

interface LoginViewProps {
  onDemoLogin: () => void;
  onCustomLogin?: (name: string, campus: string, major: string) => void;
  onNotify: (message: string, icon?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onDemoLogin,
  onCustomLogin,
  onNotify,
}) => {
  const [loading, setLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCampus, setCustomCampus] = useState('Universitas Gadjah Mada');
  const [customMajor, setCustomMajor] = useState('Ilmu Komputer');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await authService.signInWithGoogle();
    if (res.error) {
      setLoading(false);
      onNotify(
        `${res.error} (Tips: Gunakan opsi 'Masuk dengan Identitas Mahasiswa' di bawah untuk langsung mencoba tanpa setup Google OAuth)`,
        'ℹ️'
      );
      // Buka form kustom otomatis jika Google OAuth belum dikonfigurasi di dashboard Supabase
      setShowCustomForm(true);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      onNotify('Silakan masukkan nama atau panggilan Anda.', '⚠️');
      return;
    }
    if (onCustomLogin) {
      onCustomLogin(customName.trim(), customCampus.trim(), customMajor.trim());
    } else {
      // Fallback: simpan ke localStorage
      const id = `user-${Date.now()}`;
      localStorage.setItem('napas_user_id', id);
      localStorage.setItem('napas_user_name', customName.trim());
      window.location.reload();
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {/* Logo and Header */}
        <div className="login-header">
          <div className="login-logo-circle">
            <img
              src="/assets/napas.png"
              alt="Logo NAPAS"
              className="login-logo-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './assets/napas.png';
              }}
            />
          </div>
          <h1 className="login-title">NAPAS</h1>
          <p className="login-tagline">Radar Burnout & Kesejahteraan Mahasiswa</p>
          <p className="login-desc">
            Deteksi dini beban belajar, sinkronkan jadwal kuliah & tugas, serta lindungi fokusmu dari distraksi digital.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="login-actions">
          {/* Tombol Google Auth */}
          <button
            type="button"
            className="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Akun Google / Kampus'}</span>
          </button>

          {/* Form Masuk Mahasiswa Kustom */}
          {showCustomForm ? (
            <form className="custom-login-form" onSubmit={handleCustomSubmit}>
              <div className="custom-form-title">
                <span>🎓 Masuk dengan Identitas Mahasiswa:</span>
              </div>
              <div className="form-group-compact">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Lengkap / Panggilan Anda"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group-compact">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Kampus (misal: UGM, ITB, UI)"
                  value={customCampus}
                  onChange={(e) => setCustomCampus(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-compact">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Program Studi / Jurusan"
                  value={customMajor}
                  onChange={(e) => setCustomMajor(e.target.value)}
                  required
                />
              </div>
              <div className="custom-form-buttons">
                <button type="submit" className="btn-custom-submit">
                  Masuk & Mulai Personalisasi 🚀
                </button>
                <button
                  type="button"
                  className="btn-custom-cancel"
                  onClick={() => setShowCustomForm(false)}
                >
                  Tutup
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn-show-custom-login"
              onClick={() => setShowCustomForm(true)}
            >
              <span>🎓 Masuk dengan Nama Mahasiswa Sendiri</span>
            </button>
          )}

          <div className="login-divider">
            <span>atau</span>
          </div>

          <button
            type="button"
            className="btn-demo-quick"
            onClick={onDemoLogin}
          >
            <span>⚡ Mode Demo Cepat (Profil Raka - JOINTS)</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="login-privacy-footer">
          <div className="privacy-pill">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shield-icon"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>
              <strong>Privacy by Design:</strong> Data fokus diproses lokal di dalam browser Anda.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
