# Panduan Membangun Backend NAPAS v2 — FastAPI + Supabase (Versi Revisi Final)

> **Status Dokumen:** FINAL & PRODUCTION-READY (REVISED)  
> **Peran Tim:** P2 — Backend & Burnout Engine  
> **Kompetisi:** JOINTS 2026 (FMIPA UGM)  
> **Prinsip Utama:** *Privacy-by-Design, Explainable Scoring, Graceful Degradation, End-to-End Ready, Rehearsal-Friendly*

---

## 0. Changelog & Penyempurnaan dari Versi Sebelumnya

1. **Endpoint Baru `/check-ins` (POST + GET `/check-ins/today`):** Check-in 2-tap mahasiswa langsung tersimpan dan dihitung dalam engine hari ini.
2. **Endpoint Baru `/interventions` (POST + GET dengan Statistik):** Mencatat intervensi (breathing, lock, break, playbook) dan menyajikan metrik kepatuhan untuk halaman Laporan Web Dashboard.
3. **Logika `alasan_json` (Explainable AI / Chips Alasan):** Tidak lagi sekadar array kosong; chips alasan dihasilkan secara dinamis berdasarkan ambang batas ilmiah yang mudah diverifikasi juri FMIPA.
4. **Graceful Degradation & Dynamic Re-weighting:** Jika webcam atau sensor window dimatikan/tanpa data, bobot dinormalisasi ulang secara proporsional. Dilengkapi proteksi: jika sinyal aktif $< 2$, skor dibatasi maksimal **Oranye** ($\le 79.0$) dan tidak pernah dinyatakan Merah.
5. **Normalisasi Check-in Subjektif ($1 - 5 \rightarrow 0 - 100$):** Skala $1$ (Sangat Lelah) menjadi $100$ poin beban, dan $5$ (Sangat Prima) menjadi $0$ poin.
6. **Definisi Presisi `trend_up_3days`:** Naik 3 hari berurutan dengan ambang kenaikan minimal $\ge +2.0$ poin (epsilon) agar fluktuasi minor/noise tidak memicu flag tren palsu.
7. **Timezone WIB (Asia/Jakarta, UTC+7):** Seluruh query rentang waktu "hari ini" dan evaluasi agenda larut malam menggunakan batas lokal WIB.
8. **Arsitektur Keamanan Satu Pintu:** Kunci `service_role` Supabase disimpan **eksklusif** di sisi backend FastAPI. Desktop Agent (P1) dan Web Dashboard (P3) hanya berinteraksi melalui API FastAPI.
9. **Endpoint Simulasi Panggung `POST /demo/simulate`:** Memungkinkan tim menyuntikkan burst kondisi Oranye atau Merah dalam $< 2$ detik untuk kebutuhan rekaman video 2 menit dan live pitching.
10. **Health Check dengan Uji Supabase DB:** `GET /health` memverifikasi koneksi aktif ke Supabase PostgreSQL (`{"status": "healthy", "db": "connected"}`).

---

## 1. Ringkasan Arsitektur & Peran Backend

```
┌──────────────────────────┐             ┌──────────────────────────┐
│  NAPAS Agent (Desktop)   │             │   Web Dashboard (Next)   │
│  - POST /metrics (60s)   │             │  - GET /index/today      │
│  - GET  /workload        │             │  - GET /index/history    │
│  - POST /interventions   │             │  - GET /interventions    │
│  - POST /check-ins       │             │  - CRUD /workload        │
└────────────┬─────────────┘             └────────────▲─────────────┘
             │                                        │
             ▼                                        │
    ┌─────────────────────────────────────────────────┴─────────────┐
    │                 FASTAPI BACKEND (PORT 8000)                   │
    │  - /health (DB Check)        - /index/today & /history        │
    │  - /users (Profile & Consent)- /check-ins & /check-ins/today  │
    │  - /workload (CRUD Tasks)    - /interventions (Log & Stats)   │
    │  - /metrics (Batch Ingest)   - /demo/simulate (Stage Rehearsal│
    └───────────────────────────────┬───────────────────────────────┘
                                    │ (Service Role Key)
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                 SUPABASE (Cloud PostgreSQL)                   │
    │  Tabel: users, workload_items, sensor_metrics, check_ins,     │
    │         interventions, daily_index                            │
    └───────────────────────────────────────────────────────────────┘
```

---

## 2. Skema Database Supabase (SQL DDL Lengkap + Indexing)

Jalankan DDL berikut di **SQL Editor** dashboard Supabase Anda:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  consent_camera BOOLEAN DEFAULT FALSE,
  consent_window BOOLEAN DEFAULT FALSE,
  baseline_blink_rate NUMERIC DEFAULT 15.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL WORKLOAD ITEMS
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

-- 3. TABEL SENSOR METRICS (Batch Telemetri ±60 Detik)
CREATE TABLE IF NOT EXISTS sensor_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  blink_rate NUMERIC,          -- Kedipan per menit
  brow_tension NUMERIC,        -- 0..1 (intensitas alis tegang)
  jaw_tension NUMERIC,         -- 0..1
  gaze_minutes NUMERIC,        -- Durasi tatap layar tanpa jeda
  face_visible BOOLEAN DEFAULT TRUE,
  focus_seconds INT DEFAULT 0,
  distraction_seconds INT DEFAULT 0,
  app_category TEXT
);

-- 4. TABEL INTERVENTIONS (Log Aksi: Breathing, Lock, Break, Playbook)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  tipe TEXT CHECK (tipe IN ('breathing', 'lock', 'break', 'playbook')),
  durasi INT DEFAULT 60,
  selesai BOOLEAN DEFAULT FALSE
);

-- 5. TABEL CHECK INS (Evaluasi 2-Tap Mahasiswa)
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  skor INT CHECK (skor BETWEEN 1 AND 5), -- 1: Sangat Lelah/Tertekan, 5: Sangat Prima
  catatan TEXT
);

-- 6. TABEL DAILY INDEX (Agregat Harian & History Tren)
CREATE TABLE IF NOT EXISTS daily_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  index NUMERIC NOT NULL,
  zona TEXT NOT NULL CHECK (zona IN ('hijau', 'kuning', 'oranye', 'merah')),
  load_score NUMERIC,
  stress_score NUMERIC,
  dist_score NUMERIC,
  checkin_score NUMERIC,
  alasan_json JSONB DEFAULT '[]'::jsonb,
  trend_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tanggal)
);

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_sensor_user_ts ON sensor_metrics (user_id, ts);
CREATE INDEX IF NOT EXISTS idx_workload_user_dl ON workload_items (user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_ts ON check_ins (user_id, ts);
CREATE INDEX IF NOT EXISTS idx_daily_index_user_tgl ON daily_index (user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_interventions_user_ts ON interventions (user_id, ts);
```

---

## 3. Formulasi Sub-Skor & Burnout Engine Matematis

Bobot baku:

$$\text{Bobot} = \{\text{load}: 0.35, \text{stress}: 0.35, \text{dist}: 0.20, \text{checkin}: 0.10\}$$

### 3.1. Sub-Skor Spesifik

1. **LoadScore ($0 - 100$):**
   Diambil dari `workload_items` dengan `status = 'belum'` dan jatuh tempo dalam 7 hari ke depan (WIB):
   - $A = \min(100, \text{jumlah\_deadline\_7\_hari} \times 20)$
   - $B = \min\left(100, \frac{\text{total\_est\_jam\_7\_hari}}{30} \times 100\right)$
   - $C = \min(100, \text{agenda\_larut\_malam\_7\_hari} \times 34)$ (jam lokal $\ge 22.00$ atau $\le 04.00$)
   - $\text{LoadScore} = 0.5A + 0.3B + 0.2C$.

2. **StressScore ($0 - 100$):**
   Diambil dari `sensor_metrics` 24 jam terakhir pada baris dengan `face_visible = true`:
   - $\text{ref\_blink} = 15.0$ kedipan/menit
   - $\text{blink\_comp} = \text{clamp}\left(\frac{\text{ref\_blink} - \overline{\text{blink}}}{\text{ref\_blink}}, 0.0, 1.0\right)$
   - $\text{brow\_comp} = \overline{\text{brow\_tension}}$ ($0.0 - 1.0$)
   - $\text{gaze\_comp} = \text{clamp}\left(\frac{\overline{\text{gaze\_minutes}}}{90.0}, 0.0, 1.0\right)$
   - $\text{StressScore} = (0.4 \times \text{blink\_comp} + 0.4 \times \text{brow\_comp} + 0.2 \times \text{gaze\_comp}) \times 100$.

3. **DistractionScore ($0 - 100$):**
   Diambil dari `sensor_metrics` hari ini (sejak 00:00:00 WIB):
   - $\text{ratio} = \frac{\sum \text{distraction\_seconds}}{\sum \text{focus\_seconds} + \sum \text{distraction\_seconds}}$
   - $\text{DistractionScore} = \text{ratio} \times 100$.

4. **CheckInScore ($0 - 100$):**
   Diambil dari check-in terbaru hari ini:
   - $\text{CheckInScore} = (5 - \text{skor}) \times 25.0$.

### 3.2. Graceful Degradation & Dynamic Re-weighting

Jika salah satu sinyal bernilai `None` (misal kamera mati, belum ada tugas, atau belum check-in):
1. **Normalisasi Ulang:**
   $$\text{Index} = \frac{\sum_{k \in \text{sinyal aktif}} \text{Bobot}_k \times \text{SubSkor}_k}{\sum_{k \in \text{sinyal aktif}} \text{Bobot}_k}$$
2. **Proteksi False Positive:** Jika jumlah sinyal aktif $< 2$, skor dibatasi $\le 79.0$ (tidak akan memicu status Merah tanpa bukti multi-sensor).
3. **Modifikator Tren:** Jika `trend_up_3days` bernilai `True` ($\ge 3$ hari berturut-turut naik dengan kenaikan $\ge +2.0$), index ditambah $+10$.
4. **Zona:**
   - $0 \le \text{Index} < 30 \rightarrow$ **hijau**
   - $30 \le \text{Index} < 60 \rightarrow$ **kuning**
   - $60 \le \text{Index} < 80 \rightarrow$ **oranye**
   - $\text{Index} \ge 80 \rightarrow$ **merah**

---

## 4. Daftar Endpoint API (Lengkap)

| Method | Path | Deskripsi | Prioritas |
|---|---|---|---|
| `GET` | `/health` | Cek server FastAPI dan koneksi Supabase DB | MUST |
| `POST` | `/users` | Daftarkan/ambil user (nama, email, consent) | MUST |
| `GET` | `/users/{user_id}` | Ambil profil user & flag consent | MUST |
| `POST` | `/workload` | Tambah tugas/deadline baru | MUST |
| `GET` | `/workload/{user_id}` | Ambil daftar tugas aktif (Deadline Radar) | MUST |
| `PATCH`| `/workload/{id}/status`| Update status tugas (`belum`/`selesai`) | MUST |
| `POST` | `/metrics` | Batch ingest telemetri 60s dari Agent | MUST |
| `POST` | `/check-ins` | Simpan evaluasi subjektif 2-tap (skor 1-5) | MUST |
| `GET` | `/check-ins/today?user_id=` | Ambil check-in hari ini (WIB) | MUST |
| `POST` | `/interventions` | Catat aktivitas intervensi selesai | MUST |
| `GET` | `/interventions?user_id=&days=` | Riwayat & ringkasan statistik intervensi | MUST |
| `GET` | `/index/today?user_id=` | Hitung Burnout Index hari ini + chips alasan + upsert | MUST |
| `GET` | `/index/history?user_id=&days=` | Riwayat index harian (Line Chart tren) | MUST |
| `POST` | `/demo/simulate` | Suntikkan kondisi Oranye / Merah instan | SHOULD |

---

## 5. Panduan Eksekusi Langkah demi Langkah (PowerShell)

### Langkah 1: Siapkan Database di Supabase
1. Buka [Supabase](https://supabase.com) $\rightarrow$ **SQL Editor**.
2. Jalankan isi file [`schema.sql`](file:///c:/PROJECT%20MIKAIL%20V2/napas/backend/schema.sql) (atau jalankan [`seed.sql`](file:///c:/PROJECT%20MIKAIL%20V2/napas/backend/seed.sql) jika ingin langsung mengisi data awal demo).
3. Di **Project Settings $\rightarrow$ API**, salin `Project URL` dan **`service_role key`**.

### Langkah 2: Konfigurasi File `.env`
Pastikan file `backend/.env` terisi:
```env
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJh...kunci_service_role...
PORT=8000
```

### Langkah 3: Install & Jalankan Server
```powershell
cd "c:\PROJECT MIKAIL V2\napas\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

### Langkah 4: Uji Coba Mandiri
1. Buka Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
2. Periksa health check: [http://localhost:8000/health](http://localhost:8000/health) $\rightarrow$ harus merespons `{"status": "healthy", "db": "connected"}`.
3. Jalankan seed data Raka jika belum:
   ```powershell
   python seed_demo.py
   ```
4. Buka file [`test-frontend.html`](file:///c:/PROJECT%20MIKAIL%20V2/napas/backend/test-frontend.html) di browser Anda untuk melihat visualisasi live skor, zona, chips alasan, dan kontrol simulasi panggung.
