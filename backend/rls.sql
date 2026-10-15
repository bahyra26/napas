-- ============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS) UNTUK SUPABASE
-- Sesuai Prinsip: "Arsitektur Keamanan Satu Pintu" (Panduan Backend v2)
-- ============================================================================
-- Kunci service_role FastAPI secara default membypass RLS, sehingga API Backend
-- tetap berfungsi normal. Menyalakan RLS di bawah ini mengamankan tabel dari
-- akses publik anon / direct client tanpa otentikasi.
-- ============================================================================

-- 1. AKTIFKAN RLS PADA SELURUH TABEL PUBLIK
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- 2. KEBIJAKAN AKSES ROW LEVEL SECURITY (RLS POLICIES)
-- Kunci service_role FastAPI membypass RLS secara default.
-- Kebijakan di bawah ini mengizinkan pengguna terotentikasi mengelola data sesi fokus mereka sendiri:

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can view their own focus sessions'
  ) THEN
    CREATE POLICY "Users can view their own focus sessions"
    ON public.focus_sessions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert their own focus sessions'
  ) THEN
    CREATE POLICY "Users can insert their own focus sessions"
    ON public.focus_sessions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can update their own focus sessions'
  ) THEN
    CREATE POLICY "Users can update their own focus sessions"
    ON public.focus_sessions FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can delete their own focus sessions'
  ) THEN
    CREATE POLICY "Users can delete their own focus sessions"
    ON public.focus_sessions FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can manage their own study sessions'
  ) THEN
    CREATE POLICY "Users can manage their own study sessions"
    ON public.study_sessions FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
