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

  async postCheckIn(
    userId: string,
    skor: number,
    catatan?: string,
    jamTidur?: number,
    energi?: number
  ): Promise<CheckInItem | null> {
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
      if (!res.ok) return null;
      const user = await res.json();
      setStoredUserId(user.id, user.nama);
      return user;
    } catch (err) {
      console.warn('syncAuth failed:', err);
      return null;
    }
  },

  async getProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, partial: Partial<StudentProfile>): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('updateProfile failed:', err);
      return null;
    }
  },

  async getClassSchedule(userId: string): Promise<ClassScheduleItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async addClassSchedule(payload: Omit<ClassScheduleItem, 'id'>): Promise<ClassScheduleItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('addClassSchedule failed:', err);
      return null;
    }
  },

  async bulkSetClassSchedule(userId: string, items: Omit<ClassScheduleItem, 'id'>[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, items, replace: true }),
      });
      return res.ok;
    } catch (err) {
      console.error('bulkSetClassSchedule failed:', err);
      return false;
    }
  },

  async deleteClassSchedule(scheduleId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${encodeURIComponent(scheduleId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getRadar(userId: string, days: number = 14): Promise<RadarResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/planner/radar?user_id=${encodeURIComponent(userId)}&days=${days}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
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
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('syncGoogleCalendar failed:', err);
      return null;
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
    try {
      const res = await fetch(`${API_BASE_URL}/focus-sessions/${encodeURIComponent(sessionId)}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('finishFocusSession failed:', err);
      return null;
    }
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

