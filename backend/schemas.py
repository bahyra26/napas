from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

# --- USERS ---
class UserCreate(BaseModel):
    nama: str
    email: str
    consent_camera: bool = False
    consent_window: bool = False
    baseline_blink_rate: float = 18.0

class UserResponse(BaseModel):
    id: str
    nama: str
    email: str
    consent_camera: bool
    consent_window: bool
    baseline_blink_rate: float
    created_at: Optional[str] = None

# --- WORKLOAD ITEMS ---
class WorkloadCreate(BaseModel):
    user_id: str
    judul: str
    jenis: str = Field(default="tugas", pattern="^(tugas|rapat|kuliah|ujian)$")
    deadline: datetime
    est_jam: float = 2.0
    effort: int = Field(default=3, ge=1, le=5)

class WorkloadUpdateStatus(BaseModel):
    status: str = Field(pattern="^(belum|selesai)$")

class WorkloadResponse(BaseModel):
    id: str
    user_id: str
    judul: str
    jenis: str
    deadline: str
    est_jam: float
    effort: int
    status: str

# --- SENSOR METRICS ---
class MetricItem(BaseModel):
    blink_rate: Optional[float] = None
    brow_tension: Optional[float] = None
    jaw_tension: Optional[float] = None
    gaze_minutes: Optional[float] = None
    face_visible: bool = True
    focus_seconds: int = 0
    distraction_seconds: int = 0
    app_category: Optional[str] = None

class BatchMetricsCreate(BaseModel):
    user_id: str
    metrics: List[MetricItem]

# --- CHECK-INS ---
class CheckInCreate(BaseModel):
    user_id: str
    skor: int = Field(ge=1, le=5)
    catatan: Optional[str] = None

# --- INTERVENTIONS ---
class InterventionCreate(BaseModel):
    user_id: str
    tipe: str = Field(pattern="^(breathing|lock|break|playbook)$")
    durasi: int = 60
    selesai: bool = False

# --- BURNOUT INDEX ---
class BurnoutIndexResponse(BaseModel):
    user_id: str
    tanggal: str
    index: float
    zona: str
    load_score: float
    stress_score: float
    dist_score: float
    checkin_score: float
    alasan: List[str]
    trend_flag: bool
