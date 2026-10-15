import sys
import os

# Menambahkan folder backend ke python path agar semua router dan modul dapat diimpor
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Sinkronisasi environment variable Supabase jika menggunakan prefix VITE_
if "SUPABASE_URL" not in os.environ and "VITE_SUPABASE_URL" in os.environ:
    os.environ["SUPABASE_URL"] = os.environ["VITE_SUPABASE_URL"]
if "SUPABASE_KEY" not in os.environ and "VITE_SUPABASE_ANON_KEY" in os.environ:
    os.environ["SUPABASE_KEY"] = os.environ["VITE_SUPABASE_ANON_KEY"]

# Ekspor FastAPI app untuk Vercel Serverless ASGI
from main import app
