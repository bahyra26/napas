-- ============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS) UNTUK SUPABASE
-- Sesuai Prinsip: "Arsitektur Keamanan Satu Pintu" (Panduan Backend v2)
-- ============================================================================
-- Kunci service_role FastAPI secara default membypass RLS, sehingga API Backend
-- tetap berfungsi normal. Menyalakan RLS di bawah ini mengamankan tabel dari
-- akses publik anon / direct client tanpa otentikasi.
-- ============================================================================

-- 1. AKTIFKAN RLS PADA SELURUH TABEL PUBLIK
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workload_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sensor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS class_schedule ENABLE ROW LEVEL SECURITY;

-- 2. KEBIJAKAN AKSES ROW LEVEL SECURITY (RLS POLICIES)
-- Kunci service_role FastAPI membypass RLS secara default.
-- Kebijakan di bawah ini mengizinkan pengguna terotentikasi mengelola data mereka sendiri:

DO $$ 
BEGIN
  -- Kebijakan focus_sessions
  IF to_regclass('public.focus_sessions') IS NOT NULL THEN
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
  END IF;

  -- Kebijakan user_profiles
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile'
    ) THEN
      CREATE POLICY "Users can view their own profile"
      ON public.user_profiles FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
      CREATE POLICY "Users can insert their own profile"
      ON public.user_profiles FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile'
    ) THEN
      CREATE POLICY "Users can update their own profile"
      ON public.user_profiles FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can delete their own profile'
    ) THEN
      CREATE POLICY "Users can delete their own profile"
      ON public.user_profiles FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
    END IF;
  END IF;

  -- Kebijakan class_schedule
  IF to_regclass('public.class_schedule') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'class_schedule' AND policyname = 'Users can manage their own class schedule'
    ) THEN
      CREATE POLICY "Users can manage their own class schedule"
      ON public.class_schedule FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    END IF;
  END IF;
END $$;
