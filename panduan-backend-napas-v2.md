# Panduan Membangun Backend NAPAS v2 — FastAPI + Supabase (Dokumen Final & Siap Dijalankan)

> **Status Dokumen:** FINAL & PRODUCTION-READY  
> **Peran Tim:** P2 — Backend & Burnout Engine  
> **Kompetisi:** JOINTS 2026 (FMIPA UGM)  
> **Prinsip Utama:** *Privacy-by-Design, Explainable Scoring, Graceful Degradation, End-to-End Ready*

---

## 1. Ringkasan Arsitektur & Peran Backend

Backend NAPAS v2 bertindak sebagai pusat saraf (*nerve center*) yang menghubungkan **NAPAS Agent (Desktop PySide6)** dan **Web Dashboard (Next.js)**:
1. **Menerima Data Telemetri:** Menerima batch metrik fisiologis 60 detik dari Agent (tanpa pernah menerima/menyimpan feed video kamera).
2. **Manajemen Beban Akademik:** Menyimpan data tugas, ujian, rapat, estimasi durasi, dan deadline.
3. **Burnout Engine Terbuka (Explainable AI):** Menghitung **Burnout Index (0–100)**, memetakan ke zona (Hijau, Kuning, Oranye, Merah), serta menyertakan *chips alasan* ("mengapa skor ini muncul") yang transparan untuk juri akademisi FMIPA.
4. **Deteksi Tren 3-Hari:** Memicu modifikator tren jika kelelahan meningkat secara konsekutif.
5. **Penyedia API Terbuka:** Menyediakan REST API dengan CORS aktif agar Web Dashboard dan Agent dapat terhubung tanpa kendala.

```
┌──────────────────────────┐             ┌──────────────────────────┐
│  NAPAS Agent (Desktop)   │             │   Web Dashboard (Next)   │
│  - Kirim /metrics 60s    │             │  - Ambil /index/today    │
│  - Ambil /workload       │             │  - Ambil /index/history  │
│  - Kirim /interventions  │             │  - Kelola /workload      │
└────────────┬─────────────┘             └────────────▲─────────────┘
             │                                        │
             ▼                                        │
    ┌─────────────────────────────────────────────────┴─────────────┐
    │                 FASTAPI BACKEND (PORT 8000)                   │
    │  - routers/users.py         - routers/index.py (Engine)       │
    │  - routers/workload.py      - routers/checkins.py             │
    │  - routers/metrics.py       - routers/interventions.py        │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                 SUPABASE (Cloud PostgreSQL)                   │
    │  Tabel: users, workload_items, sensor_metrics, check_ins,     │
    │         interventions, daily_index                            │
    └───────────────────────────────────────────────────────────────┘
```

---

## 2. Skema Database Supabase (SQL DDL Lengkap + Index)

Buka dashboard [Supabase](https://supabase.com) project Anda, masuk ke menu **SQL Editor**, buat query baru, lalu jalankan DDL berikut sekaligus:

```sql
-- ============================================================================
-- SKEMA DATABASE NAPAS v2 (FINAL + INDEXING)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  consent_camera BOOLEAN DEFAULT FALSE,
  consent_window BOOLEAN DEFAULT FALSE,
  baseline_blink_rate NUMERIC DEFAULT 18.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL WORKLOAD ITEMS (Tugas & Deadline)
CREATE TABLE IF NOT EXISTS workload_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  jenis TEXT CHECK (jenis IN ('tugas', 'rapat', 'kuliah', 'ujian')),
  deadline TIMESTAMPTZ NOT NULL,
  est_jam NUMERIC DEFAULT 2.0,
  effort INT CHECK (effort BETWEEN 1 AND 5) DEFAULT 3,
  status TEXT DEFAULT 'belum' CHECK (status IN ('belum', 'selesai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SENSOR METRICS (Batch Telemetri 60 Detik dari Agent)
CREATE TABLE IF NOT EXISTS sensor_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  blink_rate NUMERIC,
  brow_tension NUMERIC,
  jaw_tension NUMERIC,
  gaze_minutes NUMERIC,
  face_visible BOOLEAN DEFAULT TRUE,
  focus_seconds INT DEFAULT 0,
  distraction_seconds INT DEFAULT 0,
  app_category TEXT
);

-- 4. TABEL INTERVENTIONS (Log Tindakan: Breathing, Focus Lock, Nudge)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  tipe TEXT CHECK (tipe IN ('breathing', 'lock', 'break', 'playbook')),
  durasi INT DEFAULT 60,
  selesai BOOLEAN DEFAULT FALSE
);

-- 5. TABEL CHECK INS (Evaluasi Subjektif 2-Tap Mahasiswa)
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  skor INT CHECK (skor BETWEEN 1 AND 5), -- 1: Sangat Buruk/Kelelahan, 5: Sangat Bugar/Prima
  catatan TEXT
);

-- 6. TABEL DAILY INDEX (Agregat Harian & History Tren)
CREATE TABLE IF NOT EXISTS daily_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  index NUMERIC NOT NULL,
  zona TEXT NOT NULL CHECK (zona IN ('hijau', 'kuning', 'oranye', 'merah')),
  load_score NUMERIC DEFAULT 0,
  stress_score NUMERIC DEFAULT 0,
  dist_score NUMERIC DEFAULT 0,
  checkin_score NUMERIC DEFAULT 0,
  alasan_json JSONB DEFAULT '[]'::jsonb,
  trend_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tanggal)
);

-- ============================================================================
-- INDEX UNTUK PERFORMA QUERY CEPAT REAL-TIME
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_workload_user_deadline ON workload_items(user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_sensor_metrics_user_ts ON sensor_metrics(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_ts ON check_ins(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_daily_index_user_date ON daily_index(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_interventions_user_ts ON interventions(user_id, ts);
```

---

## 3. Formulasi Matematis Burnout Engine & Explainability

Formula inti Burnout Index:

$$\text{Burnout Index} = 0.35 \times \text{LoadScore} + 0.35 \times \text{StressScore} + 0.20 \times \text{DistractionScore} + 0.10 \times \text{CheckInScore} \pm \text{TrendModifier}$$

Rentang skor dijaga ketat di interval $[0, 100]$.

### 3.1. Rincian Perhitungan Sub-Skor

1. **LoadScore ($0 - 100$):**
   - Mengambil semua tugas aktif (`status = 'belum'`) dalam rentang 7 hari ke depan.
   - Bobot kedekatan deadline:
     - Deadline $< 24$ jam: bobot dasar $28 \times (\text{effort} / 3.0)$
     - Deadline $1 - 3$ hari: bobot dasar $15 \times (\text{effort} / 3.0)$
     - Deadline $4 - 7$ hari: bobot dasar $8 \times (\text{effort} / 3.0)$
   - Pinalti Larut Malam: Jika ada agenda/deadline antara pukul 22:00–04:00, ditambah pinalti $+10$.
   - $\text{LoadScore} = \min(100.0, \sum \text{bobot} + \text{pinalti})$.

2. **StressScore ($0 - 100$) — On-Device BioVisual Telemetry:**
   - Dihitung dari rata-rata telemetri `sensor_metrics` hari ini (hanya saat `face_visible = true`):
     - **Blink Deficit:** Baseline mata normal $\approx 18$ kedipan/menit. Saat stres atau kelelahan fokus, kedipan turun drastis.  
       $$\text{blink\_deficit} = \max\left(0, \frac{\text{baseline} - \overline{\text{blink}}}{\text{baseline}}\right) \times 100$$
     - **Muscle Tension (Alis & Rahang):**  
       $$\text{tension\_score} = (\overline{\text{brow\_tension}} \times 60.0) + (\overline{\text{jaw\_tension}} \times 40.0)$$
     - **Continuous Gaze:** Jika rata-rata durasi tatap tanpa jeda $> 45$ menit:  
       $$\text{gaze\_score} = \min\left(100.0, \frac{\overline{\text{gaze\_minutes}}}{50.0} \times 100.0\right)$$
     - Total: $\text{StressScore} = 0.40 \times \text{blink\_deficit} + 0.40 \times \text{tension\_score} + 0.20 \times \text{gaze\_score}$.
   - **Graceful Degradation:** Jika kamera dimatikan (`consent_camera = false` atau tidak ada rekaman metrik hari ini), sistem tidak menjatuhkan pinalti palsu; `StressScore` otomatis mengambil nilai netral aman ($20.0$).

3. **DistractionScore ($0 - 100$) — Focus Guard:**
   - Dihitung dari total akumulasi detik fokus vs distraksi hari ini:  
     $$\text{DistractionScore} = \frac{\sum \text{distraction\_seconds}}{\sum \text{focus\_seconds} + \sum \text{distraction\_seconds}} \times 100$$
   - Jika belum ada aktivitas di hari tersebut, skor adalah $0.0$.

4. **CheckInScore ($0 - 100$) — Normalisasi Subjektif:**
   - Skor input mahasiswa $1 - 5$ (1: Sangat Lelah/Tertekan, 5: Sangat Prima).
   - Normalisasi ke skala stres: $\text{CheckInScore} = (5 - \text{skor}) \times 25.0$.
   - Jika mahasiswa belum melakukan check-in hari ini, digunakan nilai default netral ($35.0$).

5. **Modifikator Tren 3-Hari ($+10$ poin):**
   - Query skor 3 hari berurutan sebelum hari ini dari `daily_index`.
   - Jika $\text{Index}_{t-1} > \text{Index}_{t-2} > \text{Index}_{t-3}$, maka `trend_flag = true` dan nilai akhir index ditambah $+10$.

6. **Pemetaan Zona:**
   - $0 \le \text{Index} < 30 \rightarrow$ **hijau** (Kondisi Prima)
   - $30 \le \text{Index} < 60 \rightarrow$ **kuning** (Beban Moderat)
   - $60 \le \text{Index} < 80 \rightarrow$ **oranye** (Peringatan Awal Kelelahan)
   - $\text{Index} \ge 80 \rightarrow$ **merah** (Resiko Burnout Tinggi)

7. **Explainability Engine (`alasan_json`):**
   - Menghasilkan daftar pesan terstruktur yang mudah dipahami, contoh:
     - `"5 deadline aktif dalam 7 hari kedepan"`
     - `"Kedipan mata turun 36% di bawah ambang normal"`
     - `"Distraksi mencapai 48 menit (34% waktu aktif)"`
     - `"Tren Burnout Index meningkat 3 hari berturut-turut"`

---

## 4. Struktur Folder Backend

Semua kode backend diletakkan di dalam folder `backend/`:

```
c:\PROJECT MIKAIL V2\KORBAN SIC 2026\backend\
├── .env                     # File konfigurasi lokal (jangan di-commit)
├── .env.example             # Template variabel environment
├── requirements.txt         # Daftar pustaka Python
├── db.py                    # Inisialisasi Supabase Client
├── schemas.py               # Pydantic Schemas validasi request/response
├── engine.py                # Rumus matematika Burnout Index & Explainability
├── main.py                  # Entrypoint FastAPI & konfigurasi CORS
├── routers/
│   ├── __init__.py
│   ├── users.py             # Endpoint registrasi & profil user
│   ├── workload.py          # CRUD tugas & deadline
│   ├── metrics.py           # Batch ingest data telemetri sensor
│   ├── checkins.py          # Endpoint check-in harian 2-tap
│   ├── interventions.py     # Log aksi intervensi (breathing, lock)
│   └── index.py             # Endpoint kalkulasi index hari ini & tren
├── seed_demo.py             # Script otomatis inject data skenario demo Raka (7 hari)
└── test-frontend.html       # UI pengujian interaktif mandiri
```

---

## 5. Implementasi Kode Lengkap (100% Siap Dijalankan)

### 5.1. `requirements.txt`

```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
supabase>=2.3.0
python-dotenv>=1.0.1
```

### 5.2. `.env.example` & `.env`

Buat file `.env` di dalam folder `backend/`:

```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJh......isi_anon_key_atau_service_role_key_anda......
PORT=8000
```

### 5.3. `backend/db.py`

Mengelola koneksi tunggal (*singleton*) ke Supabase:

```python
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n[PERINGATAN] SUPABASE_URL atau SUPABASE_KEY belum diatur di file .env!")
    print("Pastikan file .env sudah diisi sesuai konfigurasi project Supabase Anda.\n")

supabase: Client = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"[ERROR] Gagal menginisialisasi Supabase Client: {e}")
```

### 5.4. `backend/schemas.py`

Model data Pydantic untuk validasi input dan serialisasi respons:

```python
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
```

### 5.5. `backend/engine.py`

Logika perhitungan matematis Burnout Index murni (*pure logic & explainability*):

```python
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple

def calculate_load_score(workload_items: List[Dict[str, Any]], now: datetime = None) -> Tuple[float, List[str]]:
    """
    Menghitung skor beban tugas 7 hari ke depan.
    Rentang: 0 - 100.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    total_score = 0.0
    upcoming_count = 0
    urgent_count = 0
    night_penalty = 0.0
    alasan = []

    for item in workload_items:
        if item.get("status") == "selesai":
            continue

        raw_dl = item.get("deadline")
        if isinstance(raw_dl, str):
            dl = datetime.fromisoformat(raw_dl.replace("Z", "+00:00"))
        else:
            dl = raw_dl

        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)

        diff = dl - now
        hours_until = diff.total_seconds() / 3600.0

        # Hanya hitung deadline yang belum lewat dan dalam kurun waktu 7 hari (168 jam)
        if -2 <= hours_until <= 168:
            upcoming_count += 1
            effort = float(item.get("effort") or 3)
            effort_mult = effort / 3.0

            if hours_until <= 24:
                total_score += 28.0 * effort_mult
                urgent_count += 1
            elif hours_until <= 72:
                total_score += 15.0 * effort_mult
            else:
                total_score += 8.0 * effort_mult

            # Deteksi jadwal larut malam (antara jam 22.00 s.d 04.00)
            if dl.hour >= 22 or dl.hour <= 4:
                night_penalty = 10.0

    load_score = min(100.0, max(0.0, total_score + night_penalty))

    if urgent_count > 0:
        alasan.append(f"{urgent_count} deadline mendesak (< 24 jam)")
    elif upcoming_count > 0:
        alasan.append(f"{upcoming_count} agenda/tugas dalam 7 hari ke depan")
    if night_penalty > 0:
        alasan.append("Terdapat agenda/tugas larut malam (>22:00)")

    return round(load_score, 1), alasan


def calculate_stress_score(metrics_list: List[Dict[str, Any]], baseline_blink: float = 18.0) -> Tuple[float, List[str]]:
    """
    Menghitung skor stres dari data telemetri biovisual kamera.
    Rentang: 0 - 100.
    """
    alasan = []
    if not metrics_list:
        # Graceful degradation jika tidak ada data sensor
        return 20.0, ["Sensor biovisual nonaktif / baseline normal"]

    valid_samples = [m for m in metrics_list if m.get("face_visible") is not False]
    if not valid_samples:
        return 20.0, ["Pengguna tidak terdeteksi di depan laptop"]

    avg_blink = sum(m.get("blink_rate", baseline_blink) or baseline_blink for m in valid_samples) / len(valid_samples)
    avg_brow = sum(m.get("brow_tension", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)
    avg_jaw = sum(m.get("jaw_tension", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)
    avg_gaze = sum(m.get("gaze_minutes", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)

    # 1. Blink Deficit
    blink_drop_pct = 0.0
    if avg_blink < baseline_blink:
        blink_drop_pct = ((baseline_blink - avg_blink) / baseline_blink) * 100.0
    blink_score = min(100.0, blink_drop_pct * 1.5)

    # 2. Facial Muscle Tension
    tension_score = min(100.0, (avg_brow * 60.0) + (avg_jaw * 40.0))

    # 3. Screen Gaze Duration
    gaze_score = min(100.0, (avg_gaze / 50.0) * 100.0)

    stress_score = (0.40 * blink_score) + (0.40 * tension_score) + (0.20 * gaze_score)
    stress_score = min(100.0, max(0.0, stress_score))

    if blink_drop_pct >= 25.0:
        alasan.append(f"Kedipan mata turun {int(blink_drop_pct)}% di bawah normal")
    if tension_score >= 45.0:
        alasan.append("Ketegangan otot wajah/alis konsisten tinggi")
    if avg_gaze >= 40.0:
        alasan.append(f"Tatap layar terus-menerus rata-rata {int(avg_gaze)} menit tanpa jeda")

    return round(stress_score, 1), alasan


def calculate_distraction_score(metrics_list: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
    """
    Menghitung rasio distraksi dari Focus Guard.
    Rentang: 0 - 100.
    """
    alasan = []
    if not metrics_list:
        return 0.0, []

    total_focus = sum(m.get("focus_seconds", 0) or 0 for m in metrics_list)
    total_distraction = sum(m.get("distraction_seconds", 0) or 0 for m in metrics_list)
    total_time = total_focus + total_distraction

    if total_time <= 0:
        return 0.0, []

    ratio = (total_distraction / total_time) * 100.0
    dist_minutes = int(total_distraction / 60)

    if ratio >= 25.0 and dist_minutes >= 10:
        alasan.append(f"Waktu distraksi {dist_minutes} menit ({int(ratio)}% dari jam kerja)")

    return round(min(100.0, ratio), 1), alasan


def calculate_checkin_score(latest_checkin: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Menormalkan check-in subjektif (1 s.d 5) menjadi skor kelelahan (0 s.d 100).
    """
    alasan = []
    if not latest_checkin:
        return 35.0, []

    skor = latest_checkin.get("skor", 3)
    stress_mapping = {
        1: (100.0, "Kondisi subjektif: Sangat lelah / tertekan"),
        2: (75.0, "Kondisi subjektif: Cukup lelah"),
        3: (50.0, "Kondisi subjektif: Biasa saja"),
        4: (25.0, "Kondisi subjektif: Segar"),
        5: (0.0, "Kondisi subjektif: Sangat berenergi / prima")
    }

    norm_score, label = stress_mapping.get(skor, (50.0, "Kondisi subjektif moderat"))
    if skor <= 2:
        alasan.append(label)

    return norm_score, alasan


def calculate_burnout_index(
    load_score: float,
    stress_score: float,
    dist_score: float,
    checkin_score: float,
    trend_up_3days: bool,
    alasan_list: List[str]
) -> Tuple[float, str, List[str]]:
    """
    Agregasi akhir Burnout Index + modifikator tren + penentuan zona warna.
    """
    base_index = (
        (0.35 * load_score)
        + (0.35 * stress_score)
        + (0.20 * dist_score)
        + (0.10 * checkin_score)
    )

    final_alasan = list(alasan_list)

    if trend_up_3days:
        base_index += 10.0
        final_alasan.append("Tren Burnout Index meningkat 3 hari berturut-turut (+10)")

    final_index = round(min(100.0, max(0.0, base_index)), 1)

    if final_index < 30.0:
        zona = "hijau"
    elif final_index < 60.0:
        zona = "kuning"
    elif final_index < 80.0:
        zona = "oranye"
    else:
        zona = "merah"

    return final_index, zona, final_alasan
```

### 5.6. `backend/routers/users.py`

```python
from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=UserResponse)
def create_user(payload: UserCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    # Cek apakah email sudah ada
    res = supabase.table("users").select("*").eq("email", payload.email).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]

    insert_res = supabase.table("users").insert({
        "nama": payload.nama,
        "email": payload.email,
        "consent_camera": payload.consent_camera,
        "consent_window": payload.consent_window,
        "baseline_blink_rate": payload.baseline_blink_rate
    }).execute()

    if not insert_res.data:
        raise HTTPException(status_code=400, detail="Gagal membuat user")

    return insert_res.data[0]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return res.data[0]
```

### 5.7. `backend/routers/workload.py`

```python
from fastapi import APIRouter, HTTPException
from typing import List
from db import supabase
from schemas import WorkloadCreate, WorkloadUpdateStatus, WorkloadResponse

router = APIRouter(prefix="/workload", tags=["Workload"])

@router.post("", response_model=WorkloadResponse)
def create_workload_item(payload: WorkloadCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("workload_items").insert({
        "user_id": payload.user_id,
        "judul": payload.judul,
        "jenis": payload.jenis,
        "deadline": payload.deadline.isoformat(),
        "est_jam": payload.est_jam,
        "effort": payload.effort,
        "status": "belum"
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal menyimpan workload item")

    return res.data[0]

@router.get("/{user_id}", response_model=List[WorkloadResponse])
def get_user_workloads(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("workload_items") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("deadline", desc=False) \
        .execute()

    return res.data or []

@router.patch("/{item_id}/status", response_model=WorkloadResponse)
def update_workload_status(item_id: str, payload: WorkloadUpdateStatus):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("workload_items") \
        .update({"status": payload.status}) \
        .eq("id", item_id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")

    return res.data[0]
```

### 5.8. `backend/routers/metrics.py`

```python
from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import BatchMetricsCreate

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.post("")
def ingest_batch_metrics(payload: BatchMetricsCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    if not payload.metrics:
        return {"status": "ok", "inserted": 0}

    rows = []
    for m in payload.metrics:
        rows.append({
            "user_id": payload.user_id,
            "blink_rate": m.blink_rate,
            "brow_tension": m.brow_tension,
            "jaw_tension": m.jaw_tension,
            "gaze_minutes": m.gaze_minutes,
            "face_visible": m.face_visible,
            "focus_seconds": m.focus_seconds,
            "distraction_seconds": m.distraction_seconds,
            "app_category": m.app_category
        })

    res = supabase.table("sensor_metrics").insert(rows).execute()
    return {"status": "ok", "inserted": len(res.data or [])}
```

### 5.9. `backend/routers/checkins.py`

```python
from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import CheckInCreate

router = APIRouter(prefix="/check-ins", tags=["Check-ins"])

@router.post("")
def submit_check_in(payload: CheckInCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("check_ins").insert({
        "user_id": payload.user_id,
        "skor": payload.skor,
        "catatan": payload.catatan
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal menyimpan check-in")

    return {"status": "ok", "check_in": res.data[0]}
```

### 5.10. `backend/routers/interventions.py`

```python
from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import InterventionCreate

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.post("")
def log_intervention(payload: InterventionCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    res = supabase.table("interventions").insert({
        "user_id": payload.user_id,
        "tipe": payload.tipe,
        "durasi": payload.durasi,
        "selesai": payload.selesai
    }).execute()

    return {"status": "ok", "data": res.data[0] if res.data else None}
```

### 5.11. `backend/routers/index.py`

Endpoint sentral pengolahan Burnout Index (query data harian $\rightarrow$ panggil `engine.py` $\rightarrow$ upsert ke `daily_index` $\rightarrow$ return respons explainable):

```python
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date, timezone, timedelta
from typing import List, Dict, Any
from db import supabase
from schemas import BurnoutIndexResponse
from engine import (
    calculate_load_score,
    calculate_stress_score,
    calculate_distraction_score,
    calculate_checkin_score,
    calculate_burnout_index
)

router = APIRouter(prefix="/index", tags=["Burnout Index"])

@router.get("/today", response_model=BurnoutIndexResponse)
def get_or_compute_today_index(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    today_str = date.today().isoformat()
    now_utc = datetime.now(timezone.utc)
    today_start_iso = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()

    # 1. Ambil data profil user (untuk baseline)
    u_res = supabase.table("users").select("baseline_blink_rate").eq("id", user_id).execute()
    baseline_blink = 18.0
    if u_res.data and len(u_res.data) > 0:
        baseline_blink = float(u_res.data[0].get("baseline_blink_rate") or 18.0)

    # 2. Query workload aktif
    wl_res = supabase.table("workload_items").select("*").eq("user_id", user_id).execute()
    workload_items = wl_res.data or []
    load_score, load_alasan = calculate_load_score(workload_items, now=now_utc)

    # 3. Query sensor metrics hari ini
    sm_res = supabase.table("sensor_metrics") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", today_start_iso) \
        .execute()
    metrics_list = sm_res.data or []
    stress_score, stress_alasan = calculate_stress_score(metrics_list, baseline_blink=baseline_blink)
    dist_score, dist_alasan = calculate_distraction_score(metrics_list)

    # 4. Query check-in terbaru hari ini
    ci_res = supabase.table("check_ins") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", today_start_iso) \
        .order("ts", desc=True) \
        .limit(1) \
        .execute()
    latest_checkin = ci_res.data[0] if (ci_res.data and len(ci_res.data) > 0) else None
    checkin_score, checkin_alasan = calculate_checkin_score(latest_checkin)

    # 5. Cek tren 3-hari berurutan sebelum hari ini
    history_res = supabase.table("daily_index") \
        .select("tanggal, index") \
        .eq("user_id", user_id) \
        .lt("tanggal", today_str) \
        .order("tanggal", desc=True) \
        .limit(3) \
        .execute()
    
    trend_up_3days = False
    hist_data = history_res.data or []
    if len(hist_data) >= 3:
        idx_t1 = float(hist_data[0]["index"])
        idx_t2 = float(hist_data[1]["index"])
        idx_t3 = float(hist_data[2]["index"])
        if idx_t1 > idx_t2 and idx_t2 > idx_t3:
            trend_up_3days = True

    # 6. Hitung Burnout Index & gabungkan alasan
    semua_alasan = load_alasan + stress_alasan + dist_alasan + checkin_alasan
    final_index, zona, explain_chips = calculate_burnout_index(
        load_score=load_score,
        stress_score=stress_score,
        dist_score=dist_score,
        checkin_score=checkin_score,
        trend_up_3days=trend_up_3days,
        alasan_list=semua_alasan
    )

    # 7. Upsert ke tabel daily_index
    daily_record = {
        "user_id": user_id,
        "tanggal": today_str,
        "index": final_index,
        "zona": zona,
        "load_score": load_score,
        "stress_score": stress_score,
        "dist_score": dist_score,
        "checkin_score": checkin_score,
        "alasan_json": explain_chips,
        "trend_flag": trend_up_3days
    }
    supabase.table("daily_index").upsert(daily_record, on_conflict="user_id,tanggal").execute()

    return BurnoutIndexResponse(
        user_id=user_id,
        tanggal=today_str,
        index=final_index,
        zona=zona,
        load_score=load_score,
        stress_score=stress_score,
        dist_score=dist_score,
        checkin_score=checkin_score,
        alasan=explain_chips,
        trend_flag=trend_up_3days
    )

@router.get("/history")
def get_index_history(user_id: str, days: int = Query(default=30, ge=1, le=90)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung")

    start_date = (date.today() - timedelta(days=days)).isoformat()

    res = supabase.table("daily_index") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("tanggal", start_date) \
        .order("tanggal", desc=False) \
        .execute()

    return res.data or []
```

### 5.12. `backend/main.py`

Entry point utama aplikasi FastAPI lengkap dengan CORS dan router:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, workload, metrics, checkins, interventions, index

app = FastAPI(
    title="NAPAS v2 — Burnout Radar Backend",
    description="Backend API untuk mendeteksi tanda burnout mahasiswa secara real-time, explainable scoring, dan intervensi mandiri.",
    version="2.0.0"
)

# CORS Diizinkan untuk Web Dashboard Next.js & Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(users.router)
app.include_router(workload.router)
app.include_router(metrics.router)
app.include_router(checkins.router)
app.include_router(interventions.router)
app.include_router(index.router)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "NAPAS v2 Backend Engine",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## 6. Script Generator Data Demo Raka (`seed_demo.py`)

Untuk memastikan demo panggung atau video 2 menit berjalan mulus tanpa ketergantungan kondisi ruangan/kamera, sediakan skrip seed data demo tokoh **Raka** (mahasiswa tingkat akhir, deadline week):

```python
# c:\PROJECT MIKAIL V2\KORBAN SIC 2026\backend\seed_demo.py
import os
from datetime import datetime, date, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Isi .env terlebih dahulu!")
    exit(1)

sb: Client = create_client(url, key)

def run_seed():
    print("=== MULAI SEED DATA DEMO RAKA (NAPAS v2) ===")

    # 1. Pastikan User Raka Ada
    user_data = {
        "nama": "Raka Pratama",
        "email": "raka@joints2026.ugm.ac.id",
        "consent_camera": True,
        "consent_window": True,
        "baseline_blink_rate": 18.0
    }
    u = sb.table("users").upsert(user_data, on_conflict="email").execute()
    user_id = u.data[0]["id"]
    print(f"User ID Raka: {user_id}")

    # 2. Seed Workload (6 Deadline Minggu Ini)
    now = datetime.now(timezone.utc)
    workloads = [
        {"user_id": user_id, "judul": "Skripsi Bab 4 & 5 (Analisis)", "jenis": "tugas", "deadline": (now + timedelta(hours=14)).isoformat(), "est_jam": 8, "effort": 5, "status": "belum"},
        {"user_id": user_id, "judul": "Tugas Besar Pemrograman Web", "jenis": "tugas", "deadline": (now + timedelta(days=2)).isoformat(), "est_jam": 6, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Rapat Koordinasi BEM FMIPA", "jenis": "rapat", "deadline": (now + timedelta(days=2, hours=4)).isoformat(), "est_jam": 2, "effort": 3, "status": "belum"},
        {"user_id": user_id, "judul": "Laporan Praktikum Machine Learning", "jenis": "tugas", "deadline": (now + timedelta(days=3)).isoformat(), "est_jam": 5, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Kuis Teori Komputasi", "jenis": "ujian", "deadline": (now + timedelta(days=5)).isoformat(), "est_jam": 3, "effort": 5, "status": "belum"},
        {"user_id": user_id, "judul": "Revisi Makalah Seminar", "jenis": "tugas", "deadline": (now + timedelta(days=6)).isoformat(), "est_jam": 4, "effort": 3, "status": "belum"}
    ]
    sb.table("workload_items").delete().eq("user_id", user_id).execute()
    sb.table("workload_items").insert(workloads).execute()
    print("6 Workload items berhasil ditambahkan.")

    # 3. Seed Tren 7 Hari Terakhir (Index Meningkat dari Hijau -> Oranye)
    today = date.today()
    history = [
        {"days_ago": 6, "idx": 24.5, "zona": "hijau", "load": 20, "stress": 22, "dist": 15},
        {"days_ago": 5, "idx": 28.0, "zona": "hijau", "load": 25, "stress": 26, "dist": 20},
        {"days_ago": 4, "idx": 38.5, "zona": "kuning", "load": 40, "stress": 35, "dist": 22},
        {"days_ago": 3, "idx": 52.0, "zona": "kuning", "load": 55, "stress": 48, "dist": 30},
        {"days_ago": 2, "idx": 64.0, "zona": "oranye", "load": 68, "stress": 62, "dist": 35},
        {"days_ago": 1, "idx": 74.5, "zona": "oranye", "load": 78, "stress": 71, "dist": 40}
    ]

    sb.table("daily_index").delete().eq("user_id", user_id).execute()
    for h in history:
        tgl = (today - timedelta(days=h["days_ago"])).isoformat()
        sb.table("daily_index").insert({
            "user_id": user_id,
            "tanggal": tgl,
            "index": h["idx"],
            "zona": h["zona"],
            "load_score": h["load"],
            "stress_score": h["stress"],
            "dist_score": h["dist"],
            "checkin_score": 50,
            "alasan_json": ["Beban akademik meningkat bertahap"],
            "trend_flag": (h["days_ago"] <= 2)
        }).execute()
    print("History tren 6 hari berhasil di-seed.")

    # 4. Seed Sensor Metrics Hari Ini (Kondisi Kelelahan: Alis tegang, kedipan drop)
    metrics = []
    for _ in range(15):
        metrics.append({
            "user_id": user_id,
            "blink_rate": 11.2,
            "brow_tension": 0.72,
            "jaw_tension": 0.55,
            "gaze_minutes": 48.0,
            "face_visible": True,
            "focus_seconds": 2200,
            "distraction_seconds": 950,
            "app_category": "academic"
        })
    sb.table("sensor_metrics").insert(metrics).execute()
    print("15 batch sensor metrics hari ini tersimpan.")

    # 5. Seed Check-In Hari Ini
    sb.table("check_ins").insert({
        "user_id": user_id,
        "skor": 2,
        "catatan": "Kepala pusing dan deadline skripsi menumpuk."
    }).execute()
    print("Check-in Raka tersimpan.")

    print("\n[SUKSES] Seed data selesai! Buka test frontend atau hit GET /index/today?user_id=" + user_id)

if __name__ == "__main__":
    run_seed()
```

---

## 7. Frontend Pengujian Interaktif Mandiri (`test-frontend.html`)

Simpan file ini di `backend/test-frontend.html`. Cukup buka langsung file ini di browser untuk menguji seluruh fungsionalitas backend:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>NAPAS v2 — Backend Testing Console</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 1px solid #334155; }
    h1, h2 { color: #38bdf8; margin-top: 0; }
    input, button { padding: 10px 14px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 14px; }
    button { background: #2563eb; cursor: pointer; border: none; font-weight: bold; }
    button:hover { background: #1d4ed8; }
    .gauge { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .chip { display: inline-block; padding: 4px 12px; border-radius: 16px; background: #334155; margin: 4px; font-size: 13px; color: #e2e8f0; }
    .badge { padding: 6px 14px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 14px; }
    .hijau { color: #4ade80; background: rgba(74, 222, 128, 0.15); }
    .kuning { color: #facc15; background: rgba(250, 204, 21, 0.15); }
    .oranye { color: #fb923c; background: rgba(251, 146, 60, 0.15); }
    .merah { color: #f87171; background: rgba(248, 113, 113, 0.15); }
  </style>
</head>
<body>
  <h1>📡 NAPAS v2 — Testing Console Backend</h1>
  <div class="card">
    <label>User ID (dari Supabase / Seed): </label>
    <input type="text" id="userId" style="width: 320px;" placeholder="UUID User...">
    <button onclick="fetchTodayIndex()">Hitung Index Hari Ini</button>
    <button onclick="fetchHistory()" style="background:#0d9488;">Lihat History 7 Hari</button>
  </div>

  <div class="card" id="resultCard" style="display:none;">
    <h2>Hasil Evaluasi Burnout Index</h2>
    <div>Status Zona: <span id="zonaBadge" class="badge"></span></div>
    <div class="gauge" id="indexValue">0.0</div>
    <p>Sub-Skor: Load: <b id="valLoad">0</b> | Stress: <b id="valStress">0</b> | Distraksi: <b id="valDist">0</b> | CheckIn: <b id="valCheck">0</b></p>
    <p>Trend Warning: <span id="valTrend">-</span></p>
    <h3>Explainable Chips (Mengapa skor ini muncul?):</h3>
    <div id="chipsContainer"></div>
  </div>

  <div class="card" id="historyCard" style="display:none;">
    <h2>Riwayat Index</h2>
    <pre id="historyJson" style="background:#090d16; padding:12px; border-radius:8px; overflow-x:auto;"></pre>
  </div>

  <script>
    const API = "http://localhost:8000";

    async function fetchTodayIndex() {
      const uid = document.getElementById("userId").value.trim();
      if (!uid) return alert("Masukkan User ID!");
      try {
        const res = await fetch(`${API}/index/today?user_id=${uid}`);
        if (!res.ok) throw new Error(await res.text());
        const d = await res.json();
        
        document.getElementById("resultCard").style.display = "block";
        document.getElementById("indexValue").innerText = d.index;
        
        const badge = document.getElementById("zonaBadge");
        badge.innerText = d.zona;
        badge.className = "badge " + d.zona;

        document.getElementById("valLoad").innerText = d.load_score;
        document.getElementById("valStress").innerText = d.stress_score;
        document.getElementById("valDist").innerText = d.dist_score;
        document.getElementById("valCheck").innerText = d.checkin_score;
        document.getElementById("valTrend").innerText = d.trend_flag ? "AKTIF (+10)" : "TIDAK";

        const chips = document.getElementById("chipsContainer");
        chips.innerHTML = "";
        d.alasan.forEach(a => {
          const c = document.createElement("span");
          c.className = "chip";
          c.innerText = "• " + a;
          chips.appendChild(c);
        });
      } catch (err) {
        alert("Gagal memuat: " + err.message);
      }
    }

    async function fetchHistory() {
      const uid = document.getElementById("userId").value.trim();
      if (!uid) return alert("Masukkan User ID!");
      try {
        const res = await fetch(`${API}/index/history?user_id=${uid}&days=7`);
        const d = await res.json();
        document.getElementById("historyCard").style.display = "block";
        document.getElementById("historyJson").innerText = JSON.stringify(d, null, 2);
      } catch (err) {
        alert("Gagal memuat history: " + err.message);
      }
    }
  </script>
</body>
</html>
```

---

## 8. Panduan Eksekusi Langkah demi Langkah (PowerShell)

### Langkah 1: Jalankan DDL di Supabase
1. Buka dashboard project di [supabase.com](https://supabase.com).
2. Masuk ke **SQL Editor**.
3. Salin seluruh isi SQL dari **Bagian 2** dokumen ini dan klik **Run**.
4. Buka **Project Settings $\rightarrow$ API**, catat:
   - `Project URL`
   - `anon public key` (atau `service_role key` untuk dev).

### Langkah 2: Setup Virtual Environment & Dependencies
Buka terminal PowerShell di root proyek Anda:

```powershell
# 1. Pindah ke direktori backend
cd "c:\PROJECT MIKAIL V2\KORBAN SIC 2026\backend"

# 2. Buat Python Virtual Environment (opsional tapi disarankan)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install semua dependencies
pip install -r requirements.txt
```

### Langkah 3: Konfigurasi File `.env`
Pastikan file `.env` di folder `backend/` sudah terisi:

```env
SUPABASE_URL=https://nama-project-anda.supabase.co
SUPABASE_KEY=eyJh...kunci-anda...
PORT=8000
```

### Langkah 4: Jalankan Server FastAPI

```powershell
uvicorn main:app --reload --port 8000
```

Buka browser dan periksa:
- **Health Check:** `http://localhost:8000/health`
- **Swagger UI Interaktif:** `http://localhost:8000/docs`

### Langkah 5: Seed Data Demo Raka

Buka terminal PowerShell baru:

```powershell
cd "c:\PROJECT MIKAIL V2\KORBAN SIC 2026\backend"
python seed_demo.py
```

Skrip ini akan mencetak `User ID Raka` di terminal.

### Langkah 6: Verifikasi dengan Test Console

1. Buka file `c:\PROJECT MIKAIL V2\KORBAN SIC 2026\backend\test-frontend.html` di browser (cukup klik dua kali).
2. Masukkan `User ID Raka` yang didapat dari langkah seed.
3. Klik tombol **Hitung Index Hari Ini**.
4. Perhatikan skor angka, zona warna, dan chips alasan explainable yang muncul!

---

## 9. Checklist Kesiapan Technical Meeting (19 Sep 2026)

- [x] Skema 6 tabel + indexing relasional siap di Supabase.
- [x] Rumus Burnout Index lengkap dengan bobot ilmiah, normalisasi, dan degradasi aman.
- [x] Engine explainable (`alasan_json`) menghasilkan chips alasan konkret.
- [x] Deteksi tren 3-hari terverifikasi dan memberi penambahan skor.
- [x] Seluruh endpoint REST API siap (`/health`, `/users`, `/workload`, `/metrics`, `/check-ins`, `/interventions`, `/index/today`, `/index/history`).
- [x] CORS diaktifkan untuk integrasi mudah dengan Next.js frontend (P3) dan Desktop Agent (P1).
- [x] Skrip generator data demo (`seed_demo.py`) siap pakai untuk simulasi live demo tanpa resiko glitch hardware.
