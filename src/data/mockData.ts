import {
  CalendarDay,
  FocusDailyBar,
  FocusOverviewData,
  FocusStreakDay,
  FocusTopDistractor,
  HeatmapRow,
  InterventionHistoryItem,
  InterventionSettingItem,
  SensorPermissionItem,
  TaskItem,
  TrendPoint,
  UserProfileInfo,
  WeeklyInsightData,
  WeeklySummaryStat,
  WellnessPlaybookItem,
} from '../types';
import {
  generateRealtimeCalendarDays,
  generateRealtimeStreakDays,
  generateRealtimeWeeklyBars,
  getTodayDateString,
} from '../utils/dateUtils';

export const INITIAL_TASKS: TaskItem[] = [];

export const INITIAL_CALENDAR_DAYS: CalendarDay[] = generateRealtimeCalendarDays();

// Clean neutral baseline 14 days (0% / start of tracking)
export const TREND_POINTS: TrendPoint[] = Array.from({ length: 14 }, (_, idx) => {
  const cx = 66.0 + (idx / 13) * (730.0 - 66.0);
  return {
    day: idx + 1,
    val: '0%',
    percentNum: 0,
    cx: Number(cx.toFixed(1)),
    cy: 230.0,
    isIntervention: false,
  };
});

export const HEATMAP_HOURS = ['08', '10', '12', '14', '16', '18', '20', '22'];

const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAYS_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const HEATMAP_DATA: HeatmapRow[] = DAYS_SHORT.map((dayName, dayIdx) => ({
  dayName,
  cells: HEATMAP_HOURS.map((hr) => ({
    hour: hr,
    level: 'green' as const,
    info: `${DAYS_FULL[dayIdx]} ${hr}:00 · Ringan`,
  })),
}));

/* ==========================================================================
   FOKUS & DISTRAKSI DATA (CLEAN / AUTHENTIC)
   ========================================================================== */

export const FOCUS_OVERVIEW_TODAY: FocusOverviewData = {
  date: getTodayDateString(),
  focusPercent: 0,
  distractPercent: 0,
  focusDuration: '0 menit',
  distractDuration: '0 menit',
  motivationalNote: 'Sesi fokus siap dimulai. Aktifkan Ruang Belajar untuk mulai melacak.',
};

export const FOCUS_TOP_DISTRACTORS: FocusTopDistractor[] = [];

export const FOCUS_STREAK_DAYS: FocusStreakDay[] = generateRealtimeStreakDays();

export const FOCUS_STREAK_INFO = {
  currentStreak: 0,
  targetRule: 'fokus teratur >4 jam/hari',
  bestRecord: 0,
  days: FOCUS_STREAK_DAYS,
};

export const FOCUS_WEEKLY_BARS: FocusDailyBar[] = generateRealtimeWeeklyBars();

/* ==========================================================================
   LAPORAN & REKOMENDASI DATA (CLEAN / AUTHENTIC)
   ========================================================================== */

export const WEEKLY_INSIGHT: WeeklyInsightData = {
  title: 'Kondisi mental dan fisik prima!',
  description:
    'Belum ada akumulasi tekanan atau tugas berat tercatat pekan ini. Kondisimu terpantau prima!',
  weeklyScore: 0,
  zoneName: 'zona hijau',
  note: 'Pertahankan ritme belajar yang sehat dan luangkan waktu untuk pemulihan.',
};

export const WELLNESS_PLAYBOOK: WellnessPlaybookItem[] = [
  {
    id: 'pb-1',
    stepNumber: 1,
    title: 'Batasi layar setelah 22.00',
    description: 'Sisakan 30 menit untuk bersiap tidur tanpa notifikasi atau cahaya biru.',
    actionLabel: 'Mulai malam ini',
    isPrimary: true,
  },
  {
    id: 'pb-2',
    stepNumber: 2,
    title: 'Ambil jeda jalan kaki 30 menit',
    description: 'Pilih waktu sebelum jam 14.00, saat fokus biasanya mulai menurun.',
    actionLabel: 'Jadwalkan besok',
    isPrimary: false,
  },
  {
    id: 'pb-3',
    stepNumber: 3,
    title: 'Hubungi orang yang kamu percaya',
    description: 'Ceritakan satu hal atau beban akademik yang membuatmu terasa berat.',
    actionLabel: 'Saat kamu siap',
    isPrimary: false,
  },
];

export const PLAYBOOK_ADVISORY =
  'Jika mengalami kelelahan berlebih, pertimbangkan konsultasi ke konselor kampus atau dokter.';

export const WEEKLY_SUMMARY_STATS: WeeklySummaryStat[] = [
  {
    id: 'stat-muncul',
    value: '0 kali',
    label: 'intervensi muncul',
    colorType: 'orange',
  },
  {
    id: 'stat-selesai',
    value: '0',
    label: 'intervensi selesai',
    colorType: 'green',
  },
  {
    id: 'stat-risiko',
    value: '0 hari',
    label: 'risiko tinggi',
    colorType: 'red',
  },
];

export const INTERVENTION_HISTORY: InterventionHistoryItem[] = [];

export const DAILY_REFLECTION_INFO = {
  tag: 'REFLEKSI HARI INI',
  question: 'Hal baik apa yang ingin kamu ulang besok?',
  actionText: 'Tulis refleksi →',
};

/* ==========================================================================
   SETTINGS DATA
   ========================================================================== */

export const INITIAL_SENSOR_PERMISSIONS: SensorPermissionItem[] = [
  {
    id: 'sensor-camera',
    iconType: 'camera',
    title: 'Kamera BioVisual',
    description: 'Mendeteksi pola kedipan dan ketegangan wajah secara on-device.',
    enabled: false,
  },
  {
    id: 'sensor-window',
    iconType: 'window',
    title: 'Aktivitas Jendela',
    description: 'Membedakan aplikasi akademik dan distraksi untuk laporan fokus.',
    enabled: false,
  },
  {
    id: 'sensor-heart',
    iconType: 'heart',
    title: 'Check-in suasana hati',
    description: 'Menyimpan jawaban check-in singkat yang kamu isi sendiri.',
    enabled: true,
  },
];

export const INITIAL_INTERVENTION_SETTINGS: InterventionSettingItem[] = [
  {
    id: 'inter-breathing',
    title: 'Breathing 4-7-8',
    description: 'Tawarkan saat sinyal stres naik.',
    enabled: true,
  },
  {
    id: 'inter-focuslock',
    title: 'Focus Lock',
    description: 'Aktif saat distraksi > 5 menit.',
    enabled: true,
  },
  {
    id: 'inter-nudge',
    title: 'Nudge 20-20-20',
    description: 'Pengingat setelah 45 menit fokus.',
    enabled: true,
  },
];

export const INITIAL_WHITELIST_APPS: string[] = ['VS Code', 'Google Docs', 'Notion'];

export const INITIAL_USER_PROFILE: UserProfileInfo = {
  name: 'Mahasiswa',
  email: '',
  role: 'Mahasiswa',
};
