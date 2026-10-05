import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredUserId } from '../../services/api';
import {
  WhitelistWebsite,
  DEFAULT_STUDENT_WHITELIST,
  isUrlAllowed,
  extractDomain,
  ambientAudio,
} from '../../services/focusGuardian';

interface FocusSessionCardProps {
  onSessionCompleted: () => void;
  onNotify: (message: string, icon?: string) => void;
}

export const FocusSessionCard: React.FC<FocusSessionCardProps> = ({
  onSessionCompleted,
  onNotify,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Configuration
  const [taskName, setTaskName] = useState('Mengerjakan Tugas & Studi Mandiri');
  const [durationMinutes, setDurationMinutes] = useState(25);

  // Website Whitelist
  const [whitelist, setWhitelist] = useState<WhitelistWebsite[]>(() => {
    const saved = localStorage.getItem('napas_focus_whitelist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_STUDENT_WHITELIST;
  });
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [showAddSite, setShowAddSite] = useState(false);

  // URL Checker Sandbox
  const [testUrl, setTestUrl] = useState('');
  const [checkResult, setCheckResult] = useState<{
    tested: boolean;
    allowed: boolean;
    matchedDomain?: string;
    isKnownDistraction?: boolean;
    distractionName?: string;
  } | null>(null);

  // Live Stats
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [distractSeconds, setDistractSeconds] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [isTabDistracted, setIsTabDistracted] = useState(false);
  const [lastDistractDuration, setLastDistractDuration] = useState<number | null>(null);

  // Audio Ambient
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'binaural'>('none');
  const [soundVolume, setSoundVolume] = useState(0.3);

  // Refs
  const timerRef = useRef<number | null>(null);
  const distractStartRef = useRef<number | null>(null);
  const origTitleRef = useRef<string>(document.title);

  // Simpan whitelist ke localStorage & sync ke profil
  const saveWhitelist = (items: WhitelistWebsite[]) => {
    setWhitelist(items);
    localStorage.setItem('napas_focus_whitelist', JSON.stringify(items));
    const userId = getStoredUserId();
    if (userId) {
      api.updateProfile(userId, {
        focus_whitelist: items.map((i) => i.domain),
      });
    }
  };

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim()) return;

    const domain = extractDomain(newSiteUrl);
    if (!domain) {
      onNotify('Format URL tidak valid.', '⚠️');
      return;
    }

    const name = newSiteName.trim() || domain;
    const newItem: WhitelistWebsite = {
      id: `w-${Date.now()}`,
      name,
      url: newSiteUrl.startsWith('http') ? newSiteUrl : `https://${newSiteUrl}`,
      domain,
      category: 'other',
      icon: '🌐',
    };

    const updated = [...whitelist, newItem];
    saveWhitelist(updated);
    setNewSiteName('');
    setNewSiteUrl('');
    setShowAddSite(false);
    onNotify(`Website "${name}" (${domain}) berhasil diizinkan! Mencakup seluruh halamannya.`, '✅');
  };

  const handleRemoveWebsite = (id: string, name: string) => {
    const updated = whitelist.filter((w) => w.id !== id);
    saveWhitelist(updated);
    onNotify(`"${name}" dihapus dari whitelist.`, '🗑️');
  };

  // URL Checker function
  const handleCheckUrl = () => {
    if (!testUrl.trim()) return;
    const res = isUrlAllowed(testUrl, whitelist);
    setCheckResult({
      tested: true,
      allowed: res.allowed,
      matchedDomain: res.matchedWebsite?.domain,
      isKnownDistraction: res.isKnownDistraction,
      distractionName: res.distractionName,
    });
  };

  // Visibility / Blur detection saat sesi berjalan
  useEffect(() => {
    if (!isRunning) {
      document.title = origTitleRef.current;
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Mahasiswa beralih ke tab/aplikasi lain
        setIsTabDistracted(true);
        distractStartRef.current = Date.now();
        setDistractionCount((prev) => prev + 1);
        document.title = '⚠️ [NAPAS] Sesi Belajar Berjalan! Yuk Kembali!';
      } else {
        // Mahasiswa kembali ke tab NAPAS
        setIsTabDistracted(false);
        document.title = origTitleRef.current;
        if (distractStartRef.current) {
          const diffSec = Math.round((Date.now() - distractStartRef.current) / 1000);
          if (diffSec > 1) {
            setDistractSeconds((prev) => prev + diffSec);
            setLastDistractDuration(diffSec);
            ambientAudio.playChime();
          }
          distractStartRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = origTitleRef.current;
    };
  }, [isRunning]);

  // Audio ambient controls
  const handleToggleSound = (type: 'rain' | 'binaural') => {
    if (activeSound === type) {
      ambientAudio.stop();
      setActiveSound('none');
    } else {
      if (type === 'rain') ambientAudio.playRain(soundVolume);
      if (type === 'binaural') ambientAudio.playBinaural(soundVolume);
      setActiveSound(type);
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
    setSoundVolume(val);
    ambientAudio.setVolume(val);
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      onNotify('Mode Zen Layar Penuh diaktifkan ⛶', '✨');
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleStartSession = async () => {
    const userId = getStoredUserId();
    if (!userId) {
      onNotify('Silakan login terlebih dahulu.', '⚠️');
      return;
    }

    const newSessionId = `ses-${Date.now()}`;
    setSessionId(newSessionId);
    setIsRunning(true);
    setSecondsRemaining(durationMinutes * 60);
    setFocusSeconds(0);
    setDistractSeconds(0);
    setDistractionCount(0);
    setLastDistractDuration(null);
    origTitleRef.current = document.title;

    ambientAudio.playChime();

    // Catat ke backend
    await api.startFocusSession({
      user_id: userId,
      judul: taskName,
      target_menit: durationMinutes,
      agent_connected: true,
    });

    // Countdown visual
    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleStopSession(true);
          return 0;
        }
        setFocusSeconds((f) => f + 1);
        return prev - 1;
      });
    }, 1000);

    onNotify(
      `Sesi fokus ${durationMinutes} menit dimulai! Guard website aktif melindungi konsentrasimu.`,
      '🎯'
    );
  };

  const handleStopSession = async (completed = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    ambientAudio.stop();
    setActiveSound('none');
    setIsRunning(false);
    document.title = origTitleRef.current;

    if (sessionId) {
      const blockedAppsSummary: Record<string, number> = {};
      if (distractionCount > 0) {
        blockedAppsSummary['Tab Distraksi'] = distractionCount;
      }

      await api.finishFocusSession(sessionId, {
        focus_seconds: focusSeconds || durationMinutes * 60 - secondsRemaining,
        distraction_seconds: distractSeconds,
        blocked_apps: blockedAppsSummary,
        completed,
      });
    }

    ambientAudio.playChime();

    onNotify(
      completed
        ? `🎉 Selamat! Sesi belajar ${durationMinutes} menit selesai dengan sukses!`
        : 'Sesi fokus diakhiri.',
      completed ? '🏆' : '⏹️'
    );

    onSessionCompleted();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="focus-session-card">
      {/* Top Banner: Status Web Focus Guardian */}
      <div className="agent-status-banner online">
        <div className="agent-indicator-pill">
          <span className="dot-indicator"></span>
          <span>
            <strong>NAPAS Web Focus Sanctuary:</strong> Perlindungan fokus aktif di dalam browser. Seluruh website di whitelist diizinkan penuh (termasuk semua sub-halaman).
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

      {/* Peringatan kembali ke tab */}
      {lastDistractDuration !== null && !isTabDistracted && (
        <div className="agent-distraction-alert">
          <span className="alert-pulse">🌿</span>
          <span>
            Kamu sempat meninggalkan ruang belajar selama <strong>{lastDistractDuration} detik</strong>. Yuk kembali fokus ke tugasmu!
          </span>
          <button
            type="button"
            className="btn-dismiss-alert"
            onClick={() => setLastDistractDuration(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Focus Control Area */}
      {!isRunning ? (
        <div className="focus-idle-state">
          <div className="focus-setup-header">
            <h3>Ruang Belajar & Guard Website Fokus</h3>
            <p>
              Tentukan target tugasmu dan atur link/website yang diperbolehkan dibuka. Kamu bebas berpindah halaman di dalam website yang diizinkan (misal e-learning kampus).
            </p>
          </div>

          <div className="focus-setup-controls">
            <div className="form-group-compact">
              <label>Target Belajar / Tugas Saat Ini:</label>
              <input
                type="text"
                className="form-input"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Contoh: Belajar Modul 4 Pemrograman Web / Cicil Makalah AI"
              />
            </div>

            <div className="duration-selector-row">
              <label>Durasi Sesi:</label>
              <div className="duration-buttons">
                {[15, 25, 45, 60, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    className={`btn-dur ${durationMinutes === dur ? 'active' : ''}`}
                    onClick={() => setDurationMinutes(dur)}
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
                  🌐 <strong>Website Belajar yang Diizinkan</strong> ({whitelist.length} Domain Aktif)
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
                {whitelist.map((w) => (
                  <div key={w.id} className="whitelist-chip" title={`Domain: ${w.domain} (Mencakup seluruh halamannya)`}>
                    <span className="chip-icon">{w.icon}</span>
                    <span className="chip-name">{w.name}</span>
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip-link-btn"
                      title="Uji coba buka website ini"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↗
                    </a>
                    <button
                      type="button"
                      className="chip-del-btn"
                      onClick={() => handleRemoveWebsite(w.id, w.name)}
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
              <label>🔍 Cek Keabsahan Link Website:</label>
              <div className="link-checker-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tempel URL di sini untuk memeriksa (contoh: https://elearning.ugm.ac.id/mod/assign/...)"
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
                    <span>
                      ✅ <strong>Diizinkan!</strong> Link ini berada di domain{' '}
                      <code>{checkResult.matchedDomain}</code> (semua halaman website ini aman dibuka saat fokus).
                    </span>
                  ) : checkResult.isKnownDistraction ? (
                    <span>
                      ⛔ <strong>Distraksi Terdeteksi:</strong> Website ini adalah{' '}
                      <strong>{checkResult.distractionName}</strong> dan berada di luar whitelist belajar.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>Belum Diizinkan:</strong> Domain <code>{extractDomain(testUrl)}</code> belum masuk whitelist.
                      <button
                        type="button"
                        className="btn-quick-whitelist"
                        onClick={() => {
                          const domain = extractDomain(testUrl);
                          const updated = [
                            ...whitelist,
                            {
                              id: `w-${Date.now()}`,
                              name: domain,
                              url: testUrl.startsWith('http') ? testUrl : `https://${testUrl}`,
                              domain,
                              category: 'other' as const,
                              icon: '🌐',
                            },
                          ];
                          saveWhitelist(updated);
                          setCheckResult({ tested: true, allowed: true, matchedDomain: domain });
                          onNotify(`Domain "${domain}" berhasil ditambahkan ke whitelist!`, '✅');
                        }}
                      >
                        + Izinkan Website Ini
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Mulai Sesi */}
            <button
              type="button"
              className="btn-start-focus"
              onClick={handleStartSession}
            >
              <span>Mulai Sesi Fokus ({durationMinutes} Menit) 🎯</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Focus Sanctuary */
        <div className="focus-active-state">
          <div className="focus-timer-ring">
            <div className="timer-number">{formatTime(secondsRemaining)}</div>
            <div className="timer-sublabel">{taskName}</div>
          </div>

          {/* Quick Launch Websites in Focus */}
          <div className="active-focus-launchpad">
            <span className="launchpad-title">🚀 Buka Website Belajar (Bebas Navigasi Seluruh Halaman):</span>
            <div className="launchpad-buttons">
              {whitelist.map((w) => (
                <a
                  key={w.id}
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-launch-site"
                  title={`Buka ${w.name} di tab baru`}
                >
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                  <span className="launch-icon">↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Audio Ambience Synthesizer */}
          <div className="focus-audio-bar">
            <span className="audio-label">🎧 Audio Ambience Fokus:</span>
            <div className="audio-buttons">
              <button
                type="button"
                className={`btn-ambient ${activeSound === 'rain' ? 'active' : ''}`}
                onClick={() => handleToggleSound('rain')}
              >
                🌧️ {activeSound === 'rain' ? 'Matikan Hujan' : 'Suara Hujan'}
              </button>
              <button
                type="button"
                className={`btn-ambient ${activeSound === 'binaural' ? 'active' : ''}`}
                onClick={() => handleToggleSound('binaural')}
              >
                🧠 {activeSound === 'binaural' ? 'Matikan Gelombang' : 'Binaural Alpha (14Hz)'}
              </button>
              {activeSound !== 'none' && (
                <div className="volume-slider-group">
                  <span>Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
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
              <span className="stat-num color-green">{Math.floor(focusSeconds / 60)}m {focusSeconds % 60}s</span>
              <span className="stat-desc">Waktu Fokus Efektif</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num color-orange">{distractionCount}×</span>
              <span className="stat-desc">Beralih Tab / Jendela</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num color-red">{distractSeconds}s</span>
              <span className="stat-desc">Total Waktu Distraksi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="focus-active-actions">
            <button
              type="button"
              className="btn-finish-focus"
              onClick={() => handleStopSession(true)}
            >
              Selesaikan Sesi Belajar ✅
            </button>
            <button
              type="button"
              className="btn-cancel-focus"
              onClick={() => handleStopSession(false)}
            >
              Akhiri Lebih Awal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
