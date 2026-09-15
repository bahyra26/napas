from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date, timezone, timedelta
from typing import List, Dict, Any
from db import supabase
from schemas import BurnoutIndexResponse
from engine import (
    calculate_load_score,
    calculate_stress_score,
    calculate_distraction_score,
    calculate_checkin_score,
    calculate_burnout_index
)

router = APIRouter(prefix="/index", tags=["Burnout Index"])

@router.get("/today", response_model=BurnoutIndexResponse)
def get_or_compute_today_index(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    today_str = date.today().isoformat()
    now_utc = datetime.now(timezone.utc)
    today_start_iso = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()

    # 1. Ambil data profil user (untuk baseline)
    u_res = supabase.table("users").select("baseline_blink_rate").eq("id", user_id).execute()
    baseline_blink = 18.0
    if u_res.data and len(u_res.data) > 0:
        baseline_blink = float(u_res.data[0].get("baseline_blink_rate") or 18.0)

    # 2. Query workload aktif
    wl_res = supabase.table("workload_items").select("*").eq("user_id", user_id).execute()
    workload_items = wl_res.data or []
    load_score, load_alasan = calculate_load_score(workload_items, now=now_utc)

    # 3. Query sensor metrics hari ini
    sm_res = supabase.table("sensor_metrics") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", today_start_iso) \
        .execute()
    metrics_list = sm_res.data or []
    stress_score, stress_alasan = calculate_stress_score(metrics_list, baseline_blink=baseline_blink)
    dist_score, dist_alasan = calculate_distraction_score(metrics_list)

    # 4. Query check-in terbaru hari ini
    ci_res = supabase.table("check_ins") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", today_start_iso) \
        .order("ts", desc=True) \
        .limit(1) \
        .execute()
    latest_checkin = ci_res.data[0] if (ci_res.data and len(ci_res.data) > 0) else None
    checkin_score, checkin_alasan = calculate_checkin_score(latest_checkin)

    # 5. Cek tren 3-hari berurutan sebelum hari ini
    history_res = supabase.table("daily_index") \
        .select("tanggal, index") \
        .eq("user_id", user_id) \
        .lt("tanggal", today_str) \
        .order("tanggal", desc=True) \
        .limit(3) \
        .execute()
    
    trend_up_3days = False
    hist_data = history_res.data or []
    if len(hist_data) >= 3:
        idx_t1 = float(hist_data[0]["index"])
        idx_t2 = float(hist_data[1]["index"])
        idx_t3 = float(hist_data[2]["index"])
        if idx_t1 > idx_t2 and idx_t2 > idx_t3:
            trend_up_3days = True

    # 6. Hitung Burnout Index & gabungkan alasan
    semua_alasan = load_alasan + stress_alasan + dist_alasan + checkin_alasan
    final_index, zona, explain_chips = calculate_burnout_index(
        load_score=load_score,
        stress_score=stress_score,
        dist_score=dist_score,
        checkin_score=checkin_score,
        trend_up_3days=trend_up_3days,
        alasan_list=semua_alasan
    )

    # 7. Upsert ke tabel daily_index
    daily_record = {
        "user_id": user_id,
        "tanggal": today_str,
        "index": final_index,
        "zona": zona,
        "load_score": load_score,
        "stress_score": stress_score,
        "dist_score": dist_score,
        "checkin_score": checkin_score,
        "alasan_json": explain_chips,
        "trend_flag": trend_up_3days
    }
    supabase.table("daily_index").upsert(daily_record, on_conflict="user_id,tanggal").execute()

    return BurnoutIndexResponse(
        user_id=user_id,
        tanggal=today_str,
        index=final_index,
        zona=zona,
        load_score=load_score,
        stress_score=stress_score,
        dist_score=dist_score,
        checkin_score=checkin_score,
        alasan=explain_chips,
        trend_flag=trend_up_3days
    )

@router.get("/history")
def get_index_history(user_id: str, days: int = Query(default=30, ge=1, le=90)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    start_date = (date.today() - timedelta(days=days)).isoformat()

    res = supabase.table("daily_index") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("tanggal", start_date) \
        .order("tanggal", desc=False) \
        .execute()

    return res.data or []
