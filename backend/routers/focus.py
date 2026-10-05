from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import List, Dict, Any, Optional
from db import supabase, now_wib
from schemas import FocusSessionStart, FocusSessionFinish

router = APIRouter(prefix="/focus-sessions", tags=["Focus Sessions"])

_MEM_FOCUS_SESSIONS: dict = {}

@router.post("/start")
def start_focus_session(payload: FocusSessionStart):
    import uuid
    now_iso = now_wib().isoformat()
    session_id = str(uuid.uuid4())
    row = {
        "id": session_id,
        "user_id": payload.user_id,
        "workload_id": payload.workload_id,
        "judul": payload.judul or "Sesi Fokus Belajar",
        "mulai": now_iso,
        "target_menit": payload.target_menit,
        "agent_connected": payload.agent_connected,
        "completed": False,
        "focus_seconds": 0,
        "distraction_seconds": 0,
        "blocked_count": 0,
        "blocked_apps": {}
    }

    saved = row
    if supabase:
        try:
            res = supabase.table("focus_sessions").insert(row).execute()
            if res.data:
                saved = res.data[0]
        except Exception:
            pass

    u_id = payload.user_id
    if u_id not in _MEM_FOCUS_SESSIONS:
        _MEM_FOCUS_SESSIONS[u_id] = []
    _MEM_FOCUS_SESSIONS[u_id].append(saved)

    return saved

@router.post("/{session_id}/finish")
def finish_focus_session(session_id: str, payload: FocusSessionFinish):
    now_iso = now_wib().isoformat()
    blocked_count = sum(payload.blocked_apps.values()) if payload.blocked_apps else 0

    upd = {
        "selesai": now_iso,
        "focus_seconds": payload.focus_seconds,
        "distraction_seconds": payload.distraction_seconds,
        "blocked_count": blocked_count,
        "blocked_apps": payload.blocked_apps,
        "completed": payload.completed
    }

    session = None
    if supabase:
        try:
            res = supabase.table("focus_sessions").update(upd).eq("id", session_id).execute()
            if res.data:
                session = res.data[0]
        except Exception:
            pass

    if not session:
        for u_id in _MEM_FOCUS_SESSIONS:
            for s in _MEM_FOCUS_SESSIONS[u_id]:
                if s.get("id") == session_id:
                    s.update(upd)
                    session = s
                    break

    if not session:
        session = {"id": session_id, **upd}

    user_id = session.get("user_id")

    # Ingest ke sensor_metrics agar terhitung oleh engine & chart analitik
    if user_id and supabase:
        try:
            supabase.table("sensor_metrics").insert({
                "user_id": user_id,
                "ts": now_iso,
                "face_visible": True,
                "focus_seconds": payload.focus_seconds,
                "distraction_seconds": payload.distraction_seconds,
                "app_category": "Focus Session"
            }).execute()
        except Exception:
            pass

    return session

@router.get("/{user_id}/active")
def get_active_session(user_id: str):
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("completed", False) \
                .order("mulai", desc=True) \
                .limit(1) \
                .execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception:
            pass

    mem_list = _MEM_FOCUS_SESSIONS.get(user_id, [])
    active = [s for s in mem_list if not s.get("completed")]
    return active[-1] if active else None

@router.get("/{user_id}")
def list_focus_sessions(user_id: str, limit: int = Query(default=10, ge=1, le=50)):
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("mulai", desc=True) \
                .limit(limit) \
                .execute()
            if res.data:
                return res.data
        except Exception:
            pass

    mem_list = _MEM_FOCUS_SESSIONS.get(user_id, [])
    return list(reversed(mem_list))[:limit]
