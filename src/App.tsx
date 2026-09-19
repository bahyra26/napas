import React, { useState, useRef, useEffect } from 'react';
import { CalendarDay, MoodType, TabType, TaskItem, ToastState } from './types';
import { INITIAL_CALENDAR_DAYS, INITIAL_TASKS } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Toast } from './components/common/Toast';
import { PlaceholderView } from './components/common/PlaceholderView';
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-tab', activeTab);
  }, [activeTab]);

  // Data states
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(INITIAL_CALENDAR_DAYS);
  const [selectedDate, setSelectedDate] = useState<string>('Kamis, 19 September');

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

    // Update Kamis to Sedang & lighter load
    setCalendarDays((prev) =>
      prev.map((day) => {
        if (day.date === 'Kamis, 19 September') {
          return {
            ...day,
            status: 'Sedang',
            load: 45,
            pillText: '1 tugas',
            tasks: [{ title: 'UAS Kalkulus Fisika', time: 'Deadline 23.59' }],
          };
        }
        return day;
      })
    );
  };

  const selectedDay =
    calendarDays.find((d) => d.date === selectedDate) || calendarDays[0];

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
                    <RingkasanBeban />
                  </div>
                  <AgendaDetail
                    selectedDay={selectedDay}
                    onOpenReschedule={() => setIsRescheduleOpen(true)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Tab 4: Fokus */}
          {activeTab === 'fokus' && (
            <section id="view-fokus" className="page-view active">
              <PlaceholderView
                icon="🧘‍♂️"
                title="Ruang Fokus & Relaksasi"
                description="Atur ritme kerja menggunakan timer Pomodoro 25 menit dan panduan relaksasi pernapasan terintegrasi."
              />
            </section>
          )}

          {/* Tab 5: Laporan */}
          {activeTab === 'laporan' && (
            <section id="view-laporan" className="page-view active">
              <PlaceholderView
                icon="📊"
                title="Laporan Kesejahteraan Mingguan"
                description="Unduh rekap data kesehatan mental, riwayat intervensi, dan skor kepatuhan istirahat dalam format PDF."
              />
            </section>
          )}

          {/* Tab 6: Settings */}
          {activeTab === 'settings' && (
            <section id="view-settings" className="page-view active">
              <PlaceholderView
                icon="⚙️"
                title="Pengaturan Sistem"
                description="Sesuaikan profil pengguna, jadwal notifikasi, pengingat jeda istirahat, dan preferensi privasi data sensor."
              />
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
