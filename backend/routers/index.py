from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from db import supabase, now_wib, start_of_day_wib, iso_start_today
from schemas import BurnoutIndexResponse
from engine import (
    calculate_load_score,
    calculate_stress_score,
    calculate_distraction_score,
    calculate_checkin_score,
    trend_up_3days,
    compute_index
)

router = APIRouter(prefix="/index", tags=["Burnout Index"])

@router.get("/today", response_model=BurnoutIndexResponse)
def get_or_compute_today_index(user_id: str):
    """
    Menghitung Burnout Index hari ini secara dinamis dan transparan (Explainable AI).
    Endpoint ini memiliki side effect: hasil perhitungan di-upsert ke tabel `daily_index`.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    current_wib = now_wib()
    today_wib_str = current_wib.date().isoformat()
    today_start_iso = iso_start_today()
    twenty_four_hours_ago = (current_wib - timedelta(hours=24)).isoformat()

    # 1. Query Workload items (status 'belum')
    wl_res = supabase.table("workload_items") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    workload_items = wl_res.data or []
    load_score, load_alasan = calculate_load_score(workload_items, now=current_wib)

    # 2. Query Sensor Metrics 24 jam terakhir (untuk StressScore) dan hari ini (untuk DistractionScore)
    sm_res = supabase.table("sensor_metrics") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", twenty_four_hours_ago) \
        .execute()
    metrics_24h = sm_res.data or []

    # Filter khusus hari ini untuk DistractionScore
    metrics_today = [m for m in metrics_24h if (m.get("ts") or "") >= today_start_iso]

    stress_score, stress_alasan = calculate_stress_score(metrics_24h)
    dist_score, dist_alasan = calculate_distraction_score(metrics_today)

    # 3. Query Check-in terbaru hari ini (WIB)
    ci_res = supabase.table("check_ins") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", today_start_iso) \
        .order("ts", desc=True) \
        .limit(1) \
        .execute()
    latest_checkin = ci_res.data[0] if (ci_res.data and len(ci_res.data) > 0) else None
    checkin_score, checkin_alasan = calculate_checkin_score(latest_checkin)

    # 4. Query history 7 hari terakhir (sebelum hari ini) untuk evaluasi tren 3-hari beruntun (+2 epsilon)
    hist_start = (current_wib.date() - timedelta(days=8)).isoformat()
    history_res = supabase.table("daily_index") \
        .select("tanggal, index") \
        .eq("user_id", user_id) \
        .gte("tanggal", hist_start) \
        .lt("tanggal", today_wib_str) \
        .order("tanggal", desc=False) \
        .execute()
    
    hist_data = history_res.data or []
    is_trend_up = trend_up_3days(hist_data)

    # 5. Agregasi alasan dari masing-masing sub-skor
    sub_reasons = load_alasan + stress_alasan + dist_alasan + checkin_alasan

    # 6. Jalankan Burnout Engine dengan Graceful Degradation & Re-weighting
    engine_result = compute_index(
        load=load_score,
        stress=stress_score,
        dist=dist_score,
        checkin=checkin_score,
        is_trend_up=is_trend_up,
        sub_reasons=sub_reasons
    )

    final_index = engine_result["index"]
    zona = engine_result["zona"]
    final_alasan = engine_result["alasan"]
    sensors_missing = engine_result["sensors_missing"]

    # 7. Upsert ke tabel daily_index
    daily_record = {
        "user_id": user_id,
        "tanggal": today_wib_str,
        "index": final_index,
        "zona": zona,
        "load_score": load_score,
        "stress_score": stress_score,
        "dist_score": dist_score,
        "checkin_score": checkin_score,
        "alasan_json": final_alasan,
        "trend_flag": is_trend_up
    }
    supabase.table("daily_index").upsert(daily_record, on_conflict="user_id,tanggal").execute()

    return BurnoutIndexResponse(
        user_id=user_id,
        tanggal=today_wib_str,
        index=final_index,
        zona=zona,
        load_score=load_score,
        stress_score=stress_score,
        dist_score=dist_score,
        checkin_score=checkin_score,
        alasan=final_alasan,
        trend_flag=is_trend_up,
        sensors_missing=sensors_missing
    )


@router.get("/history")
def get_index_history(user_id: str, days: int = Query(default=30, ge=1, le=90)):
    """Mengambil histori harian Burnout Index untuk chart tren."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    start_date = (now_wib().date() - timedelta(days=days)).isoformat()

    res = supabase.table("daily_index") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("tanggal", start_date) \
        .order("tanggal", desc=False) \
        .execute()

    return res.data or []
