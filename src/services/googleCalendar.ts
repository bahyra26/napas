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
  isGoogleConnected(userId?: string): boolean {
    const token = authService.getStoredProviderToken();
    if (token && token.trim().length > 0) return true;
    if (userId) {
      const manualConnected = localStorage.getItem(`napas_google_connected_${userId}`);
      if (manualConnected === 'true') return true;
    }
    const globalConnected = localStorage.getItem('napas_google_connected_global');
    return globalConnected === 'true';
  },

  setGoogleConnected(userId: string, connected: boolean, count?: number) {
    if (connected) {
      localStorage.setItem(`napas_google_connected_${userId}`, 'true');
      localStorage.setItem('napas_google_connected_global', 'true');
      localStorage.setItem(`napas_calendar_last_sync_${userId}`, new Date().toISOString());
      if (count !== undefined) {
        localStorage.setItem(`napas_calendar_synced_count_${userId}`, String(count));
      }
    } else {
      localStorage.removeItem(`napas_google_connected_${userId}`);
      localStorage.removeItem('napas_google_connected_global');
      localStorage.removeItem(`napas_calendar_last_sync_${userId}`);
      localStorage.removeItem(`napas_calendar_synced_count_${userId}`);
    }
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

  getProviderToken(): string | null {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const pt = params.get('provider_token');
      if (pt) {
        localStorage.setItem('napas_provider_token', pt);
        return pt;
      }
    }
    return authService.getStoredProviderToken();
  },

  /**
   * Mengambil agenda ASLI langsung dari Google Calendar REST API menggunakan OAuth access token
   */
  async fetchAndSyncEvents(userId: string): Promise<{ success: boolean; count: number; message: string }> {
    const token = this.getProviderToken();
    if (!token) {
      return {
        success: false,
        count: 0,
        message: 'Akun Google belum terhubung atau sesi OAuth kedaluwarsa. Silakan klik "Hubungkan Google Calendar".',
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
            message: 'Sesi Google OAuth telah berakhir. Silakan hubungkan ulang akun Google Anda.',
          };
        }
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          count: 0,
          message: errJson?.error?.message || `Gagal membaca Google Calendar (HTTP ${res.status}).`,
        };
      }

      const data = await res.json();
      const rawEvents: GoogleCalendarEventItem[] = data.items || [];

      if (rawEvents.length === 0) {
        this.setGoogleConnected(userId, true, 0);
        return {
          success: true,
          count: 0,
          message: 'Akun Google Calendar terhubung! Tidak ada agenda terjadwal dalam 14 hari ke depan.',
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

      this.setGoogleConnected(userId, true, syncedCount);

      return {
        success: true,
        count: syncedCount,
        message: `Berhasil menyinkronkan ${syncedCount} agenda asli dari Google Calendar email Anda!`,
      };
    } catch (err: any) {
      console.warn('Google Calendar sync error:', err);
      return {
        success: false,
        count: 0,
        message: err?.message || 'Terjadi kesalahan saat menghubungi server Google Calendar.',
      };
    }
  },

  /**
   * Parser iCal (.ics) dari export file kalender atau link iCal Google
   */
  async parseAndSyncIcs(
    userId: string,
    icsContent: string
  ): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const events: any[] = [];
      const lines = icsContent.split(/\r\n|\n|\r/);
      let inEvent = false;
      let currentEvent: any = {};

      const parseIcsDate = (dateStr: string): string => {
        // Misal: 20261015T100000Z atau 20261015
        const clean = dateStr.replace(/^.*:/, '').trim();
        if (clean.length === 8) {
          const y = clean.substring(0, 4);
          const m = clean.substring(4, 6);
          const d = clean.substring(6, 8);
          return `${y}-${m}-${d}T23:59:00Z`;
        }
        if (clean.includes('T')) {
          const [dPart, tPart] = clean.split('T');
          const y = dPart.substring(0, 4);
          const m = dPart.substring(4, 6);
          const d = dPart.substring(6, 8);
          const hh = tPart.substring(0, 2);
          const mm = tPart.substring(2, 4);
          const ss = tPart.substring(4, 6) || '00';
          return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
        }
        return new Date().toISOString();
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('BEGIN:VEVENT')) {
          inEvent = true;
          currentEvent = { id: `ics-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
        } else if (line.startsWith('END:VEVENT')) {
          if (inEvent && currentEvent.summary) {
            events.push({
              id: currentEvent.id,
              summary: currentEvent.summary,
              start: currentEvent.start || new Date().toISOString(),
              end: currentEvent.end || currentEvent.start || new Date().toISOString(),
              all_day: currentEvent.all_day || false,
              description: currentEvent.description || '',
            });
          }
          inEvent = false;
          currentEvent = {};
        } else if (inEvent) {
          if (line.startsWith('SUMMARY:')) {
            currentEvent.summary = line.substring(8).trim();
          } else if (line.startsWith('DTSTART')) {
            currentEvent.start = parseIcsDate(line);
          } else if (line.startsWith('DTEND')) {
            currentEvent.end = parseIcsDate(line);
          } else if (line.startsWith('DESCRIPTION:')) {
            currentEvent.description = line.substring(12).trim();
          }
        }
      }

      if (events.length === 0) {
        return {
          success: false,
          count: 0,
          message: 'Tidak ditemukan agenda valid dalam file kalender iCal.',
        };
      }

      const syncRes = await api.syncGoogleCalendar(userId, events);
      const syncedCount = syncRes?.synced ?? events.length;
      this.setGoogleConnected(userId, true, syncedCount);

      return {
        success: true,
        count: syncedCount,
        message: `Berhasil mengimpor ${syncedCount} agenda kalender dari file .ics!`,
      };
    } catch (e: any) {
      return {
        success: false,
        count: 0,
        message: e?.message || 'Gagal memproses file iCal kalender.',
      };
    }
  },
};

