import sys
import os

# 1. Menambahkan folder backend ke python path dari berbagai kemungkinan struktur bundle Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(current_dir, "..", "backend"),
    os.path.join(current_dir, "backend"),
    os.path.abspath("backend"),
    os.path.join(os.getcwd(), "backend"),
]
for c in candidates:
    if os.path.exists(c) and c not in sys.path:
        sys.path.insert(0, c)

# 2. Sinkronisasi environment variable Supabase dengan fallback
DEFAULT_SUPABASE_URL = "https://enzizvrvfogjjgctpmli.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueml6dnJ2Zm9nampnY3RwbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2MTY2NywiZXhwIjoyMTA0OTM3NjY3fQ.WRZlF1Mn8rv-yX--mv6go5YQXYS-xix2vMPrF8VzG9o"

if not os.environ.get("SUPABASE_URL"):
    os.environ["SUPABASE_URL"] = os.environ.get("VITE_SUPABASE_URL", DEFAULT_SUPABASE_URL)
if not os.environ.get("SUPABASE_KEY"):
    os.environ["SUPABASE_KEY"] = os.environ.get("VITE_SUPABASE_ANON_KEY", DEFAULT_SUPABASE_KEY)

# 3. Ekspor FastAPI app untuk Vercel Serverless ASGI
from main import app, health_check
from fastapi import APIRouter
from routers import (
    users,
    profile,
    planner,
    focus,
    workload,
    metrics,
    checkins,
    interventions,
    index,
    demo,
    insights,
)

# 4. Daftarkan router dengan prefix /api agar semua endpoint /api/... dapat diakses langsung oleh Vercel
api_router = APIRouter(prefix="/api")
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(planner.router)
api_router.include_router(focus.router)
api_router.include_router(workload.router)
api_router.include_router(metrics.router)
api_router.include_router(checkins.router)
api_router.include_router(interventions.router)
api_router.include_router(index.router)
api_router.include_router(demo.router)
api_router.include_router(insights.router)
api_router.add_api_route("/health", health_check, methods=["GET"], tags=["System"])

app.include_router(api_router)

# 5. Middleware normalisasi path untuk Vercel rewrites (mengatasi x-matched-path)
@app.middleware("http")
async def vercel_path_normalizer(request, call_next):
    # Jika Vercel mem-proxy ke file handler /api/index.py atau /api/index
    # header x-matched-path berisi request path asli dari user
    matched_path = request.headers.get("x-matched-path")
    if matched_path and request.scope.get("path") in ("/api/index.py", "/api/index", "/api"):
        clean_path = matched_path.split("?")[0]
        if clean_path:
            request.scope["path"] = clean_path
    return await call_next(request)
