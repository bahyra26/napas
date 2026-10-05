import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredUserId } from '../../services/api';
import { agentClient, AgentStatusEvent } from '../../services/agentClient';

interface FocusSessionCardProps {
  onSessionCompleted: () => void;
  onNotify: (message: string, icon?: string) => void;
}

export const FocusSessionCard: React.FC<FocusSessionCardProps> = ({
  onSessionCompleted,
  onNotify,
}) => {
  const [agentOnline, setAgentOnline] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Configuration
  const [taskName, setTaskName] = useState('Belajar & Mengerjakan Tugas');
  const [durationMinutes, setDurationMinutes] = useState(25);

  // Live Stats
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [distractSeconds, setDistractSeconds] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [activeWindow, setActiveWindow] = useState('Desktop');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Listen to Agent connection
    const unsubConn = agentClient.onConnectionChange((connected) => {
      setAgentOnline(connected);
    });

    // Listen to Agent status
    const unsubStatus = agentClient.onStatus((status: AgentStatusEvent) => {
      setActiveWindow(status.active_window || 'Desktop');
      setFocusSeconds(status.focus_seconds);
      setDistractSeconds(status.distraction_seconds);
      setBlockedCount(status.blocked_count);
    });

    // Listen to Agent distraction blocked
    const unsubBlocked = agentClient.onBlocked((evt) => {
      setBlockedCount((prev) => prev + 1);
      setWarningMessage(null);
      onNotify(evt.message, '🚫');
    });

    // Listen to Agent distraction warning
    const unsubWarning = agentClient.onWarning((evt) => {
      if (evt.countdown > 0) {
        setWarningMessage(`⚠️ ${evt.app} terbuka! Ditutup dalam ${evt.countdown} detik...`);
      } else {
        setWarningMessage(evt.message);
      }
    });

    return () => {
      unsubConn();
      unsubStatus();
      unsubBlocked();
      unsubWarning();
    };
  }, [onNotify]);

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
    setBlockedCount(0);
    setWarningMessage(null);

    // Kirim sinyal start ke Agent lokal
    agentClient.startSession({
      sessionId: newSessionId,
      action: 'warn_then_close',
    });

    // Catat ke backend
    await api.startFocusSession({
      user_id: userId,
      judul: taskName,
      target_menit: durationMinutes,
      agent_connected: agentOnline,
    });

    // Mulai countdown timer visual
    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleStopSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    onNotify(
      `Sesi fokus ${durationMinutes} menit dimulai! ${agentOnline ? 'Agent aktif melindungi fokusmu.' : 'Mode fokus berjalan.'}`,
      '🎯'
    );
  };

  const handleStopSession = async (completed = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    agentClient.stopSession();
    setIsRunning(false);
    setWarningMessage(null);

    if (sessionId) {
      await api.finishFocusSession(sessionId, {
        focus_seconds: focusSeconds || (durationMinutes * 60 - secondsRemaining),
        distraction_seconds: distractSeconds,
        completed,
      });
    }

    onNotify(
      completed
        ? `🎉 Selamat! Sesi fokus ${durationMinutes} menit selesai dengan sukses!`
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
      {/* Top Banner: Status Agent Desktop */}
      <div className={`agent-status-banner ${agentOnline ? 'online' : 'offline'}`}>
        <div className="agent-indicator-pill">
          <span className="dot-indicator"></span>
          <span>
            {agentOnline
              ? 'NAPAS Focus Agent: Terhubung (Aplikasi distraksi otomatis ditutup)'
              : 'Web Mode (Jalankan run_agent.bat di laptop untuk menutup aplikasi distraksi otomatis)'}
          </span>
        </div>
      </div>

      {warningMessage && (
        <div className="agent-distraction-alert">
          <span className="alert-pulse">⚡</span>
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Main Focus Control Area */}
      {!isRunning ? (
        <div className="focus-idle-state">
          <div className="focus-setup-header">
            <h3>Mulai Sesi Fokus Mendalam</h3>
            <p>Pilih durasi dan target tugasmu. Aplikasi yang tidak terkait akan diblokir saat sesi berjalan.</p>
          </div>

          <div className="focus-setup-controls">
            <div className="form-group-compact">
              <label>Target Tugas:</label>
              <input
                type="text"
                className="form-input"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Apa yang ingin kamu selesaikan?"
              />
            </div>

            <div className="duration-selector-row">
              <label>Pilih Durasi:</label>
              <div className="duration-buttons">
                {[15, 25, 45, 60, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    className={`btn-dur ${durationMinutes === dur ? 'active' : ''}`}
                    onClick={() => setDurationMinutes(dur)}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

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
        <div className="focus-active-state">
          <div className="focus-timer-ring">
            <div className="timer-number">{formatTime(secondsRemaining)}</div>
            <div className="timer-sublabel">{taskName}</div>
          </div>

          <div className="focus-live-stats">
            <div className="live-stat-item">
              <span className="stat-num color-green">{Math.floor(focusSeconds / 60)}m</span>
              <span className="stat-desc">Waktu Fokus</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num color-orange">{blockedCount}×</span>
              <span className="stat-desc">Distraksi Dicegah</span>
            </div>
            <div className="live-stat-item">
              <span className="stat-num" title={activeWindow}>{activeWindow.slice(0, 14)}...</span>
              <span className="stat-desc">Jendela Aktif</span>
            </div>
          </div>

          <div className="focus-active-actions">
            <button
              type="button"
              className="btn-finish-focus"
              onClick={() => handleStopSession(true)}
            >
              Selesaikan Sesi Lebih Cepat ✅
            </button>
            <button
              type="button"
              className="btn-cancel-focus"
              onClick={() => handleStopSession(false)}
            >
              Hentikan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
