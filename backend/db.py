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
