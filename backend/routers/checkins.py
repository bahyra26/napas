from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from db import supabase, iso_start_today, now_wib
from schemas import CheckInCreate, CheckInResponse

router = APIRouter(prefix="/check-ins", tags=["Check-ins"])

@router.post("", response_model=CheckInResponse)
def submit_check_in(payload: CheckInCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    row = {
        "user_id": payload.user_id,
        "skor": payload.skor,
        "catatan": payload.catatan
    }
    if payload.jam_tidur is not None:
        row["jam_tidur"] = payload.jam_tidur
    if payload.energi is not None:
        row["energi"] = payload.energi

    try:
        res = supabase.table("check_ins").insert(row).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        # Fallback jika kolom baru (jam_tidur / energi) belum ditambahkan ke tabel Supabase
        basic_row = {
            "user_id": payload.user_id,
            "skor": payload.skor,
            "catatan": payload.catatan
        }
        res = supabase.table("check_ins").insert(basic_row).execute()
        if res.data:
            item = res.data[0]
            item["jam_tidur"] = payload.jam_tidur
            item["energi"] = payload.energi
            return item

    raise HTTPException(status_code=400, detail="Gagal menyimpan check-in")

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
