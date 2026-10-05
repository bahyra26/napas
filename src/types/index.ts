export type TabType = 'home' | 'tren' | 'deadline' | 'fokus' | 'laporan' | 'settings';

export type PriorityType = 'red' | 'yellow' | 'green';

export interface TaskItem {
  id: string;
  title: string;
  meta: string;
  priority: PriorityType;
}

export type MoodType = 'Bahagia / Senang' | 'Netral' | 'Sedih';

export interface CalendarDay {
  date: string;
  dayName: string;
  dayNum: number;
  monthShort?: string;
  monthFull?: string;
  status: 'Ringan' | 'Sedang' | 'Berat';
  load: number;
  pillText: string;
  tasks: Array<{ title: string; time: string }>;
}

export interface TrendPoint {
  day: number;
  val: string;
  percentNum: number;
  cx: number;
  cy: number;
  isIntervention?: boolean;
}

export interface HeatmapCell {
  hour: string;
  level: 'green' | 'peach' | 'red';
  info: string;
}

export interface HeatmapRow {
  dayName: string;
  cells: HeatmapCell[];
}

export interface ToastState {
  visible: boolean;
  message: string;
  icon: string;
}

export interface FocusTopDistractor {
  id: string;
  name: string;
  durationMinutes: number;
  durationLabel: string;
  percentage: number;
}

export interface FocusDailyBar {
  id: string;
  dayShort: string;
  dayFull: string;
  focusPercent: number;
  distractPercent: number;
  focusDuration: string;
  distractDuration: string;
  totalDuration: string;
  totalHoursNum: number;
}

export interface FocusStreakDay {
  letter: string;
  dayName: string;
  completed: boolean;
}

export interface FocusOverviewData {
  date: string;
  focusPercent: number;
  distractPercent: number;
  focusDuration: string;
  distractDuration: string;
  motivationalNote: string;
}

export interface WeeklyInsightData {
  title: string;
  description: string;
  weeklyScore: number;
  zoneName: string;
  note: string;
}

export interface WellnessPlaybookItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  actionLabel: string;
  isPrimary?: boolean;
}

export interface WeeklySummaryStat {
  id: string;
  value: string;
  label: string;
  colorType: 'orange' | 'green' | 'red';
}

export interface InterventionHistoryItem {
  id: string;
  title: string;
  status: string;
  time: string;
  isCompleted: boolean;
}

export interface SensorPermissionItem {
  id: string;
  iconType: 'camera' | 'window' | 'heart';
  title: string;
  description: string;
  enabled: boolean;
}

export interface InterventionSettingItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface UserProfileInfo {
  name: string;
  email?: string;
  role?: string;
}



