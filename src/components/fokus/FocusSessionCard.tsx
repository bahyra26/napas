import React, { useState, useEffect } from 'react';
import {
  focusStore,
  FocusSessionState,
} from '../../services/focusSessionStore';
import {
  WhitelistWebsite,
  isUrlAllowed,
  extractDomain,
} from '../../services/focusGuardian';

interface FocusSessionCardProps {
  onSessionCompleted: () => void;
  onNotify: (message: string, icon?: string) => void;
}

export const FocusSessionCard: React.FC<FocusSessionCardProps> = ({
  onSessionCompleted,
  onNotify,
}) => {
  // Global & Persistent Focus State
  const [session, setSession] = useState<FocusSessionState>(() => focusStore.getState());

  // Form states
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [showAddSite, setShowAddSite] = useState(false);

  // URL Checker Sandbox
  const [testUrl, setTestUrl] = useState('');
  const [checkResult, setCheckResult] = useState<{
    tested: boolean;
    allowed: boolean;
    matchedDomain?: string;
  } | null>(null);

  // Subscribe ke global focus store
  useEffect(() => {
    focusStore.setCallbacks(onNotify, onSessionCompleted);
    const unsubscribe = focusStore.subscribe((newState) => {
      setSession({ ...newState });
    });
    return () => {
      unsubscribe();
    };
  }, [onNotify, onSessionCompleted]);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim()) return;

    const success = focusStore.addWebsite(newSiteName, newSiteUrl);
    if (success) {
      setNewSiteName('');
      setNewSiteUrl('');
      setShowAddSite(false);
    } else {
      onNotify('Format URL tidak valid.', '⚠️');
    }
  };

  const handleRemoveWebsite = (id: string) => {
    focusStore.removeWebsite(id);
  };

  // URL Checker function
  const handleCheckUrl = () => {
    if (!testUrl.trim()) return;
    const res = isUrlAllowed(testUrl, session.whitelist);
    setCheckResult({
      tested: true,
      allowed: res.allowed,
      matchedDomain: res.matchedWebsite?.domain || extractDomain(testUrl),
    });
  };

  // Peluncur website yang diizinkan (Tidak dihitung distraksi!)
  const handleLaunchAllowedSite = (site: WhitelistWebsite) => {
    focusStore.launchAllowedSite(site);
  };

  // Navigasi URL dari bar sandbox
  const handleNavigateUrl = (url: string) => {
    if (!url.trim()) return;
    const check = isUrlAllowed(url, session.whitelist);
    if (check.allowed) {
      if (check.matchedWebsite) {
        focusStore.launchAllowedSite(check.matchedWebsite);
      } else {
        window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
        onNotify(`Membuka link yang diizinkan: ${url}`, '✅');
      }
    } else {
      const targetDomain = extractDomain(url);
      focusStore.triggerDistractionWarning(targetDomain || 'Website Terlarang', 3);
    }
  };

  // Audio ambient controls
  const handleToggleSound = (type: 'rain' | 'binaural') => {
    if (session.activeSound === type) {
      focusStore.setSound('none');
    } else {
      focusStore.setSound(type, session.soundVolume);
      onNotify(
        type === 'rain'
          ? 'Memutar suara hujan lembut untuk ketenangan pikiran 🌧️'
          : 'Memutar gelombang Alpha 14Hz untuk konsentrasi mendalam 🧠',
        '🎧'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    focusStore.setVolume(val);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { });
      onNotify('Mode Zen Layar Penuh diaktifkan ⛶', '✨');
    } else {
      document.exitFullscreen?.().catch(() => { });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="focus-session-card">
      {/* Top Banner: Status Guard */}
      <div className="agent-status-banner online">
        <div className="agent-indicator-pill">
          <span className="dot-indicator"></span>
          <span>
            <strong>NAPAS Focus Sanctuary:</strong>
            {session.agentOnline
              ? ' Companion Desktop Aktif — Auto-switch kembali ke NAPAS jika membuka distraksi.'
              : ' Guard Browser Aktif — Link di whitelist diizinkan penuh tanpa dihitung distraksi.'}
          </span>
        </div>
        <div className="banner-quick-actions">
          <button
            type="button"
            className="btn-zen-fullscreen"
            onClick={handleToggleFullscreen}
            title="Mode Layar Penuh Bebas Distraksi"
          >
            ⛶ Zen Mode
          </button>
        </div>
      </div>

      {/* MODAL PERINGATAN DISTRAKSI DENGAN HITUNG MUNDUR AUTO-SWITCH */}
      {session.distractionWarning && session.distractionWarning.active && (
        <div className="distraction-warning-modal-overlay">
          <div className="distraction-warning-modal-card">
            <div className="warning-modal-icon">⛔</div>
            <h3 className="warning-modal-title">Akses Website Tidak Diizinkan!</h3>
            <p className="warning-modal-desc">
              Kamu mencoba membuka <strong>{session.distractionWarning.site}</strong> yang berada di luar whitelist belajar fokusmu.
            </p>
            <div className="warning-countdown-badge">
              <span>Beralih kembali ke Ruang Belajar dalam:</span>
              <strong className="countdown-number">{session.distractionWarning.countdown} detik</strong>
            </div>
            <div className="warning-modal-actions">
              <button
                type="button"
                className="btn-force-back-now"
                onClick={() => {
                  focusStore.dismissDistractionWarning();
                  onNotify('Segera kembali ke Ruang Belajar NAPAS! 🎯', '✨');
                }}
              >
                Kembali Sekarang 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Focus Control Area */}
      {!session.isRunning ? (
        <div className="focus-idle-state">
          <div className="focus-setup-header">
            <h3>Ruang Belajar & Guard Website Fokus</h3>
            <p>
              Tentukan target tugasmu dan link/website yang diperbolehkan dibuka. Kamu bebas berpindah halaman di dalam website yang diizinkan (misal e-learning kampus) tanpa dihitung distraksi!
            </p>
          </div>

          <div className="focus-setup-controls">
            <div className="form-group-compact">
              <label>Target Belajar / Tugas Saat Ini:</label>
              <input
                type="text"
                className="form-input"
                value={session.taskName}
                onChange={(e) => focusStore.setTaskName(e.target.value)}
                placeholder="Contoh: Belajar Modul 4 Pemrograman Web / Cicil Makalah AI"
              />
            </div>

            <div className="duration-selector-row">
              <label>Pilih Durasi:</label>
              <div className="duration-buttons">
                {[15, 25, 45, 60, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    className={`btn-dur ${session.durationMinutes === dur ? 'active' : ''}`}
                    onClick={() => focusStore.setDurationMinutes(dur)}
                  >
                    {dur}m {dur === 25 ? '(Pomodoro)' : dur === 60 ? '(Deep Work)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Whitelist Manager Preview */}
            <div className="focus-whitelist-section">
              <div className="whitelist-header-row">
                <span className="whitelist-title">
                  🌐 <strong>Website Belajar yang Diizinkan</strong> ({session.whitelist.length} Domain Aktif)
                </span>
                <button
                  type="button"
                  className="btn-add-site-toggle"
                  onClick={() => setShowAddSite(!showAddSite)}
                >
                  {showAddSite ? 'Batal' : '+ Tambah Link/Web Baru'}
                </button>
              </div>

              {/* Form Tambah Website */}
              {showAddSite && (
                <form className="add-site-form" onSubmit={handleAddWebsite}>
                  <input
                    type="text"
                    className="form-input-site"
                    placeholder="Nama Website (misal: E-Learning UGM)"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input-site"
                    placeholder="URL / Domain (misal: https://elearning.ugm.ac.id)"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-save-site">
                    Simpan ke Whitelist
                  </button>
                </form>
              )}

              {/* Chips Website Terdaftar */}
              <div className="whitelist-chips-container">
                {session.whitelist.map((w) => (
                  <div key={w.id} className="whitelist-chip" title={`Domain: ${w.domain} (Mencakup seluruh halamannya)`}>
                    <span className="chip-icon">{w.icon}</span>
                    <span className="chip-name">{w.name}</span>
                    <button
                      type="button"
                      className="chip-link-btn"
                      title="Uji coba buka website ini"
                      onClick={() => handleLaunchAllowedSite(w)}
                    >
                      ↗
                    </button>
                    <button
                      type="button"
                      className="chip-del-btn"
                      onClick={() => handleRemoveWebsite(w.id)}
                      title="Hapus dari whitelist"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sandbox Penguji Link */}
            <div className="link-checker-box">
              <label>🔍 Cek / Simulasikan Buka Website:</label>
              <div className="link-checker-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ketik atau tempel URL (misal: https://elearning.ugm.ac.id/mod/quiz/...)"
                  value={testUrl}
                  onChange={(e) => {
                    setTestUrl(e.target.value);
                    setCheckResult(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckUrl()}
                />
                <button type="button" className="btn-check-url" onClick={handleCheckUrl}>
                  Periksa
                </button>
              </div>

              {checkResult && checkResult.tested && (
                <div className={`checker-feedback ${checkResult.allowed ? 'allowed' : 'blocked'}`}>
                  {checkResult.allowed ? (
                    <div className="feedback-content">
                      <span>
                        ✅ <strong>Diizinkan!</strong> Base domain{' '}
                        <code>{checkResult.matchedDomain}</code> ada di whitelist. Seluruh halaman, modul, & endpoint website ini bebas dibuka saat sesi fokus.
                      </span>
                      <button
                        type="button"
                        className="btn-launch-allowed"
                        onClick={() => handleNavigateUrl(testUrl)}
                      >
                        Buka Website ↗
                      </button>
                    </div>
                  ) : (
                    <div className="feedback-content">
                      <span>
                        ⛔ <strong>Di Luar Whitelist:</strong> Domain <code>{extractDomain(testUrl)}</code> belum diizinkan. Jika dibuka saat fokus, tab akan otomatis ditutup dalam 3 detik.
                      </span>
                      <button
                        type="button"
                        className="btn-quick-whitelist"
                        onClick={() => {
                          const domain = extractDomain(testUrl);
                          focusStore.addWebsite(domain, testUrl);
                          setCheckResult({ tested: true, allowed: true, matchedDomain: domain });
                          onNotify(`Domain ${domain} berhasil ditambahkan ke whitelist!`, '✅');
                        }}
                      >
                        + Izinkan Base Domain Ini
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Mulai Sesi */}
            <button
              type="button"
              className="btn-start-focus"
              onClick={() => focusStore.startSession()}
            >
              <span>Mulai Sesi Fokus ({session.durationMinutes} Menit) 🎯</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Focus Sanctuary */
        <div className="focus-active-state">
          <div className="focus-timer-ring">
            <div className="timer-number">{formatTime(session.secondsRemaining)}</div>
            <div className="timer-sublabel">{session.taskName}</div>
          </div>

          {/* Indicator jika sedang aktif belajar di website yang diizinkan */}
          {session.activeStudySite && (
            <div className="active-study-site-banner">
              <span className="study-pulse-dot">🟢</span>
              <span className="study-site-text">
                Sedang Belajar di: <strong>{session.activeStudySite.name}</strong> ({session.activeStudySite.domain}) —{' '}
                <em>Waktu fokus terus bertambah, bebas membuka materi & kuis.</em>
              </span>
              <button
                type="button"
                className="btn-done-study-site"
                onClick={() => focusStore.clearActiveStudySite()}
                title="Tutup indikator situs ini"
              >
                Selesai Belajar di Tab Ini
              </button>
            </div>
          )}

          {/* Quick Launch Websites in Focus */}
          <div className="active-focus-launchpad">
            <span className="launchpad-title">
              🚀 Website Belajar yang Diizinkan (Klik untuk membuka — tetap dihitung Waktu Fokus):
            </span>
            <div className="launchpad-buttons">
              {session.whitelist.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`btn-launch-site ${session.activeStudySite?.id === w.id ? 'active-site' : ''}`}
                  onClick={() => handleLaunchAllowedSite(w)}
                  title={`Buka ${w.name} (mencakup seluruh halaman)`}
                >
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                  <span className="launch-icon">↗</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Navigator Penguji Link saat fokus */}
          <div className="focus-url-navigator-row">
            <input
              type="text"
              className="form-input-nav"
              placeholder="Buka atau uji link website lain saat sesi fokus..."
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigateUrl(testUrl)}
            />
            <button
              type="button"
              className="btn-nav-go"
              onClick={() => handleNavigateUrl(testUrl)}
            >
              Buka / Validasi ↗
            </button>
          </div>

          {/* Audio Ambience Synthesizer */}
          <div className="focus-audio-bar">
            <span className="audio-label">🎧 Audio Ambience Fokus:</span>
            <div className="audio-buttons">
              <button
                type="button"
                className={`btn-ambient ${session.activeSound === 'rain' ? 'active' : ''}`}
                onClick={() => handleToggleSound('rain')}
              >
                🌧️ {session.activeSound === 'rain' ? 'Matikan Hujan' : 'Suara Hujan'}
              </button>
              <button
                type="button"
                className={`btn-ambient ${session.activeSound === 'binaural' ? 'active' : ''}`}
                onClick={() => handleToggleSound('binaural')}
              >
                🧠 {session.activeSound === 'binaural' ? 'Matikan Gelombang' : 'Binaural Alpha (14Hz)'}
              </button>
              {session.activeSound !== 'none' && (
                <div className="volume-slider-group">
                  <span>Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={session.soundVolume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Stats Row */}
          <div className="focus-live-stats">
            <div className="live-stat-item">
              <span className="stat-num color-green">{Math.floor(session.focusSeconds / 60)}m {session.focusSeconds % 60}s</span>
              <span className="stat-desc">Waktu Fokus Efektif</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num color-orange">{session.distractionCount}×</span>
              <span className="stat-desc">Distraksi Dicegah</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num" title={session.agentWindow}>{session.agentWindow.slice(0, 14)}...</span>
              <span className="stat-desc">Jendela / Tab Aktif</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="focus-active-actions">
            <button
              type="button"
              className="btn-finish-focus"
              onClick={() => focusStore.stopSession(true)}
            >
              Selesaikan Sesi Belajar ✅
            </button>
            <button
              type="button"
              className="btn-cancel-focus"
              onClick={() => focusStore.stopSession(false)}
            >
              Akhiri Lebih Awal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
