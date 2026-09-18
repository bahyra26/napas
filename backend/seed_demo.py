import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from db import WIB, now_wib

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("\n[ERROR] SUPABASE_URL atau SUPABASE_KEY belum diisi di file .env!")
    print("Silakan isi file .env terlebih dahulu dengan URL dan API Key dari Supabase.\n")
    exit(1)

sb: Client = create_client(url, key)

def run_seed():
    print("=== MULAI SEED DATA DEMO RAKA (NAPAS v2 REVISI) ===")
    current_time = now_wib()
    today_date = current_time.date()

    # 1. Pastikan User Raka Ada
    user_data = {
        "nama": "Raka Pratama",
        "email": "raka@joints2026.ugm.ac.id",
        "consent_camera": True,
        "consent_window": True,
        "baseline_blink_rate": 15.0
    }
    u = sb.table("users").upsert(user_data, on_conflict="email").execute()
    user_id = u.data[0]["id"]
    print(f"[OK] User ID Raka: {user_id}")

    # 2. Bersihkan Data Lama
    sb.table("workload_items").delete().eq("user_id", user_id).execute()
    sb.table("daily_index").delete().eq("user_id", user_id).execute()
    sb.table("sensor_metrics").delete().eq("user_id", user_id).execute()
    sb.table("check_ins").delete().eq("user_id", user_id).execute()
    sb.table("interventions").delete().eq("user_id", user_id).execute()

    # 3. Seed 5 Workload Items (Termasuk Agenda Larut Malam)
    workloads = [
        {"user_id": user_id, "judul": "Skripsi Bab 4 & 5 (Analisis)", "jenis": "tugas", "deadline": (current_time + timedelta(hours=14)).isoformat(), "est_jam": 8, "effort": 5, "status": "belum"},
        {"user_id": user_id, "judul": "Tugas Besar Pemrograman Web", "jenis": "tugas", "deadline": (current_time + timedelta(days=2)).isoformat(), "est_jam": 6, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Rapat Koordinasi BEM FMIPA", "jenis": "rapat", "deadline": (current_time + timedelta(days=2, hours=4)).isoformat(), "est_jam": 2, "effort": 3, "status": "belum"},
        {"user_id": user_id, "judul": "Laporan Praktikum Machine Learning", "jenis": "tugas", "deadline": (current_time + timedelta(days=3)).isoformat(), "est_jam": 5, "effort": 4, "status": "belum"},
        {"user_id": user_id, "judul": "Revisi Makalah Seminar Larut Malam", "jenis": "tugas", "deadline": (current_time + timedelta(days=1)).replace(hour=23, minute=0, second=0).isoformat(), "est_jam": 4, "effort": 4, "status": "belum"}
    ]
    sb.table("workload_items").insert(workloads).execute()
    print("[OK] 5 Workload items berhasil ditambahkan.")

    # 4. Seed Tren 5 Hari Terakhir (Index Meningkat Beruntun: 28 -> 38 -> 52 -> 64 -> 74)
    history = [
        {"days_ago": 5, "idx": 28.0, "zona": "hijau", "load": 25.0, "stress": 22.0, "dist": 15.0, "check": 25.0},
        {"days_ago": 4, "idx": 38.0, "zona": "kuning", "load": 40.0, "stress": 35.0, "dist": 20.0, "check": 50.0},
        {"days_ago": 3, "idx": 52.0, "zona": "kuning", "load": 55.0, "stress": 48.0, "dist": 30.0, "check": 50.0},
        {"days_ago": 2, "idx": 64.0, "zona": "oranye", "load": 68.0, "stress": 62.0, "dist": 35.0, "check": 75.0},
        {"days_ago": 1, "idx": 74.5, "zona": "oranye", "load": 78.0, "stress": 70.0, "dist": 40.0, "check": 75.0}
    ]
    for h in history:
        tgl = (today_date - timedelta(days=h["days_ago"])).isoformat()
        sb.table("daily_index").insert({
            "user_id": user_id,
            "tanggal": tgl,
            "index": h["idx"],
            "zona": h["zona"],
            "load_score": h["load"],
            "stress_score": h["stress"],
            "dist_score": h["dist"],
            "checkin_score": h["check"],
            "alasan_json": ["Beban akademik meningkat bertahap"],
            "trend_flag": (h["days_ago"] <= 2)
        }).execute()
    print("[OK] History tren 5 hari berhasil di-seed (memicu trend_up_3days).")

    # 5. Seed Sensor Metrics Hari Ini (Kelelahan: Blink drop, brow tegang, distraksi)
    metrics = []
    for i in range(15):
        metrics.append({
            "user_id": user_id,
            "ts": (current_time - timedelta(minutes=i * 15)).isoformat(),
            "blink_rate": 10.5,
            "brow_tension": 0.68,
            "jaw_tension": 0.55,
            "gaze_minutes": 48.0,
            "face_visible": True,
            "focus_seconds": 1800,
            "distraction_seconds": 900,
            "app_category": "academic"
        })
    sb.table("sensor_metrics").insert(metrics).execute()
    print("[OK] 15 batch sensor metrics hari ini tersimpan.")

    # 6. Seed Check-In Hari Ini
    sb.table("check_ins").insert({
        "user_id": user_id,
        "ts": (current_time - timedelta(hours=2)).isoformat(),
        "skor": 2,
        "catatan": "Pusing dan sulit tidur karena beban skripsi menumpuk."
    }).execute()
    print("[OK] Check-in Raka tersimpan.")

    # 7. Seed Interventions Hari Ini
    sb.table("interventions").insert([
        {"user_id": user_id, "ts": (current_time - timedelta(hours=3)).isoformat(), "tipe": "breathing", "durasi": 60, "selesai": True},
        {"user_id": user_id, "ts": (current_time - timedelta(hours=1)).isoformat(), "tipe": "break", "durasi": 300, "selesai": True}
    ]).execute()
    print("[OK] 2 log intervensi tersimpan.")

    print("\n" + "=" * 55)
    print("🎉 SUKSES! Seed data demo selesai.")
    print(f"👉 USER_ID RAKA: {user_id}")
    print(f"👉 Tes API: http://localhost:8000/index/today?user_id={user_id}")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    run_seed()
