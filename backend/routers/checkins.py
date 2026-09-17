from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from db import supabase, iso_start_today, now_wib
from schemas import CheckInCreate, CheckInResponse

router = APIRouter(prefix="/check-ins", tags=["Check-ins"])

@router.post("", response_model=CheckInResponse)
def submit_check_in(payload: CheckInCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("check_ins").insert({
        "user_id": payload.user_id,
        "skor": payload.skor,
        "catatan": payload.catatan
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal menyimpan check-in")

    return res.data[0]

@router.get("/today", response_model=Optional[CheckInResponse])
def get_today_check_in(user_id: str):
    """Mengambil check-in terbaru hari ini (WIB)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    start_iso = iso_start_today()
    res = supabase.table("check_ins") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", start_iso) \
        .order("ts", desc=True) \
        .limit(1) \
        .execute()

    if res.data and len(res.data) > 0:
        return res.data[0]
    return None

@router.get("", response_model=List[CheckInResponse])
def list_check_ins(user_id: str, days: int = Query(default=7, ge=1, le=90)):
    """Mengambil riwayat check-in N hari terakhir."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    from datetime import timedelta
    start_time = (now_wib() - timedelta(days=days)).isoformat()
    res = supabase.table("check_ins") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", start_time) \
        .order("ts", desc=True) \
        .execute()

    return res.data or []
