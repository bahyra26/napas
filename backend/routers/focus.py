from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
import sys
import os
import subprocess
import socket

from db import supabase, now_wib, ensure_uuid, ensure_user_in_supabase
from schemas import FocusSessionStart, FocusSessionFinish
from local_db import (
    deterministic_uuid,
    local_save_focus_session,
    local_get_active_session,
    local_list_focus_sessions,
    save_or_update_user,
    get_connection
)

router = APIRouter(prefix="/focus-sessions", tags=["Focus Sessions"])

@router.post("/start")
def start_focus_session(payload: FocusSessionStart):
    now_iso = now_wib().isoformat()
    session_id = payload.session_id or payload.id or str(uuid.uuid4())
    u_id = deterministic_uuid(payload.user_id)

    # Pastikan user terdaftar di database lokal dan Supabase
    save_or_update_user(u_id, "Mahasiswa")
    ensure_user_in_supabase(u_id)

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

    # 1. Simpan permanen ke SQLite Lokal (Dijamin 100% aman di disk!)
    saved = local_save_focus_session(row)

    # 2. Coba simpan ke Supabase jika tabelnya ada
    if supabase:
        try:
            supabase.table("focus_sessions").upsert(row).execute()
        except Exception:
            pass

    return saved


STUDY_TERMS_FILTER = {
    "github", "gitlab", "ugm", "elearning", "moodle", "canvas", "classroom",
    "docs", "drive", "notion", "wikipedia", "chatgpt", "claude", "beranda",
    "dashboard", "computer", "organisasi", "townhall", "itdev", "mikail",
    "napas", "localhost", "127.0.0.1", "code", "visual studio", "terminal",
    "powershell", "cmd", "acrobat", "word", "excel", "powerpoint", "figma",
    "zoom", "untitled", "new tab", "tab baru", "loading", "memuat",
    "speed dial", "startpage", "about:blank", "canva", "google dokumen", "google docs"
}

_AGENT_PROCESS = None

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
        "id": session_id,
        "selesai": now_iso,
        "focus_seconds": payload.focus_seconds,
        "distraction_seconds": payload.distraction_seconds,
        "blocked_count": blocked_count,
        "blocked_apps": clean_blocked_apps,
        "completed": payload.completed
    }

    # 1. Update ke SQLite Lokal
    session = local_save_focus_session(upd)
    user_id = session.get("user_id")

    # 2. Update ke Supabase focus_sessions jika ada
    if supabase:
        try:
            supabase.table("focus_sessions").update({
                "selesai": now_iso,
                "focus_seconds": payload.focus_seconds,
                "distraction_seconds": payload.distraction_seconds,
                "blocked_count": blocked_count,
                "blocked_apps": clean_blocked_apps,
                "completed": payload.completed
            }).eq("id", session_id).execute()
        except Exception:
            pass

    # 3. Ingest ke sensor_metrics agar terhitung oleh engine & chart analitik
    if user_id:
        # Pastikan user terdaftar di tabel users Supabase terlebih dahulu
        ensure_user_in_supabase(user_id)

        # Simpan ke sensor_metrics SQLite lokal
        try:
            conn = get_connection()
            conn.cursor().execute("""
                INSERT INTO sensor_metrics (id, user_id, ts, focus_seconds, distraction_seconds, app_category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user_id, now_iso, payload.focus_seconds, payload.distraction_seconds, "Focus Session", now_iso))
            conn.commit()
            conn.close()
        except Exception:
            pass

        # Simpan ke sensor_metrics Supabase (dijamin aman dari FK violation!)
        if supabase:
            try:
                supabase.table("sensor_metrics").insert({
                    "user_id": user_id,
                    "ts": now_iso,
                    "face_visible": True,
                    "focus_seconds": payload.focus_seconds,
                    "distraction_seconds": payload.distraction_seconds,
                    "app_category": "Focus Session"
                }).execute()
            except Exception as e:
                print(f"[FOCUS] Error insert sensor_metrics Supabase: {e}")

    return session

@router.get("/{user_id}/active")
def get_active_session(user_id: str):
    u_uuid = deterministic_uuid(user_id)

    # 1. Cek SQLite Lokal terlebih dahulu
    active = local_get_active_session(u_uuid) or local_get_active_session(user_id)
    if active:
        return active

    # 2. Cek Supabase jika ada
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .eq("completed", False) \
                .order("mulai", desc=True) \
                .limit(1) \
                .execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception:
            pass

    return None

@router.get("/{user_id}")
def list_focus_sessions(user_id: str, limit: int = Query(default=10, ge=1, le=50)):
    u_uuid = deterministic_uuid(user_id)

    # 1. Ambil dari SQLite Lokal
    local_sessions = local_list_focus_sessions(u_uuid, limit)
    if not local_sessions and user_id != u_uuid:
        local_sessions = local_list_focus_sessions(user_id, limit)

    known_ids = {s.get("id") for s in local_sessions}

    # 2. Gabungkan dengan Supabase jika ada
    if supabase:
        try:
            res = supabase.table("focus_sessions") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .order("mulai", desc=True) \
                .limit(limit) \
                .execute()
            if res.data:
                for row in res.data:
                    if row.get("id") not in known_ids:
                        local_sessions.append(row)
        except Exception:
            pass

    return local_sessions[:limit]
