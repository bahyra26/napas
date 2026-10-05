-- ============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS) UNTUK SUPABASE
-- Sesuai Prinsip: "Arsitektur Keamanan Satu Pintu" (Panduan Backend v2)
-- ============================================================================
-- Kunci service_role FastAPI secara default membypass RLS, sehingga API Backend
-- tetap berfungsi normal. Menyalakan RLS di bawah ini mengamankan tabel dari
-- akses publik anon / direct client tanpa otentikasi.
-- ============================================================================

-- 1. AKTIFKAN RLS PADA 6 TABEL
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_index ENABLE ROW LEVEL SECURITY;

-- 2. KEBIJAKAN AKSES SERVICE_ROLE (Bypass penuh untuk FastAPI Backend)
-- (Supabase secara default memberikan izin penuh kepada service_role key)
