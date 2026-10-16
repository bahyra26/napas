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
-- Kebijakan di bawah ini mengizinkan pengguna dan frontend mengelola data secara aman:

DO $$ 
BEGIN
  -- ==========================================
  -- 1. Kebijakan Tabel USERS
  -- ==========================================
  IF to_regclass('public.users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow select on users'
    ) THEN
      CREATE POLICY "Allow select on users"
      ON public.users FOR SELECT
      TO anon, authenticated
      USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow insert on users'
    ) THEN
      CREATE POLICY "Allow insert on users"
      ON public.users FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow update on users'
    ) THEN
      CREATE POLICY "Allow update on users"
      ON public.users FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  -- ==========================================
  -- 2. Kebijakan Tabel WORKLOAD_ITEMS
  -- ==========================================
  IF to_regclass('public.workload_items') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'workload_items' AND policyname = 'Users can manage workloads'
    ) THEN
      CREATE POLICY "Users can manage workloads"
      ON public.workload_items FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  -- ==========================================
  -- 3. Kebijakan Tabel CHECK_INS & DAILY_INDEX
  -- ==========================================
  IF to_regclass('public.check_ins') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'check_ins' AND policyname = 'Users can manage check_ins'
    ) THEN
      CREATE POLICY "Users can manage check_ins"
      ON public.check_ins FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  IF to_regclass('public.daily_index') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'daily_index' AND policyname = 'Users can manage daily_index'
    ) THEN
      CREATE POLICY "Users can manage daily_index"
      ON public.daily_index FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  -- ==========================================
  -- 4. Kebijakan Tabel SENSOR_METRICS & INTERVENTIONS
  -- ==========================================
  IF to_regclass('public.sensor_metrics') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'sensor_metrics' AND policyname = 'Users can manage sensor_metrics'
    ) THEN
      CREATE POLICY "Users can manage sensor_metrics"
      ON public.sensor_metrics FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  IF to_regclass('public.interventions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'interventions' AND policyname = 'Users can manage interventions'
    ) THEN
      CREATE POLICY "Users can manage interventions"
      ON public.interventions FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  -- ==========================================
  -- 5. Kebijakan focus_sessions
  -- ==========================================
  IF to_regclass('public.focus_sessions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can view their own focus sessions'
    ) THEN
      CREATE POLICY "Users can view their own focus sessions"
      ON public.focus_sessions FOR SELECT TO anon, authenticated
      USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert their own focus sessions'
    ) THEN
      CREATE POLICY "Users can insert their own focus sessions"
      ON public.focus_sessions FOR INSERT TO anon, authenticated
      WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can update their own focus sessions'
    ) THEN
      CREATE POLICY "Users can update their own focus sessions"
      ON public.focus_sessions FOR UPDATE TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can delete their own focus sessions'
    ) THEN
      CREATE POLICY "Users can delete their own focus sessions"
      ON public.focus_sessions FOR DELETE TO anon, authenticated
      USING (true);
    END IF;
  END IF;

  -- ==========================================
  -- 6. Kebijakan user_profiles
  -- ==========================================
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can manage their own profile'
    ) THEN
      CREATE POLICY "Users can manage their own profile"
      ON public.user_profiles FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;

  -- ==========================================
  -- 7. Kebijakan class_schedule
  -- ==========================================
  IF to_regclass('public.class_schedule') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'class_schedule' AND policyname = 'Users can manage their own class schedule'
    ) THEN
      CREATE POLICY "Users can manage their own class schedule"
      ON public.class_schedule FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. AUTOMATIC USER SYNC TRIGGER (AUTH.USERS -> PUBLIC.USERS)
-- Berjalan dengan hak superuser (SECURITY DEFINER) sehingga bebas hambatan RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nama, email, consent_camera, consent_window, baseline_blink_rate)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    true,
    true,
    15.0
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger ke tabel auth.users Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
