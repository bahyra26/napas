import os
import sys
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

DEFAULT_SUPABASE_URL = "https://enzizvrvfogjjgctpmli.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueml6dnJ2Zm9nampnY3RwbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2MTY2NywiZXhwIjoyMTA0OTM3NjY3fQ.WRZlF1Mn8rv-yX--mv6go5YQXYS-xix2vMPrF8VzG9o"

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or DEFAULT_SUPABASE_URL
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or DEFAULT_SUPABASE_KEY

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

import uuid
import re

UUID_REGEX = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)

def ensure_uuid(user_id: str) -> str:
    """Memastikan user_id selalu berformat UUID valid (RFC-4122) yang diterima Supabase Postgres."""
    if not user_id:
        return str(uuid.uuid4())
    if UUID_REGEX.match(user_id):
        return user_id
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))

def ensure_user_in_supabase(user_id: str, nama: str = "Mahasiswa", email: str = None) -> bool:
    """Memastikan record user_id ada di tabel users Supabase agar tidak melanggar foreign key constraint."""
    if not supabase:
        return False
    u_uuid = ensure_uuid(user_id)
    try:
        chk = supabase.table("users").select("id").eq("id", u_uuid).execute()
        if chk.data and len(chk.data) > 0:
            return True
        supabase.table("users").insert({
            "id": u_uuid,
            "nama": nama or "Mahasiswa",
            "email": email or f"{u_uuid[:8]}@napas.local",
            "consent_camera": True,
            "consent_window": True,
            "baseline_blink_rate": 15.0
        }).execute()
        return True
    except Exception as e:
        print(f"[DB] Gagal memastikan user di Supabase ({u_uuid}): {e}")
        return False

def get_valid_user_uuids(user_id: str) -> list[str]:
    """Mengembalikan daftar UUID valid dan unik yang aman untuk dikueri ke kolom bertipe UUID di Supabase."""
    if not user_id:
        return []
    res = set()
    if UUID_REGEX.match(user_id):
        res.add(user_id)
    u_ensured = ensure_uuid(user_id)
    if UUID_REGEX.match(u_ensured):
        res.add(u_ensured)
    try:
        from local_db import deterministic_uuid
        d_uuid = deterministic_uuid(user_id)
        if UUID_REGEX.match(d_uuid):
            res.add(d_uuid)
    except Exception:
        pass
    return list(res)


