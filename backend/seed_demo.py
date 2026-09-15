import os
from datetime import datetime, date, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("\n[ERROR] SUPABASE_URL atau SUPABASE_KEY belum diisi di file .env!")
    print("Silakan isi file .env terlebih dahulu dengan URL dan API Key dari Supabase.\n")
    exit(1)

sb: Client = create_client(url, key)

def run_seed():
    print("=== MULAI SEED DATA DEMO RAKA (NAPAS v2) ===")

    # 1. Pastikan User Raka Ada
    user_data = {
        "nama": "Raka Pratama",
        "email": "raka@joints2026.ugm.ac.id",
        "consent_camera": True,
        "consent_window": True,
        "baseline_blink_rate": 18.0
    }
    u = sb.table("users").upsert(user_data, on_conflict="email").execute()
    user_id = u.data[0]["id"]
    print(f"[OK] User ID Raka: {user_id}")

    # 2. Seed Workload (6 Deadline Minggu Ini)
    now = datetime.now(timezone.utc)
    workloads = [
        {"user_id": user_id, "judul": "Skripsi Bab 4 & 5 (Analisis)", "jenis": "tugas", "deadline": (now + timedelta(hours=14)).isoformat(), "est_jam": 8, "effort": 5, "status": "belum"},
        {"user_id": user_id, "judul": "Tugas Besar Pemrograman Web", "jenis": "tugas", "deadline": (now + timedelta(days=2)).isoformat(), "est_jam": 6, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Rapat Koordinasi BEM FMIPA", "jenis": "rapat", "deadline": (now + timedelta(days=2, hours=4)).isoformat(), "est_jam": 2, "effort": 3, "status": "belum"},
        {"user_id": user_id, "judul": "Laporan Praktikum Machine Learning", "jenis": "tugas", "deadline": (now + timedelta(days=3)).isoformat(), "est_jam": 5, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Kuis Teori Komputasi", "jenis": "ujian", "deadline": (now + timedelta(days=5)).isoformat(), "est_jam": 3, "effort": 5, "status": "belum"},
        {"user_id": user_id, "judul": "Revisi Makalah Seminar", "jenis": "tugas", "deadline": (now + timedelta(days=6)).isoformat(), "est_jam": 4, "effort": 3, "status": "belum"}
    ]
    sb.table("workload_items").delete().eq("user_id", user_id).execute()
    sb.table("workload_items").insert(workloads).execute()
    print("[OK] 6 Workload items berhasil ditambahkan.")

    # 3. Seed Tren 7 Hari Terakhir (Index Meningkat dari Hijau -> Oranye)
    today = date.today()
    history = [
        {"days_ago": 6, "idx": 24.5, "zona": "hijau", "load": 20, "stress": 22, "dist": 15},
        {"days_ago": 5, "idx": 28.0, "zona": "hijau", "load": 25, "stress": 26, "dist": 20},
        {"days_ago": 4, "idx": 38.5, "zona": "kuning", "load": 40, "stress": 35, "dist": 22},
        {"days_ago": 3, "idx": 52.0, "zona": "kuning", "load": 55, "stress": 48, "dist": 30},
        {"days_ago": 2, "idx": 64.0, "zona": "oranye", "load": 68, "stress": 62, "dist": 35},
        {"days_ago": 1, "idx": 74.5, "zona": "oranye", "load": 78, "stress": 71, "dist": 40}
    ]

    sb.table("daily_index").delete().eq("user_id", user_id).execute()
    for h in history:
        tgl = (today - timedelta(days=h["days_ago"])).isoformat()
        sb.table("daily_index").insert({
            "user_id": user_id,
            "tanggal": tgl,
            "index": h["idx"],
            "zona": h["zona"],
            "load_score": h["load"],
            "stress_score": h["stress"],
            "dist_score": h["dist"],
            "checkin_score": 50,
            "alasan_json": ["Beban akademik meningkat bertahap"],
            "trend_flag": (h["days_ago"] <= 2)
        }).execute()
    print("[OK] History tren 6 hari berhasil di-seed.")

    # 4. Seed Sensor Metrics Hari Ini (Kondisi Kelelahan: Alis tegang, kedipan drop)
    metrics = []
    for _ in range(15):
        metrics.append({
            "user_id": user_id,
            "blink_rate": 11.2,
            "brow_tension": 0.72,
            "jaw_tension": 0.55,
            "gaze_minutes": 48.0,
            "face_visible": True,
            "focus_seconds": 2200,
            "distraction_seconds": 950,
            "app_category": "academic"
        })
    sb.table("sensor_metrics").insert(metrics).execute()
    print("[OK] 15 batch sensor metrics hari ini tersimpan.")

    # 5. Seed Check-In Hari Ini
    sb.table("check_ins").insert({
        "user_id": user_id,
        "skor": 2,
        "catatan": "Kepala pusing dan deadline skripsi menumpuk."
    }).execute()
    print("[OK] Check-in Raka tersimpan.")

    print("\n" + "="*50)
    print(f"🎉 SUKSES! Seed data selesai.")
    print(f"👉 USER_ID RAKA: {user_id}")
    print(f"Buka browser: http://localhost:8000/index/today?user_id={user_id}")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_seed()
