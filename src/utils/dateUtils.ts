import { CalendarDay, FocusDailyBar, FocusStreakDay } from '../types';

const INDO_DAYS_LONG = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const INDO_MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDO_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Returns today's formatted date string e.g. "Sen, 5 Okt 2026"
 */
export function getTodayDateString(d = new Date()): string {
  const dayName = INDO_DAYS_SHORT[d.getDay()];
  const dateNum = d.getDate();
  const monthName = INDO_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

/**
 * Returns time string e.g. "hari ini, 10.35"
 */
export function getTodayTimeString(d = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `hari ini, ${hours}.${minutes}`;
}

/**
 * Generate 14-day calendar grid relative to today (Day 0 to Day 13).
 */
export function generateRealtimeCalendarDays(baseDate = new Date()): CalendarDay[] {
  // Preset task patterns across the 14 days (retaining the hackathon demo agenda)
  const templates: Array<{
    status: 'Ringan' | 'Sedang' | 'Berat';
    load: number;
    pillText: string;
    tasks: Array<{ title: string; time: string }>;
  }> = [
    {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    },
    {
      status: 'Sedang',
      load: 35,
      pillText: '1 tugas',
      tasks: [{ title: 'Kuis Probabilitas & Statistika', time: '10.00 - 11.30' }],
    },
    {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    },
    {
      status: 'Berat',
      load: 78,
      pillText: '2 tugas',
      tasks: [
        { title: 'Technical Meeting JOINTS', time: '13.00 - 14.00' },
        { title: 'UAS Kalkulus Fisika', time: 'Deadline 23.59' },
      ],
    },
    {
      status: 'Sedang',
      load: 55,
      pillText: '2 tugas',
      tasks: [
        { title: 'Laporan Praktikum Jaringan', time: 'Deadline 17.00' },
        { title: 'Submit Review Paper', time: '21.00' },
      ],
    },
    {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    },
    {
      status: 'Sedang',
      load: 30,
      pillText: '1 tugas',
      tasks: [{ title: 'Cicil Bab 3 Skripsi', time: '20.00' }],
    },
    {
      status: 'Sedang',
      load: 40,
      pillText: '1 tugas',
      tasks: [{ title: 'Tugas Algoritma Pemrograman', time: 'Deadline 23.59' }],
    },
    {
      // Day index 8: Hari Terpadat!
      status: 'Berat',
      load: 95,
      pillText: '3 tugas',
      tasks: [
        { title: 'Presentasi Proyek Akhir', time: '09.00 - 11.30' },
        { title: 'Laporan Besar Basis Data', time: 'Deadline 18.00' },
        { title: 'Kuis Desain UI/UX', time: 'Deadline 23.59' },
      ],
    },
    {
      status: 'Sedang',
      load: 35,
      pillText: '1 tugas',
      tasks: [{ title: 'Diskusi Kelompok Riset', time: '16.00 - 17.30' }],
    },
    {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    },
    {
      status: 'Sedang',
      load: 60,
      pillText: '2 tugas',
      tasks: [
        { title: 'Asistensi Modul 4', time: '14.00 - 16.00' },
        { title: 'Submit Revisi Bab 2', time: 'Deadline 23.59' },
      ],
    },
    {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    },
    {
      status: 'Sedang',
      load: 30,
      pillText: '1 tugas',
      tasks: [{ title: 'Persiapan Mingguan & Jadwal', time: '19.00' }],
    },
  ];

  const days: CalendarDay[] = [];

  for (let i = 0; i < 14; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);

    const dayName = INDO_DAYS_SHORT[cur.getDay()];
    const dayFull = INDO_DAYS_LONG[cur.getDay()];
    const dayNum = cur.getDate();
    const monthShort = INDO_MONTHS_SHORT[cur.getMonth()];
    const monthFull = INDO_MONTHS_LONG[cur.getMonth()];
    const dateStr = `${dayFull}, ${dayNum} ${monthFull}`;

    const tpl = templates[i] || {
      status: 'Ringan',
      load: 0,
      pillText: 'Bebas',
      tasks: [],
    };

    days.push({
      date: dateStr,
      dayName,
      dayNum,
      monthShort,
      monthFull,
      status: tpl.status,
      load: tpl.load,
      pillText: tpl.pillText,
      tasks: [...tpl.tasks],
    });
  }

  return days;
}

/**
 * Generate 7 days for Fokus vs Distraksi chart ending on today.
 */
export function generateRealtimeWeeklyBars(baseDate = new Date()): FocusDailyBar[] {
  // Preset ratios for 7 days [Day -6 ... Day 0]
  const stats = [
    { focusPercent: 72, distractPercent: 28, focusDuration: '5j 11m', distractDuration: '2j 01m', totalDuration: '7j 12m', totalHoursNum: 7.2 },
    { focusPercent: 81, distractPercent: 19, focusDuration: '5j 38m', distractDuration: '1j 20m', totalDuration: '6j 58m', totalHoursNum: 6.96 },
    { focusPercent: 76, distractPercent: 24, focusDuration: '5j 04m', distractDuration: '1j 36m', totalDuration: '6j 40m', totalHoursNum: 6.66 },
    { focusPercent: 83, distractPercent: 17, focusDuration: '6j 09m', distractDuration: '1j 16m', totalDuration: '7j 25m', totalHoursNum: 7.41 },
    { focusPercent: 79, distractPercent: 21, focusDuration: '5j 28m', distractDuration: '1j 27m', totalDuration: '6j 55m', totalHoursNum: 6.91 },
    { focusPercent: 70, distractPercent: 30, focusDuration: '4j 04m', distractDuration: '1j 44m', totalDuration: '5j 48m', totalHoursNum: 5.8 },
    { focusPercent: 78, distractPercent: 22, focusDuration: '5j 30m', distractDuration: '1j 34m', totalDuration: '6j 20m', totalHoursNum: 6.33 },
  ];

  const bars: FocusDailyBar[] = [];

  for (let i = 0; i < 7; i++) {
    const offset = i - 6; // -6 to 0 (today)
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + offset);

    const dayShort = INDO_DAYS_SHORT[cur.getDay()];
    const dayFull = INDO_DAYS_LONG[cur.getDay()];
    const dayNum = cur.getDate();
    const monthShort = INDO_MONTHS_SHORT[cur.getMonth()];
    const st = stats[i];

    bars.push({
      id: `bar-${dayShort.toLowerCase()}-${i}`,
      dayShort,
      dayFull: `${dayFull}, ${dayNum} ${monthShort}`,
      focusPercent: st.focusPercent,
      distractPercent: st.distractPercent,
      focusDuration: st.focusDuration,
      distractDuration: st.distractDuration,
      totalDuration: st.totalDuration,
      totalHoursNum: st.totalHoursNum,
    });
  }

  return bars;
}

/**
 * Generate streak days aligned with Monday - Sunday of current week
 */
export function generateRealtimeStreakDays(baseDate = new Date()): FocusStreakDay[] {
  // Day of week: 0 is Min, 1 is Sen, etc.
  const currentDayIndex = baseDate.getDay();
  // Monday is 1, Sunday is 7 in ISO
  const todayIso = currentDayIndex === 0 ? 7 : currentDayIndex;

  const weekLabels: Array<{ letter: string; dayName: string }> = [
    { letter: 'S', dayName: 'Senin' },
    { letter: 'S', dayName: 'Selasa' },
    { letter: 'R', dayName: 'Rabu' },
    { letter: 'K', dayName: 'Kamis' },
    { letter: 'J', dayName: 'Jumat' },
    { letter: 'S', dayName: 'Sabtu' },
    { letter: 'M', dayName: 'Minggu' },
  ];

  return weekLabels.map((item, idx) => {
    const dayIso = idx + 1; // 1 to 7
    // If day is before or equal to today, mark completed (or completed up to today)
    const isCompleted = dayIso <= todayIso;
    return {
      letter: item.letter,
      dayName: item.dayName,
      completed: isCompleted,
    };
  });
}
