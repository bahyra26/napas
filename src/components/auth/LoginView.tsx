import React, { useState } from 'react';
import { authService } from '../../services/supabase';
import { setStoredUserId } from '../../services/api';

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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login Form States
  const [loginEmailOrUser, setLoginEmailOrUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password Strength Criteria
  const hasMinLen = regPassword.length >= 8;
  const hasUpperLower = /[a-z]/.test(regPassword) && /[A-Z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(regPassword);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await authService.signInWithGoogle();
    if (res.error) {
      setLoading(false);
      onNotify(
        `${res.error} (Tips: Anda dapat langsung mengisi form atau klik 'Mode Demo Cepat')`,
        'ℹ️'
      );
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrUser.trim()) {
      onNotify('Silakan masukkan email atau username Anda.', '⚠️');
      return;
    }
    if (!loginPassword) {
      onNotify('Silakan masukkan password Anda.', '⚠️');
      return;
    }

    setLoading(true);

    try {
      // Coba auth Supabase jika tersedia
      const res = await authService.signInWithPassword(loginEmailOrUser, loginPassword);
      if (res.user) {
        setLoading(false);
        const name = res.user.user_metadata?.full_name || loginEmailOrUser.split('@')[0];
        setStoredUserId(res.user.id, name);
        window.location.reload();
        return;
      }
    } catch {
      // Supabase unconfigured / offline -> fallback lokal
    }

    // Fallback: Login lokal mulus
    setLoading(false);
    const resolvedName = loginEmailOrUser.includes('@')
      ? loginEmailOrUser.split('@')[0]
      : loginEmailOrUser.trim();
    const formattedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);

    if (onCustomLogin) {
      onCustomLogin(formattedName, 'Universitas Indonesia', 'Teknik Informatika');
    } else {
      const id = `user-${Date.now()}`;
      setStoredUserId(id, formattedName);
      window.location.reload();
    }
    onNotify(`Selamat datang kembali, ${formattedName}!`, '🌱');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      onNotify('Silakan masukkan nama lengkap Anda.', '⚠️');
      return;
    }
    if (!regEmail.trim()) {
      onNotify('Silakan masukkan email aktif Anda.', '⚠️');
      return;
    }
    if (!regUsername.trim()) {
      onNotify('Silakan buat username Anda.', '⚠️');
      return;
    }
    if (regPassword.length < 6) {
      onNotify('Password minimal harus 6 karakter.', '⚠️');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.signUpWithEmail({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        username: regUsername,
      });

      if (res.user) {
        setLoading(false);
        setStoredUserId(res.user.id, regFullName.trim());
        onNotify('Pendaftaran berhasil! Selamat datang di NAPAS.', '🎉');
        window.location.reload();
        return;
      }
    } catch {
      // Supabase unconfigured / offline -> fallback lokal
    }

    // Fallback: Buat akun lokal langsung
    setLoading(false);
    const cleanName = regFullName.trim();
    if (onCustomLogin) {
      onCustomLogin(cleanName, 'Universitas Indonesia', 'Mahasiswa');
    } else {
      const id = `user-${Date.now()}`;
      setStoredUserId(id, cleanName);
      window.location.reload();
    }
    onNotify(`Akun berhasil dibuat! Selamat datang di NAPAS, ${cleanName}!`, '🎉');
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* ==================================================================
            LEFT PANEL: BRAND & MINDFUL ART
            ================================================================== */}
        <div className="auth-left">
          {/* Top Brand Logo */}
          <div className="auth-brand">
            <img
              src="./assets/logo_brain.png"
              alt="Logo NAPAS"
              className="auth-brand-logo"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = './assets/napas.png';
              }}
            />
            <span className="auth-brand-text">NAPAS</span>
          </div>

          {/* Intro Text & Headings */}
          <div className="auth-intro-content">
            <h1 className="auth-intro-title">
              {mode === 'login' ? (
                <>
                  Selamat Datang
                  <br />
                  Kembali!
                </>
              ) : (
                <>
                  Mulai Perjalanan
                  <br />
                  Lebih Baik
                </>
              )}
            </h1>
            <p className="auth-intro-desc">
              {mode === 'login'
                ? 'Pantau kesehatan mentalmu, langkah kecil untuk hidup yang lebih baik.'
                : 'Daftar sekarang dan temukan cara untuk menjaga kesehatan mentalmu setiap hari.'}
            </p>
          </div>

          {/* Illustration Section */}
          <div className="auth-illustration-container">
            <div className="auth-illustration-backdrop">
              {mode === 'login' ? (
                <img
                  src="./assets/Meditasi.png"
                  alt="Meditasi NAPAS"
                  className="auth-illustration-img"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = './assets/meditasi.png';
                  }}
                />
              ) : (
                <img
                  src="./assets/Background.png"
                  alt="Perjalanan NAPAS"
                  className="auth-illustration-img"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = './assets/background.png';
                  }}
                />
              )}
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="auth-badge-footer">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="auth-badge-icon"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2" />
            </svg>
            <span className="auth-badge-text">
              {mode === 'login'
                ? 'Jaga kesehatan mental, raih versi terbaik dirimu.'
                : 'Kamu tidak sendirian. NAPAS selalu ada untukmu.'}
            </span>
          </div>
        </div>

        {/* ==================================================================
            RIGHT PANEL: FORM (LOGIN / DAFTAR AKUN)
            ================================================================== */}
        <div className="auth-right">
          {mode === 'login' ? (
            /* ------------------ LOGIN FORM ------------------ */
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Login</h2>
                <p className="auth-form-subtitle">Masuk ke akun NAPAS kamu</p>
              </div>

              <form className="auth-form" onSubmit={handleLoginSubmit}>
                {/* Email atau Username */}
                <div className="auth-field">
                  <label className="auth-label">Email atau Username</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Masukkan email atau username"
                      value={loginEmailOrUser}
                      onChange={(e) => setLoginEmailOrUser(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Masukkan password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Ingat saya</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() =>
                      onNotify('Gunakan opsi Google atau login langsung dengan nama Anda.', 'ℹ️')
                    }
                  >
                    Lupa password?
                  </button>
                </div>

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  <span>{loading ? 'Memproses...' : 'Login'}</span>
                  <span>→</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>atau</span>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <img
                    src="./assets/google.png"
                    alt="Google"
                    className="auth-google-img"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = './assets/search.png';
                    }}
                  />
                  <span>Login dengan Google</span>
                </button>

                {/* Quick Demo Button */}
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={onDemoLogin}
                  title="Masuk instan dengan profil demo tanpa kredensial"
                >
                  ⚡ Masuk Cepat (Mode Demo Raka)
                </button>
              </form>

              {/* Switch to Register */}
              <p className="auth-switch-text">
                Belum punya akun?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => setMode('register')}
                >
                  Daftar sekarang
                </button>
              </p>
            </>
          ) : (
            /* ------------------ REGISTER (DAFTAR AKUN) FORM ------------------ */
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Daftar Akun</h2>
                <p className="auth-form-subtitle">Buat akun NAPAS untuk memulai</p>
              </div>

              <form className="auth-form" onSubmit={handleRegisterSubmit}>
                {/* Nama Lengkap */}
                <div className="auth-field">
                  <label className="auth-label">Nama Lengkap</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Masukkan nama lengkap"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="Masukkan email aktif"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="auth-field">
                  <label className="auth-label">Username</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Buat username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Buat password minimal 8 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Badges (Dynamic Check) */}
                <div className="auth-password-criteria">
                  <div className={`auth-criteria-item ${hasMinLen ? 'valid' : ''}`}>
                    <span className="criteria-dot" />
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div className={`auth-criteria-item ${hasUpperLower ? 'valid' : ''}`}>
                    <span className="criteria-dot" />
                    <span>Huruf besar & kecil</span>
                  </div>
                  <div className={`auth-criteria-item ${hasNumber ? 'valid' : ''}`}>
                    <span className="criteria-dot" />
                    <span>Angka</span>
                  </div>
                  <div className={`auth-criteria-item ${hasSpecial ? 'valid' : ''}`}>
                    <span className="criteria-dot" />
                    <span>Karakter khusus</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  <span>{loading ? 'Mendaftarkan...' : 'Daftar'}</span>
                  <span>→</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>atau</span>
                </div>

                {/* Google Sign Up */}
                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <img
                    src="./assets/google.png"
                    alt="Google"
                    className="auth-google-img"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = './assets/search.png';
                    }}
                  />
                  <span>Daftar dengan Google</span>
                </button>

                {/* Subtle Quick Demo */}
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={onDemoLogin}
                >
                  ⚡ Coba Mode Demo Tanpa Daftar
                </button>
              </form>

              {/* Switch to Login */}
              <p className="auth-switch-text">
                Sudah punya akun?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => setMode('login')}
                >
                  Login di sini
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
