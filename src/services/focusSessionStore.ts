import { api, getStoredUserId } from './api';
import { agentClient, AgentStatusEvent } from './agentClient';
import {
  WhitelistWebsite,
  DEFAULT_STUDENT_WHITELIST,
  extractDomain,
  extractAllKeywords,
  ambientAudio,
} from './focusGuardian';

export interface FocusSessionState {
  isRunning: boolean;
  sessionId: string | null;
  taskName: string;
  durationMinutes: number;
  secondsRemaining: number;
  focusSeconds: number;
  distractSeconds: number;
  distractionCount: number;
  blockedApps: Record<string, number>;
  whitelist: WhitelistWebsite[];
  activeStudySite: WhitelistWebsite | null;
  distractionWarning: {
    site: string;
    countdown: number;
    active: boolean;
  } | null;
  agentOnline: boolean;
  agentWindow: string;
  activeSound: 'none' | 'rain' | 'binaural';
  soundVolume: number;
}

type Listener = (state: FocusSessionState) => void;

class FocusSessionStore {
  private state: FocusSessionState;
  private listeners: Set<Listener> = new Set();
  private timerId: number | null = null;
  private warningTimerId: number | null = null;
  private onNotifyCallback: ((msg: string, icon?: string) => void) | null = null;
  private onSessionCompletedCallback: (() => void) | null = null;

  constructor() {
    const savedWhitelist = localStorage.getItem('napas_focus_whitelist');
    let initialWhitelist = DEFAULT_STUDENT_WHITELIST;
    if (savedWhitelist) {
      try {
        initialWhitelist = JSON.parse(savedWhitelist);
      } catch {}
    }

    // Cek apakah ada sesi aktif yang sedang berjalan di localStorage
    const savedActive = localStorage.getItem('napas_active_focus_session');
    let isRunning = false;
    let sessionId: string | null = null;
    let taskName = 'Mengerjakan Tugas & Studi Mandiri';
    let durationMinutes = 25;
    let secondsRemaining = 25 * 60;
    let focusSeconds = 0;
    let distractSeconds = 0;
    let distractionCount = 0;
    let blockedApps: Record<string, number> = {};

    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        const elapsedSec = Math.floor((Date.now() - parsed.startedAt) / 1000);
        const totalSec = parsed.durationMinutes * 60;

        if (elapsedSec < totalSec && parsed.isRunning) {
          isRunning = true;
          sessionId = parsed.sessionId;
          taskName = parsed.taskName || taskName;
          durationMinutes = parsed.durationMinutes || durationMinutes;
          secondsRemaining = Math.max(0, totalSec - elapsedSec);
          focusSeconds = elapsedSec;
          distractSeconds = parsed.distractSeconds || 0;
          distractionCount = parsed.distractionCount || 0;
          blockedApps = parsed.blockedApps || {};
        } else {
          localStorage.removeItem('napas_active_focus_session');
        }
      } catch {
        localStorage.removeItem('napas_active_focus_session');
      }
    }

    this.state = {
      isRunning,
      sessionId,
      taskName,
      durationMinutes,
      secondsRemaining,
      focusSeconds,
      distractSeconds,
      distractionCount,
      blockedApps,
      whitelist: initialWhitelist,
      activeStudySite: null,
      distractionWarning: null,
      agentOnline: false,
      agentWindow: 'Desktop',
      activeSound: 'none',
      soundVolume: 0.3,
    };

    this.initAgentListeners();

    // Jika sesi sedang berjalan saat refresh/kembali, lanjutkan interval timer
    if (isRunning) {
      this.startTimerLoop();
    }
  }

  public setCallbacks(
    onNotify: (msg: string, icon?: string) => void,
    onCompleted: () => void
  ) {
    this.onNotifyCallback = onNotify;
    this.onSessionCompletedCallback = onCompleted;
  }

  private notify(msg: string, icon = '🎯') {
    if (this.onNotifyCallback) {
      this.onNotifyCallback(msg, icon);
    }
  }

  public getState(): FocusSessionState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state));
    // Persist active session state
    if (this.state.isRunning && this.state.sessionId) {
      localStorage.setItem(
        'napas_active_focus_session',
        JSON.stringify({
          isRunning: true,
          sessionId: this.state.sessionId,
          taskName: this.state.taskName,
          durationMinutes: this.state.durationMinutes,
          startedAt: Date.now() - this.state.focusSeconds * 1000,
          distractSeconds: this.state.distractSeconds,
          distractionCount: this.state.distractionCount,
          blockedApps: this.state.blockedApps,
        })
      );
    } else {
      localStorage.removeItem('napas_active_focus_session');
    }
  }

  private initAgentListeners() {
    agentClient.onConnectionChange((connected) => {
      this.state.agentOnline = connected;
      if (connected) {
        if (!this.state.isRunning) {
          // FAILSAFE: Jika di web tidak ada sesi aktif, stop agent segera agar tidak memblokir browsing
          agentClient.stopSession();
          agentClient.setStudySite(undefined);
        } else {
          // Sinkronkan sesi aktif ke agent
          const keywords = extractAllKeywords(this.state.whitelist);
          agentClient.startSession({
            sessionId: this.state.sessionId || `ses-${Date.now()}`,
            action: 'warn_then_close',
            whitelist: this.state.whitelist.map((w) => w.domain),
            whitelist_keywords: keywords,
          });
          if (this.state.activeStudySite) {
            agentClient.setStudySite(this.state.activeStudySite.name, keywords);
          }
        }
      }
      this.emit();
    });

    agentClient.onStatus((status: AgentStatusEvent) => {
      this.state.agentWindow = status.active_window || 'Desktop';
      if (this.state.isRunning && status.is_active) {
        if (typeof status.focus_seconds === 'number' && status.focus_seconds > this.state.focusSeconds) {
          this.state.focusSeconds = status.focus_seconds;
        }
        if (typeof status.distraction_seconds === 'number' && status.distraction_seconds > 0) {
          this.state.distractSeconds = status.distraction_seconds;
        }
        if (typeof status.blocked_count === 'number' && status.blocked_count > 0) {
          this.state.distractionCount = status.blocked_count;
        }
      }
      this.emit();
    });

    agentClient.onWarning((evt) => {
      if (this.state.isRunning) {
        this.triggerDistractionWarning(evt.app || 'Aplikasi Terlarang', evt.countdown || 3);
      }
    });

    agentClient.onBlocked((evt) => {
      if (this.state.isRunning) {
        this.dismissDistractionWarning();
        this.state.distractionCount += 1;
        const app = evt.app || 'Aplikasi Terlarang';
        this.state.blockedApps[app] = (this.state.blockedApps[app] || 0) + 1;
        window.focus();
        this.emit();
        this.notify(evt.message, '🛡️');
      }
    });
  }

  // --- ACTIONS ---

  public setTaskName(name: string) {
    this.state.taskName = name;
    this.emit();
  }

  public setDurationMinutes(mins: number) {
    this.state.durationMinutes = mins;
    if (!this.state.isRunning) {
      this.state.secondsRemaining = mins * 60;
    }
    this.emit();
  }

  public saveWhitelist(items: WhitelistWebsite[]) {
    this.state.whitelist = items;
    localStorage.setItem('napas_focus_whitelist', JSON.stringify(items));
    const userId = getStoredUserId();
    if (userId) {
      api.updateProfile(userId, {
        focus_whitelist: items.map((i) => i.domain),
      });
    }
    this.emit();
  }

  public addWebsite(name: string, url: string): boolean {
    const domain = extractDomain(url);
    if (!domain) return false;

    const newItem: WhitelistWebsite = {
      id: `w-${Date.now()}`,
      name: name.trim() || domain,
      url: url.startsWith('http') ? url : `https://${url}`,
      domain,
      category: 'other',
      icon: '🌐',
    };

    const updated = [...this.state.whitelist, newItem];
    this.saveWhitelist(updated);
    this.notify(`Website "${newItem.name}" (${domain}) berhasil diizinkan!`, '✅');
    return true;
  }

  public removeWebsite(id: string) {
    const target = this.state.whitelist.find((w) => w.id === id);
    const updated = this.state.whitelist.filter((w) => w.id !== id);
    this.saveWhitelist(updated);
    this.notify(`"${target?.name || 'Website'}" dihapus dari whitelist.`, '🗑️');
  }

  public launchAllowedSite(site: WhitelistWebsite) {
    this.state.activeStudySite = site;
    this.emit();

    // Beritahukan ke desktop agent agar mencatat domain dan kata kunci situs belajar ini
    const keywords = extractAllKeywords([site, ...this.state.whitelist]);
    agentClient.setStudySite(site.name, keywords);

    window.open(site.url, '_blank');
    this.notify(
      `Membuka ${site.name} (${site.domain}). Waktu belajarmu tetap dihitung fokus! Bebas menjelajah seluruh modul/halaman.`,
      '🚀'
    );
  }

  public clearActiveStudySite() {
    this.state.activeStudySite = null;
    agentClient.setStudySite(undefined);
    this.emit();
  }

  public triggerDistractionWarning(siteOrAppName: string, initialCountdown = 3) {
    // Jangan pemicu warning jika yang dibuka adalah "Untitled" atau "New Tab" sementara
    const lower = siteOrAppName.toLowerCase().trim();
    if (
      lower === 'untitled' ||
      lower === 'new tab' ||
      lower === 'tab baru' ||
      lower === 'loading' ||
      lower === 'about:blank' ||
      lower === 'opera' ||
      lower === 'google chrome' ||
      lower === 'microsoft edge'
    ) {
      return;
    }

    if (!this.state.distractionWarning || !this.state.distractionWarning.active) {
      ambientAudio.playChime();
    }

    this.state.distractionWarning = {
      site: siteOrAppName,
      countdown: initialCountdown,
      active: true,
    };
    this.emit();

    if (this.warningTimerId) {
      clearInterval(this.warningTimerId);
    }

    let remaining = initialCountdown;
    this.warningTimerId = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (this.warningTimerId) {
          clearInterval(this.warningTimerId);
          this.warningTimerId = null;
        }
        this.dismissDistractionWarning();
        this.state.activeStudySite = null;
        this.state.distractionCount += 1;
        this.state.distractSeconds += initialCountdown;
        this.state.blockedApps[siteOrAppName] = (this.state.blockedApps[siteOrAppName] || 0) + 1;
        window.focus();
        this.emit();
        this.notify(
          `Distraksi "${siteOrAppName}" dicegah. Otomatis beralih kembali ke Ruang Belajar NAPAS! 🎯`,
          '🛡️'
        );
      } else {
        if (this.state.distractionWarning) {
          this.state.distractionWarning.countdown = remaining;
          this.emit();
        }
      }
    }, 1000);
  }

  public dismissDistractionWarning() {
    if (this.warningTimerId) {
      clearInterval(this.warningTimerId);
      this.warningTimerId = null;
    }
    this.state.distractionWarning = null;
    this.emit();
  }

  // START SESSION (GLOBAL & PERSISTENT)
  public async startSession() {
    const userId = getStoredUserId();
    if (!userId) {
      this.notify('Silakan login terlebih dahulu.', '⚠️');
      return;
    }

    const newSessionId = `ses-${Date.now()}`;
    this.state.isRunning = true;
    this.state.sessionId = newSessionId;
    this.state.secondsRemaining = this.state.durationMinutes * 60;
    this.state.focusSeconds = 0;
    this.state.distractSeconds = 0;
    this.state.distractionCount = 0;
    this.state.blockedApps = {};
    this.state.activeStudySite = null;
    this.state.distractionWarning = null;
    this.emit();

    ambientAudio.playChime();

    // Kirim keyword whitelist ke Desktop Agent
    const keywords = extractAllKeywords(this.state.whitelist);
    agentClient.startSession({
      sessionId: newSessionId,
      action: 'warn_then_close',
      whitelist: this.state.whitelist.map((w) => w.domain),
      whitelist_keywords: keywords,
    });

    // Catat ke backend
    const started = await api.startFocusSession({
      user_id: userId,
      judul: this.state.taskName,
      target_menit: this.state.durationMinutes,
      agent_connected: this.state.agentOnline,
    });

    if (started?.id) {
      this.state.sessionId = started.id;
      this.emit();
    }

    this.startTimerLoop();

    this.notify(
      `Sesi fokus ${this.state.durationMinutes} menit dimulai! Guard website aktif melindungi konsentrasimu.`,
      '🎯'
    );
  }

  private startTimerLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.timerId = window.setInterval(() => {
      if (!this.state.isRunning) return;

      this.state.secondsRemaining = Math.max(0, this.state.secondsRemaining - 1);
      this.state.focusSeconds += 1;

      if (this.state.secondsRemaining <= 0) {
        this.stopSession(true);
        return;
      }

      this.emit();
    }, 1000);
  }

  // STOP SESSION (GLOBAL & PERSISTENT)
  public async stopSession(completed = false) {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.dismissDistractionWarning();

    agentClient.setStudySite(undefined);
    agentClient.stopSession();
    ambientAudio.stop();
    this.state.activeSound = 'none';
    this.state.isRunning = false;
    this.state.activeStudySite = null;
    localStorage.removeItem('napas_active_focus_session');

    const sid = this.state.sessionId;
    const finalFocus = this.state.focusSeconds;
    const finalDistract = this.state.distractSeconds;
    const finalBlocked = { ...this.state.blockedApps };

    this.emit();

    if (sid) {
      await api.finishFocusSession(sid, {
        focus_seconds: finalFocus,
        distraction_seconds: finalDistract,
        blocked_apps: finalBlocked,
        completed,
      });
    }

    ambientAudio.playChime();

    this.notify(
      completed
        ? `🎉 Selamat! Sesi belajar ${this.state.durationMinutes} menit selesai dengan sukses!`
        : 'Sesi fokus diakhiri.',
      completed ? '🏆' : '⏹️'
    );

    if (this.onSessionCompletedCallback) {
      this.onSessionCompletedCallback();
    }
  }

  public setSound(sound: 'none' | 'rain' | 'binaural', volume = 0.3) {
    this.state.activeSound = sound;
    this.state.soundVolume = volume;
    if (sound === 'rain') ambientAudio.playRain(volume);
    else if (sound === 'binaural') ambientAudio.playBinaural(volume);
    else ambientAudio.stop();
    this.emit();
  }

  public setVolume(vol: number) {
    this.state.soundVolume = vol;
    ambientAudio.setVolume(vol);
    this.emit();
  }
}

export const focusStore = new FocusSessionStore();
