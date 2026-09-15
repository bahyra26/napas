from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import CheckInCreate

router = APIRouter(prefix="/check-ins", tags=["Check-ins"])

@router.post("")
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

    return {"status": "ok", "check_in": res.data[0]}
