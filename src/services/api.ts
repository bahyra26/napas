const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export interface WorkloadItem {
  id: string;
  user_id: string;
  judul: string;
  jenis: 'tugas' | 'rapat' | 'kuliah' | 'ujian';
  deadline: string;
  est_jam: number;
  effort: number;
  status: 'belum' | 'selesai';
}

export interface CheckInItem {
  id: string;
  user_id: string;
  ts: string;
  skor: number;
  catatan?: string;
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

export const api = {
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
      if (!res.ok) return null;
      const user = await res.json();
      setStoredUserId(user.id, user.nama);
      return user;
    } catch (err) {
      console.warn('initDemoUser failed, backend may be offline:', err);
      return null;
    }
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
      if (!res.ok) return null;
      const user = await res.json();
      setStoredUserId(user.id, user.nama);
      return user;
    } catch (err) {
      console.warn('getOrCreateUser failed:', err);
      return null;
    }
  },

  async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateUser(userId: string, partial: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('updateUser failed:', err);
      return null;
    }
  },

  async getTodayIndex(userId: string): Promise<BurnoutIndexResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/index/today?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('getTodayIndex failed:', err);
      return null;
    }
  },

  async getIndexHistory(userId: string, days: number = 14): Promise<DailyIndexHistoryItem[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/index/history?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('getIndexHistory failed:', err);
      return [];
    }
  },

  async getWorkloads(userId: string): Promise<WorkloadItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/workload/${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('getWorkloads failed:', err);
      return [];
    }
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
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('createWorkload failed:', err);
      return null;
    }
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

  async postCheckIn(userId: string, skor: number, catatan?: string): Promise<CheckInItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/check-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, skor, catatan }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Checkin failed:', err);
      return null;
    }
  },

  async getTodayCheckIn(userId: string): Promise<CheckInItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/check-ins/today?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Intervention log failed:', err);
      return null;
    }
  },

  async getInterventions(userId: string, days: number = 7): Promise<InterventionStatsResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/interventions?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getHeatmap(userId: string, days: number = 7): Promise<HeatmapResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/metrics/heatmap?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getFocusSummary(userId: string, days: number = 7): Promise<FocusSummaryResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/metrics/focus-summary?user_id=${encodeURIComponent(userId)}&days=${days}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getWeeklyInsight(userId: string): Promise<WeeklyInsightResponse | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/insights/weekly?user_id=${encodeURIComponent(userId)}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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
};
