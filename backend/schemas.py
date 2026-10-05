from pydantic import BaseModel, Field
from typing import Optional, List, Union, Dict, Any
from datetime import datetime

# --- USERS ---
class UserCreate(BaseModel):
    nama: str
    email: str
    consent_camera: bool = False
    consent_window: bool = False
    baseline_blink_rate: float = 15.0

class UserUpdate(BaseModel):
    nama: Optional[str] = None
    email: Optional[str] = None
    consent_camera: Optional[bool] = None
    consent_window: Optional[bool] = None
    baseline_blink_rate: Optional[float] = None

class UserResponse(BaseModel):
    id: str
    nama: str
    email: str
    consent_camera: bool
    consent_window: bool
    baseline_blink_rate: float
    created_at: Optional[str] = None
    auth_id: Optional[str] = None
    avatar_url: Optional[str] = None
    onboarded: Optional[bool] = False

class AuthSyncRequest(BaseModel):
    access_token: str


# --- WORKLOAD ITEMS ---
class WorkloadCreate(BaseModel):
    user_id: str
    judul: str
    jenis: str = Field(default="tugas", pattern="^(tugas|rapat|kuliah|ujian)$")
    deadline: datetime
    est_jam: float = 2.0
    effort: int = Field(default=3, ge=1, le=5)
    mata_kuliah: Optional[str] = None

class WorkloadUpdateStatus(BaseModel):
    status: str = Field(pattern="^(belum|selesai)$")

class WorkloadUpdate(BaseModel):
    judul: Optional[str] = None
    deadline: Optional[datetime] = None
    est_jam: Optional[float] = None
    effort: Optional[int] = Field(default=None, ge=1, le=5)
    mata_kuliah: Optional[str] = None

class WorkloadResponse(BaseModel):
    id: str
    user_id: str
    judul: str
    jenis: str
    deadline: str
    est_jam: float
    effort: int
    status: str
    mata_kuliah: Optional[str] = None
    source: Optional[str] = None
    google_event_id: Optional[str] = None


# --- SENSOR METRICS ---
class MetricPoint(BaseModel):
    ts: Optional[datetime] = None
    blink_rate: Optional[float] = None
    brow_tension: Optional[float] = None
    jaw_tension: Optional[float] = None
    gaze_minutes: Optional[float] = None
    face_visible: bool = True
    focus_seconds: int = 0
    distraction_seconds: int = 0
    app_category: Optional[str] = None

class MetricBatch(BaseModel):
    user_id: str
    batch: Optional[List[MetricPoint]] = None
    metrics: Optional[List[MetricPoint]] = None

    def get_items(self) -> List[MetricPoint]:
        return self.batch or self.metrics or []


# --- CHECK-INS ---
class CheckInCreate(BaseModel):
    user_id: str
    skor: int = Field(ge=1, le=5)
    catatan: Optional[str] = None
    jam_tidur: Optional[float] = Field(default=None, ge=0, le=24)
    energi: Optional[int] = Field(default=None, ge=1, le=5)

class CheckInResponse(BaseModel):
    id: str
    user_id: str
    ts: str
    skor: int
    catatan: Optional[str] = None
    jam_tidur: Optional[float] = None
    energi: Optional[int] = None


# --- INTERVENTIONS ---
class InterventionCreate(BaseModel):
    user_id: str
    tipe: str = Field(pattern="^(breathing|lock|break|playbook)$")
    durasi: int = 60
    selesai: bool = False

class InterventionResponse(BaseModel):
    id: str
    user_id: str
    ts: str
    tipe: str
    durasi: int
    selesai: bool


# --- BURNOUT INDEX ---
class BurnoutIndexResponse(BaseModel):
    user_id: str
    tanggal: str
    index: float
    zona: str
    load_score: Optional[float] = None
    stress_score: Optional[float] = None
    dist_score: Optional[float] = None
    checkin_score: Optional[float] = None
    alasan: List[str]
    trend_flag: bool
    sensors_missing: List[str] = []


# --- HEATMAP STRES ---
class HeatmapCell(BaseModel):
    hour: str
    level: str  # 'green' | 'peach' | 'red'
    info: str

class HeatmapRow(BaseModel):
    dayName: str
    cells: List[HeatmapCell]

class HeatmapResponse(BaseModel):
    hours: List[str]
    rows: List[HeatmapRow]
    peak_stress_hours: str
    heaviest_day: str
    advice: str


# --- FOKUS & DISTRAKSI ---
class FocusOverview(BaseModel):
    date: str
    focusPercent: int
    distractPercent: int
    focusDuration: str
    distractDuration: str
    motivationalNote: str

class FocusTopDistractor(BaseModel):
    id: str
    name: str
    durationMinutes: int
    durationLabel: str
    percentage: int

class FocusStreakDay(BaseModel):
    letter: str
    dayName: str
    completed: bool

class FocusStreakInfo(BaseModel):
    currentStreak: int
    targetRule: str
    bestRecord: int
    days: List[FocusStreakDay]

class FocusDailyBar(BaseModel):
    id: str
    dayShort: str
    dayFull: str
    focusPercent: int
    distractPercent: int
    focusDuration: str
    distractDuration: str
    totalDuration: str
    totalHoursNum: float

class FocusSummaryResponse(BaseModel):
    overview: FocusOverview
    top_distractors: List[FocusTopDistractor]
    streak: FocusStreakInfo
    weekly_bars: List[FocusDailyBar]


# --- INSIGHT MINGGUAN & PLAYBOOK ---
class WellnessPlaybookItem(BaseModel):
    id: str
    stepNumber: int
    title: str
    description: str
    actionLabel: str
    isPrimary: bool = False

class WeeklySummaryStat(BaseModel):
    id: str
    value: str
    label: str
    colorType: str  # 'orange' | 'green' | 'red'

class WeeklyInsightResponse(BaseModel):
    title: str
    description: str
    weeklyScore: int
    zoneName: str
    note: str
    playbook: List[WellnessPlaybookItem]
    advisory: str
    summaryStats: List[WeeklySummaryStat]


# --- DEMO SIMULATION ---
class SimulateRequest(BaseModel):
    user_id: str
    mode: str = Field(default="oranye", pattern="^(oranye|merah|reset)$")


# --- PROFIL MAHASISWA ---
class ProfileUpsert(BaseModel):
    panggilan: Optional[str] = None
    kampus: Optional[str] = None
    jurusan: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=14)
    jam_tidur: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    jam_bangun: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    kronotipe: Optional[str] = Field(default=None, pattern="^(pagi|siang|malam)$")
    target_fokus_jam: Optional[float] = Field(default=None, ge=0.5, le=16)
    focus_whitelist: Optional[List[str]] = None
    focus_blacklist: Optional[List[str]] = None
    agent_action: Optional[str] = Field(default=None, pattern="^(warn_only|minimize|warn_then_close|close)$")
    onboarded: Optional[bool] = None


# --- JADWAL KULIAH ---
class ClassScheduleCreate(BaseModel):
    user_id: str
    mata_kuliah: str
    hari: int = Field(ge=0, le=6)
    jam_mulai: str = Field(pattern=r"^\d{2}:\d{2}$")
    jam_selesai: str = Field(pattern=r"^\d{2}:\d{2}$")
    ruang: Optional[str] = None
    source: str = "manual"

class ClassScheduleBulk(BaseModel):
    user_id: str
    items: List[ClassScheduleCreate]
    replace: bool = True


# --- GOOGLE CALENDAR SYNC ---
class CalendarEvent(BaseModel):
    id: str
    summary: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    description: Optional[str] = None

class CalendarSyncRequest(BaseModel):
    user_id: str
    events: List[CalendarEvent]


# --- PLANNER ---
class AutoPlanRequest(BaseModel):
    user_id: str
    session_minutes: int = Field(default=50, ge=15, le=180)
    days: int = Field(default=14, ge=1, le=30)
    replace_existing: bool = True

class StudySessionUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(rencana|selesai|dilewati)$")
    google_event_id: Optional[str] = None


# --- FOCUS SESSION ---
class FocusSessionStart(BaseModel):
    user_id: str
    workload_id: Optional[str] = None
    judul: Optional[str] = None
    target_menit: int = Field(default=25, ge=1, le=240)
    agent_connected: bool = False

class FocusSessionFinish(BaseModel):
    focus_seconds: int = 0
    distraction_seconds: int = 0
    blocked_apps: Dict[str, int] = {}
    completed: bool = True
