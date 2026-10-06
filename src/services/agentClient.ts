/**
 * Client WebSocket untuk berkomunikasi dengan NAPAS Focus Agent di laptop mahasiswa (ws://127.0.0.1:8765).
 */

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
  private isConnected = false;
  private reconnectTimer: number | null = null;

  private onConnectionListeners: ConnectionCallback[] = [];
  private onStatusListeners: StatusCallback[] = [];
  private onBlockedListeners: BlockedCallback[] = [];
  private onWarningListeners: WarningCallback[] = [];

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
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
            this.isConnected = true;
            this.notifyConnection(true);
          }
        } catch {}
      };

      this.ws.onclose = () => {
        if (this.isConnected) {
          this.isConnected = false;
          this.notifyConnection(false);
        }
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.isConnected) {
          this.isConnected = false;
          this.notifyConnection(false);
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  private notifyConnection(state: boolean) {
    this.onConnectionListeners.forEach((cb) => cb(state));
  }

  public isAgentOnline(): boolean {
    return this.isConnected;
  }

  public onConnectionChange(cb: ConnectionCallback) {
    this.onConnectionListeners.push(cb);
    cb(this.isConnected);
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
    if (!this.isConnected || !this.ws) return false;
    this.ws.send(
      JSON.stringify({
        type: 'start_session',
        session_id: params.sessionId,
        whitelist: params.whitelist,
        whitelist_keywords: params.whitelist_keywords,
        blacklist: params.blacklist,
        action: params.action || 'warn_then_close',
      })
    );
    return true;
  }

  public setStudySite(site?: string, keywords?: string[]) {
    if (!this.isConnected || !this.ws) return false;
    this.ws.send(
      JSON.stringify({
        type: 'set_study_site',
        site: site || null,
        keywords: keywords || [],
      })
    );
    return true;
  }

  public stopSession() {
    if (!this.isConnected || !this.ws) return false;
    this.ws.send(
      JSON.stringify({
        type: 'stop_session',
      })
    );
    return true;
  }
}

export const agentClient = new AgentClient();
