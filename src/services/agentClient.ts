/**
 * Client WebSocket & Cloud Bridge untuk berkomunikasi dengan NAPAS Focus Agent di laptop mahasiswa.
 * Bekerja mulus di Localhost (WebSocket) maupun saat dideploy di Vercel HTTPS (Cloud Poller).
 */

const API_BASE_URL =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('127.0.0.1') && !import.meta.env.VITE_API_URL.includes('localhost')
        ? import.meta.env.VITE_API_URL
        : '/api')
    : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export interface AgentStatusEvent {
  active_window: string;
  focus_seconds: number;
  distraction_seconds: number;
  blocked_count: number;
  is_active: boolean;
  session_id?: string;
}

export interface AgentBlockedEvent {
  app: string;
  title: string;
  action_taken: string;
  message: string;
}

export interface AgentWarningEvent {
  app: string;
  title: string;
  countdown: number;
  message: string;
}

type ConnectionCallback = (connected: boolean) => void;
type StatusCallback = (status: AgentStatusEvent) => void;
type BlockedCallback = (event: AgentBlockedEvent) => void;
type WarningCallback = (event: AgentWarningEvent) => void;

class AgentClient {
  private ws: WebSocket | null = null;
  private url = 'ws://127.0.0.1:8765';
  private isWsConnected = false;
  private isCloudConnected = false;
  private reconnectTimer: number | null = null;
  private pollTimer: number | null = null;

  private onConnectionListeners: ConnectionCallback[] = [];
  private onStatusListeners: StatusCallback[] = [];
  private onBlockedListeners: BlockedCallback[] = [];
  private onWarningListeners: WarningCallback[] = [];

  constructor() {
    this.connectWs();
    this.startCloudBridgePoll();
  }

  // 1. Direct WebSocket (Cepat untuk localhost development)
  public connectWs() {
    if (typeof window === 'undefined') return;
    // Jangan buka insecure ws:// jika halaman berada di https:// untuk mencegah error mixed content
    if (window.location.protocol === 'https:') {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.notifyConnection(true);
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            this.onStatusListeners.forEach((cb) => cb(data));
          } else if (data.type === 'app_blocked') {
            this.onBlockedListeners.forEach((cb) => cb(data));
          } else if (data.type === 'distraction_warning') {
            this.onWarningListeners.forEach((cb) => cb(data));
          } else if (data.type === 'agent_connected') {
            this.isWsConnected = true;
            this.notifyConnection(true);
          }
        } catch {}
      };

      this.ws.onclose = () => {
        if (this.isWsConnected) {
          this.isWsConnected = false;
          this.notifyConnection(this.isCloudConnected);
        }
        this.scheduleWsReconnect();
      };

      this.ws.onerror = () => {
        if (this.isWsConnected) {
          this.isWsConnected = false;
          this.notifyConnection(this.isCloudConnected);
        }
      };
    } catch {
      this.scheduleWsReconnect();
    }
  }

  private scheduleWsReconnect() {
    if (this.reconnectTimer || typeof window === 'undefined') return;
    if (window.location.protocol === 'https:') return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWs();
    }, 4000);
  }

  // 2. Cloud Bridge Poller (Bekerja 100% di Vercel HTTPS maupun Localhost)
  private startCloudBridgePoll() {
    if (typeof window === 'undefined') return;

    const poll = async () => {
      try {
        // A. Cek status live agent
        const liveRes = await fetch(`${API_BASE_URL}/focus-sessions/agent/live`, {
          signal: AbortSignal.timeout(2500),
        });
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          const online = Boolean(liveData.online);
          if (this.isCloudConnected !== online) {
            this.isCloudConnected = online;
            this.notifyConnection(this.isWsConnected || this.isCloudConnected);
          }
          if (online && !this.isWsConnected) {
            this.onStatusListeners.forEach((cb) =>
              cb({
                active_window: liveData.active_window || 'Desktop',
                focus_seconds: liveData.focus_seconds || 0,
                distraction_seconds: liveData.distraction_seconds || 0,
                blocked_count: liveData.blocked_count || 0,
                is_active: liveData.is_active || false,
                session_id: liveData.session_id,
              })
            );
          }
        }

        // B. Ambil event-event distraksi/blokir jika ada
        const evtRes = await fetch(`${API_BASE_URL}/focus-sessions/agent/events`, {
          signal: AbortSignal.timeout(2500),
        });
        if (evtRes.ok) {
          const evtData = await evtRes.json();
          if (Array.isArray(evtData.events)) {
            for (const evt of evtData.events) {
              if (evt.type === 'app_blocked') {
                this.onBlockedListeners.forEach((cb) => cb(evt));
              } else if (evt.type === 'distraction_warning') {
                this.onWarningListeners.forEach((cb) => cb(evt));
              }
            }
          }
        }
      } catch {}
    };

    // Jalankan segera dan interval tiap 1.5 detik
    poll();
    this.pollTimer = window.setInterval(poll, 1500);
  }

  private notifyConnection(state: boolean) {
    this.onConnectionListeners.forEach((cb) => cb(state));
  }

  public cleanup() {
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isAgentOnline(): boolean {
    return this.isWsConnected || this.isCloudConnected;
  }

  public onConnectionChange(cb: ConnectionCallback) {
    this.onConnectionListeners.push(cb);
    cb(this.isAgentOnline());
    return () => {
      this.onConnectionListeners = this.onConnectionListeners.filter((l) => l !== cb);
    };
  }

  public onStatus(cb: StatusCallback) {
    this.onStatusListeners.push(cb);
    return () => {
      this.onStatusListeners = this.onStatusListeners.filter((l) => l !== cb);
    };
  }

  public onBlocked(cb: BlockedCallback) {
    this.onBlockedListeners.push(cb);
    return () => {
      this.onBlockedListeners = this.onBlockedListeners.filter((l) => l !== cb);
    };
  }

  public onWarning(cb: WarningCallback) {
    this.onWarningListeners.push(cb);
    return () => {
      this.onWarningListeners = this.onWarningListeners.filter((l) => l !== cb);
    };
  }

  public startSession(params: {
    sessionId: string;
    whitelist?: string[];
    whitelist_keywords?: string[];
    blacklist?: string[];
    action?: string;
  }) {
    const payload = {
      type: 'start_session',
      session_id: params.sessionId,
      whitelist: params.whitelist,
      whitelist_keywords: params.whitelist_keywords,
      blacklist: params.blacklist,
      action: params.action || 'warn_then_close',
    };

    // 1. Kirim via WS jika aktif
    if (this.isWsConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {}
    }

    // 2. Kirim via Cloud Bridge Command
    fetch(`${API_BASE_URL}/focus-sessions/agent/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return true;
  }

  public setStudySite(site?: string, keywords?: string[]) {
    const payload = {
      type: 'set_study_site',
      site: site || null,
      keywords: keywords || [],
    };

    if (this.isWsConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {}
    }

    fetch(`${API_BASE_URL}/focus-sessions/agent/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return true;
  }

  public stopSession() {
    const payload = {
      type: 'stop_session',
    };

    if (this.isWsConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {}
    }

    fetch(`${API_BASE_URL}/focus-sessions/agent/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return true;
  }
}

export const agentClient = new AgentClient();
