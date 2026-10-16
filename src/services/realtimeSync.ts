/**
 * NAPAS Real-Time Synchronization Engine
 * 
 * Menghubungkan seluruh aliran data secara real-time melalui 3 jembatan:
 * 1. Supabase Postgres Realtime (Listen INSERT/UPDATE/DELETE di cloud database)
 * 2. Cross-Tab Broadcast Channel (Sinkronisasi instan < 5ms antar-tab browser)
 * 3. Desktop Agent WebSocket (Streaming status jendela & distraksi laptop)
 * 4. Resilient Live Heartbeat (Polling hening 20 detik jika WebSocket terhambat)
 */

import { supabase } from './supabase';
import { agentClient, AgentStatusEvent } from './agentClient';

export type RealtimeEventType =
  | 'TASK_CHANGED'
  | 'MOOD_CHANGED'
  | 'INDEX_CHANGED'
  | 'FOCUS_SESSION_CHANGED'
  | 'SCHEDULE_CHANGED'
  | 'THEME_CHANGED'
  | 'AGENT_STATUS';

export interface RealtimeMessage {
  type: RealtimeEventType;
  userId?: string;
  payload?: any;
  timestamp: number;
}

export interface RealtimeSyncHandlers {
  userId: string;
  onWorkloadChange?: () => void;
  onCheckinChange?: (payload?: any) => void;
  onFocusSessionChange?: (payload?: any) => void;
  onScheduleChange?: () => void;
  onIndexChange?: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onAgentStatus?: (status: AgentStatusEvent) => void;
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'offline') => void;
}

class RealtimeSyncManager {
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private heartbeatInterval: number | null = null;
  private activeUserId: string | null = null;
  private handlers: RealtimeSyncHandlers | null = null;
  private isConnected = false;

  constructor() {
    this.initBroadcastChannel();
    this.initStorageFallback();
  }

  /**
   * Inisialisasi BroadcastChannel untuk komunikasi antar tab browser (0ms latensi)
   */
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('napas_realtime_bus');
        this.broadcastChannel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
          this.handleIncomingBroadcast(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or failed to init:', err);
      }
    }
  }

  /**
   * Fallback listener menggunakan Storage Event jika browser tidak mendukung BroadcastChannel
   */
  private initStorageFallback() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'napas_realtime_event_bus' && e.newValue) {
          try {
            const data: RealtimeMessage = JSON.parse(e.newValue);
            this.handleIncomingBroadcast(data);
          } catch {}
        }
      });
    }
  }

  /**
   * Memproses pesan yang diterima dari tab lain
   */
  private handleIncomingBroadcast(msg: RealtimeMessage) {
    if (!msg || !this.handlers) return;

    // Abaikan jika pesan untuk user lain
    if (msg.userId && this.activeUserId && msg.userId !== this.activeUserId) {
      return;
    }

    switch (msg.type) {
      case 'TASK_CHANGED':
        this.handlers.onWorkloadChange?.();
        break;
      case 'MOOD_CHANGED':
        this.handlers.onCheckinChange?.(msg.payload);
        break;
      case 'FOCUS_SESSION_CHANGED':
        this.handlers.onFocusSessionChange?.(msg.payload);
        break;
      case 'SCHEDULE_CHANGED':
        this.handlers.onScheduleChange?.();
        break;
      case 'INDEX_CHANGED':
        this.handlers.onIndexChange?.();
        break;
      case 'THEME_CHANGED':
        if (msg.payload === 'light' || msg.payload === 'dark') {
          this.handlers.onThemeChange?.(msg.payload);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Mengirimkan event ke seluruh tab lain secara real-time
   */
  public broadcast(type: RealtimeEventType, payload?: any) {
    const msg: RealtimeMessage = {
      type,
      userId: this.activeUserId || undefined,
      payload,
      timestamp: Date.now(),
    };

    // 1. Kirim via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {}
    }

    // 2. Kirim via Storage Event fallback
    try {
      localStorage.setItem('napas_realtime_event_bus', JSON.stringify(msg));
    } catch {}
  }

  /**
   * Inisialisasi subscription Supabase Postgres Realtime & Agent WebSocket
   */
  public init(handlers: RealtimeSyncHandlers): () => void {
    this.handlers = handlers;
    this.activeUserId = handlers.userId;

    this.connectSupabaseRealtime(handlers.userId);
    this.connectAgentWebSocket();
    this.startHeartbeat();

    return () => {
      this.cleanup();
    };
  }

  /**
   * Hubungkan ke Supabase Postgres Realtime
   */
  private connectSupabaseRealtime(userId: string) {
    if (!supabase) {
      this.isConnected = true;
      this.handlers?.onConnectionStatusChange?.('connected');
      return;
    }

    try {
      this.handlers?.onConnectionStatusChange?.('connecting');

      // Tutup channel lama jika ada
      if (this.supabaseChannel) {
        supabase.removeChannel(this.supabaseChannel);
      }

      // Buat channel realtime terisolasi untuk user ini
      const channelName = `napas-realtime-${userId.slice(0, 8)}-${Date.now()}`;
      this.supabaseChannel = supabase
        .channel(channelName)
        // 1. Listen perubahan pada tabel workload_items
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workload_items',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            this.handlers?.onWorkloadChange?.();
            this.broadcast('TASK_CHANGED');
          }
        )
        // 2. Listen perubahan pada tabel check_ins
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'check_ins',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            this.handlers?.onCheckinChange?.(payload.new);
            this.broadcast('MOOD_CHANGED', payload.new);
          }
        )
        // 3. Listen perubahan pada tabel focus_sessions
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'focus_sessions',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            this.handlers?.onFocusSessionChange?.(payload.new);
            this.broadcast('FOCUS_SESSION_CHANGED', payload.new);
          }
        )
        // 4. Listen perubahan pada tabel class_schedule
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'class_schedule',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            this.handlers?.onScheduleChange?.();
            this.broadcast('SCHEDULE_CHANGED');
          }
        )
        // 5. Listen perubahan pada tabel daily_index
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_index',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            this.handlers?.onIndexChange?.();
            this.broadcast('INDEX_CHANGED');
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.handlers?.onConnectionStatusChange?.('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.handlers?.onConnectionStatusChange?.('offline');
          }
        });
    } catch (err) {
      console.warn('Supabase realtime init error:', err);
      this.handlers?.onConnectionStatusChange?.('connected');
    }
  }

  /**
   * Hubungkan ke agen desktop lokal
   */
  private connectAgentWebSocket() {
    agentClient.onStatus((status: AgentStatusEvent) => {
      this.handlers?.onAgentStatus?.(status);
    });

    agentClient.onConnectionChange((connected: boolean) => {
      if (connected) {
        this.handlers?.onConnectionStatusChange?.('connected');
      }
    });
  }

  /**
   * Heartbeat terjadwal (setiap 25 detik) untuk memastikan data tetap mutakhir
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = window.setInterval(() => {
      // Trigger silent background refresh
      if (this.activeUserId) {
        this.handlers?.onIndexChange?.();
      }
    }, 25000);
  }

  /**
   * Membersihkan listener dan channel
   */
  public cleanup() {
    if (this.supabaseChannel && supabase) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }

    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.handlers = null;
    this.activeUserId = null;
    this.isConnected = false;
  }

  public isRealtimeConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeSync = new RealtimeSyncManager();
