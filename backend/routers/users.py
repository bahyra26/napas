from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=UserResponse)
def create_user(payload: UserCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    # Cek apakah email sudah ada
    res = supabase.table("users").select("*").eq("email", payload.email).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]

    insert_res = supabase.table("users").insert({
        "nama": payload.nama,
        "email": payload.email,
        "consent_camera": payload.consent_camera,
        "consent_window": payload.consent_window,
        "baseline_blink_rate": payload.baseline_blink_rate
    }).execute()

    if not insert_res.data:
        raise HTTPException(status_code=400, detail="Gagal membuat user")

    return insert_res.data[0]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return res.data[0]
