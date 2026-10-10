from fastapi import APIRouter, HTTPException
from db import supabase, ensure_uuid, ensure_user_in_supabase
from schemas import UserCreate, UserUpdate, UserResponse
from local_db import save_or_update_user, get_user_by_id, deterministic_uuid

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/login-or-register")
def login_or_register(payload: dict):
    """
    Login atau register pengguna dengan ID deterministik.
    Menjamin ID konsisten setiap login dan tersimpan permanen di SQLite lokal serta Supabase.
    """
    identifier = payload.get("identifier") or payload.get("email") or payload.get("nama") or "Mahasiswa"
    nama = payload.get("nama") or identifier.split("@")[0]
    email = payload.get("email") or (identifier if "@" in identifier else f"{identifier}@napas.local")

    u_id = deterministic_uuid(identifier)

    # 1. Simpan ke SQLite lokal
    local_user = save_or_update_user(u_id, nama, email)

    # 2. Sinkronkan ke Supabase
    ensure_user_in_supabase(u_id, nama, email)

    return local_user


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

@router.post("/sync-auth", response_model=UserResponse)
def sync_supabase_auth(payload: dict):
    """
    Menautkan sesi Supabase Auth (mis. Google Login) ke tabel users.
    Payload: {"access_token": "..."} atau {"auth_id": "...", "email": "...", "nama": "...", "avatar_url": "..."}
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    auth_id = payload.get("auth_id")
    email = payload.get("email")
    nama = payload.get("nama")
    avatar_url = payload.get("avatar_url")
    access_token = payload.get("access_token")

    # Jika dikirim access_token, verifikasi via Supabase Auth Client
    if access_token:
        if access_token == "demo-token":
            return init_demo_user()
        try:
            auth_user_res = supabase.auth.get_user(access_token)
            if auth_user_res and hasattr(auth_user_res, "user") and auth_user_res.user:
                u = auth_user_res.user
                auth_id = u.id
                email = u.email
                meta = getattr(u, "user_metadata", {}) or {}
                nama = meta.get("full_name") or meta.get("name") or (email.split("@")[0] if email else "Mahasiswa")
                avatar_url = meta.get("avatar_url") or meta.get("picture")
        except Exception as e:
            # Jika token tidak valid / verifikasi offline gagal tapi dikirim payload info
            if not email and not auth_id:
                raise HTTPException(status_code=401, detail=f"Token tidak valid: {str(e)}")

    if not email and not auth_id:
        raise HTTPException(status_code=400, detail="Wajib menyertakan email atau auth_id")

    # Cari user berdasarkan auth_id atau email
    query = supabase.table("users").select("*")
    if auth_id:
        res = query.eq("auth_id", auth_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]

    if email:
        res = supabase.table("users").select("*").eq("email", email).execute()
        if res.data and len(res.data) > 0:
            existing = res.data[0]
            # Update auth_id & avatar_url jika belum ada
            upd = {}
            if auth_id and not existing.get("auth_id"):
                upd["auth_id"] = auth_id
            if avatar_url and not existing.get("avatar_url"):
                upd["avatar_url"] = avatar_url
            if upd:
                supabase.table("users").update(upd).eq("id", existing["id"]).execute()
                existing.update(upd)
            return existing

    # Jika user belum ada sama sekali, buat baru
    new_user = {
        "nama": nama or (email.split("@")[0] if email else "Mahasiswa"),
        "email": email or f"{auth_id}@auth.local",
        "auth_id": auth_id,
        "avatar_url": avatar_url,
        "consent_camera": True,
        "consent_window": True,
        "baseline_blink_rate": 18.0,
        "onboarded": False
    }
    insert_res = supabase.table("users").insert(new_user).execute()
    if not insert_res.data:
        raise HTTPException(status_code=400, detail="Gagal mendaftarkan user baru")

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
    u_uuid = deterministic_uuid(user_id)
    if supabase:
        try:
            res = supabase.table("users").select("*").in_("id", [user_id, u_uuid]).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception:
            pass

    # Fallback ke SQLite lokal
    local_u = get_user_by_id(u_uuid) or get_user_by_id(user_id)
    if local_u:
        return local_u

    raise HTTPException(status_code=404, detail="User tidak ditemukan")


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
