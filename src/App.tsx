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
import { GoogleCalendarModal } from './components/modals/GoogleCalendarModal';
import { TrenLaporanView } from './components/tren/TrenLaporanView';
import { CalendarGrid } from './components/deadline/CalendarGrid';
import { RingkasanBeban } from './components/deadline/RingkasanBeban';
import { AgendaDetail } from './components/deadline/AgendaDetail';
import { GoogleCalendarBanner } from './components/deadline/GoogleCalendarBanner';
import { FokusView } from './components/fokus/FokusView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { api, getStoredUserId, setStoredUserId, StudentProfile } from './services/api';
import { authService } from './services/supabase';
import { googleCalendarService } from './services/googleCalendar';
import { focusStore } from './services/focusSessionStore';

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
  const [burnoutScore, setBurnoutScore] = useState<number>(() => {
    try {
      const storedUid = typeof window !== 'undefined' ? localStorage.getItem('napas_user_id') : null;
      if (storedUid) {
        const cached = localStorage.getItem(`napas_checkin_score_${storedUid}`);
        if (cached === '3') return 45;
        if (cached === '1' || cached === '2') return 79;
        if (cached === '5' || cached === '4') return 16;
      }
      const mood = typeof window !== 'undefined' ? localStorage.getItem('napas_checkin_mood') : null;
      if (mood === 'Netral') return 45;
      if (mood === 'Sedih') return 79;
      if (mood === 'Bahagia / Senang') return 16;
    } catch {}
    return 16;
  });
  const [zonaLabel, setZonaLabel] = useState<string>(() => {
    try {
      const storedUid = typeof window !== 'undefined' ? localStorage.getItem('napas_user_id') : null;
      if (storedUid) {
        const cached = localStorage.getItem(`napas_checkin_score_${storedUid}`);
        if (cached === '3') return 'Kuning (Waspada)';
        if (cached === '1' || cached === '2') return 'Oranye (Beban Tinggi)';
        if (cached === '5' || cached === '4') return 'Hijau (Prima)';
      }
      const mood = typeof window !== 'undefined' ? localStorage.getItem('napas_checkin_mood') : null;
      if (mood === 'Netral') return 'Kuning (Waspada)';
      if (mood === 'Sedih') return 'Oranye (Beban Tinggi)';
      if (mood === 'Bahagia / Senang') return 'Hijau (Prima)';
    } catch {}
    return 'Hijau (Prima)';
  });
  const [trendText, setTrendText] = useState<string>('Kondisi stabil');
  const [alasanChips, setAlasanChips] = useState<string[]>([]);
  const [todayCheckinScore, setTodayCheckinScore] = useState<number | undefined>(() => {
    try {
      const storedUid = typeof window !== 'undefined' ? localStorage.getItem('napas_user_id') : null;
      if (storedUid) {
        const cached = localStorage.getItem(`napas_checkin_score_${storedUid}`);
        if (cached) return Number(cached);
      }
      const mood = typeof window !== 'undefined' ? localStorage.getItem('napas_checkin_mood') : null;
      if (mood === 'Bahagia / Senang') return 5;
      if (mood === 'Netral') return 3;
      if (mood === 'Sedih') return 1;
    } catch {}
    return undefined;
  });

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
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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

  const studentName =
    studentProfile?.panggilan ||
    studentProfile?.nama ||
    (typeof window !== 'undefined' ? localStorage.getItem('napas_user_name') : null) ||
    'Mahasiswa';

  useEffect(() => {
    document.body.setAttribute('data-tab', activeTab);
    const titles: Record<TabType, string> = {
      home: `Profil ${studentName}`,
      tren: 'Tren & Laporan Kesejahteraan',
      deadline: 'Deadline Radar',
      fokus: 'Fokus & Distraksi',
      laporan: 'Tren & Laporan Kesejahteraan',
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
        return;
      }
    }
    setTasks([]);
  }, []);

  // Load Deadline Radar from backend
  const loadRadar = useCallback(async (uid: string) => {
    // 1. Instant hydration dari local cache jika tersedia
    try {
      const cached = localStorage.getItem(`napas_radar_cache_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.days && parsed.days.length > 0) {
          setCalendarDays(parsed.days);
        }
      }
    } catch {}

    const radar = await api.getRadar(uid, 14);
    if (radar && radar.days && radar.days.length > 0) {
      const mappedDays: CalendarDay[] = radar.days.map((d) => ({
        date: d.date,
        raw_date: d.raw_date || d.date,
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
      try {
        localStorage.setItem(`napas_radar_cache_${uid}`, JSON.stringify({ days: mappedDays }));
      } catch {}
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

    const isAlreadyOnboarded =
      prof?.onboarded === true ||
      localStorage.getItem(`napas_user_onboarded_${uid}`) === 'true';

    if (prof) {
      setStudentProfile({ ...prof, onboarded: isAlreadyOnboarded });
      if (!isAlreadyOnboarded) {
        setIsOnboardingOpen(true);
      } else {
        setIsOnboardingOpen(false);
      }
    } else {
      if (!isAlreadyOnboarded) {
        setIsOnboardingOpen(true);
      } else {
        setIsOnboardingOpen(false);
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
      focusStore.loadUserWhitelist(uid),
      api.getTodayCheckIn(uid).then((ci) => {
        if (ci) setTodayCheckinScore(ci.skor);
      }),
    ]);
  }, [loadIndexToday, loadWorkloads, loadRadar, loadProfileAndSchedule]);

  // Auth State Listener & Mount
  useEffect(() => {
    async function checkAuthAndInit() {
      // 0. Ambil provider_token langsung dari URL hash jika user baru saja dialihkan dari Google OAuth
      let hashProviderToken: string | null = null;
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        hashProviderToken = hashParams.get('provider_token');
        if (hashProviderToken) {
          authService.setStoredProviderToken(hashProviderToken);
        }
      }

      // 1. Eksekusi instan jika userId lokal sudah tersimpan agar UI langsung ter-render tanpa delay
      const storedUid = getStoredUserId();
      if (storedUid) {
        initUserSession(storedUid);
      }

      // 2. Cek sesi Supabase jika user baru kembali dari Google OAuth redirect atau token aktif
      try {
        const session = await authService.getSession();
        if (session?.user) {
          const pt = session.provider_token || hashProviderToken || authService.getStoredProviderToken();
          if (pt) {
            authService.setStoredProviderToken(pt);
          }
          const synced = await api.syncAuth({
            access_token: session.access_token,
            auth_id: session.user.id,
            email: session.user.email,
            nama: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });
          if (synced) {
            setStoredUserId(synced.id, synced.nama || synced.email || 'Mahasiswa');
            if (synced.id !== storedUid) {
              await initUserSession(synced.id);
            }
            if (pt) {
              googleCalendarService.fetchAndSyncEvents(synced.id).then((res) => {
                if (res.success) {
                  loadRadar(synced.id);
                  loadWorkloads(synced.id);
                  showToast('Google Calendar asli berhasil disinkronkan!', '📅');
                }
              });
            }
            // Bersihkan hash dari URL agar rapi
            if (window.location.hash && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Session check warning:', err);
      }
    }

    checkAuthAndInit();

    // Listener jika session berubah
    const unsub = authService.onAuthStateChange(async (session) => {
      if (session?.user) {
        if (session.provider_token) {
          authService.setStoredProviderToken(session.provider_token);
        }
        const synced = await api.syncAuth({
          access_token: session.access_token,
          auth_id: session.user.id,
          email: session.user.email,
          nama: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        });
        if (synced) {
          setStoredUserId(synced.id, synced.nama || synced.email || 'Mahasiswa');
          await initUserSession(synced.id);
          const pt = session.provider_token || authService.getStoredProviderToken();
          if (pt) {
            googleCalendarService.fetchAndSyncEvents(synced.id).then((res) => {
              if (res.success) {
                loadRadar(synced.id);
                loadWorkloads(synced.id);
                showToast('Google Calendar asli berhasil disinkronkan!', '📅');
              }
            });
          }
        }
      }
    });

    return () => unsub();
  }, [initUserSession, loadRadar, loadWorkloads]);

  // Refresh deadline dan workloads otomatis saat tab Deadline Radar dibuka
  useEffect(() => {
    if (activeTab === 'deadline' && userId) {
      loadRadar(userId);
      loadWorkloads(userId);
    }
  }, [activeTab, userId, loadRadar, loadWorkloads]);

  const handleCustomLogin = async (
    identifier: string,
    name: string,
    campus: string,
    major: string
  ) => {
    let uid = '';
    const regRes = await api.loginOrRegister({
      identifier: identifier || name,
      nama: name,
      email: identifier.includes('@') ? identifier : undefined,
    });

    if (regRes?.id) {
      uid = regRes.id;
    } else {
      // Deterministic fallback offline jika backend mati
      const clean = (identifier || name).trim().toLowerCase();
      let hash = 0;
      for (let i = 0; i < clean.length; i++) {
        hash = (hash << 5) - hash + clean.charCodeAt(i);
        hash |= 0;
      }
      uid = 'c0000000-0000-4000-8000-' + Math.abs(hash).toString(16).padStart(12, '0').slice(-12);
    }

    setStoredUserId(uid, name);
    localStorage.removeItem('napas_demo_mode');

    // Cek profil yang ada
    const existing = await api.getProfile(uid);
    const isAlreadyOnboarded =
      existing?.onboarded === true ||
      localStorage.getItem(`napas_user_onboarded_${uid}`) === 'true';

    if (!isAlreadyOnboarded) {
      const baseProf: Partial<StudentProfile> = {
        panggilan: name.split(' ')[0],
        onboarded: false,
      };
      if (campus) baseProf.kampus = campus;
      if (major) baseProf.jurusan = major;
      const created = await api.updateProfile(uid, baseProf);
      setStudentProfile(created || {
        user_id: uid,
        nama: name,
        panggilan: name.split(' ')[0],
        kampus: campus || '',
        jurusan: major || '',
        semester: 1,
        jam_tidur: '23:00',
        jam_bangun: '06:00',
        kronotipe: 'pagi',
        target_fokus_jam: 4.0,
        focus_whitelist: [],
        focus_blacklist: [],
        agent_action: 'warn_then_close',
        onboarded: false,
      });
      setIsOnboardingOpen(true);
    } else {
      setStudentProfile(existing);
      setIsOnboardingOpen(false);
    }

    await initUserSession(uid);
    showToast(`Selamat datang, ${name}!`, '🎓');
  };

  const handleLogout = async () => {
    await authService.signOut();
    localStorage.removeItem('napas_user_id');
    localStorage.removeItem('napas_user_name');
    localStorage.removeItem('napas_demo_mode');
    localStorage.removeItem('napas_active_focus_session');
    localStorage.removeItem('napas_checkin_mood');
    focusStore.resetForUser();
    setUserId(null);
    setStudentProfile(null);
    setTodayCheckinScore(undefined);
    showToast('Berhasil keluar.', '👋');
  };

  const handleSyncGoogleCalendar = async () => {
    if (!userId) return;
    if (!googleCalendarService.isGoogleConnected(userId)) {
      setIsGoogleModalOpen(true);
      return;
    }
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

    // Optimistically update score & zona immediately for instant reactive feedback
    if (score === 5 || score === 4) {
      setBurnoutScore(16);
      setZonaLabel('Hijau (Prima)');
    } else if (score === 3) {
      setBurnoutScore(45);
      setZonaLabel('Kuning (Waspada)');
    } else if (score <= 2) {
      setBurnoutScore(72);
      setZonaLabel('Oranye (Beban Tinggi)');
    }

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

    const targetDayObj = calendarDays.find((d) => d.date === targetDay);
    const dayWithTasks = calendarDays.find((d) => d.date === selectedDate);
    const movableTask = dayWithTasks?.tasks?.find((t: any) => t.id);

    if (userId && movableTask && movableTask.id && targetDayObj && (targetDayObj as any).raw_date) {
      await api.updateWorkload(movableTask.id, {
        deadline: `${(targetDayObj as any).raw_date}T23:59:00+07:00`,
      });
      showToast(`Tugas "${movableTask.title}" berhasil dipindahkan ke ${targetDay}!`, '✅');
      await Promise.all([loadRadar(userId), loadWorkloads(userId), loadIndexToday(userId)]);
    } else {
      showToast(`Jadwal dialihkan ke ${targetDay}.`, '✅');
      if (userId) {
        await Promise.all([loadRadar(userId), loadIndexToday(userId)]);
      }
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

          {/* Tab 2: Tren & Laporan (Unified) */}
          {(activeTab === 'tren' || activeTab === 'laporan') && (
            <section id="view-tren" className="page-view active">
              <TrenLaporanView onNotify={showToast} />
            </section>
          )}

          {/* Tab 3: Deadline Radar */}
          {activeTab === 'deadline' && (
            <section id="view-deadline" className="page-view active">
              <div className="deadline-container">
                <GoogleCalendarBanner
                  isConnected={googleCalendarService.isGoogleConnected(userId || undefined)}
                  isSyncing={isSyncingCalendar}
                  lastSyncText={googleCalendarService.getLastSyncInfo(userId || '').lastSyncText}
                  syncedCount={googleCalendarService.getLastSyncInfo(userId || '').syncedCount}
                  onSync={handleSyncGoogleCalendar}
                  onOpenModal={() => setIsGoogleModalOpen(true)}
                  onAddManualDeadline={() => setIsAddTaskOpen(true)}
                />

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

          {/* Tab 6: Settings */}
          {activeTab === 'settings' && (
            <section id="view-settings" className="page-view active">
              <SettingsView
                onNotify={showToast}
                onProfileUpdated={(prof) => {
                  setStudentProfile(prof);
                  const nameVal = prof.panggilan || prof.nama;
                  if (nameVal) {
                    localStorage.setItem('napas_user_name', nameVal);
                  }
                }}
              />
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
        currentLoadScore={selectedDay?.load}
      />

      <GoogleCalendarModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        userId={userId}
        onSyncComplete={async () => {
          if (userId) {
            await Promise.all([loadWorkloads(userId), loadRadar(userId), loadIndexToday(userId)]);
          }
        }}
        showToast={showToast}
      />

      {isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          userId={userId}
          initialName={studentName}
          onComplete={async (prof) => {
            setStudentProfile(prof);
            setIsOnboardingOpen(false);
            if (prof.panggilan) {
              localStorage.setItem('napas_user_name', prof.panggilan);
            }
            if (userId) {
              await Promise.all([
                loadIndexToday(userId),
                loadWorkloads(userId),
                loadRadar(userId),
                focusStore.loadUserWhitelist(userId),
              ]);
            }
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
