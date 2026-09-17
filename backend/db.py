import os
import sys
from datetime import datetime, timedelta, timezone
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

# ============================================================================
# HELPER TIMEZONE WIB (Asia/Jakarta, UTC+7)
# Supabase menyimpan dalam UTC. Semua batasan 'hari ini' dihitung dalam WIB.
# ============================================================================
WIB = timezone(timedelta(hours=7))

def now_wib() -> datetime:
    """Mengembalikan waktu saat ini dalam timezone WIB (UTC+7)."""
    return datetime.now(WIB)

def start_of_day_wib(dt: datetime = None) -> datetime:
    """Batas awal hari (00:00:00) dalam WIB."""
    base = dt or now_wib()
    return base.replace(hour=0, minute=0, second=0, microsecond=0)

def iso_start_today() -> str:
    """Batas bawah filter 'hari ini' untuk query Supabase (ts gte ...)."""
    return start_of_day_wib().isoformat()
