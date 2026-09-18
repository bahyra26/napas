from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from datetime import timedelta
from db import supabase, now_wib
from schemas import InterventionCreate, InterventionResponse

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.post("", response_model=InterventionResponse)
def log_intervention(payload: InterventionCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("interventions").insert({
        "user_id": payload.user_id,
        "tipe": payload.tipe,
        "durasi": payload.durasi,
        "selesai": payload.selesai
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal mencatat intervensi")

    return res.data[0]

@router.get("")
def get_interventions(user_id: str, days: int = Query(default=7, ge=1, le=90)):
    """
    Mengambil riwayat intervensi beserta ringkasan statistik
    untuk ditampilkan pada halaman Laporan / Wellness Web Dashboard.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    start_time = (now_wib() - timedelta(days=days)).isoformat()
    res = supabase.table("interventions") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", start_time) \
        .order("ts", desc=True) \
        .execute()

    items = res.data or []
    completed_count = sum(1 for i in items if i.get("selesai"))

    type_counts = {}
    for i in items:
        t = i.get("tipe", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "user_id": user_id,
        "days": days,
        "total": len(items),
        "completed": completed_count,
        "by_type": type_counts,
        "items": items
    }
