from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import UserCreate, UserUpdate, UserResponse

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

@router.post("/init-demo", response_model=UserResponse)
def init_demo_user():
    """
    Memastikan user demo Raka Pratama tersedia untuk demo hackathon JOINTS 2026.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    email = "raka@joints2026.ugm.ac.id"
    res = supabase.table("users").select("*").eq("email", email).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]

    insert_res = supabase.table("users").insert({
        "nama": "Raka Pratama",
        "email": email,
        "consent_camera": True,
        "consent_window": True,
        "baseline_blink_rate": 15.0
    }).execute()

    if not insert_res.data:
        raise HTTPException(status_code=400, detail="Gagal membuat user demo Raka")

    return insert_res.data[0]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("users").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return res.data[0]

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UserUpdate):
    """
    Memperbarui profil user atau toggle consent kamera/window.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    update_data = {}
    if payload.nama is not None:
        update_data["nama"] = payload.nama
    if payload.email is not None:
        update_data["email"] = payload.email
    if payload.consent_camera is not None:
        update_data["consent_camera"] = payload.consent_camera
    if payload.consent_window is not None:
        update_data["consent_window"] = payload.consent_window
    if payload.baseline_blink_rate is not None:
        update_data["baseline_blink_rate"] = payload.baseline_blink_rate

    if not update_data:
        res = supabase.table("users").select("*").eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return res.data[0]

    update_res = supabase.table("users").update(update_data).eq("id", user_id).execute()
    if not update_res.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan atau gagal diperbarui")

    return update_res.data[0]
