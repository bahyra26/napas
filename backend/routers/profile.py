from fastapi import APIRouter, HTTPException
from typing import List, Optional
from db import supabase, now_wib, ensure_uuid, ensure_user_in_supabase
from local_db import local_save_profile, local_get_profile, deterministic_uuid, get_user_by_id
from schemas import (
    ProfileUpsert,
    ClassScheduleCreate,
    ClassScheduleBulk,
    CalendarSyncRequest,
    CalendarIcalSyncRequest,
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
            "kampus": "",
            "jurusan": "",
            "semester": 1,
            "jam_tidur": "23:00",
            "jam_bangun": "06:00",
            "kronotipe": "pagi",
            "target_fokus_jam": 4.0,
            "focus_whitelist": DEFAULT_WHITELIST,
            "focus_blacklist": DEFAULT_BLACKLIST,
            "agent_action": "warn_then_close",
            "onboarded": bool(user.get("onboarded", False))
        }

    # Pastikan focus_whitelist valid list
    wl = profile.get("focus_whitelist")
    if not wl or isinstance(wl, dict) or len(wl) == 0:
        profile["focus_whitelist"] = DEFAULT_WHITELIST

    is_user_onboarded = user.get("onboarded") if user.get("onboarded") is not None else profile.get("onboarded", False)

    return {
        **profile,
        "nama": user.get("nama", profile.get("panggilan", "Mahasiswa")),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url", ""),
        "onboarded": bool(is_user_onboarded)
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
    if payload.avatar_url is not None: data["avatar_url"] = payload.avatar_url
    if payload.onboarded is not None: data["onboarded"] = payload.onboarded

    u_uuid = deterministic_uuid(user_id)
    data["user_id"] = u_uuid

    # 1. Simpan permanen ke SQLite Lokal
    saved = local_save_profile(data)

    # 2. Coba upsert ke Supabase jika tabel ada
    if supabase:
        try:
            from db import ensure_user_in_supabase
            ensure_user_in_supabase(u_uuid, nama=payload.panggilan or "Mahasiswa")

            # Filter hanya field yang valid ada di tabel user_profiles Supabase
            ALLOWED_PROFILE_FIELDS = (
                "panggilan", "kampus", "jurusan", "semester",
                "jam_tidur", "jam_bangun", "kronotipe", "target_fokus_jam",
                "focus_whitelist", "focus_blacklist"
            )
            sb_profile_data = {
                "user_id": u_uuid,
                "updated_at": data.get("updated_at")
            }
            for col in ALLOWED_PROFILE_FIELDS:
                if col in data:
                    sb_profile_data[col] = data[col]

            res = supabase.table("user_profiles").upsert(sb_profile_data, on_conflict="user_id").execute()
            if res.data:
                saved = res.data[0]
        except Exception as e:
            print(f"[Supabase Profile Upsert Error]: {e}")

        # Update avatar_url di tabel users Supabase agar konsisten
        if payload.avatar_url is not None:
            try:
                supabase.table("users").update({"avatar_url": payload.avatar_url}).in_("id", [user_id, u_uuid]).execute()
            except Exception as e:
                print(f"[Supabase Users Avatar Error]: {e}")

        if payload.onboarded is not None:
            try:
                supabase.table("users").update({"onboarded": payload.onboarded}).in_("id", [user_id, u_uuid]).execute()
            except Exception as e:
                print(f"[Supabase Users Onboarded Error]: {e}")

    return {
        **saved,
        "avatar_url": data.get("avatar_url") or saved.get("avatar_url", ""),
        "onboarded": payload.onboarded if payload.onboarded is not None else saved.get("onboarded", True)
    }


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
    u_id = ensure_uuid(payload.user_id)
    ensure_user_in_supabase(u_id)
    row = payload.model_dump()
    row["id"] = str(uuid.uuid4())
    row["user_id"] = u_id
    if supabase:
        try:
            res = supabase.table("class_schedule").insert(row).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    
    if u_id not in _MEM_SCHEDULES:
        _MEM_SCHEDULES[u_id] = []
    _MEM_SCHEDULES[u_id].append(row)
    return row

@router.post("/schedule/bulk")
def bulk_set_class_schedule(payload: ClassScheduleBulk):
    import uuid
    u_id = ensure_uuid(payload.user_id)
    ensure_user_in_supabase(u_id)
    rows = []
    for item in payload.items:
        r = item.model_dump()
        r["id"] = str(uuid.uuid4())
        r["user_id"] = u_id
        rows.append(r)

    if supabase:
        try:
            if payload.replace:
                supabase.table("class_schedule").delete().eq("user_id", u_id).execute()
            if rows:
                res = supabase.table("class_schedule").insert(rows).execute()
                return {"status": "ok", "count": len(res.data or [])}
            return {"status": "ok", "count": 0}
        except Exception:
            pass

    if payload.replace:
        _MEM_SCHEDULES[u_id] = rows
    else:
        if u_id not in _MEM_SCHEDULES:
            _MEM_SCHEDULES[u_id] = []
        _MEM_SCHEDULES[u_id].extend(rows)
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

    u_id = ensure_uuid(payload.user_id)
    ensure_user_in_supabase(u_id)

    # 1. Simpan ke SQLite Lokal
    synced_local = local_bulk_sync_google_events(u_id, raw_events)

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
                    "user_id": u_id,
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
                    .in_("user_id", [payload.user_id, u_id]) \
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

@router.post("/calendar/sync-ical-url")
def sync_google_calendar_ical_url(payload: CalendarIcalSyncRequest):
    """
    Mengunduh dan menyinkronkan agenda Google Calendar asli mahasiswa
    melalui link iCal (.ics) Google Calendar pribadi tanpa terhalang CORS browser.
    """
    import urllib.request
    from local_db import local_bulk_sync_google_events

    url = payload.ical_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL iCal tidak boleh kosong")

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NAPAS/2.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengambil kalender dari URL Google: {str(e)}")

    events = []
    lines = content.splitlines()
    in_event = False
    cur = {}

    def parse_dt(dt_str):
        clean = dt_str.split(":")[-1].strip()
        if len(clean) == 8:
            y, m, d = clean[:4], clean[4:6], clean[6:8]
            return f"{y}-{m}-{d}T23:59:00+07:00"
        if "T" in clean:
            date_p, time_p = clean.split("T")
            time_p = time_p.rstrip("Z")
            y, m, d = date_p[:4], date_p[4:6], date_p[6:8]
            hh = time_p[:2] if len(time_p) >= 2 else "00"
            mm = time_p[2:4] if len(time_p) >= 4 else "00"
            ss = time_p[4:6] if len(time_p) >= 6 else "00"
            tz = "+00:00" if clean.endswith("Z") else "+07:00"
            return f"{y}-{m}-{d}T{hh}:{mm}:{ss}{tz}"
        return None

    for line in lines:
        if line.startswith("BEGIN:VEVENT"):
            in_event = True
            cur = {"id": f"gcal-ics-{len(events)+1}"}
        elif line.startswith("END:VEVENT"):
            if in_event and cur.get("summary") and cur.get("start"):
                events.append(cur)
            in_event = False
            cur = {}
        elif in_event:
            if line.startswith("SUMMARY:"):
                cur["summary"] = line[8:].strip()
            elif line.startswith("UID:"):
                cur["id"] = line[4:].strip()
            elif line.startswith("DTSTART"):
                parsed = parse_dt(line)
                if parsed:
                    cur["start"] = parsed
            elif line.startswith("DTEND"):
                parsed = parse_dt(line)
                if parsed:
                    cur["end"] = parsed
            elif line.startswith("DESCRIPTION:"):
                cur["description"] = line[12:].strip()

    if not events:
        return {"status": "ok", "synced": 0, "message": "Tidak ada agenda valid dalam tautan kalender iCal."}

    formatted_events = []
    for ev in events:
        formatted_events.append({
            "id": ev["id"],
            "summary": ev["summary"],
            "start": ev["start"],
            "end": ev.get("end") or ev["start"],
            "all_day": False,
            "description": ev.get("description", "")
        })

    synced_local = local_bulk_sync_google_events(payload.user_id, formatted_events)

    if supabase:
        try:
            for ev in formatted_events:
                summary_lower = ev["summary"].lower()
                jenis = "kuliah" if any(k in summary_lower for k in ["kuliah", "praktikum", "kelas"]) else ("ujian" if any(k in summary_lower for k in ["uts", "uas", "ujian"]) else "tugas")
                row = {
                    "user_id": payload.user_id,
                    "judul": ev["summary"],
                    "jenis": jenis,
                    "deadline": ev["end"] or ev["start"],
                    "est_jam": 2.0,
                    "effort": 3,
                    "status": "belum",
                    "source": "google",
                    "google_event_id": ev["id"]
                }
                existing = supabase.table("workload_items").select("id").eq("user_id", payload.user_id).eq("google_event_id", ev["id"]).execute()
                if existing.data and len(existing.data) > 0:
                    supabase.table("workload_items").update(row).eq("id", existing.data[0]["id"]).execute()
                else:
                    supabase.table("workload_items").insert(row).execute()
        except Exception as e:
            print("Supabase iCal sync warning:", e)

    return {"status": "ok", "synced": synced_local, "message": f"Berhasil menyinkronkan {synced_local} agenda asli dari Google Calendar mahasiswa!"}

