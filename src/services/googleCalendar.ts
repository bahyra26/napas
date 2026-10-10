import { api } from './api';
import { authService } from './supabase';

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  description?: string;
}

export const googleCalendarService = {
  isGoogleConnected(): boolean {
    const token = authService.getStoredProviderToken();
    return Boolean(token && token.trim().length > 0);
  },

  getLastSyncInfo(userId: string): { lastSyncText: string | null; syncedCount: number } {
    try {
      const lastSyncIso = localStorage.getItem(`napas_calendar_last_sync_${userId}`);
      const countStr = localStorage.getItem(`napas_calendar_synced_count_${userId}`);
      const count = countStr ? parseInt(countStr, 10) : 0;
      if (!lastSyncIso) return { lastSyncText: null, syncedCount: count };

      const syncDate = new Date(lastSyncIso);
      const now = new Date();
      const isToday = syncDate.toDateString() === now.toDateString();

      const timeStr = syncDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
      const dateStr = syncDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      return {
        lastSyncText: isToday ? `Hari ini, ${timeStr} WIB` : `${dateStr}, ${timeStr} WIB`,
        syncedCount: count,
      };
    } catch {
      return { lastSyncText: null, syncedCount: 0 };
    }
  },

  async fetchAndSyncEvents(userId: string): Promise<{ success: boolean; count: number; message: string }> {
    const token = authService.getStoredProviderToken();
    if (!token) {
      return {
        success: false,
        count: 0,
        message: 'Akun Google belum terhubung. Silakan klik "Hubungkan Akun Google".',
      };
    }

    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('napas_provider_token');
          return {
            success: false,
            count: 0,
            message: 'Sesi Google telah kedaluwarsa. Silakan hubungkan ulang akun Google Anda.',
          };
        }
        return {
          success: false,
          count: 0,
          message: `Gagal membaca Google Calendar (HTTP ${res.status}).`,
        };
      }

      const data = await res.json();
      const rawEvents: GoogleCalendarEventItem[] = data.items || [];

      if (rawEvents.length === 0) {
        localStorage.setItem(`napas_calendar_last_sync_${userId}`, new Date().toISOString());
        localStorage.setItem(`napas_calendar_synced_count_${userId}`, '0');
        return {
          success: true,
          count: 0,
          message: 'Kalender Google aktif, namun belum ada agenda dalam 14 hari ke depan.',
        };
      }

      const formattedEvents = rawEvents.map((e) => {
        const startIso = e.start?.dateTime || e.start?.date || new Date().toISOString();
        const endIso = e.end?.dateTime || e.end?.date;
        return {
          id: e.id,
          summary: e.summary || 'Agenda Google',
          start: startIso,
          end: endIso,
          all_day: !e.start?.dateTime,
          description: e.description,
        };
      });

      const syncRes = await api.syncGoogleCalendar(userId, formattedEvents);
      const syncedCount = syncRes?.synced ?? formattedEvents.length;

      localStorage.setItem(`napas_calendar_last_sync_${userId}`, new Date().toISOString());
      localStorage.setItem(`napas_calendar_synced_count_${userId}`, String(syncedCount));

      return {
        success: true,
        count: syncedCount,
        message: `Berhasil menyinkronkan ${syncedCount} agenda dari Google Calendar!`,
      };
    } catch (err: any) {
      console.warn('Google Calendar sync error:', err);
      return {
        success: false,
        count: 0,
        message: err?.message || 'Terjadi kesalahan saat menghubungkan Google Calendar.',
      };
    }
  },
};
