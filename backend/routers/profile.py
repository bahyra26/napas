from fastapi import APIRouter, HTTPException
from typing import List, Optional
from db import supabase, now_wib, ensure_uuid
from local_db import local_save_profile, local_get_profile, deterministic_uuid, get_user_by_id
from schemas import (
    ProfileUpsert,
    ClassScheduleCreate,
    ClassScheduleBulk,
    CalendarSyncRequest,
    WorkloadResponse
)

router = APIRouter(tags=["Profile & Schedule"])

DEFAULT_WHITELIST = [
    "elearning.ugm.ac.id",
    "docs.google.com",
    "notion.so",
    "github.com",
    "journal.ugm.ac.id",
    "wikipedia.org",
    "chatgpt.com",
    "canva.com"
]
DEFAULT_BLACKLIST = ["Discord", "YouTube", "Instagram", "TikTok", "Steam", "Mobile Legends", "Netflix", "Twitter", "X.com"]

_MEM_SCHEDULES: dict = {}

@router.get("/profile/{user_id}")
def get_user_profile(user_id: str):
    u_uuid = deterministic_uuid(user_id)
    user = {}
    if supabase:
        try:
            u_res = supabase.table("users").select("*").in_("id", [user_id, u_uuid]).execute()
            if u_res.data:
                user = u_res.data[0]
        except Exception:
            pass

    if not user:
        user = get_user_by_id(u_uuid) or get_user_by_id(user_id) or {}

    profile = None
    if supabase:
        try:
            p_res = supabase.table("user_profiles").select("*").in_("user_id", [user_id, u_uuid]).execute()
            if p_res.data and len(p_res.data) > 0:
                profile = p_res.data[0]
        except Exception:
            pass

    if not profile:
        profile = local_get_profile(u_uuid) or local_get_profile(user_id)

    if not profile:
        profile = {
            "user_id": user_id,
            "panggilan": user.get("nama", "Mahasiswa").split()[0] if user.get("nama") else "Mahasiswa",
            "kampus": "Universitas Gadjah Mada",
            "jurusan": "Ilmu Komputer",
            "semester": 6,
            "jam_tidur": "23:00",
            "jam_bangun": "06:00",
            "kronotipe": "pagi",
            "target_fokus_jam": 4.0,
            "focus_whitelist": DEFAULT_WHITELIST,
            "focus_blacklist": DEFAULT_BLACKLIST,
            "agent_action": "warn_then_close"
        }

    # Pastikan focus_whitelist valid list
    wl = profile.get("focus_whitelist")
    if not wl or isinstance(wl, dict) or len(wl) == 0:
        profile["focus_whitelist"] = DEFAULT_WHITELIST

    return {
        **profile,
        "nama": user.get("nama", profile.get("panggilan", "Mahasiswa")),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url", ""),
        "onboarded": user.get("onboarded", profile.get("onboarded", False))
    }

@router.put("/profile/{user_id}")
def upsert_user_profile(user_id: str, payload: ProfileUpsert):
    data = {
        "user_id": user_id,
        "updated_at": now_wib().isoformat()
    }
    if payload.panggilan is not None: data["panggilan"] = payload.panggilan
    if payload.kampus is not None: data["kampus"] = payload.kampus
    if payload.jurusan is not None: data["jurusan"] = payload.jurusan
    if payload.semester is not None: data["semester"] = payload.semester
    if payload.jam_tidur is not None: data["jam_tidur"] = payload.jam_tidur
    if payload.jam_bangun is not None: data["jam_bangun"] = payload.jam_bangun
    if payload.kronotipe is not None: data["kronotipe"] = payload.kronotipe
    if payload.target_fokus_jam is not None: data["target_fokus_jam"] = payload.target_fokus_jam
    if payload.focus_whitelist is not None: data["focus_whitelist"] = payload.focus_whitelist
    if payload.focus_blacklist is not None: data["focus_blacklist"] = payload.focus_blacklist
    if payload.agent_action is not None: data["agent_action"] = payload.agent_action
    if payload.onboarded is not None: data["onboarded"] = payload.onboarded

    u_uuid = deterministic_uuid(user_id)
    data["user_id"] = u_uuid

    # 1. Simpan permanen ke SQLite Lokal
    saved = local_save_profile(data)

    # 2. Coba upsert ke Supabase jika tabel ada
    if supabase:
        try:
            res = supabase.table("user_profiles").upsert(data, on_conflict="user_id").execute()
            if res.data:
                saved = res.data[0]
        except Exception:
            pass

        if payload.onboarded is not None:
            try:
                supabase.table("users").update({"onboarded": payload.onboarded}).in_("id", [user_id, u_uuid]).execute()
            except Exception:
                pass

    return saved


@router.get("/schedule/{user_id}")
def get_class_schedule(user_id: str):
    if supabase:
        try:
            res = supabase.table("class_schedule") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("hari") \
                .order("jam_mulai") \
                .execute()
            return res.data or []
        except Exception:
            pass
    return _MEM_SCHEDULES.get(user_id, [])

@router.post("/schedule")
def add_class_schedule(payload: ClassScheduleCreate):
    import uuid
    row = payload.model_dump()
    row["id"] = str(uuid.uuid4())
    if supabase:
        try:
            res = supabase.table("class_schedule").insert(row).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    
    user_id = payload.user_id
    if user_id not in _MEM_SCHEDULES:
        _MEM_SCHEDULES[user_id] = []
    _MEM_SCHEDULES[user_id].append(row)
    return row

@router.post("/schedule/bulk")
def bulk_set_class_schedule(payload: ClassScheduleBulk):
    import uuid
    rows = []
    for item in payload.items:
        r = item.model_dump()
        r["id"] = str(uuid.uuid4())
        rows.append(r)

    if supabase:
        try:
            if payload.replace:
                supabase.table("class_schedule").delete().eq("user_id", payload.user_id).execute()
            if rows:
                res = supabase.table("class_schedule").insert(rows).execute()
                return {"status": "ok", "count": len(res.data or [])}
            return {"status": "ok", "count": 0}
        except Exception:
            pass

    if payload.replace:
        _MEM_SCHEDULES[payload.user_id] = rows
    else:
        if payload.user_id not in _MEM_SCHEDULES:
            _MEM_SCHEDULES[payload.user_id] = []
        _MEM_SCHEDULES[payload.user_id].extend(rows)
    return {"status": "ok", "count": len(rows)}

@router.delete("/schedule/{schedule_id}")
def delete_class_schedule(schedule_id: str):
    if supabase:
        try:
            supabase.table("class_schedule").delete().eq("id", schedule_id).execute()
        except Exception:
            pass
    for u_id in _MEM_SCHEDULES:
        _MEM_SCHEDULES[u_id] = [s for s in _MEM_SCHEDULES[u_id] if s.get("id") != schedule_id]
    return {"status": "ok", "deleted_id": schedule_id}

@router.post("/calendar/sync")
def sync_google_calendar_events(payload: CalendarSyncRequest):
    """
    Sinkronisasi event dari Google Calendar ke tabel workload_items (SQLite Lokal & Supabase).
    Event otomatis terklasifikasi sebagai kuliah / tugas / rapat dan tidak duplikat.
    """
    from local_db import local_bulk_sync_google_events, deterministic_uuid

    raw_events = []
    for ev in payload.events:
        raw_events.append({
            "id": ev.id,
            "summary": ev.summary,
            "start": ev.start.isoformat() if ev.start else None,
            "end": ev.end.isoformat() if ev.end else None,
            "all_day": ev.all_day,
            "description": ev.description
        })

    # 1. Simpan ke SQLite Lokal
    synced_local = local_bulk_sync_google_events(payload.user_id, raw_events)

    # 2. Simpan juga ke Supabase jika tersedia
    synced_supabase = 0
    if supabase:
        try:
            for ev in payload.events:
                summary_lower = ev.summary.lower()
                if any(k in summary_lower for k in ["kuliah", "praktikum", "asistensi", "kelas", "lab"]):
                    jenis = "kuliah"
                elif any(k in summary_lower for k in ["rapat", "meeting", "diskusi", "tm "]):
                    jenis = "rapat"
                elif any(k in summary_lower for k in ["uas", "uts", "kuis", "ujian", "evaluasi"]):
                    jenis = "ujian"
                else:
                    jenis = "tugas"

                est_jam = 1.5
                if ev.end and ev.start:
                    dur = (ev.end - ev.start).total_seconds() / 3600.0
                    if dur > 0:
                        est_jam = round(dur, 1)

                row = {
                    "user_id": payload.user_id,
                    "judul": ev.summary,
                    "jenis": jenis,
                    "deadline": (ev.end or ev.start).isoformat(),
                    "est_jam": min(12.0, max(0.5, est_jam)),
                    "effort": 4 if jenis in ["ujian"] else (3 if jenis in ["tugas"] else 2),
                    "status": "belum",
                    "source": "google",
                    "google_event_id": ev.id
                }

                existing = supabase.table("workload_items") \
                    .select("id") \
                    .eq("user_id", payload.user_id) \
                    .eq("google_event_id", ev.id) \
                    .execute()

                if existing.data and len(existing.data) > 0:
                    supabase.table("workload_items").update(row).eq("id", existing.data[0]["id"]).execute()
                else:
                    supabase.table("workload_items").insert(row).execute()
                synced_supabase += 1
        except Exception as e:
            print("Supabase calendar sync warning:", e)

    return {"status": "ok", "synced": max(synced_local, synced_supabase, len(payload.events))}
