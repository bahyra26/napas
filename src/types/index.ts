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
