from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import supabase
from routers import users, workload, metrics, checkins, interventions, index, demo

app = FastAPI(
    title="NAPAS v2 — Burnout Radar Backend API",
    description="Backend API untuk mendeteksi tanda burnout mahasiswa secara real-time, explainable scoring (chips alasan), dan intervensi mandiri.",
    version="2.1.0"
)

# CORS Diizinkan untuk Web Dashboard Next.js & Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(users.router)
app.include_router(workload.router)
app.include_router(metrics.router)
app.include_router(checkins.router)
app.include_router(interventions.router)
app.include_router(index.router)
app.include_router(demo.router)

@app.get("/health", tags=["System"])
def health_check():
    """Memverifikasi status server dan koneksi aktif ke Supabase DB."""
    db_status = "disconnected"
    if supabase:
        try:
            # Test query ringan ke Supabase
            res = supabase.table("users").select("id").limit(1).execute()
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "db": db_status,
        "service": "NAPAS v2 Backend Engine",
        "version": "2.1.0 (Revised)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
