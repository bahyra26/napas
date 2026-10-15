from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from db import supabase, now_wib, WIB
from schemas import AutoPlanRequest, StudySessionUpdate

router = APIRouter(prefix="/planner", tags=["Planner & Radar"])

DAY_SHORT_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
DAY_LONG_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
MONTH_SHORT_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
MONTH_LONG_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

_MEM_STUDY_SESSIONS: dict = {}

@router.get("/radar")
def get_deadline_radar(user_id: str, days: int = Query(default=14, ge=1, le=30)):
    """
    Menghasilkan grid kalender 14 hari dinamis dari data tugas (workload_items)
    dan jadwal kuliah mingguan (class_schedule) asli milik pengguna.
    """
    current_wib = now_wib()
    today_date = current_wib.date()

    # 1. Ambil workload aktif (SQLite Lokal & Supabase)
    from local_db import local_list_workload_items, deterministic_uuid
    u_uuid = deterministic_uuid(user_id)
    workloads = local_list_workload_items(u_uuid, status="belum")
    if not workloads and user_id != u_uuid:
        workloads = local_list_workload_items(user_id, status="belum")

    known_ids = {w.get("id") for w in workloads}
    if supabase:
        try:
            wl_res = supabase.table("workload_items") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .eq("status", "belum") \
                .execute()
            if wl_res.data:
                for w in wl_res.data:
                    if w.get("id") not in known_ids:
                        workloads.append(w)
        except Exception:
            pass

    # 2. Ambil jadwal kuliah mingguan
    class_schedules = []
    if supabase:
        try:
            cs_res = supabase.table("class_schedule") \
                .select("*") \
                .eq("user_id", user_id) \
                .execute()
            class_schedules = cs_res.data or []
        except Exception:
            from routers.profile import _MEM_SCHEDULES
            class_schedules = _MEM_SCHEDULES.get(user_id, [])
    else:
        from routers.profile import _MEM_SCHEDULES
        class_schedules = _MEM_SCHEDULES.get(user_id, [])

    # 3. Ambil study sessions rencana
    study_sessions = []
    if supabase:
        try:
            ss_res = supabase.table("study_sessions") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("status", "rencana") \
                .execute()
            study_sessions = ss_res.data or []
        except Exception:
            study_sessions = [s for s in _MEM_STUDY_SESSIONS.get(user_id, []) if s.get("status") == "rencana"]
    else:
        study_sessions = [s for s in _MEM_STUDY_SESSIONS.get(user_id, []) if s.get("status") == "rencana"]

    # Petakan workload berdasarkan tanggal (YYYY-MM-DD)
    workload_by_date: Dict[str, List[Dict[str, Any]]] = {}
    for w in workloads:
        raw_dl = w.get("deadline")
        if not raw_dl:
            continue
        try:
            dl_dt = datetime.fromisoformat(raw_dl.replace("Z", "+00:00")).astimezone(WIB)
            d_str = dl_dt.date().isoformat()
            if d_str not in workload_by_date:
                workload_by_date[d_str] = []
            time_str = f"Deadline {dl_dt.strftime('%H.%M')}" if dl_dt.hour != 0 or dl_dt.minute != 0 else "Deadline 23.59"
            is_google = (w.get("source") == "google" or bool(w.get("google_event_id")))
            workload_by_date[d_str].append({
                "id": w["id"],
                "title": w["judul"],
                "time": time_str,
                "effort": w.get("effort", 3),
                "est_jam": float(w.get("est_jam") or 2.0),
                "source": w.get("source", "local"),
                "is_google": is_google,
                "jenis": w.get("jenis", "tugas")
            })
        except Exception:
            continue

    # Petakan study sessions
    study_by_date: Dict[str, List[Dict[str, Any]]] = {}
    for s in study_sessions:
        raw_m = s.get("mulai")
        if not raw_m:
            continue
        try:
            m_dt = datetime.fromisoformat(raw_m.replace("Z", "+00:00")).astimezone(WIB)
            d_str = m_dt.date().isoformat()
            if d_str not in study_by_date:
                study_by_date[d_str] = []
            study_by_date[d_str].append({
                "title": f"Sesi: {s['judul']}",
                "time": m_dt.strftime("%H.%M")
            })
        except Exception:
            continue

    calendar_days: List[Dict[str, Any]] = []

    for i in range(days):
        cur_date = today_date + timedelta(days=i)
        d_str = cur_date.isoformat()
        weekday_idx = cur_date.weekday()  # 0: Senin, 6: Minggu

        day_tasks: List[Dict[str, str]] = []
        total_effort_points = 0
        total_est_hours = 0.0

        # Tambahkan jadwal kuliah hari ini
        day_classes = [c for c in class_schedules if c.get("hari") == weekday_idx]
        for c in day_classes:
            jam_m = c.get("jam_mulai", "08:00").replace(":", ".")
            jam_s = c.get("jam_selesai", "10:00").replace(":", ".")
            ruang = f" ({c['ruang']})" if c.get("ruang") else ""
            day_tasks.append({
                "title": f"Kuliah: {c['mata_kuliah']}{ruang}",
                "time": f"{jam_m} - {jam_s}"
            })
            total_effort_points += 2
            total_est_hours += 2.0

        # Tambahkan workload / deadline hari ini
        if d_str in workload_by_date:
            for w in workload_by_date[d_str]:
                day_tasks.append({
                    "title": w["title"],
                    "time": w["time"],
                    "source": w.get("source", "local"),
                    "is_google": w.get("is_google", False),
                    "jenis": w.get("jenis", "tugas")
                })
                total_effort_points += int(w["effort"]) * 2
                total_est_hours += w["est_jam"]

        # Tambahkan study sessions
        if d_str in study_by_date:
            for s in study_by_date[d_str]:
                day_tasks.append(s)

        # Hitung skor beban harian (0 - 100)
        task_count = len(day_tasks)
        load_score = min(100, int((task_count * 15) + (total_est_hours * 8) + (total_effort_points * 2)))

        if load_score >= 65:
            status = "Berat"
            pill_text = f"{task_count} agenda"
        elif load_score >= 35:
            status = "Sedang"
            pill_text = f"{task_count} agenda" if task_count > 0 else "Sedang"
        else:
            status = "Ringan"
            pill_text = "Bebas" if task_count == 0 else f"{task_count} agenda"

        day_full = DAY_LONG_ID[weekday_idx]
        month_full = MONTH_LONG_ID[cur_date.month - 1]
        month_short = MONTH_SHORT_ID[cur_date.month - 1]

        calendar_days.append({
            "date": f"{day_full}, {cur_date.day} {month_full}",
            "raw_date": d_str,
            "dayName": DAY_SHORT_ID[weekday_idx],
            "dayNum": cur_date.day,
            "monthShort": month_short,
            "monthFull": month_full,
            "status": status,
            "load": load_score,
            "pillText": pill_text,
            "tasks": day_tasks
        })

    # Analisis hari terberat
    busiest = max(calendar_days, key=lambda d: d["load"])
    heavy_days_count = len([d for d in calendar_days if d["status"] == "Berat"])
    free_days_count = len([d for d in calendar_days if len(d["tasks"]) == 0])
    total_tasks_count = sum(len(d["tasks"]) for d in calendar_days)

    return {
        "days": calendar_days,
        "busiest_day": busiest,
        "summary": {
            "total_tasks": total_tasks_count,
            "heavy_days": heavy_days_count,
            "free_days": free_days_count,
            "busiest_label": f"{busiest['dayNum']} {busiest['monthShort']}"
        }
    }


@router.post("/auto")
def auto_plan_study_sessions(payload: AutoPlanRequest):
    """
    Algoritma Perencana Belajar Otomatis:
    Menganalisis tugas tertunda dan mencarikan slot waktu belajar ideal di jam produktif
    sebelum deadline tugas, menghindari jam kuliah dan batas tidur mahasiswa.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    user_id = payload.user_id
    current_wib = now_wib()

    # Ambil profil user untuk jam tidur & produktif
    profile = {}
    if supabase:
        try:
            p_res = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
            if p_res.data:
                profile = p_res.data[0]
        except Exception:
            from routers.profile import _MEM_PROFILES
            profile = _MEM_PROFILES.get(user_id, {})
    else:
        from routers.profile import _MEM_PROFILES
        profile = _MEM_PROFILES.get(user_id, {})

    kronotipe = profile.get("kronotipe", "pagi")
    jam_tidur_str = profile.get("jam_tidur", "23:00")
    jam_tidur_hour = int(jam_tidur_str.split(":")[0]) if ":" in jam_tidur_str else 23

    # Tentukan jam optimal berdasarkan kronotipe
    if kronotipe == "malam":
        preferred_hours = [19, 20, 21, 14, 15, 16]
    elif kronotipe == "siang":
        preferred_hours = [13, 14, 15, 16, 9, 10]
    else:  # pagi
        preferred_hours = [8, 9, 10, 11, 14, 15]

    # Ambil tugas yang belum selesai
    end_date_iso = (current_wib + timedelta(days=payload.days)).isoformat()
    workloads = []
    if supabase:
        try:
            wl_res = supabase.table("workload_items") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("status", "belum") \
                .lte("deadline", end_date_iso) \
                .order("deadline") \
                .execute()
            workloads = wl_res.data or []
        except Exception:
            pass

    if payload.replace_existing:
        if supabase:
            try:
                supabase.table("study_sessions").delete().eq("user_id", user_id).eq("status", "rencana").execute()
            except Exception:
                pass
        _MEM_STUDY_SESSIONS[user_id] = [s for s in _MEM_STUDY_SESSIONS.get(user_id, []) if s.get("status") != "rencana"]

    if not workloads:
        return {"status": "ok", "message": "Tidak ada tugas tertunda yang perlu dijadwalkan.", "created": 0, "sessions": []}

    created_sessions = []
    session_minutes = payload.session_minutes
    import uuid

    for w in workloads:
        raw_dl = w.get("deadline")
        if not raw_dl:
            continue
        try:
            dl_dt = datetime.fromisoformat(raw_dl.replace("Z", "+00:00")).astimezone(WIB)
        except Exception:
            continue

        est_jam = float(w.get("est_jam") or 2.0)
        needed_sessions = max(1, round(est_jam * 60 / session_minutes))

        # Jadwalkan sesi 1 sampai 3 hari sebelum deadline
        for s_idx in range(needed_sessions):
            day_offset = max(0, min(3, needed_sessions - s_idx))
            target_day = (dl_dt - timedelta(days=day_offset)).date()
            if target_day < current_wib.date():
                target_day = current_wib.date()

            # Pilih jam produktif yang belum melewati batas tidur
            slot_hour = preferred_hours[s_idx % len(preferred_hours)]
            if slot_hour >= jam_tidur_hour:
                slot_hour = max(8, jam_tidur_hour - 2)

            start_dt = datetime(target_day.year, target_day.month, target_day.day, slot_hour, 0, tzinfo=WIB)
            if start_dt < current_wib:
                start_dt = current_wib + timedelta(minutes=30)
            end_dt = start_dt + timedelta(minutes=session_minutes)

            part_label = f" (Sesi {s_idx + 1}/{needed_sessions})" if needed_sessions > 1 else ""
            session_row = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "workload_id": w["id"],
                "judul": f"Cicil {w['judul']}{part_label}",
                "mulai": start_dt.isoformat(),
                "selesai": end_dt.isoformat(),
                "status": "rencana"
            }
            saved = session_row
            if supabase:
                try:
                    ins = supabase.table("study_sessions").insert(session_row).execute()
                    if ins.data:
                        saved = ins.data[0]
                except Exception:
                    pass
            created_sessions.append(saved)
            if user_id not in _MEM_STUDY_SESSIONS:
                _MEM_STUDY_SESSIONS[user_id] = []
            _MEM_STUDY_SESSIONS[user_id].append(saved)

    return {
        "status": "ok",
        "message": f"Berhasil membuat {len(created_sessions)} sesi belajar pintar.",
        "created": len(created_sessions),
        "sessions": created_sessions
    }


@router.get("/sessions/{user_id}")
def get_user_study_sessions(user_id: str):
    if supabase:
        try:
            res = supabase.table("study_sessions") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("mulai") \
                .execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return _MEM_STUDY_SESSIONS.get(user_id, [])


@router.patch("/sessions/{session_id}")
def update_study_session(session_id: str, payload: StudySessionUpdate):
    upd = {}
    if payload.status: upd["status"] = payload.status
    if payload.google_event_id: upd["google_event_id"] = payload.google_event_id

    if supabase:
        try:
            res = supabase.table("study_sessions").update(upd).eq("id", session_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    for u_id in _MEM_STUDY_SESSIONS:
        for s in _MEM_STUDY_SESSIONS[u_id]:
            if s.get("id") == session_id:
                s.update(upd)
                return s

    return {"id": session_id, **upd}
