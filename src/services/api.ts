const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface BackendHealth {
  status: string;
  db: string;
  service: string;
  version: string;
}

export interface TodayIndexResponse {
  user_id: string;
  tanggal: string;
  burnout_index: number;
  zona: 'hijau' | 'kuning' | 'oranye' | 'merah';
  label_zona: string;
  alasan_chips: string[];
  subskor: {
    workload: number;
    sensor: number;
    self_report: number;
  };
  intervensi_rekomendasi?: string;
  confidence: number;
  missing_sources: string[];
}

export const api = {
  async getHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getTodayIndex(userId: string): Promise<TodayIndexResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/today/${userId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async postCheckIn(userId: string, skor: number, catatan?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, skor, catatan }),
      });
      return await res.json();
    } catch (err) {
      console.error('Checkin failed:', err);
      return null;
    }
  },

  async postIntervention(userId: string, tipe: 'breathing' | 'lock' | 'break' | 'playbook', durasi: number = 60, selesai: boolean = true) {
    try {
      const res = await fetch(`${API_BASE_URL}/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tipe, durasi, selesai }),
      });
      return await res.json();
    } catch (err) {
      console.error('Intervention log failed:', err);
      return null;
    }
  },
};
