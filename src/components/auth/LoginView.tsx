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
            {mode === 'login' ? (
              /* Mindful Calm Breathing Person Illustration */
              <svg
                viewBox="0 0 320 280"
                className="auth-illustration-svg"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="mintGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d5eee1" />
                    <stop offset="100%" stopColor="#c3e6d5" stopOpacity="0.4" />
                  </radialGradient>
                  <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d5c48" />
                    <stop offset="100%" stopColor="#094536" />
                  </linearGradient>
                  <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1f7d5e" />
                    <stop offset="100%" stopColor="#43b88b" />
                  </linearGradient>
                  <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a8f6d" />
                    <stop offset="100%" stopColor="#5cc99e" />
                  </linearGradient>
                </defs>

                {/* Circular Halo */}
                <circle cx="160" cy="155" r="105" fill="url(#mintGlow)" />
                <circle cx="160" cy="155" r="95" fill="#daf0e5" />

                {/* Amber Sun Dot */}
                <circle cx="242" cy="78" r="14" fill="#f09a3e" />

                {/* Mindful Air Swirls */}
                <path
                  d="M 238 120 C 242 118 248 119 250 123"
                  stroke="#3b9673"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 252 135 C 255 133 260 134 262 138"
                  stroke="#3b9673"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 72 130 C 76 128 80 130 82 134"
                  stroke="#3b9673"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Foliage Left */}
                <path
                  d="M 70 215 C 60 180 85 150 95 155 C 105 160 102 190 92 215 Z"
                  fill="url(#leafGrad1)"
                />
                <path
                  d="M 90 220 C 80 165 110 135 120 142 C 128 150 120 185 108 220 Z"
                  fill="url(#leafGrad2)"
                />

                {/* Foliage Right */}
                <path
                  d="M 248 220 C 258 180 230 150 220 156 C 210 162 215 195 228 220 Z"
                  fill="url(#leafGrad1)"
                />
                <path
                  d="M 230 220 C 242 165 210 135 198 142 C 190 150 200 185 212 220 Z"
                  fill="url(#leafGrad2)"
                />

                {/* Hoodie Body */}
                <path
                  d="M 112 250 C 114 205 134 190 160 190 C 186 190 206 205 208 250 Z"
                  fill="url(#hoodieGrad)"
                />
                <path
                  d="M 148 190 Q 160 206 172 190"
                  stroke="#063227"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 154 198 L 153 222"
                  stroke="#063227"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 166 198 L 167 222"
                  stroke="#063227"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Neck & Shadow */}
                <path d="M 150 170 L 150 192 L 170 192 L 170 170 Z" fill="#fcdbbd" />
                <path
                  d="M 150 182 Q 160 188 170 182 L 170 192 L 150 192 Z"
                  fill="#ebbe9d"
                />

                {/* Face */}
                <path
                  d="M 142 144 C 142 170 154 178 166 178 C 178 178 184 168 184 148 C 184 126 174 122 158 122 C 146 122 142 132 142 144 Z"
                  fill="#fcdbbd"
                />

                {/* Ear */}
                <path
                  d="M 139 146 C 137 142 139 138 143 138 L 143 150 C 139 150 138 148 139 146 Z"
                  fill="#f5c7a4"
                />

                {/* Peaceful Closed Eye */}
                <path
                  d="M 165 145 Q 171 150 176 146"
                  stroke="#0d4838"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Eyebrow */}
                <path
                  d="M 163 139 Q 171 140 178 142"
                  stroke="#0a392c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Gentle Smile */}
                <path
                  d="M 167 160 Q 172 165 178 162"
                  stroke="#0d4838"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="177" cy="154" r="5" fill="#fca898" opacity="0.45" />

                {/* Hair */}
                <path
                  d="M 135 140 C 130 120 144 100 162 100 C 178 100 185 110 188 124 C 190 134 186 140 184 142 C 180 130 175 125 162 124 C 152 123 145 130 142 142 C 140 144 136 144 135 140 Z"
                  fill="#0c3c2f"
                />
                <path
                  d="M 138 126 C 132 122 134 112 140 110 C 148 108 152 116 148 122 Z"
                  fill="#0c3c2f"
                />
              </svg>
            ) : (
              /* Plant & Health Tablet Device Illustration */
              <svg
                viewBox="0 0 320 280"
                className="auth-illustration-svg"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="regMintGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d5eee1" />
                    <stop offset="100%" stopColor="#c3e6d5" stopOpacity="0.4" />
                  </radialGradient>
                  <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#145844" />
                    <stop offset="100%" stopColor="#0b382b" />
                  </linearGradient>
                  <linearGradient id="leafGradA" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#258664" />
                    <stop offset="100%" stopColor="#4bc295" />
                  </linearGradient>
                </defs>

                {/* Circular Halo */}
                <circle cx="160" cy="155" r="105" fill="url(#regMintGlow)" />
                <circle cx="160" cy="155" r="95" fill="#daf0e5" />

                {/* Amber Sun Dot */}
                <circle cx="242" cy="78" r="14" fill="#f09a3e" />

                {/* Potted Plant */}
                <path
                  d="M 98 226 L 104 252 C 104 254 106 256 109 256 L 135 256 C 138 256 140 254 140 252 L 146 226 Z"
                  fill="url(#potGrad)"
                />
                <rect x="94" y="218" width="56" height="10" rx="4" fill="#1b6650" />

                {/* Plant Stems & Leaves */}
                <path
                  d="M 122 218 C 122 170 120 145 118 128"
                  stroke="#165b46"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M 120 190 C 108 178 98 175 94 176 C 92 186 104 196 118 196 Z"
                  fill="url(#leafGradA)"
                />
                <path
                  d="M 122 170 C 134 158 144 155 148 156 C 150 166 138 176 124 176 Z"
                  fill="url(#leafGradA)"
                />
                <path
                  d="M 119 146 C 107 134 97 131 93 132 C 91 142 103 152 117 152 Z"
                  fill="url(#leafGradA)"
                />
                <path
                  d="M 118 132 C 122 114 116 104 118 104 C 120 104 128 116 122 132 Z"
                  fill="url(#leafGradA)"
                />

                {/* Health Tablet Card */}
                <rect
                  x="156"
                  y="126"
                  width="120"
                  height="98"
                  rx="14"
                  fill="#ffffff"
                  stroke="#259a72"
                  strokeWidth="3"
                />

                {/* Heart Badge with ECG Wave */}
                <g transform="translate(198, 140)">
                  <rect x="-8" y="-4" width="48" height="42" rx="10" fill="#e4f6ec" />
                  <path
                    d="M 16 7 C 12 1 4 3 4 11 C 4 19 16 26 16 26 C 16 26 28 19 28 11 C 28 3 20 1 16 7 Z"
                    fill="#17634d"
                  />
                  <path
                    d="M 8 13 L 12 13 L 14 9 L 16 18 L 18 11 L 20 14 L 24 14"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>

                {/* Checklist Rows */}
                <g transform="translate(174, 188)">
                  <circle cx="8" cy="8" r="6" fill="#187258" />
                  <path
                    d="M 5 8 L 7.5 10.5 L 11 6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <rect x="20" y="5.5" width="62" height="5.5" rx="2.75" fill="#caeada" />
                </g>

                <g transform="translate(174, 206)">
                  <circle cx="8" cy="8" r="6" fill="#187258" />
                  <path
                    d="M 5 8 L 7.5 10.5 L 11 6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <rect x="20" y="5.5" width="46" height="5.5" rx="2.75" fill="#caeada" />
                </g>
              </svg>
            )}
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
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
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
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
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
