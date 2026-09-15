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
