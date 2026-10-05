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
  async fetchAndSyncEvents(userId: string): Promise<{ success: boolean; count: number; message: string }> {
    const token = authService.getStoredProviderToken();
    if (!token) {
      return {
        success: false,
        count: 0,
        message: 'Akses Google Calendar tidak ditemukan. Silakan login ulang dengan Google.',
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
          return {
            success: false,
            count: 0,
            message: 'Sesi Google telah kedaluwarsa. Silakan login ulang untuk menyinkronkan kalender.',
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
        return {
          success: true,
          count: 0,
          message: 'Tidak ada agenda terjadwal di Google Calendar dalam 14 hari ke depan.',
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
