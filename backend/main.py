from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, workload, metrics, checkins, interventions, index

app = FastAPI(
    title="NAPAS v2 — Burnout Radar Backend",
    description="Backend API untuk mendeteksi tanda burnout mahasiswa secara real-time, explainable scoring, dan intervensi mandiri.",
    version="2.0.0"
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

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "NAPAS v2 Backend Engine",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
