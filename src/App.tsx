import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarDay, MoodType, PriorityType, TabType, TaskItem, ToastState } from './types';
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
import { AddTaskModal, NewTaskPayload } from './components/modals/AddTaskModal';
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
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { api, getStoredUserId, setStoredUserId, StudentProfile } from './services/api';
import { authService } from './services/supabase';
import { googleCalendarService } from './services/googleCalendar';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth & Student Profile state
  const [userId, setUserId] = useState<string | null>(getStoredUserId());
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);

  // Burnout Engine state
  const [burnoutScore, setBurnoutScore] = useState<number>(20);
  const [zonaLabel, setZonaLabel] = useState<string>('Hijau (Prima)');
  const [trendText, setTrendText] = useState<string>('Kondisi stabil');
  const [alasanChips, setAlasanChips] = useState<string[]>([]);
  const [todayCheckinScore, setTodayCheckinScore] = useState<number | undefined>(undefined);

  // Task & Schedule data states
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [matkulList, setMatkulList] = useState<string[]>([]);
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
    }, 3000);
  };

  const studentName = studentProfile?.panggilan || studentProfile?.nama || 'Raka';

  useEffect(() => {
    document.body.setAttribute('data-tab', activeTab);
    const titles: Record<TabType, string> = {
      home: `Profil ${studentName}`,
      tren: 'Tren Kesejahteraan',
      deadline: 'Deadline Radar',
      fokus: 'Fokus & Distraksi',
      laporan: 'Laporan & Rekomendasi',
      settings: 'Settings',
    };
    document.title = `NAPAS · ${titles[activeTab] || 'Dashboard'}`;
  }, [activeTab, studentName]);

  // Load index today from backend
  const loadIndexToday = useCallback(async (uid: string) => {
    const data = await api.getTodayIndex(uid);
    if (data) {
      setBurnoutScore(Math.round(data.index));
      const zonaMap: Record<string, string> = {
        hijau: 'Hijau (Prima)',
        kuning: 'Kuning (Waspada)',
        oranye: 'Oranye (Beban Tinggi)',
        merah: 'Merah (Kritis)',
      };
      setZonaLabel(zonaMap[data.zona] || data.zona);
      if (data.alasan && data.alasan.length > 0) {
        setAlasanChips(data.alasan);
      }
      if (data.trend_flag) {
        setTrendText('+10 tren naik');
      } else {
        setTrendText('Kondisi stabil');
      }
    }
  }, []);

  // Load workloads from backend
  const loadWorkloads = useCallback(async (uid: string) => {
    const workloads = await api.getWorkloads(uid);
    if (workloads && workloads.length > 0) {
      const activeWorkloads = workloads.filter((w) => w.status !== 'selesai');
      if (activeWorkloads.length > 0) {
        const mapped: TaskItem[] = activeWorkloads.map((w) => {
          let meta = 'Mendatang';
          try {
            const dl = new Date(w.deadline);
            meta = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          } catch {}
          const priority: PriorityType =
            w.effort >= 4 ? 'red' : w.effort >= 3 ? 'yellow' : 'green';
          return {
            id: w.id,
            title: w.judul,
            meta,
            priority,
          };
        });
        setTasks(mapped);
      }
    }
  }, []);

  // Load Deadline Radar from backend
  const loadRadar = useCallback(async (uid: string) => {
    const radar = await api.getRadar(uid, 14);
    if (radar && radar.days && radar.days.length > 0) {
      const mappedDays: CalendarDay[] = radar.days.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        dayNum: d.dayNum,
        monthShort: d.monthShort,
        monthFull: d.monthFull,
        status: d.status,
        load: d.load,
        pillText: d.pillText,
        tasks: d.tasks,
      }));
      setCalendarDays(mappedDays);
      setSelectedDate((prev) => {
        const exists = mappedDays.some((md) => md.date === prev);
        return exists ? prev : mappedDays[0].date;
      });
    }
  }, []);

  // Load Profile and class schedules
  const loadProfileAndSchedule = useCallback(async (uid: string) => {
    const [prof, sched] = await Promise.all([
      api.getProfile(uid),
      api.getClassSchedule(uid),
    ]);

    if (prof) {
      setStudentProfile(prof);
      if (prof.onboarded === false) {
        setIsOnboardingOpen(true);
      }
    }

    if (sched && sched.length > 0) {
      const uniqueMatkul = Array.from(new Set(sched.map((s) => s.mata_kuliah)));
      setMatkulList(uniqueMatkul);
    }
  }, []);

  // Initialize data for user
  const initUserSession = useCallback(async (uid: string) => {
    setUserId(uid);
    await Promise.all([
      loadIndexToday(uid),
      loadWorkloads(uid),
      loadRadar(uid),
      loadProfileAndSchedule(uid),
      api.getTodayCheckIn(uid).then((ci) => {
        if (ci) setTodayCheckinScore(ci.skor);
      }),
    ]);
  }, [loadIndexToday, loadWorkloads, loadRadar, loadProfileAndSchedule]);

  // Auth State Listener & Mount
  useEffect(() => {
    async function checkAuthAndInit() {
      // 1. Cek sesi Supabase jika user baru kembali dari Google OAuth redirect
      const session = await authService.getSession();
      if (session?.user) {
        const synced = await api.syncAuth({
          access_token: session.access_token,
          auth_id: session.user.id,
          email: session.user.email,
          nama: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        });
        if (synced) {
          await initUserSession(synced.id);
          return;
        }
      }

      // 2. Cek userId lokal yang tersimpan
      const storedUid = getStoredUserId();
      if (storedUid) {
        await initUserSession(storedUid);
      }
    }

    checkAuthAndInit();

    // Listener jika session berubah
    const unsub = authService.onAuthStateChange(async (session) => {
      if (session?.user) {
        const synced = await api.syncAuth({
          access_token: session.access_token,
          auth_id: session.user.id,
          email: session.user.email,
        });
        if (synced) {
          await initUserSession(synced.id);
        }
      }
    });

    return () => unsub();
  }, [initUserSession]);

  const handleDemoLogin = async () => {
    const demoUser = await api.initDemoUser();
    if (demoUser) {
      setStoredUserId(demoUser.id, demoUser.nama);
      localStorage.setItem('napas_demo_mode', 'true');
      await initUserSession(demoUser.id);
      showToast('Masuk sebagai Raka Pratama (Mode Demo).', '⚡');
    } else {
      // Offline fallback
      const fallbackId = '951459f9-e92f-4193-b470-ea87a899e18d';
      setStoredUserId(fallbackId, 'Raka Pratama');
      localStorage.setItem('napas_demo_mode', 'true');
      setUserId(fallbackId);
      showToast('Masuk Mode Demo Raka.', '⚡');
    }
  };

  const handleCustomLogin = async (name: string, campus: string, major: string) => {
    const customId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'c0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
    setStoredUserId(customId, name);
    localStorage.removeItem('napas_demo_mode');

    // Buat profil di backend / memory
    await api.updateProfile(customId, {
      panggilan: name.split(' ')[0],
      kampus: campus,
      jurusan: major,
      semester: 4,
      onboarded: true,
    });

    await initUserSession(customId);
    showToast(`Selamat datang, ${name}! Profil berhasil dipersonalisasi.`, '🎓');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUserId(null);
    setStudentProfile(null);
    showToast('Berhasil keluar.', '👋');
  };

  const handleSyncGoogleCalendar = async () => {
    if (!userId) return;
    setIsSyncingCalendar(true);
    const result = await googleCalendarService.fetchAndSyncEvents(userId);
    setIsSyncingCalendar(false);

    if (result.success) {
      showToast(result.message, '📅');
      await Promise.all([loadWorkloads(userId), loadRadar(userId), loadIndexToday(userId)]);
    } else {
      showToast(result.message, '⚠️');
    }
  };

  const handleAutoPlan = async () => {
    if (!userId) return;
    setIsAutoPlanning(true);
    const planRes = await api.autoPlan(userId, 50, 14);
    setIsAutoPlanning(false);

    if (planRes && planRes.created > 0) {
      showToast(planRes.message, '⚡');
      await Promise.all([loadRadar(userId), loadWorkloads(userId)]);
    } else {
      showToast(planRes?.message || 'Tidak ada tugas yang perlu dijadwalkan.', 'ℹ️');
    }
  };

  const handleRefreshScore = async () => {
    if (userId) {
      await loadIndexToday(userId);
      showToast(`Skor diperbarui: ${burnoutScore}% (${zonaLabel})`, '✨');
    }
  };

  const handleMoodSelect = async (
    mood: MoodType,
    icon: string,
    score: number,
    jamTidur?: number,
    energi?: number
  ) => {
    showToast(`Mood dicatat: ${mood}`, icon);
    setTodayCheckinScore(score);

    if (userId) {
      await api.postCheckIn(userId, score, `Mood: ${mood}`, jamTidur, energi);
      await loadIndexToday(userId);
    }
  };


  const handleBreathingComplete = async (tipe: 'breathing', durasi: number) => {
    if (userId) {
      await api.postIntervention(userId, tipe, durasi, true);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tugas dihapus!', '🗑️');

    if (userId) {
      await api.deleteWorkload(id);
      await Promise.all([loadIndexToday(userId), loadRadar(userId)]);
    }
  };

  const handleAddTask = async (newTask: NewTaskPayload) => {
    const tempId = `task-${Date.now()}`;
    setTasks((prev) => [{ id: tempId, title: newTask.title, meta: newTask.meta, priority: newTask.priority }, ...prev]);
    showToast('Tugas baru berhasil ditambahkan!', '✅');

    if (userId) {
      const saved = await api.createWorkload({
        user_id: userId,
        judul: newTask.title,
        jenis: 'tugas',
        deadline: newTask.deadlineIso,
        est_jam: newTask.estJam,
        effort: newTask.effort,
      });
      if (saved) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: saved.id } : t)));
        await Promise.all([loadIndexToday(userId), loadRadar(userId)]);
      }
    }
  };

  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDate(day.date);
    showToast(`Melihat agenda ${day.date}`, '📅');
  };

  const handleConfirmReschedule = async (targetDay: string) => {
    setIsRescheduleOpen(false);
    showToast(`Tugas berhasil dipindahkan ke ${targetDay}! Beban diperbarui.`, '✅');

    // Update state kalender lokal
    setCalendarDays((prev) =>
      prev.map((day) => {
        if (day.date === selectedDate) {
          return {
            ...day,
            status: 'Sedang',
            load: Math.max(30, day.load - 33),
            pillText: `${Math.max(1, day.tasks.length - 1)} agenda`,
            tasks: day.tasks.slice(1),
          };
        }
        if (day.date === targetDay) {
          return {
            ...day,
            status: 'Sedang',
            load: Math.min(60, day.load + 30),
            pillText: `${day.tasks.length + 1} agenda`,
            tasks: [...day.tasks, { title: 'Jadwal Pindahan', time: '14.00' }],
          };
        }
        return day;
      })
    );

    if (userId) {
      await loadRadar(userId);
      await loadIndexToday(userId);
    }
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
          ? 'Bebas Agenda · Optimal'
          : idx === 1
          ? 'Bebas Agenda · Akhir Pekan'
          : 'Bebas Agenda',
    }));

  // Jika belum login, tampilkan LoginView
  if (!userId) {
    return (
      <div className="app-viewport">
        <LoginView
          onDemoLogin={handleDemoLogin}
          onCustomLogin={handleCustomLogin}
          onNotify={showToast}
        />
        <Toast visible={toast.visible} message={toast.message} icon={toast.icon} />
      </div>
    );
  }

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
          studentName={studentName}
          avatarUrl={studentProfile?.avatar_url}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectTab={setActiveTab}
          onSyncCalendar={handleSyncGoogleCalendar}
          isSyncingCalendar={isSyncingCalendar}
          onLogout={handleLogout}
        />

        <div className="dashboard-container">
          {/* Tab 1: Home */}
          {activeTab === 'home' && (
            <section id="view-home" className="page-view active">
              <main className="dashboard-grid">
                <section className="col col-left">
                  <GaugeCircle
                    score={burnoutScore}
                    zonaLabel={zonaLabel}
                    trendText={trendText}
                    onRefresh={handleRefreshScore}
                  />
                  <KenapaCard alasan={alasanChips} />
                </section>

                <MoodCheckin
                  currentScore={todayCheckinScore}
                  onMoodSelect={handleMoodSelect}
                />

                <section className="col col-right">
                  <BreathingSection
                    onNotify={showToast}
                    onInterventionComplete={handleBreathingComplete}
                  />
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

          {/* Tab 3: Deadline Radar */}
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
                    onAutoPlan={handleAutoPlan}
                    isAutoPlanning={isAutoPlanning}
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
        matkulList={matkulList}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirmReschedule={handleConfirmReschedule}
        availableDays={availableRescheduleDays}
      />

      {isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          userId={userId}
          initialName={studentName}
          onComplete={(prof) => {
            setStudentProfile(prof);
            setIsOnboardingOpen(false);
            initUserSession(userId);
          }}
          onNotify={showToast}
        />
      )}

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
