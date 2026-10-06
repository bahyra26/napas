from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import List, Dict, Any, Optional
from db import supabase, now_wib, ensure_uuid
from schemas import FocusSessionStart, FocusSessionFinish

router = APIRouter(prefix="/focus-sessions", tags=["Focus Sessions"])

_MEM_FOCUS_SESSIONS: dict = {}

@router.post("/start")
def start_focus_session(payload: FocusSessionStart):
    import uuid
    now_iso = now_wib().isoformat()
    session_id = payload.session_id or payload.id or str(uuid.uuid4())
    u_id = ensure_uuid(payload.user_id)
    row = {
        "id": session_id,
        "user_id": u_id,
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

import sys
import os
import subprocess
import socket

_AGENT_PROCESS = None

STUDY_TERMS_FILTER = {
    "github", "gitlab", "ugm", "elearning", "moodle", "canvas", "classroom",
    "docs", "drive", "notion", "wikipedia", "chatgpt", "claude", "beranda",
    "dashboard", "computer", "organisasi", "townhall", "itdev", "mikail",
    "napas", "localhost", "127.0.0.1", "code", "visual studio", "terminal",
    "powershell", "cmd", "acrobat", "word", "excel", "powerpoint", "figma",
    "zoom", "untitled", "new tab", "tab baru"
}

def is_agent_port_active(port=8765) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(('127.0.0.1', port)) == 0

@router.post("/agent/start")
def start_desktop_agent():
    global _AGENT_PROCESS
    if is_agent_port_active(8765):
        return {"status": "already_running", "port": 8765}

    agent_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "agent", "napas_agent.py"))
    python_exe = sys.executable
    if os.path.exists(agent_script):
        creationflags = 0
        if sys.platform == "win32":
            creationflags = 0x08000000  # CREATE_NO_WINDOW
        try:
            _AGENT_PROCESS = subprocess.Popen(
                [python_exe, agent_script],
                creationflags=creationflags
            )
            return {"status": "started", "pid": _AGENT_PROCESS.pid, "port": 8765}
        except Exception as e:
            return {"status": "error", "detail": str(e)}
    return {"status": "error", "message": "File napas_agent.py tidak ditemukan"}

@router.post("/agent/stop")
def stop_desktop_agent():
    global _AGENT_PROCESS
    if _AGENT_PROCESS:
        try:
            _AGENT_PROCESS.terminate()
        except Exception:
            pass
        _AGENT_PROCESS = None
    return {"status": "stopped"}

@router.get("/agent/status")
def get_agent_status():
    return {
        "online": is_agent_port_active(8765),
        "port": 8765
    }

@router.post("/{session_id}/finish")
def finish_focus_session(session_id: str, payload: FocusSessionFinish):
    now_iso = now_wib().isoformat()

    # Filter out educational websites from blocked_apps to prevent false stats
    clean_blocked_apps = {}
    if payload.blocked_apps:
        for app, cnt in payload.blocked_apps.items():
            app_lower = app.lower().strip()
            if not any(st in app_lower for st in STUDY_TERMS_FILTER):
                clean_blocked_apps[app] = cnt

    blocked_count = sum(clean_blocked_apps.values())

    upd = {
        "selesai": now_iso,
        "focus_seconds": payload.focus_seconds,
        "distraction_seconds": payload.distraction_seconds,
        "blocked_count": blocked_count,
        "blocked_apps": clean_blocked_apps,
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
    u_uuid = ensure_uuid(user_id)
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", u_uuid) \
                .eq("completed", False) \
                .order("mulai", desc=True) \
                .limit(1) \
                .execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception:
            pass

    mem_list = _MEM_FOCUS_SESSIONS.get(user_id, []) or _MEM_FOCUS_SESSIONS.get(u_uuid, [])
    active = [s for s in mem_list if not s.get("completed")]
    return active[-1] if active else None

@router.get("/{user_id}")
def list_focus_sessions(user_id: str, limit: int = Query(default=10, ge=1, le=50)):
    u_uuid = ensure_uuid(user_id)
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .eq("user_id", u_uuid) \
                .order("mulai", desc=True) \
                .limit(limit) \
                .execute()
            if res.data:
                return res.data
        except Exception:
            pass

    mem_list = _MEM_FOCUS_SESSIONS.get(user_id, []) or _MEM_FOCUS_SESSIONS.get(u_uuid, [])
    return list(reversed(mem_list))[:limit]
