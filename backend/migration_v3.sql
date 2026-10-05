-- ============================================================================
-- MIGRASI NAPAS v3 — Personalisasi, Google Calendar, Planner, Focus Session
-- Jalankan SEKALI di Supabase SQL Editor (aman diulang: IF NOT EXISTS).
-- ============================================================================

-- 1. USERS: tautan ke akun Supabase Auth (Google)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- 2. PROFIL MAHASISWA (hasil onboarding)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  panggilan TEXT,
  kampus TEXT,
  jurusan TEXT,
  semester INT,
  jam_tidur TEXT DEFAULT '23:00',        -- target jam tidur (HH:MM)
  jam_bangun TEXT DEFAULT '06:00',       -- target jam bangun (HH:MM)
  kronotipe TEXT DEFAULT 'pagi' CHECK (kronotipe IN ('pagi', 'siang', 'malam')),
  target_fokus_jam NUMERIC DEFAULT 4.0,  -- target fokus per hari
  focus_whitelist JSONB DEFAULT '["Code.exe","notion","docs.google","Word"]'::jsonb,
  focus_blacklist JSONB DEFAULT '["Discord","YouTube","Instagram","TikTok","Steam","Mobile Legends","Netflix","Twitter","X.com"]'::jsonb,
  agent_action TEXT DEFAULT 'warn_then_close' CHECK (agent_action IN ('warn_only', 'minimize', 'warn_then_close', 'close')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JADWAL KULIAH MINGGUAN
CREATE TABLE IF NOT EXISTS class_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mata_kuliah TEXT NOT NULL,
  hari INT NOT NULL CHECK (hari BETWEEN 0 AND 6),  -- 0 = Senin ... 6 = Minggu
  jam_mulai TEXT NOT NULL,                          -- HH:MM
  jam_selesai TEXT NOT NULL,                        -- HH:MM
  ruang TEXT,
  source TEXT DEFAULT 'manual',                     -- manual | google
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_class_schedule_user ON class_schedule(user_id, hari);

-- 4. WORKLOAD: mata kuliah, sumber, id event Google
ALTER TABLE workload_items ADD COLUMN IF NOT EXISTS mata_kuliah TEXT;
ALTER TABLE workload_items ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE workload_items ADD COLUMN IF NOT EXISTS google_event_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_workload_google_event
  ON workload_items(user_id, google_event_id) WHERE google_event_id IS NOT NULL;

-- 5. CHECK-IN: jam tidur semalam & energi
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS jam_tidur NUMERIC;  -- durasi tidur (jam)
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS energi INT CHECK (energi BETWEEN 1 AND 5);

-- 6. SESI BELAJAR HASIL AUTO-PLANNER
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workload_id UUID REFERENCES workload_items(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  mulai TIMESTAMPTZ NOT NULL,
  selesai TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'rencana' CHECK (status IN ('rencana', 'selesai', 'dilewati')),
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, mulai);

-- 7. SESI FOKUS (dari Focus Mode web + Agent)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workload_id UUID REFERENCES workload_items(id) ON DELETE SET NULL,
  judul TEXT,
  mulai TIMESTAMPTZ NOT NULL,
  selesai TIMESTAMPTZ,
  target_menit INT DEFAULT 25,
  focus_seconds INT DEFAULT 0,
  distraction_seconds INT DEFAULT 0,
  blocked_count INT DEFAULT 0,
  blocked_apps JSONB DEFAULT '{}'::jsonb,   -- {"Discord": 2, "YouTube": 1}
  agent_connected BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, mulai);
