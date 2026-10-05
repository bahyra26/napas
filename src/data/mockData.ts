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

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Laporan Praktikum',
    meta: 'Besok · 23.59',
    priority: 'red',
  },
  {
    id: 'task-2',
    title: 'Tugas Kalkulus 1 : Hal 39',
    meta: '2 minggu lagi',
    priority: 'green',
  },
];

export const INITIAL_CALENDAR_DAYS: CalendarDay[] = generateRealtimeCalendarDays();

export const TREND_POINTS: TrendPoint[] = [
  { day: 1, val: '3%', percentNum: 3, cx: 66.0, cy: 224.0 },
  { day: 2, val: '4.5%', percentNum: 4.5, cx: 117.1, cy: 221.0 },
  { day: 3, val: '5.5%', percentNum: 5.5, cx: 168.2, cy: 219.0 },
  { day: 4, val: '3.5%', percentNum: 3.5, cx: 219.2, cy: 223.0 },
  { day: 5, val: '7%', percentNum: 7, cx: 270.3, cy: 216.0 },
  { day: 6, val: '10%', percentNum: 10, cx: 321.4, cy: 210.0 },
  { day: 7, val: '13%', percentNum: 13, cx: 372.5, cy: 204.0 },
  { day: 8, val: '11.5%', percentNum: 11.5, cx: 423.5, cy: 207.0 },
  { day: 9, val: '16%', percentNum: 16, cx: 474.6, cy: 198.0 },
  { day: 10, val: '20%', percentNum: 20, cx: 525.7, cy: 190.0 },
  { day: 11, val: '25% (Intervensi)', percentNum: 25, cx: 576.8, cy: 180.0, isIntervention: true },
  { day: 12, val: '29%', percentNum: 29, cx: 627.8, cy: 172.0 },
  { day: 13, val: '34%', percentNum: 34, cx: 678.9, cy: 162.0 },
  { day: 14, val: '31.5%', percentNum: 31.5, cx: 730.0, cy: 167.0 },
];

export const HEATMAP_HOURS = ['08', '10', '12', '14', '16', '18', '20', '22'];

export const HEATMAP_DATA: HeatmapRow[] = [
  {
    dayName: 'Sen',
    cells: [
      { hour: '08', level: 'green', info: 'Senin 08:00 · Ringan' },
      { hour: '10', level: 'green', info: 'Senin 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Senin 12:00 · Ringan' },
      { hour: '14', level: 'peach', info: 'Senin 14:00 · Sedang' },
      { hour: '16', level: 'red', info: 'Senin 16:00 · Berat' },
      { hour: '18', level: 'peach', info: 'Senin 18:00 · Sedang' },
      { hour: '20', level: 'peach', info: 'Senin 20:00 · Sedang' },
      { hour: '22', level: 'peach', info: 'Senin 22:00 · Sedang' },
    ],
  },
  {
    dayName: 'Sel',
    cells: [
      { hour: '08', level: 'green', info: 'Selasa 08:00 · Ringan' },
      { hour: '10', level: 'green', info: 'Selasa 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Selasa 12:00 · Ringan' },
      { hour: '14', level: 'peach', info: 'Selasa 14:00 · Sedang' },
      { hour: '16', level: 'green', info: 'Selasa 16:00 · Ringan' },
      { hour: '18', level: 'red', info: 'Selasa 18:00 · Berat' },
      { hour: '20', level: 'red', info: 'Selasa 20:00 · Berat' },
      { hour: '22', level: 'green', info: 'Selasa 22:00 · Ringan' },
    ],
  },
  {
    dayName: 'Rab',
    cells: [
      { hour: '08', level: 'green', info: 'Rabu 08:00 · Ringan' },
      { hour: '10', level: 'peach', info: 'Rabu 10:00 · Sedang' },
      { hour: '12', level: 'peach', info: 'Rabu 12:00 · Sedang' },
      { hour: '14', level: 'peach', info: 'Rabu 14:00 · Sedang' },
      { hour: '16', level: 'green', info: 'Rabu 16:00 · Ringan' },
      { hour: '18', level: 'peach', info: 'Rabu 18:00 · Sedang' },
      { hour: '20', level: 'peach', info: 'Rabu 20:00 · Sedang' },
      { hour: '22', level: 'green', info: 'Rabu 22:00 · Ringan' },
    ],
  },
  {
    dayName: 'Kam',
    cells: [
      { hour: '08', level: 'green', info: 'Kamis 08:00 · Ringan' },
      { hour: '10', level: 'green', info: 'Kamis 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Kamis 12:00 · Ringan' },
      { hour: '14', level: 'red', info: 'Kamis 14:00 · Berat' },
      { hour: '16', level: 'green', info: 'Kamis 16:00 · Ringan' },
      { hour: '18', level: 'red', info: 'Kamis 18:00 · Berat' },
      { hour: '20', level: 'red', info: 'Kamis 20:00 · Berat' },
      { hour: '22', level: 'green', info: 'Kamis 22:00 · Ringan' },
    ],
  },
  {
    dayName: 'Jum',
    cells: [
      { hour: '08', level: 'green', info: 'Jumat 08:00 · Ringan' },
      { hour: '10', level: 'green', info: 'Jumat 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Jumat 12:00 · Ringan' },
      { hour: '14', level: 'red', info: 'Jumat 14:00 · Berat' },
      { hour: '16', level: 'red', info: 'Jumat 16:00 · Berat' },
      { hour: '18', level: 'red', info: 'Jumat 18:00 · Berat' },
      { hour: '20', level: 'red', info: 'Jumat 20:00 · Berat' },
      { hour: '22', level: 'peach', info: 'Jumat 22:00 · Sedang' },
    ],
  },
  {
    dayName: 'Sab',
    cells: [
      { hour: '08', level: 'peach', info: 'Sabtu 08:00 · Sedang' },
      { hour: '10', level: 'green', info: 'Sabtu 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Sabtu 12:00 · Ringan' },
      { hour: '14', level: 'green', info: 'Sabtu 14:00 · Ringan' },
      { hour: '16', level: 'green', info: 'Sabtu 16:00 · Ringan' },
      { hour: '18', level: 'green', info: 'Sabtu 18:00 · Ringan' },
      { hour: '20', level: 'green', info: 'Sabtu 20:00 · Ringan' },
      { hour: '22', level: 'peach', info: 'Sabtu 22:00 · Sedang' },
    ],
  },
  {
    dayName: 'Min',
    cells: [
      { hour: '08', level: 'green', info: 'Minggu 08:00 · Ringan' },
      { hour: '10', level: 'green', info: 'Minggu 10:00 · Ringan' },
      { hour: '12', level: 'green', info: 'Minggu 12:00 · Ringan' },
      { hour: '14', level: 'peach', info: 'Minggu 14:00 · Sedang' },
      { hour: '16', level: 'peach', info: 'Minggu 16:00 · Sedang' },
      { hour: '18', level: 'green', info: 'Minggu 18:00 · Ringan' },
      { hour: '20', level: 'peach', info: 'Minggu 20:00 · Sedang' },
      { hour: '22', level: 'peach', info: 'Minggu 22:00 · Sedang' },
    ],
  },
];

/* ==========================================================================
   FOKUS & DISTRAKSI MOCK DATA
   ========================================================================== */

export const FOCUS_OVERVIEW_TODAY: FocusOverviewData = {
  date: getTodayDateString(),
  focusPercent: 78,
  distractPercent: 22,
  focusDuration: '5j 30m',
  distractDuration: '1j 34m',
  motivationalNote: 'Keren! Kamu sudah lebih fokus dari kemarin 👍',
};

export const FOCUS_TOP_DISTRACTORS: FocusTopDistractor[] = [
  {
    id: 'distract-1',
    name: 'YouTube',
    durationMinutes: 42,
    durationLabel: '42 menit',
    percentage: 88, // relative visual fill ~88% of bar
  },
  {
    id: 'distract-2',
    name: 'Instagram',
    durationMinutes: 28,
    durationLabel: '28 menit',
    percentage: 58,
  },
  {
    id: 'distract-3',
    name: 'Discord',
    durationMinutes: 19,
    durationLabel: '19 menit',
    percentage: 40,
  },
  {
    id: 'distract-4',
    name: 'Mobile Legends',
    durationMinutes: 15,
    durationLabel: '15 menit',
    percentage: 31,
  },
  {
    id: 'distract-5',
    name: 'Twitter/X',
    durationMinutes: 10,
    durationLabel: '10 menit',
    percentage: 21,
  },
];

export const FOCUS_STREAK_DAYS: FocusStreakDay[] = generateRealtimeStreakDays();

export const FOCUS_STREAK_INFO = {
  currentStreak: 12,
  targetRule: 'berturut-turut fokus >4 jam/hari',
  bestRecord: 18,
  days: FOCUS_STREAK_DAYS,
};

export const FOCUS_WEEKLY_BARS: FocusDailyBar[] = generateRealtimeWeeklyBars();

/* ==========================================================================
   LAPORAN & REKOMENDASI MOCK DATA
   ========================================================================== */

export const WEEKLY_INSIGHT: WeeklyInsightData = {
  title: 'Kamu sudah berusaha keras minggu ini.',
  description:
    'Beban tugas dan pola tidurmu membuat energi menurun di tengah minggu. Untungnya, kamu merespons 4 dari 5 intervensi yang muncul.',
  weeklyScore: 68,
  zoneName: 'zona oranye',
  note: 'Lebih baik dari kemarin — terus beri ruang untuk pulih.',
};

export const WELLNESS_PLAYBOOK: WellnessPlaybookItem[] = [
  {
    id: 'pb-1',
    stepNumber: 1,
    title: 'Batasi layar setelah 22.00',
    description: 'Sisakan 30 menit untuk bersiap tidur tanpa notifikasi.',
    actionLabel: 'Mulai malam ini',
    isPrimary: true,
  },
  {
    id: 'pb-2',
    stepNumber: 2,
    title: 'Ambil jeda jalan kaki 30 menit',
    description: 'Pilih waktu sebelum jam 14.00, saat stres biasanya naik.',
    actionLabel: 'Jadwalkan besok',
    isPrimary: false,
  },
  {
    id: 'pb-3',
    stepNumber: 3,
    title: 'Hubungi orang yang kamu percaya',
    description: 'Ceritakan satu hal yang membuatmu terasa berat minggu ini.',
    actionLabel: 'Saat kamu siap',
    isPrimary: false,
  },
];

export const PLAYBOOK_ADVISORY =
  'Jika kondisi ini berlanjut 7 hari, pertimbangkan konsultasi ke BK kampus atau dokter.';

export const WEEKLY_SUMMARY_STATS: WeeklySummaryStat[] = [
  {
    id: 'stat-muncul',
    value: '5 kali',
    label: 'intervensi muncul',
    colorType: 'orange',
  },
  {
    id: 'stat-selesai',
    value: '4 / 5',
    label: 'intervensi selesai',
    colorType: 'green',
  },
  {
    id: 'stat-risiko',
    value: '3 hari',
    label: 'risiko tinggi',
    colorType: 'red',
  },
];

export const INTERVENTION_HISTORY: InterventionHistoryItem[] = [
  {
    id: 'hist-1',
    title: 'Breathing 4-7-8',
    status: 'Selesai · 60 detik',
    time: 'Hari ini, 14.10',
    isCompleted: true,
  },
  {
    id: 'hist-2',
    title: 'Focus Lock',
    status: 'Selesai · 10 menit',
    time: 'Kemarin, 20.42',
    isCompleted: true,
  },
  {
    id: 'hist-3',
    title: 'Microbreak 20-20-20',
    status: 'Dilewati',
    time: 'Kemarin, 15.30',
    isCompleted: false,
  },
];

export const DAILY_REFLECTION_INFO = {
  tag: 'REFLEKSI HARI INI',
  question: 'Hal baik apa yang ingin kamu ulang besok?',
  actionText: 'Tulis refleksi →',
};

/* ==========================================================================
   SETTINGS MOCK DATA
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
  name: 'Raka Pratama',
  email: 'raka.pratama@student.ac.id',
  role: 'Mahasiswa',
};



