import React, { useState, useRef, useEffect } from 'react';
import { CalendarDay, MoodType, TabType, TaskItem, ToastState } from './types';
import { INITIAL_CALENDAR_DAYS, INITIAL_TASKS } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Toast } from './components/common/Toast';
import { GaugeCircle } from './components/home/GaugeCircle';
import { KenapaCard } from './components/home/KenapaCard';
import { MoodCheckin } from './components/home/MoodCheckin';
import { BreathingSection } from './components/home/BreathingSection';
import { QuickTasks } from './components/home/QuickTasks';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { RescheduleModal } from './components/modals/RescheduleModal';
import { TrendChart } from './components/tren/TrendChart';
import { RingkasanCard } from './components/tren/RingkasanCard';
import { HeatmapStres } from './components/tren/HeatmapStres';
import { KesimpulanCard } from './components/tren/KesimpulanCard';
import { CalendarGrid } from './components/deadline/CalendarGrid';
import { RingkasanBeban } from './components/deadline/RingkasanBeban';
import { AgendaDetail } from './components/deadline/AgendaDetail';
import { FokusView } from './components/fokus/FokusView';
import { LaporanView } from './components/laporan/LaporanView';
import { SettingsView } from './components/settings/SettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-tab', activeTab);
    const titles: Record<TabType, string> = {
      home: 'Profil Raka',
      tren: 'Tren Kesejahteraan',
      deadline: 'Deadline Radar',
      fokus: 'Fokus & Distraksi',
      laporan: 'Laporan & Rekomendasi',
      settings: 'Settings',
    };
    document.title = `NAPAS · ${titles[activeTab]}`;
  }, [activeTab]);

  // Data states
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(INITIAL_CALENDAR_DAYS);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => INITIAL_CALENDAR_DAYS[3]?.date || INITIAL_CALENDAR_DAYS[0]?.date
  );

  // Modal states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    icon: '✨',
  });
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string, icon = '✨') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ visible: true, message, icon });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  };

  const handleRefreshScore = () => {
    showToast('Skor diperbarui: 18% (Kondisi Prima)', '✨');
  };

  const handleMoodSelect = (mood: MoodType, icon: string) => {
    showToast(`Mood dicatat: ${mood}`, icon);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tugas dihapus!', '🗑️');
  };

  const handleAddTask = (newTask: Omit<TaskItem, 'id'>) => {
    const item: TaskItem = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [item, ...prev]);
    showToast('Tugas baru berhasil ditambahkan!', '✅');
  };

  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDate(day.date);
    showToast(`Melihat jadwal ${day.date}`, '📅');
  };

  const handleConfirmReschedule = (targetDay: string) => {
    setIsRescheduleOpen(false);
    showToast(`Tugas berhasil dipindahkan ke ${targetDay}! Beban menurun.`, '✅');

    setCalendarDays((prev) =>
      prev.map((day) => {
        if (day.date === selectedDate) {
          return {
            ...day,
            status: 'Sedang',
            load: Math.max(30, day.load - 33),
            pillText: `${Math.max(1, day.tasks.length - 1)} tugas`,
            tasks: day.tasks.slice(1),
          };
        }
        if (day.date === targetDay) {
          return {
            ...day,
            status: 'Sedang',
            load: Math.min(60, day.load + 30),
            pillText: `${day.tasks.length + 1} tugas`,
            tasks: [
              ...day.tasks,
              { title: 'Technical Meeting JOINTS', time: '13.00 - 14.00' },
            ],
          };
        }
        return day;
      })
    );
  };

  const selectedDay =
    calendarDays.find((d) => d.date === selectedDate) || calendarDays[0];

  const busiestDay = calendarDays.reduce(
    (max, d) => (d.load > max.load ? d : max),
    calendarDays[0]
  );

  const availableRescheduleDays = calendarDays
    .filter((d) => d.status === 'Ringan' && d.date !== selectedDate)
    .slice(0, 3)
    .map((d, idx) => ({
      day: d.date,
      badge:
        idx === 0
          ? 'Bebas Tugas · Optimal'
          : idx === 1
          ? 'Bebas Tugas · Akhir Pekan'
          : 'Bebas Tugas',
    }));

  return (
    <div className="app-viewport">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectTab={setActiveTab}
        />

        <div className="dashboard-container">
          {/* Tab 1: Home */}
          {activeTab === 'home' && (
            <section id="view-home" className="page-view active">
              <main className="dashboard-grid">
                <section className="col col-left">
                  <GaugeCircle onRefresh={handleRefreshScore} />
                  <KenapaCard />
                </section>

                <MoodCheckin onMoodSelect={handleMoodSelect} />

                <section className="col col-right">
                  <BreathingSection onNotify={showToast} />
                  <QuickTasks
                    tasks={tasks}
                    onDeleteTask={handleDeleteTask}
                    onOpenAddModal={() => setIsAddTaskOpen(true)}
                  />
                </section>
              </main>
            </section>
          )}

          {/* Tab 2: Tren */}
          {activeTab === 'tren' && (
            <section id="view-tren" className="page-view active">
              <div className="tren-container">
                <div className="tren-grid">
                  <TrendChart />
                  <RingkasanCard />
                  <HeatmapStres onCellInteract={(info) => showToast(info, '📊')} />
                  <KesimpulanCard />
                </div>
              </div>
            </section>
          )}

          {/* Tab 3: Deadline */}
          {activeTab === 'deadline' && (
            <section id="view-deadline" className="page-view active">
              <div className="deadline-container">
                <div className="deadline-grid">
                  <div className="deadline-col-left">
                    <CalendarGrid
                      days={calendarDays}
                      selectedDate={selectedDate}
                      onSelectDay={handleSelectDay}
                    />
                    <RingkasanBeban days={calendarDays} />
                  </div>
                  <AgendaDetail
                    selectedDay={selectedDay}
                    busiestDay={busiestDay}
                    onOpenReschedule={() => setIsRescheduleOpen(true)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Tab 4: Fokus */}
          {activeTab === 'fokus' && (
            <section id="view-fokus" className="page-view active">
              <FokusView onNotify={showToast} />
            </section>
          )}

          {/* Tab 5: Laporan */}
          {activeTab === 'laporan' && (
            <section id="view-laporan" className="page-view active">
              <LaporanView onNotify={showToast} />
            </section>
          )}

          {/* Tab 6: Settings */}
          {activeTab === 'settings' && (
            <section id="view-settings" className="page-view active">
              <SettingsView onNotify={showToast} />
            </section>
          )}
        </div>
      </div>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirmReschedule={handleConfirmReschedule}
        availableDays={availableRescheduleDays}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        icon={toast.icon}
      />

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </div>
  );
};

export default App;
