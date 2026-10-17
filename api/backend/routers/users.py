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
    u_uuid = deterministic_uuid(user_id)
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
    if payload.avatar_url is not None:
        update_data["avatar_url"] = payload.avatar_url
    if payload.onboarded is not None:
        update_data["onboarded"] = payload.onboarded

    # 1. Update SQLite lokal selalu agar data user tidak hilang saat offline
    local_u = get_user_by_id(u_uuid) or get_user_by_id(user_id)
    if update_data:
        nama = update_data.get("nama") or (local_u.get("nama") if local_u else "Mahasiswa")
        email = update_data.get("email") or (local_u.get("email") if local_u else f"{u_uuid[:8]}@napas.local")
        local_u = save_or_update_user(u_uuid, nama, email)
        if "avatar_url" in update_data:
            from local_db import local_save_profile
            local_save_profile({"user_id": u_uuid, "avatar_url": update_data["avatar_url"]})

    # 2. Update Supabase jika ada
    if supabase and update_data:
        try:
            update_res = supabase.table("users").update(update_data).in_("id", [user_id, u_uuid]).execute()
            if update_res.data:
                return update_res.data[0]
        except Exception as e:
            print(f"[Supabase updateUser error]: {e}")

    if local_u:
        return local_u

    raise HTTPException(status_code=404, detail="User tidak ditemukan")


@router.post("/auto-confirm")
def auto_confirm_user(payload: dict):
    """
    Auto-confirm email pengguna via Supabase Admin API dari sisi backend
    (Menggunakan kunci service_role yang aman di server tanpa membocorkannya ke client).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")
    
    email = payload.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email wajib diisi.")
        
    try:
        users_res = supabase.auth.admin.list_users()
        users_list = getattr(users_res, 'users', users_res) if not isinstance(users_res, list) else users_res
        target = next((u for u in users_list if getattr(u, 'email', '').lower() == email.lower()), None)
        if target:
            supabase.auth.admin.update_user_by_id(target.id, {"email_confirm": True})
            return {"status": "success", "message": f"User {email} berhasil dikonfirmasi"}
        return {"status": "not_found", "message": "User tidak ditemukan"}
    except Exception as e:
        print(f"[AUTH-ADMIN] Gagal auto-confirm: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/register-direct")
def register_direct(payload: dict):
    """
    Mendaftarkan pengguna baru dengan email terkonfirmasi langsung via Supabase Admin API.
    Aman karena service_role hanya dieksekusi di backend server.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")
        
    email = payload.get("email", "").strip()
    password = payload.get("password", "")
    full_name = payload.get("full_name", "") or email.split("@")[0]
    username = payload.get("username", "") or email.split("@")[0]
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email dan password wajib diisi.")
        
    try:
        created = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "username": username
            }
        })
        user_obj = getattr(created, 'user', created)
        u_id = user_obj.id if hasattr(user_obj, 'id') else user_obj.get('id')
        ensure_user_in_supabase(u_id, full_name, email)
        return {"status": "success", "user": {"id": u_id, "email": email, "nama": full_name}}
    except Exception as e:
        print(f"[AUTH-ADMIN] Gagal register-direct: {e}")
        return {"status": "error", "message": str(e)}

