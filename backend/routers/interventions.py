from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import InterventionCreate

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.post("")
def log_intervention(payload: InterventionCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("interventions").insert({
        "user_id": payload.user_id,
        "tipe": payload.tipe,
        "durasi": payload.durasi,
        "selesai": payload.selesai
    }).execute()

    return {"status": "ok", "data": res.data[0] if res.data else None}
