import os
from fastapi import APIRouter, HTTPException
from datetime import timedelta
from db import supabase, now_wib
from schemas import SimulateRequest

router = APIRouter(prefix="/demo", tags=["Demo Simulation"])

@router.post("/simulate")
def simulate_demo_state(payload: SimulateRequest):
    """
    (DEV/DEMO ONLY) Menyuntikkan metrik stres & kondisi beban kerja seketika
    agar Burnout Index berpindah ke zona ORANYE atau MERAH dalam < 2 detik.
    Sangat krusial untuk demo panggung & rekaman video 2 menit.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    user_id = payload.user_id
    mode = payload.mode
    current_time = now_wib()
    today_date = current_time.date()

    if mode == "reset":
        # Hapus sensor hari ini dan reset ke kondisi normal
        supabase.table("sensor_metrics").delete().eq("user_id", user_id).gte("ts", current_time.replace(hour=0, minute=0, second=0).isoformat()).execute()
        supabase.table("check_ins").delete().eq("user_id", user_id).gte("ts", current_time.replace(hour=0, minute=0, second=0).isoformat()).execute()
        return {"status": "ok", "message": f"Kondisi user {user_id} di-reset ke baseline normal."}

    # 1. Suntikkan 3 Hari Riwayat Index Naik Beruntun (memicu trend_up_3days)
    prev_indices = [
        {"days_ago": 3, "idx": 45.0, "zona": "kuning"},
        {"days_ago": 2, "idx": 54.0, "zona": "kuning"},
        {"days_ago": 1, "idx": 65.0, "zona": "oranye"}
    ]
    for p in prev_indices:
        tgl = (today_date - timedelta(days=p["days_ago"])).isoformat()
        supabase.table("daily_index").upsert({
            "user_id": user_id,
            "tanggal": tgl,
            "index": p["idx"],
            "zona": p["zona"],
            "load_score": 50.0,
            "stress_score": 50.0,
            "dist_score": 30.0,
            "checkin_score": 50.0,
            "alasan_json": ["Beban akademik meningkat bertahap"],
            "trend_flag": (p["days_ago"] == 1)
        }, on_conflict="user_id,tanggal").execute()

    # 2. Suntikkan Workload Deadline Mendesak
    if mode in ["oranye", "merah"]:
        workloads = [
            {"user_id": user_id, "judul": "Skripsi Bab 4 & 5 (Analisis)", "jenis": "tugas", "deadline": (current_time + timedelta(hours=10)).isoformat(), "est_jam": 8, "effort": 5, "status": "belum"},
            {"user_id": user_id, "judul": "Tugas Besar Pemrograman Web", "jenis": "tugas", "deadline": (current_time + timedelta(days=2)).isoformat(), "est_jam": 6, "effort": 4, "status": "belum"},
            {"user_id": user_id, "judul": "Laporan Praktikum Machine Learning", "jenis": "tugas", "deadline": (current_time + timedelta(days=3)).isoformat(), "est_jam": 5, "effort": 4, "status": "belum"},
            {"user_id": user_id, "judul": "Kuis Teori Komputasi", "jenis": "ujian", "deadline": (current_time + timedelta(days=4)).isoformat(), "est_jam": 3, "effort": 5, "status": "belum"}
        ]
        if mode == "merah":
            workloads.append({"user_id": user_id, "judul": "Revisi Makalah Jurnal Larut Malam", "jenis": "tugas", "deadline": (current_time + timedelta(hours=14)).replace(hour=23, minute=0).isoformat(), "est_jam": 6, "effort": 5, "status": "belum"})
            workloads.append({"user_id": user_id, "judul": "Buku Panduan Akhir Skripsi", "jenis": "tugas", "deadline": (current_time + timedelta(hours=20)).isoformat(), "est_jam": 4, "effort": 4, "status": "belum"})

        for w in workloads:
            supabase.table("workload_items").insert(w).execute()

    # 3. Suntikkan Telemetri Stres Tinggi
    blink_val = 9.5 if mode == "merah" else 11.0
    brow_val = 0.85 if mode == "merah" else 0.65
    gaze_val = 55.0 if mode == "merah" else 42.0
    dist_sec = 2400 if mode == "merah" else 1200

    metrics = []
    for i in range(10):
        metrics.append({
            "user_id": user_id,
            "ts": (current_time - timedelta(minutes=i*5)).isoformat(),
            "blink_rate": blink_val,
            "brow_tension": brow_val,
            "jaw_tension": 0.6,
            "gaze_minutes": gaze_val,
            "face_visible": True,
            "focus_seconds": 1800,
            "distraction_seconds": dist_sec,
            "app_category": "academic"
        })
    supabase.table("sensor_metrics").insert(metrics).execute()

    # 4. Suntikkan Check-in
    checkin_val = 1 if mode == "merah" else 2
    catatan_val = "Kelelahan parah, mata pedih dan sulit tidur." if mode == "merah" else "Beban tugas menumpuk dan pusing."
    supabase.table("check_ins").insert({
        "user_id": user_id,
        "skor": checkin_val,
        "catatan": catatan_val
    }).execute()

    return {
        "status": "ok",
        "mode": mode,
        "message": f"Simulasi mode {mode.upper()} berhasil disuntikkan! Silakan panggil GET /index/today?user_id={user_id}"
    }
