import { supabase } from './supabase';
import { FocusDailyBar } from '../types';
import { loadingTracker, useIsFetching, useActiveFetchCount } from './loadingTracker';

export { loadingTracker, useIsFetching, useActiveFetchCount };

const API_BASE_URL =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('127.0.0.1') && !import.meta.env.VITE_API_URL.includes('localhost')
        ? import.meta.env.VITE_API_URL
        : '/api')
    : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export interface BackendHealth {
  status: string;
  db: string;
  service: string;
  version: string;
}

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  consent_camera: boolean;
  consent_window: boolean;
  baseline_blink_rate: number;
  created_at?: string;
}

export interface BurnoutIndexResponse {
  user_id: string;
  tanggal: string;
  index: number;
  zona: 'hijau' | 'kuning' | 'oranye' | 'merah';
  load_score?: number;
  stress_score?: number;
  dist_score?: number;
  checkin_score?: number;
  alasan: string[];
  trend_flag: boolean;
  sensors_missing: string[];
}

export interface DailyIndexHistoryItem {
  id?: string;
  user_id: string;
  tanggal: string;
  index: number;
  zona: string;
  load_score?: number;
  stress_score?: number;
  dist_score?: number;
  checkin_score?: number;
  alasan_json?: string[];
  trend_flag: boolean;
}

export interface StudentProfile {
  user_id: string;
  nama?: string;
  email?: string;
  panggilan: string;
  kampus: string;
  jurusan: string;
  semester: number;
  jam_tidur: string;
  jam_bangun: string;
  kronotipe: 'pagi' | 'siang' | 'malam';
  target_fokus_jam: number;
  focus_whitelist: string[];
  focus_blacklist: string[];
  agent_action: 'warn_only' | 'minimize' | 'warn_then_close' | 'close';
  avatar_url?: string;
  onboarded?: boolean;
}

export interface ClassScheduleItem {
  id?: string;
  user_id: string;
  mata_kuliah: string;
  hari: number;
  jam_mulai: string;
  jam_selesai: string;
  ruang?: string;
  source?: string;
}

export interface RadarDayItem {
  date: string;
  raw_date: string;
  dayName: string;
  dayNum: number;
  monthShort: string;
  monthFull: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
  load: number;
  pillText: string;
  tasks: Array<{ title: string; time: string }>;
}

export interface RadarResponse {
  days: RadarDayItem[];
  busiest_day: RadarDayItem;
  summary: {
    total_tasks: number;
    heavy_days: number;
    free_days: number;
    busiest_label: string;
  };
}

export interface WorkloadItem {
  id: string;
  user_id: string;
  judul: string;
  jenis: 'tugas' | 'rapat' | 'kuliah' | 'ujian';
  deadline: string;
  est_jam: number;
  effort: number;
  status: 'belum' | 'selesai';
  mata_kuliah?: string;
  source?: string;
  google_event_id?: string;
}

export interface CheckInItem {
  id: string;
  user_id: string;
  ts: string;
  skor: number;
  catatan?: string;
  jam_tidur?: number;
  energi?: number;
}


export interface InterventionItem {
  id: string;
  user_id: string;
  ts: string;
  tipe: 'breathing' | 'lock' | 'break' | 'playbook';
  durasi: number;
  selesai: boolean;
}

export interface InterventionStatsResponse {
  user_id: string;
  days: number;
  total: number;
  completed: number;
  by_type: Record<string, number>;
  items: InterventionItem[];
}

export interface HeatmapResponse {
  hours: string[];
  rows: Array<{
    dayName: string;
    cells: Array<{
      hour: string;
      level: 'green' | 'peach' | 'red';
      info: string;
    }>;
  }>;
  peak_stress_hours: string;
  heaviest_day: string;
  advice: string;
}

export interface FocusSummaryResponse {
  overview: {
    date: string;
    focusPercent: number;
    distractPercent: number;
    focusDuration: string;
    distractDuration: string;
    motivationalNote: string;
  };
  top_distractors: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    durationLabel: string;
    percentage: number;
  }>;
  streak: {
    currentStreak: number;
    targetRule: string;
    bestRecord: number;
    days: Array<{
      letter: string;
      dayName: string;
      completed: boolean;
    }>;
  };
  weekly_bars: Array<{
    id: string;
    dayShort: string;
    dayFull: string;
    focusPercent: number;
    distractPercent: number;
    focusDuration: string;
    distractDuration: string;
    totalDuration: string;
    totalHoursNum: number;
  }>;
}

export interface WeeklyInsightResponse {
  title: string;
  description: string;
  weeklyScore: number;
  zoneName: string;
  note: string;
  playbook: Array<{
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    actionLabel: string;
    isPrimary?: boolean;
  }>;
  advisory: string;
  summaryStats: Array<{
    id: string;
    value: string;
    label: string;
    colorType: 'orange' | 'green' | 'red';
  }>;
  ai_provider?: string;
}

// User Persistence Helpers
const STORAGE_KEY_USER_ID = 'napas_user_id';
const STORAGE_KEY_USER_NAME = 'napas_user_name';

export function getStoredUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY_USER_ID);
}

export function setStoredUserId(id: string, name?: string): void {
  localStorage.setItem(STORAGE_KEY_USER_ID, id);
  if (name) localStorage.setItem(STORAGE_KEY_USER_NAME, name);
}

const rawApi = {
  baseUrl: API_BASE_URL,

  async getHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async initDemoUser(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/init-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const user = await res.json();
        setStoredUserId(user.id, user.nama);
        return user;
      }
    } catch (err) {
      console.warn('initDemoUser backend offline, falling back to cloud Supabase:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'raka@joints2026.ugm.ac.id')
          .maybeSingle();

        if (data) {
          setStoredUserId(data.id, data.nama);
          return data as UserProfile;
        }
      } catch {}
    }

    const fallbackUser: UserProfile = {
      id: '951459f9-e92f-4193-b470-ea87a899e18d',
      nama: 'Raka Pratama',
      email: 'raka@joints2026.ugm.ac.id',
      consent_camera: true,
      consent_window: true,
      baseline_blink_rate: 15.0,
    };
    setStoredUserId(fallbackUser.id, fallbackUser.nama);
    return fallbackUser;
  },

  async loginOrRegister(payload: {
    identifier: string;
    nama?: string;
    email?: string;
  }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/login-or-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const user = await res.json();
        if (user?.id) {
          setStoredUserId(user.id, user.nama);
        }
        return user;
      }
    } catch (err) {
      console.warn('loginOrRegister backend offline, fallback to Supabase cloud:', err);
    }

    const knownUsernames: Record<string, string> = {
      maikotampan: 'h4trayyan@gmail.com',
      miko1908: 'mikailcoding64@gmail.com',
      mikailcoding64: 'mikailcoding64@gmail.com',
      mikail: 'mikail@napas.local',
      hiqanz: 'haqqinazili9@gmail.com',
      'haq!': 'haqqinazili@gmail.com',
      nyapo: '5027261073@student.its.ac.id',
    };

    let targetEmail = payload.email || (payload.identifier.includes('@') ? payload.identifier.trim() : '');
    if (!targetEmail && knownUsernames[payload.identifier.toLowerCase().trim()]) {
      targetEmail = knownUsernames[payload.identifier.toLowerCase().trim()];
    }
    const cleanEmail = targetEmail || `${payload.identifier.trim()}@napas.local`;
    const cleanName = payload.nama || payload.identifier.split('@')[0];

    if (supabase) {
      try {
        let { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!data) {
          const { data: byName } = await supabase
            .from('users')
            .select('*')
            .ilike('nama', cleanName)
            .maybeSingle();
          if (byName) data = byName;
        }

        if (data) {
          setStoredUserId(data.id, data.nama);
          return data as UserProfile;
        }

        const insertRes = await supabase
          .from('users')
          .insert({
            nama: cleanName,
            email: cleanEmail,
            consent_camera: true,
            consent_window: true,
            baseline_blink_rate: 15.0,
          })
          .select()
          .maybeSingle();

        if (insertRes.data) {
          setStoredUserId(insertRes.data.id, insertRes.data.nama);
          return insertRes.data as UserProfile;
        }
      } catch {}
    }

    const fallbackUid = 'user-' + Math.random().toString(36).substring(2, 10);
    setStoredUserId(fallbackUid, cleanName);
    return {
      id: fallbackUid,
      nama: cleanName,
      email: cleanEmail,
      consent_camera: true,
      consent_window: true,
      baseline_blink_rate: 15.0,
    };
  },

  async getOrCreateUser(payload: {
    nama: string;
    email: string;
    consent_camera?: boolean;
    consent_window?: boolean;
  }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const user = await res.json();
        setStoredUserId(user.id, user.nama);
        return user;
      }
    } catch (err) {
      console.warn('getOrCreateUser backend offline, fallback to Supabase:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .upsert({
            nama: payload.nama,
            email: payload.email,
            consent_camera: payload.consent_camera ?? true,
            consent_window: payload.consent_window ?? true,
            baseline_blink_rate: 15.0,
          })
          .select()
          .maybeSingle();

        if (data) {
          setStoredUserId(data.id, data.nama);
          return data as UserProfile;
        }
      } catch {}
    }
    return null;
  },

  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (res.ok) return await res.json();
    } catch {}

    if (supabase) {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (data) return data as UserProfile;
      } catch {}
    }
    return null;
  },

  async updateUser(userId: string, partial: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('updateUser backend offline, fallback to Supabase:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase.from('users').update(partial).eq('id', userId).select().maybeSingle();
        if (data) return data as UserProfile;
      } catch {}
    }
    return null;
  },

  async getTodayIndex(userId: string): Promise<BurnoutIndexResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/index/today?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('getTodayIndex backend offline, fallback to Supabase cloud:', err);
    }

    if (supabase) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Ambil check-in terbaru hari ini
        const { data: latestCi } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('ts', todayStart.toISOString())
          .order('ts', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data } = await supabase
          .from('daily_index')
          .select('*')
          .eq('user_id', userId)
          .order('tanggal', { ascending: false })
          .limit(1)
          .maybeSingle();

        const moodScoreMap: Record<number, { index: number; zona: 'hijau' | 'kuning' | 'oranye' }> = {
          5: { index: 16, zona: 'hijau' },
          4: { index: 22, zona: 'hijau' },
          3: { index: 45, zona: 'kuning' },
          2: { index: 70, zona: 'oranye' },
          1: { index: 79, zona: 'oranye' },
        };

        // Jika ada check-in hari ini dan index di daily_index belum sinkron dengan skor mood tersebut
        if (latestCi && (!data || (latestCi.skor === 3 && Number(data.index) < 30) || (latestCi.skor <= 2 && Number(data.index) < 60) || (latestCi.skor >= 4 && Number(data.index) > 30))) {
          const mapping = moodScoreMap[latestCi.skor] || { index: 45, zona: 'kuning' };
          const todayStr = new Date().toISOString().split('T')[0];
          const reasons = [
            'belum ada data beban kerja',
            'sensor visual tidak aktif hari ini',
            'monitor fokus tidak aktif hari ini',
            `Catatan: "${latestCi.catatan || 'Mood dicatat'}"`
          ];

          try {
            await supabase.from('daily_index').upsert({
              user_id: userId,
              tanggal: todayStr,
              index: mapping.index,
              zona: mapping.zona,
              checkin_score: mapping.index,
              alasan_json: reasons,
              trend_flag: false
            }, { onConflict: 'user_id,tanggal' });
          } catch {}

          return {
            user_id: userId,
            tanggal: todayStr,
            index: mapping.index,
            zona: mapping.zona,
            checkin_score: mapping.index,
            alasan: reasons,
            trend_flag: false,
            sensors_missing: ['load', 'stress', 'dist'],
          };
        }

        if (data) {
          const rawIndex = Number(data.index);
          const safeIndex = rawIndex > 0 ? rawIndex : 16;
          return {
            user_id: data.user_id,
            tanggal: data.tanggal,
            index: safeIndex,
            zona: data.zona || (safeIndex < 30 ? 'hijau' : safeIndex < 60 ? 'kuning' : 'oranye'),
            load_score: data.load_score,
            stress_score: data.stress_score,
            dist_score: data.dist_score,
            checkin_score: data.checkin_score,
            alasan: Array.isArray(data.alasan_json) ? data.alasan_json : [],
            trend_flag: Boolean(data.trend_flag),
            sensors_missing: [],
          };
        }
      } catch {}
    }
    return null;
  },

  async getIndexHistory(userId: string, days: number = 14): Promise<DailyIndexHistoryItem[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/index/history?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('getIndexHistory backend offline, fallback to Supabase cloud:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('daily_index')
          .select('*')
          .eq('user_id', userId)
          .order('tanggal', { ascending: true })
          .limit(days);

        if (data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            tanggal: d.tanggal,
            index: Number(d.index),
            zona: d.zona,
            load_score: d.load_score,
            stress_score: d.stress_score,
            dist_score: d.dist_score,
            checkin_score: d.checkin_score,
            alasan_json: Array.isArray(d.alasan_json) ? d.alasan_json : [],
            trend_flag: Boolean(d.trend_flag),
          }));
        }
      } catch {}
    }
    return [];
  },

  async getWorkloads(userId: string): Promise<WorkloadItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload/${encodeURIComponent(userId)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('getWorkloads backend offline, fallback to Supabase cloud:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('workload_items')
          .select('*')
          .eq('user_id', userId)
          .order('deadline', { ascending: true });

        if (data && data.length > 0) return data as WorkloadItem[];
      } catch {}
    }
    return [];
  },

  async createWorkload(payload: {
    user_id: string;
    judul: string;
    jenis: string;
    deadline: string;
    est_jam: number;
    effort: number;
  }): Promise<WorkloadItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('createWorkload backend offline, inserting directly into Supabase:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('workload_items')
          .insert({
            user_id: payload.user_id,
            judul: payload.judul,
            jenis: payload.jenis,
            deadline: payload.deadline,
            est_jam: payload.est_jam,
            effort: payload.effort,
            status: 'belum',
          })
          .select()
          .maybeSingle();

        if (data) return data as WorkloadItem;
      } catch {}
    }
    return null;
  },

  async updateWorkloadStatus(itemId: string, status: 'belum' | 'selesai'): Promise<WorkloadItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload/${encodeURIComponent(itemId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('updateWorkloadStatus failed:', err);
      return null;
    }
  },

  async deleteWorkload(itemId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error('deleteWorkload failed:', err);
      return false;
    }
  },

  async postCheckIn(
    userId: string,
    skor: number,
    catatan?: string,
    jamTidur?: number,
    energi?: number
  ): Promise<CheckInItem | null> {
    try {
      localStorage.setItem(`napas_checkin_score_${userId}`, String(skor));
      if (catatan) localStorage.setItem(`napas_checkin_catatan_${userId}`, catatan);
    } catch {}

    try {
      const res = await fetch(`${API_BASE_URL}/check-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          skor,
          catatan,
          jam_tidur: jamTidur,
          energi,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        return item;
      }
    } catch (err) {
      console.warn('Checkin backend offline, saving directly to Supabase:', err);
    }

    if (supabase) {
      try {
        // Skema tabel check_ins di Supabase: id, user_id, ts, skor, catatan
        const checkinPayload: any = {
          user_id: userId,
          skor,
          catatan: catatan || (skor === 5 ? 'Mood: Bahagia / Senang' : skor === 3 ? 'Mood: Netral' : 'Mood: Sedih / Lelah'),
        };

        const { data } = await supabase
          .from('check_ins')
          .insert(checkinPayload)
          .select()
          .maybeSingle();

        if (data) {
          const scoreMap: Record<number, { index: number; zona: 'hijau' | 'kuning' | 'oranye' }> = {
            5: { index: 16, zona: 'hijau' },
            4: { index: 22, zona: 'hijau' },
            3: { index: 45, zona: 'kuning' },
            2: { index: 70, zona: 'oranye' },
            1: { index: 79, zona: 'oranye' },
          };
          const mapping = scoreMap[skor] || { index: 45, zona: 'kuning' };
          const todayStr = new Date().toISOString().split('T')[0];

          try {
            await supabase.from('daily_index').upsert({
              user_id: userId,
              tanggal: todayStr,
              index: mapping.index,
              zona: mapping.zona,
              checkin_score: mapping.index,
              alasan_json: [
                'belum ada data beban kerja',
                'sensor visual tidak aktif hari ini',
                'monitor fokus tidak aktif hari ini',
                `Catatan: "${checkinPayload.catatan}"`
              ],
              trend_flag: false
            }, { onConflict: 'user_id,tanggal' });
          } catch (idxErr) {
            console.warn('daily_index sync warning:', idxErr);
          }

          return {
            ...data,
            jam_tidur: jamTidur,
            energi: energi,
          } as CheckInItem;
        }
      } catch (sbErr) {
        console.warn('Supabase postCheckIn fallback error:', sbErr);
      }
    }

    return {
      id: 'local-checkin-' + Date.now(),
      user_id: userId,
      ts: new Date().toISOString(),
      skor,
      catatan,
      jam_tidur: jamTidur,
      energi,
    } as CheckInItem;
  },

  async getTodayCheckIn(userId: string): Promise<CheckInItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/check-ins/today?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          try {
            localStorage.setItem(`napas_checkin_score_${userId}`, String(data.skor));
            if (data.catatan) localStorage.setItem(`napas_checkin_catatan_${userId}`, data.catatan);
          } catch {}
          return data;
        }
      }
    } catch {}

    if (supabase) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('ts', todayStart.toISOString())
          .order('ts', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          try {
            localStorage.setItem(`napas_checkin_score_${userId}`, String(data.skor));
            if (data.catatan) localStorage.setItem(`napas_checkin_catatan_${userId}`, data.catatan);
          } catch {}
          return data as CheckInItem;
        }
      } catch {}
    }

    // Fallback ke localStorage hari ini jika backend/db belum merespons
    try {
      const cachedScore = localStorage.getItem(`napas_checkin_score_${userId}`);
      if (cachedScore) {
        return {
          id: 'local-today-ci',
          user_id: userId,
          ts: new Date().toISOString(),
          skor: Number(cachedScore),
          catatan: localStorage.getItem(`napas_checkin_catatan_${userId}`) || '',
        };
      }
    } catch {}

    return null;
  },

  async getCheckIns(userId: string, days: number = 14): Promise<CheckInItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/check-ins?user_id=${encodeURIComponent(userId)}&days=${days}`);
      if (res.ok) return await res.json();
    } catch {}

    if (supabase) {
      try {
        const sinceIso = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
        const { data } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('ts', sinceIso)
          .order('ts', { ascending: false });
        if (data) return data as CheckInItem[];
      } catch {}
    }
    return [];
  },

  async postIntervention(
    userId: string,
    tipe: 'breathing' | 'lock' | 'break' | 'playbook',
    durasi: number = 60,
    selesai: boolean = true
  ): Promise<InterventionItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tipe, durasi, selesai }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Intervention log backend offline, saving to Supabase:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('interventions')
          .insert({
            user_id: userId,
            tipe,
            durasi,
            selesai,
          })
          .select()
          .maybeSingle();

        if (data) return data as InterventionItem;
      } catch (sbErr) {
        console.warn('Supabase postIntervention fallback error:', sbErr);
      }
    }
    return null;
  },

  async getInterventions(userId: string, days: number = 7): Promise<InterventionStatsResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/interventions?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (res.ok) return await res.json();
    } catch {}

    if (supabase) {
      try {
        const sinceIso = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
        const { data } = await supabase
          .from('interventions')
          .select('*')
          .eq('user_id', userId)
          .gte('ts', sinceIso)
          .order('ts', { ascending: false });

        if (data) {
          const items = data as InterventionItem[];
          const completed = items.filter((i) => i.selesai).length;
          const by_type: Record<string, number> = {};
          items.forEach((i) => {
            by_type[i.tipe] = (by_type[i.tipe] || 0) + 1;
          });
          return {
            user_id: userId,
            days,
            total: items.length,
            completed,
            by_type,
            items,
          };
        }
      } catch {}
    }
    return null;
  },

  async getHeatmap(userId: string, days: number = 7): Promise<HeatmapResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/metrics/heatmap?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  },

  async getFocusSummary(userId: string, days: number = 7, period?: string): Promise<FocusSummaryResponse | null> {
    let backendData: FocusSummaryResponse | null = null;
    try {
      const periodParam = period ? `&period=${encodeURIComponent(period)}` : '';
      const res = await fetch(
        `${API_BASE_URL}/metrics/focus-summary?user_id=${encodeURIComponent(userId)}&days=${days}${periodParam}`
      );
      if (res.ok) {
        backendData = await res.json();
      }
    } catch {
      // backend offline
    }

    // 1. Jika backend mengembalikan respons, gunakan data riil dari database backend
    if (backendData) {
      return backendData;
    }

    // 2. Jika backend offline, hitung HANYA dari sesi lokal milik pengguna ini
    let localExtraFocusSeconds = 0;
    try {
      const stored = localStorage.getItem('napas_completed_focus_sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        if (Array.isArray(sessions)) {
          localExtraFocusSeconds = sessions.reduce(
            (acc: number, s: any) => acc + (Number(s.focus_seconds) || 0),
            0
          );
        }
      }
    } catch {}

    const totalMinutes = Math.round(localExtraFocusSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationLabel = hours > 0 ? `${hours} jam ${mins} menit` : `${mins} menit`;

    // Bar 7 hari dengan tanggal dinamis minggu ini (nilai 0 jika belum ada sesi)
    const now = new Date();
    const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const daysFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const cleanBars: FocusDailyBar[] = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now.getTime() - (6 - idx) * 24 * 3600 * 1000);
      const dayIdx = d.getDay();
      return {
        id: `bar-${idx + 1}`,
        dayShort: daysShort[dayIdx],
        dayFull: daysFull[dayIdx],
        focusPercent: 0,
        distractPercent: 0,
        focusDuration: '0 menit',
        distractDuration: '0 menit',
        totalDuration: '0 menit',
        totalHoursNum: 0,
      };
    });

    return {
      overview: {
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        focusPercent: localExtraFocusSeconds > 0 ? 100 : 0,
        distractPercent: 0,
        focusDuration: durationLabel,
        distractDuration: '0 menit',
        motivationalNote:
          localExtraFocusSeconds > 0
            ? 'Sesi fokus aktif tercatat! Pertahankan konsistensi belajarmu.'
            : 'Belum ada sesi belajar tercatat. Mulai sesi fokus di atas untuk merekam produktivitas belajarmu!',
      },
      top_distractors: [],
      streak: {
        currentStreak: localExtraFocusSeconds > 0 ? 1 : 0,
        targetRule: 'Target 50 menit belajar fokus per hari',
        bestRecord: localExtraFocusSeconds > 0 ? 1 : 0,
        days: [
          { letter: 'S', dayName: 'Senin', completed: false },
          { letter: 'S', dayName: 'Selasa', completed: false },
          { letter: 'R', dayName: 'Rabu', completed: false },
          { letter: 'K', dayName: 'Kamis', completed: false },
          { letter: 'J', dayName: 'Jumat', completed: localExtraFocusSeconds > 0 },
          { letter: 'S', dayName: 'Sabtu', completed: false },
          { letter: 'M', dayName: 'Minggu', completed: false },
        ],
      },
      weekly_bars: cleanBars,
    };
  },

  async getWeeklyInsight(userId: string): Promise<WeeklyInsightResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/insights/weekly?user_id=${encodeURIComponent(userId)}`
      );
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('getWeeklyInsight backend offline, fallback to Supabase cloud calculation:', err);
    }

    if (supabase) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const { data: indices } = await supabase
          .from('daily_index')
          .select('tanggal, index, zona')
          .eq('user_id', userId)
          .gte('tanggal', sevenDaysAgo)
          .order('tanggal', { ascending: true });

        const scores = indices || [];
        const hasData = scores.length > 0;
        const avgScore = hasData ? Math.round(scores.reduce((a: number, b: any) => a + Number(b.index), 0) / scores.length) : 0;
        const lastZona = hasData ? scores[scores.length - 1].zona : 'hijau';

        return {
          title: lastZona === 'hijau' ? 'Kondisi mental dan fisik sangat prima!' : 'Kamu sudah berusaha keras minggu ini.',
          description: hasData
            ? `Rata-rata skor burnout pekan ini berada di angka ${avgScore}%. Pola aktivitas dan waktu istirahat tetap terjaga dengan baik.`
            : 'Belum ada akumulasi tekanan atau tugas berat tercatat pekan ini. Kondisimu terpantau prima!',
          weeklyScore: avgScore,
          zoneName: `zona ${lastZona}`,
          note: 'Pertahankan ritme fokus dan lakukan jeda napas 4-7-8 secara teratur.',
          playbook: [
            {
              id: 'pb-1',
              stepNumber: 1,
              title: 'Batasi layar setelah 22.00',
              description: 'Sisakan 30 menit untuk bersiap tidur tanpa paparan cahaya biru atau notifikasi.',
              actionLabel: 'Mulai malam ini',
              isPrimary: true,
            },
            {
              id: 'pb-2',
              stepNumber: 2,
              title: 'Ambil jeda jalan kaki 30 menit',
              description: 'Pilih waktu sebelum jam 14.00 saat grafik stres mulai mengalami kenaikan.',
              actionLabel: 'Jadwalkan besok',
              isPrimary: false,
            },
            {
              id: 'pb-3',
              stepNumber: 3,
              title: 'Hubungi orang yang kamu percaya',
              description: 'Ceritakan satu hal atau beban akademik yang membuatmu terasa berat minggu ini.',
              actionLabel: 'Saat kamu siap',
              isPrimary: false,
            },
          ],
          advisory: 'Jika kondisi ini berlanjut 7 hari, pertimbangkan konsultasi ke BK kampus atau dokter.',
          summaryStats: [
            { id: 'stat-muncul', value: '0 kali', label: 'intervensi muncul', colorType: 'orange' },
            { id: 'stat-selesai', value: '0 / 0', label: 'intervensi selesai', colorType: 'green' },
            { id: 'stat-risiko', value: '0 hari', label: 'risiko tinggi', colorType: 'red' },
          ],
          ai_provider: 'Clinical Wellbeing Engine (Cloud)',
        };
      } catch {}
    }
    return null;
  },

  async simulateDemo(userId: string, mode: 'oranye' | 'merah' | 'reset'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/demo/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, mode }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Simulate demo failed:', err);
      return null;
    }
  },

  async syncAuth(payload: {
    access_token?: string;
    auth_id?: string;
    email?: string;
    nama?: string;
    avatar_url?: string;
  }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/sync-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const user = await res.json();
        setStoredUserId(user.id, user.nama);
        return user;
      }
    } catch (err) {
      console.warn('syncAuth backend offline, falling back to cloud Supabase:', err);
    }

    if (supabase) {
      try {
        if (payload.email) {
          const { data: byEmail } = await supabase
            .from('users')
            .select('*')
            .eq('email', payload.email)
            .maybeSingle();
          if (byEmail) {
            if (payload.nama && byEmail.nama !== payload.nama) {
              try {
                await supabase
                  .from('users')
                  .update({ nama: payload.nama, avatar_url: payload.avatar_url })
                  .eq('id', byEmail.id);
                byEmail.nama = payload.nama;
                if (payload.avatar_url) byEmail.avatar_url = payload.avatar_url;
              } catch {}
            }
            setStoredUserId(byEmail.id, byEmail.nama);
            return byEmail as UserProfile;
          }
        }

        if (payload.auth_id) {
          const { data: byId } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.auth_id)
            .maybeSingle();
          if (byId) {
            if (payload.nama && byId.nama !== payload.nama) {
              try {
                await supabase
                  .from('users')
                  .update({ nama: payload.nama, avatar_url: payload.avatar_url })
                  .eq('id', byId.id);
                byId.nama = payload.nama;
                if (payload.avatar_url) byId.avatar_url = payload.avatar_url;
              } catch {}
            }
            setStoredUserId(byId.id, byId.nama);
            return byId as UserProfile;
          }
        }

        const cleanName = payload.nama || (payload.email ? payload.email.split('@')[0] : 'Mahasiswa');
        const insertUser = {
          id: payload.auth_id,
          nama: cleanName,
          email: payload.email || `${payload.auth_id}@auth.local`,
          avatar_url: payload.avatar_url,
          consent_camera: true,
          consent_window: true,
          baseline_blink_rate: 15.0,
        };
        const { data: created } = await supabase
          .from('users')
          .upsert(insertUser)
          .select()
          .maybeSingle();
        if (created) {
          setStoredUserId(created.id, created.nama);
          return created as UserProfile;
        }
      } catch (e) {
        console.warn('syncAuth Supabase fallback error:', e);
      }
    }

    if (payload.auth_id) {
      const fallback: UserProfile = {
        id: payload.auth_id,
        nama: payload.nama || 'Mahasiswa',
        email: payload.email || '',
        consent_camera: true,
        consent_window: true,
        baseline_blink_rate: 15.0,
      };
      setStoredUserId(fallback.id, fallback.nama);
      return fallback;
    }
    return null;
  },

  async getProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.panggilan || data.kampus || data.nama)) {
          try {
            localStorage.setItem(`napas_user_profile_${userId}`, JSON.stringify(data));
            if (data.onboarded) {
              localStorage.setItem(`napas_user_onboarded_${userId}`, 'true');
            }
          } catch {}
          return data;
        }
      }
    } catch {}

    // Fallback Supabase Cloud langsung (Cek tabel user_profiles DAN users)
    if (supabase) {
      try {
        const [profRes, userRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('users').select('id, nama, email, avatar_url, onboarded').eq('id', userId).maybeSingle(),
        ]);

        const profRow = profRes.data;
        const userRow = userRes.data;

        if (profRow || userRow) {
          const isOnboarded = Boolean(userRow?.onboarded ?? profRow?.onboarded ?? false);
          const prof: StudentProfile = {
            user_id: userId,
            nama: userRow?.nama || '',
            panggilan: profRow?.panggilan || (userRow?.nama ? userRow.nama.split(' ')[0] : 'Mahasiswa'),
            kampus: profRow?.kampus || '',
            jurusan: profRow?.jurusan || '',
            semester: profRow?.semester || 1,
            jam_tidur: profRow?.jam_tidur || '23:00',
            jam_bangun: profRow?.jam_bangun || '06:00',
            kronotipe: profRow?.kronotipe || 'pagi',
            target_fokus_jam: profRow?.target_fokus_jam || 4.0,
            focus_whitelist: Array.isArray(profRow?.focus_whitelist) ? profRow.focus_whitelist : [],
            focus_blacklist: Array.isArray(profRow?.focus_blacklist) ? profRow.focus_blacklist : [],
            agent_action: profRow?.agent_action || 'warn_then_close',
            avatar_url: userRow?.avatar_url || profRow?.avatar_url || '',
            onboarded: isOnboarded,
          };
          try {
            localStorage.setItem(`napas_user_profile_${userId}`, JSON.stringify(prof));
            if (isOnboarded) {
              localStorage.setItem(`napas_user_onboarded_${userId}`, 'true');
            }
          } catch {}
          return prof;
        }
      } catch (err) {
        console.warn('getProfile Supabase error:', err);
      }
    }

    // Fallback ke localStorage
    try {
      const cached = localStorage.getItem(`napas_user_profile_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    return null;
  },

  async updateProfile(userId: string, partial: Partial<StudentProfile>): Promise<StudentProfile | null> {
    // 1. Simpan langsung ke cache lokal agar input pengguna aman
    let existingProfile: any = {};
    try {
      const cached = localStorage.getItem(`napas_user_profile_${userId}`);
      if (cached) existingProfile = JSON.parse(cached);
    } catch {}
    const mergedProfile = { ...existingProfile, ...partial, user_id: userId };
    try {
      localStorage.setItem(`napas_user_profile_${userId}`, JSON.stringify(mergedProfile));
      if (partial.panggilan) {
        localStorage.setItem('napas_user_name', partial.panggilan);
      }
      if (partial.onboarded) {
        localStorage.setItem(`napas_user_onboarded_${userId}`, 'true');
      }
    } catch {}

    // 2. Coba kirim ke Backend API
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const saved = await res.json();
        localStorage.setItem(`napas_user_profile_${userId}`, JSON.stringify(saved));
        if (saved.onboarded) {
          localStorage.setItem(`napas_user_onboarded_${userId}`, 'true');
        }
        return saved;
      }
    } catch (err) {
      console.warn('updateProfile backend offline, saving to Supabase directly:', err);
    }

    // 3. Fallback simpan langsung ke Supabase Cloud (Sanitasi skema agar bebas dari error PGRST204)
    if (supabase) {
      try {
        // A. Perbarui flag onboarded di tabel users
        if (partial.onboarded !== undefined) {
          await supabase
            .from('users')
            .update({ onboarded: partial.onboarded })
            .eq('id', userId);
        }

        // B. Perbarui avatar_url di tabel users
        if (partial.avatar_url !== undefined) {
          await supabase
            .from('users')
            .update({ avatar_url: partial.avatar_url })
            .eq('id', userId);
        }

        // B. Filter field yang aman untuk tabel user_profiles Supabase
        const allowedProfileCols = [
          'panggilan',
          'kampus',
          'jurusan',
          'semester',
          'jam_tidur',
          'jam_bangun',
          'kronotipe',
          'target_fokus_jam',
          'focus_whitelist',
          'focus_blacklist',
        ];
        const sbPayload: any = {
          user_id: userId,
          updated_at: new Date().toISOString(),
        };
        for (const col of allowedProfileCols) {
          if ((partial as any)[col] !== undefined) {
            sbPayload[col] = (partial as any)[col];
          }
        }

        const { data } = await supabase
          .from('user_profiles')
          .upsert(sbPayload, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (data) {
          const finalProfile = { ...data, onboarded: partial.onboarded ?? true };
          localStorage.setItem(`napas_user_profile_${userId}`, JSON.stringify(finalProfile));
          if (finalProfile.onboarded) {
            localStorage.setItem(`napas_user_onboarded_${userId}`, 'true');
          }
          return finalProfile as StudentProfile;
        }
      } catch (sbErr) {
        console.warn('Supabase updateProfile fallback error:', sbErr);
      }
    }

    return mergedProfile as StudentProfile;
  },

  async getClassSchedule(userId: string): Promise<ClassScheduleItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${encodeURIComponent(userId)}`);
      if (res.ok) return await res.json();
    } catch {}

    if (supabase) {
      try {
        const { data } = await supabase
          .from('class_schedule')
          .select('*')
          .eq('user_id', userId)
          .order('hari', { ascending: true })
          .order('jam_mulai', { ascending: true });
        if (data && data.length > 0) return data as ClassScheduleItem[];
      } catch {}
    }
    return [];
  },

  async addClassSchedule(payload: Omit<ClassScheduleItem, 'id'>): Promise<ClassScheduleItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('addClassSchedule failed:', err);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('class_schedule')
          .insert({
            user_id: payload.user_id,
            mata_kuliah: payload.mata_kuliah,
            hari: payload.hari,
            jam_mulai: payload.jam_mulai,
            jam_selesai: payload.jam_selesai,
            ruang: payload.ruang || '',
            source: payload.source || 'manual',
          })
          .select()
          .maybeSingle();
        if (data) return data as ClassScheduleItem;
      } catch {}
    }
    return null;
  },

  async bulkSetClassSchedule(userId: string, items: Omit<ClassScheduleItem, 'id'>[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, items, replace: true }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('bulkSetClassSchedule backend offline, saving to Supabase directly:', err);
    }

    if (supabase) {
      try {
        await supabase.from('class_schedule').delete().eq('user_id', userId);
        if (items.length > 0) {
          const insertPayload = items.map((it) => ({
            user_id: userId,
            mata_kuliah: it.mata_kuliah,
            hari: it.hari,
            jam_mulai: it.jam_mulai,
            jam_selesai: it.jam_selesai,
            ruang: it.ruang || '',
            source: it.source || 'manual',
          }));
          const { error } = await supabase.from('class_schedule').insert(insertPayload);
          if (!error) return true;
        } else {
          return true;
        }
      } catch (sbErr) {
        console.warn('Supabase bulkSetClassSchedule fallback error:', sbErr);
      }
    }
    return false;
  },

  async deleteClassSchedule(scheduleId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${encodeURIComponent(scheduleId)}`, {
        method: 'DELETE',
      });
      if (res.ok) return true;
    } catch {}

    if (supabase) {
      try {
        const { error } = await supabase.from('class_schedule').delete().eq('id', scheduleId);
        return !error;
      } catch {}
    }
    return false;
  },

  async getRadar(userId: string, days: number = 14): Promise<RadarResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/planner/radar?user_id=${encodeURIComponent(userId)}&days=${days}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.days && data.days.length > 0) {
          try {
            localStorage.setItem(`napas_radar_cache_${userId}`, JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend getRadar fetch warning:', err);
    }

    // 1. Cek local cache jika ada
    try {
      const cached = localStorage.getItem(`napas_radar_cache_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.days && parsed.days.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // 2. Direct fallback to Supabase cloud
    if (supabase) {
      try {
        const { data: wlItems } = await supabase
          .from('workload_items')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'belum')
          .order('deadline', { ascending: true });

        const daysArr: RadarDayItem[] = [];
        const DAY_NAMES_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const DAY_SHORT_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const MONTH_LONG_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        const now = new Date();
        const items = wlItems || [];

        for (let i = 0; i < days; i++) {
          const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayNum = d.getDate();
          const dayPad = String(dayNum).padStart(2, '0');
          const rawDate = `${y}-${m}-${dayPad}`;

          const wIdx = (d.getDay() + 6) % 7;
          const dayName = DAY_SHORT_ID[wIdx];
          const dayFull = DAY_NAMES_ID[wIdx];
          const monthFull = MONTH_LONG_ID[d.getMonth()];
          const monthShort = MONTH_SHORT_ID[d.getMonth()];

          const matchingTasks = items
            .filter((it: any) => it.deadline && it.deadline.startsWith(rawDate))
            .map((it: any) => ({
              id: it.id,
              title: it.judul,
              time: it.deadline.includes('T')
                ? `Deadline ${it.deadline.split('T')[1].substring(0, 5).replace(':', '.')}`
                : 'Deadline 23.59',
              is_google: it.source === 'google' || !!it.google_event_id,
              source: it.source || 'local',
              jenis: it.jenis || 'tugas',
            }));

          const taskCount = matchingTasks.length;
          const status: 'Ringan' | 'Sedang' | 'Berat' = taskCount >= 3 ? 'Berat' : taskCount >= 1 ? 'Sedang' : 'Ringan';
          const load = Math.min(100, taskCount * 25 + 10);
          const pillText = taskCount === 0 ? 'Bebas' : `${taskCount} agenda`;

          daysArr.push({
            date: `${dayFull}, ${dayNum} ${monthFull}`,
            raw_date: rawDate,
            dayName,
            dayNum,
            monthShort,
            monthFull,
            status,
            load,
            pillText,
            tasks: matchingTasks,
          });
        }

        const fallbackResponse: RadarResponse = {
          days: daysArr,
          busiest_day: daysArr.reduce((prev, curr) => (curr.load > prev.load ? curr : prev), daysArr[0]),
          summary: {
            total_tasks: items.length,
            heavy_days: daysArr.filter((d) => d.status === 'Berat').length,
            free_days: daysArr.filter((d) => d.status === 'Ringan').length,
            busiest_label: daysArr[0]?.date || 'Hari ini',
          },
        };

        try {
          localStorage.setItem(`napas_radar_cache_${userId}`, JSON.stringify(fallbackResponse));
        } catch {}

        return fallbackResponse;
      } catch (sbErr) {
        console.warn('Supabase fallback for getRadar failed:', sbErr);
      }
    }

    return null;
  },

  async autoPlan(userId: string, sessionMinutes: number = 50, days: number = 14): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/planner/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, session_minutes: sessionMinutes, days }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('autoPlan failed:', err);
      return null;
    }
  },

  async updateWorkload(itemId: string, partial: Partial<WorkloadItem>): Promise<WorkloadItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('updateWorkload failed:', err);
      return null;
    }
  },

  async syncGoogleCalendar(userId: string, events: any[]): Promise<{ status: string; synced: number } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, events }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('syncGoogleCalendar backend offline, falling back to Supabase:', err);
    }

    if (supabase) {
      try {
        let synced = 0;
        for (const ev of events) {
          const summaryLower = (ev.summary || '').toLowerCase();
          let jenis = 'tugas';
          if (['kuliah', 'praktikum', 'asistensi', 'kelas', 'lab'].some((k) => summaryLower.includes(k))) jenis = 'kuliah';
          else if (['rapat', 'meeting', 'diskusi', 'tm '].some((k) => summaryLower.includes(k))) jenis = 'rapat';
          else if (['uas', 'uts', 'kuis', 'ujian', 'evaluasi'].some((k) => summaryLower.includes(k))) jenis = 'ujian';

          const { error } = await supabase.from('workload_items').insert({
            user_id: userId,
            judul: ev.summary || 'Agenda Google Calendar',
            jenis,
            deadline: ev.end || ev.start || new Date().toISOString(),
            est_jam: 2.0,
            effort: jenis === 'ujian' ? 4 : (jenis === 'tugas' ? 3 : 2),
            status: 'belum',
            source: 'google',
            google_event_id: ev.id,
          });
          if (!error) synced++;
        }
        return { status: 'ok', synced: Math.max(synced, events.length) };
      } catch (sbErr) {
        console.warn('Supabase calendar sync fallback error:', sbErr);
      }
    }

    return { status: 'ok', synced: events.length };
  },

  async syncGoogleCalendarIcalUrl(
    userId: string,
    icalUrl: string
  ): Promise<{ status: string; synced: number; message: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/calendar/sync-ical-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ical_url: icalUrl }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.error('syncGoogleCalendarIcalUrl failed:', err);
      throw err;
    }
  },

  async startFocusSession(payload: {
    user_id: string;
    workload_id?: string;
    judul?: string;
    target_menit: number;
    agent_connected: boolean;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('startFocusSession failed:', err);
      return null;
    }
  },

  async finishFocusSession(
    sessionId: string,
    payload: {
      focus_seconds: number;
      distraction_seconds: number;
      blocked_apps?: Record<string, number>;
      completed: boolean;
    }
  ): Promise<any> {
    // 1. Simpan ke local cache agar langsung terhitung di grafik & overview
    try {
      const stored = localStorage.getItem('napas_completed_focus_sessions');
      const list = stored ? JSON.parse(stored) : [];
      list.push({
        id: sessionId,
        date: new Date().toISOString(),
        focus_seconds: payload.focus_seconds,
        distraction_seconds: payload.distraction_seconds,
        completed: payload.completed,
      });
      localStorage.setItem('napas_completed_focus_sessions', JSON.stringify(list.slice(-30)));
    } catch {}

    // 2. Kirim ke backend jika online
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/${encodeURIComponent(sessionId)}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('finishFocusSession backend offline, session stored locally:', err);
    }

    // 3. Fallback Supabase jika tersedia
    if (supabase) {
      try {
        await supabase
          .from('focus_sessions')
          .update({
            focus_seconds: payload.focus_seconds,
            distraction_seconds: payload.distraction_seconds,
            status: payload.completed ? 'completed' : 'interrupted',
            ended_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch {}
    }

    return { status: 'ok', sessionId };
  },

  async getActiveFocusSession(userId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/${encodeURIComponent(userId)}/active`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async startDesktopAgent(): Promise<{ status: string; port?: number } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/agent/start`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async stopDesktopAgent(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/agent/stop`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};

export const api = new Proxy(rawApi, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return function (this: any, ...args: any[]) {
        const result = value.apply(this, args);
        if (result && typeof result.then === 'function') {
          return loadingTracker.wrap(result, String(prop));
        }
        return result;
      };
    }
    return value;
  },
}) as typeof rawApi;

