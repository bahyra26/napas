import sqlite3
import os
import json
import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = "/tmp/napas_local.db"
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "napas_local.db")
WIB = timezone(timedelta(hours=7))

UUID_REGEX = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)

def deterministic_uuid(identifier: str) -> str:
    """Menghasilkan UUID deterministik v5 berbasis identifier (email / username / nama)."""
    if not identifier:
        return str(uuid.uuid4())
    clean = identifier.strip().lower()
    if UUID_REGEX.match(clean):
        return clean
    # Untuk demo Raka Pratama, gunakan ID bawaan
    if clean in ("raka", "raka pratama", "raka@joints2026.ugm.ac.id"):
        return "951459f9-e92f-4193-b470-ea87a899e18d"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"napas.user.{clean}"))

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()

    # 1. Tabel users
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        email TEXT,
        consent_camera INTEGER DEFAULT 1,
        consent_window INTEGER DEFAULT 1,
        baseline_blink_rate REAL DEFAULT 15.0,
        created_at TEXT
    )
    """)

    # 2. Tabel focus_sessions
    c.execute("""
    CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workload_id TEXT,
        judul TEXT,
        mulai TEXT,
        selesai TEXT,
        target_menit INTEGER DEFAULT 25,
        agent_connected INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        focus_seconds INTEGER DEFAULT 0,
        distraction_seconds INTEGER DEFAULT 0,
        blocked_count INTEGER DEFAULT 0,
        blocked_apps TEXT,
        created_at TEXT
    )
    """)

    # 3. Tabel user_profiles
    c.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        nama TEXT,
        email TEXT,
        panggilan TEXT,
        kampus TEXT,
        jurusan TEXT,
        semester INTEGER DEFAULT 4,
        jam_tidur TEXT DEFAULT '23:00',
        jam_bangun TEXT DEFAULT '06:00',
        kronotipe TEXT DEFAULT 'pagi',
        target_fokus_jam REAL DEFAULT 4.0,
        focus_whitelist TEXT,
        focus_blacklist TEXT,
        agent_action TEXT DEFAULT 'warn_then_close',
        avatar_url TEXT,
        onboarded INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)

    # 4. Tabel sensor_metrics
    c.execute("""
    CREATE TABLE IF NOT EXISTS sensor_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ts TEXT NOT NULL,
        focus_seconds INTEGER DEFAULT 0,
        distraction_seconds INTEGER DEFAULT 0,
        app_category TEXT,
        blink_rate REAL,
        brow_tension REAL,
        jaw_tension REAL,
        created_at TEXT
    )
    """)

    # 5. Tabel workload_items
    c.execute("""
    CREATE TABLE IF NOT EXISTS workload_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        judul TEXT NOT NULL,
        jenis TEXT DEFAULT 'tugas',
        deadline TEXT NOT NULL,
        est_jam REAL DEFAULT 2.0,
        effort INTEGER DEFAULT 3,
        status TEXT DEFAULT 'belum',
        created_at TEXT
    )
    """)

    # 6. Tabel check_ins
    c.execute("""
    CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ts TEXT NOT NULL,
        skor INTEGER NOT NULL,
        catatan TEXT,
        created_at TEXT
    )
    """)

    # 7. Tabel interventions
    c.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tipe TEXT NOT NULL,
        durasi INTEGER DEFAULT 60,
        selesai INTEGER DEFAULT 1,
        ts TEXT,
        created_at TEXT
    )
    """)

    # Migrasi kolom google_event_id & source di workload_items
    try:
        c.execute("ALTER TABLE workload_items ADD COLUMN google_event_id TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE workload_items ADD COLUMN source TEXT DEFAULT 'local'")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE workload_items ADD COLUMN mata_kuliah TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN onboarded INTEGER DEFAULT 0")
    except Exception:
        pass

    conn.commit()

    # Pastikan user demo Raka Pratama ada di local DB
    raka_id = "951459f9-e92f-4193-b470-ea87a899e18d"
    c.execute("SELECT id FROM users WHERE id = ?", (raka_id,))
    if not c.fetchone():
        now_iso = datetime.now(WIB).isoformat()
        c.execute("""
            INSERT INTO users (id, nama, email, consent_camera, consent_window, baseline_blink_rate, created_at)
            VALUES (?, ?, ?, 1, 1, 15.0, ?)
        """, (raka_id, "Raka Pratama", "raka@joints2026.ugm.ac.id", now_iso))
        conn.commit()

    conn.close()

# Inisialisasi tabel saat file di-import
init_db()

# ==============================================================================
# CRUD HELPERS FOR USERS
# ==============================================================================

def save_or_update_user(user_id: str, nama: str, email: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    now_iso = datetime.now(WIB).isoformat()
    clean_id = deterministic_uuid(user_id or email or nama)
    clean_name = (nama or "Mahasiswa").strip()
    clean_email = (email or f"{clean_id[:8]}@napas.local").strip()

    c.execute("SELECT * FROM users WHERE id = ?", (clean_id,))
    row = c.fetchone()
    if row:
        c.execute("""
            UPDATE users SET nama = ?, email = ? WHERE id = ?
        """, (clean_name, clean_email, clean_id))
    else:
        try:
            c.execute("""
                INSERT INTO users (id, nama, email, consent_camera, consent_window, baseline_blink_rate, created_at)
                VALUES (?, ?, ?, 1, 1, 15.0, ?)
            """, (clean_id, clean_name, clean_email, now_iso))
        except Exception:
            pass

    # Sinkronkan juga nama & email ke user_profiles jika sudah ada record profilnya
    c.execute("SELECT user_id FROM user_profiles WHERE user_id = ?", (clean_id,))
    if c.fetchone():
        c.execute("UPDATE user_profiles SET nama = ?, email = ? WHERE user_id = ?", (clean_name, clean_email, clean_id))

    conn.commit()

    c.execute("SELECT * FROM users WHERE id = ?", (clean_id,))
    row_user = c.fetchone()
    res = dict(row_user) if row_user else {"id": clean_id, "nama": clean_name, "email": clean_email}
    conn.close()
    return res

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

# ==============================================================================
# CRUD HELPERS FOR FOCUS SESSIONS
# ==============================================================================

def local_save_focus_session(session_dict: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    now_iso = datetime.now(WIB).isoformat()
    s_id = session_dict.get("id") or str(uuid.uuid4())
    u_id = session_dict.get("user_id")

    b_apps = session_dict.get("blocked_apps")
    if isinstance(b_apps, (dict, list)):
        b_apps_str = json.dumps(b_apps)
    elif isinstance(b_apps, str):
        b_apps_str = b_apps
    else:
        b_apps_str = "{}"

    c.execute("SELECT id FROM focus_sessions WHERE id = ?", (s_id,))
    exists = c.fetchone()

    if exists:
        c.execute("""
            UPDATE focus_sessions SET
                selesai = ?,
                completed = ?,
                focus_seconds = ?,
                distraction_seconds = ?,
                blocked_count = ?,
                blocked_apps = ?
            WHERE id = ?
        """, (
            session_dict.get("selesai") or now_iso,
            1 if session_dict.get("completed") else 0,
            session_dict.get("focus_seconds", 0),
            session_dict.get("distraction_seconds", 0),
            session_dict.get("blocked_count", 0),
            b_apps_str,
            s_id
        ))
    else:
        c.execute("""
            INSERT INTO focus_sessions (
                id, user_id, workload_id, judul, mulai, selesai,
                target_menit, agent_connected, completed,
                focus_seconds, distraction_seconds, blocked_count, blocked_apps, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s_id,
            u_id,
            session_dict.get("workload_id"),
            session_dict.get("judul") or "Sesi Fokus Belajar",
            session_dict.get("mulai") or now_iso,
            session_dict.get("selesai"),
            session_dict.get("target_menit", 25),
            1 if session_dict.get("agent_connected") else 0,
            1 if session_dict.get("completed") else 0,
            session_dict.get("focus_seconds", 0),
            session_dict.get("distraction_seconds", 0),
            session_dict.get("blocked_count", 0),
            b_apps_str,
            now_iso
        ))
    conn.commit()

    c.execute("SELECT * FROM focus_sessions WHERE id = ?", (s_id,))
    saved_row = dict(c.fetchone())
    conn.close()

    try:
        saved_row["blocked_apps"] = json.loads(saved_row.get("blocked_apps") or "{}")
    except Exception:
        saved_row["blocked_apps"] = {}
    saved_row["completed"] = bool(saved_row.get("completed"))
    saved_row["agent_connected"] = bool(saved_row.get("agent_connected"))
    return saved_row

def local_get_active_session(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        SELECT * FROM focus_sessions
        WHERE user_id = ? AND completed = 0
        ORDER BY mulai DESC LIMIT 1
    """, (user_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["blocked_apps"] = json.loads(d.get("blocked_apps") or "{}")
    except Exception:
        d["blocked_apps"] = {}
    d["completed"] = bool(d.get("completed"))
    d["agent_connected"] = bool(d.get("agent_connected"))
    return d

def local_list_focus_sessions(user_id: str, limit: int = 50, since_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    if since_iso:
        c.execute("""
            SELECT * FROM focus_sessions
            WHERE user_id = ? AND mulai >= ?
            ORDER BY mulai DESC LIMIT ?
        """, (user_id, since_iso, limit))
    else:
        c.execute("""
            SELECT * FROM focus_sessions
            WHERE user_id = ?
            ORDER BY mulai DESC LIMIT ?
        """, (user_id, limit))
    rows = c.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        try:
            d["blocked_apps"] = json.loads(d.get("blocked_apps") or "{}")
        except Exception:
            d["blocked_apps"] = {}
        d["completed"] = bool(d.get("completed"))
        d["agent_connected"] = bool(d.get("agent_connected"))
        results.append(d)
    return results

# ==============================================================================
# CRUD HELPERS FOR PROFILES
# ==============================================================================

def local_save_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    u_id = profile_dict.get("user_id")
    now_iso = datetime.now(WIB).isoformat()

    c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (u_id,))
    existing_row = c.fetchone()
    existing = dict(existing_row) if existing_row else {}

    c.execute("SELECT * FROM users WHERE id = ?", (u_id,))
    u_row = c.fetchone()
    existing_user = dict(u_row) if u_row else {}

    # Whitelist & Blacklist (jaga agar tidak terhapus jika tidak dikirim)
    wl = profile_dict.get("focus_whitelist")
    bl = profile_dict.get("focus_blacklist")

    if wl is not None:
        wl_str = json.dumps(wl) if isinstance(wl, (list, dict)) else "[]"
    elif existing.get("focus_whitelist"):
        fw = existing["focus_whitelist"]
        wl_str = json.dumps(fw) if isinstance(fw, (list, dict)) else str(fw)
    else:
        wl_str = json.dumps([
            "elearning.ugm.ac.id", "docs.google.com", "notion.so",
            "github.com", "journal.ugm.ac.id", "wikipedia.org",
            "chatgpt.com", "canva.com"
        ])

    if bl is not None:
        bl_str = json.dumps(bl) if isinstance(bl, (list, dict)) else "[]"
    elif existing.get("focus_blacklist"):
        fb = existing["focus_blacklist"]
        bl_str = json.dumps(fb) if isinstance(fb, (list, dict)) else str(fb)
    else:
        bl_str = json.dumps(["Discord", "YouTube", "Instagram", "TikTok", "Steam"])

    # Avatar URL: hanya timpa jika dikirim secara eksplisit (non-None)
    if "avatar_url" in profile_dict and profile_dict["avatar_url"] is not None:
        avatar_url = profile_dict["avatar_url"]
    else:
        avatar_url = existing.get("avatar_url") or existing_user.get("avatar_url") or ""

    # Nama & Email
    if "nama" in profile_dict and profile_dict["nama"] is not None and str(profile_dict["nama"]).strip():
        nama = str(profile_dict["nama"]).strip()
    else:
        nama = existing.get("nama") or existing_user.get("nama") or "Mahasiswa"

    if "email" in profile_dict and profile_dict["email"] is not None and str(profile_dict["email"]).strip():
        email = str(profile_dict["email"]).strip()
    else:
        email = existing.get("email") or existing_user.get("email") or ""

    # Panggilan
    if "panggilan" in profile_dict and profile_dict["panggilan"] is not None and str(profile_dict["panggilan"]).strip():
        panggilan = str(profile_dict["panggilan"]).strip()
    elif existing.get("panggilan"):
        panggilan = existing["panggilan"]
    elif nama:
        panggilan = nama.split()[0]
    else:
        panggilan = "Mahasiswa"

    # Kampus, Jurusan, Semester
    if "kampus" in profile_dict and profile_dict["kampus"] is not None and str(profile_dict["kampus"]).strip():
        kampus = str(profile_dict["kampus"]).strip()
    else:
        kampus = existing.get("kampus") or "Universitas Gadjah Mada"

    if "jurusan" in profile_dict and profile_dict["jurusan"] is not None and str(profile_dict["jurusan"]).strip():
        jurusan = str(profile_dict["jurusan"]).strip()
    else:
        jurusan = existing.get("jurusan") or "Teknik Informatika"

    if "semester" in profile_dict and profile_dict["semester"] is not None:
        semester = int(profile_dict["semester"])
    else:
        semester = existing.get("semester") or 1

    # Ritme & Fokus
    jam_tidur = profile_dict.get("jam_tidur") or existing.get("jam_tidur") or "23:00"
    jam_bangun = profile_dict.get("jam_bangun") or existing.get("jam_bangun") or "06:00"
    kronotipe = profile_dict.get("kronotipe") or existing.get("kronotipe") or "pagi"
    target_fokus_jam = profile_dict.get("target_fokus_jam") or existing.get("target_fokus_jam") or 4.0
    agent_action = profile_dict.get("agent_action") or existing.get("agent_action") or "warn_then_close"

    if "onboarded" in profile_dict and profile_dict["onboarded"] is not None:
        onboarded = 1 if profile_dict["onboarded"] else 0
    else:
        onboarded = existing.get("onboarded", 1)

    # Sinkronkan juga ke tabel users lokal
    if existing_user:
        try:
            c.execute("UPDATE users SET nama = ?, email = ?, avatar_url = ? WHERE id = ?", (nama, email, avatar_url, u_id))
        except Exception:
            try:
                c.execute("UPDATE users SET nama = ?, email = ? WHERE id = ?", (nama, email, u_id))
            except Exception:
                pass
    else:
        try:
            c.execute("""
                INSERT INTO users (id, nama, email, avatar_url, consent_camera, consent_window, baseline_blink_rate, created_at)
                VALUES (?, ?, ?, ?, 1, 1, 15.0, ?)
            """, (u_id, nama, email or f"{u_id[:8]}@napas.local", avatar_url, now_iso))
        except Exception:
            try:
                c.execute("""
                    INSERT INTO users (id, nama, email, consent_camera, consent_window, baseline_blink_rate, created_at)
                    VALUES (?, ?, ?, 1, 1, 15.0, ?)
                """, (u_id, nama, email or f"{u_id[:8]}@napas.local", now_iso))
            except Exception:
                pass

    if existing_row:
        c.execute("""
            UPDATE user_profiles SET
                nama = ?, email = ?, panggilan = ?, kampus = ?, jurusan = ?, semester = ?,
                jam_tidur = ?, jam_bangun = ?, kronotipe = ?,
                target_fokus_jam = ?, focus_whitelist = ?, focus_blacklist = ?,
                agent_action = ?, avatar_url = ?, onboarded = ?
            WHERE user_id = ?
        """, (
            nama, email, panggilan, kampus, jurusan, semester,
            jam_tidur, jam_bangun, kronotipe,
            target_fokus_jam, wl_str, bl_str,
            agent_action, avatar_url, onboarded,
            u_id
        ))
    else:
        c.execute("""
            INSERT INTO user_profiles (
                user_id, nama, email, panggilan, kampus, jurusan, semester,
                jam_tidur, jam_bangun, kronotipe, target_fokus_jam,
                focus_whitelist, focus_blacklist, agent_action, avatar_url, onboarded, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            u_id, nama, email, panggilan, kampus, jurusan, semester,
            jam_tidur, jam_bangun, kronotipe, target_fokus_jam,
            wl_str, bl_str, agent_action, avatar_url, onboarded, now_iso
        ))
    conn.commit()

    c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (u_id,))
    row = dict(c.fetchone())
    conn.close()

    try:
        row["focus_whitelist"] = json.loads(row.get("focus_whitelist") or "[]")
    except Exception:
        row["focus_whitelist"] = []
    try:
        row["focus_blacklist"] = json.loads(row.get("focus_blacklist") or "[]")
    except Exception:
        row["focus_blacklist"] = []
    row["onboarded"] = bool(row.get("onboarded"))
    return row

def local_get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    u_row = c.fetchone()
    conn.close()

    if not row:
        if u_row:
            u_dict = dict(u_row)
            return {
                "user_id": user_id,
                "nama": u_dict.get("nama", "Mahasiswa"),
                "email": u_dict.get("email", ""),
                "panggilan": u_dict.get("nama", "Mahasiswa").split()[0],
                "avatar_url": u_dict.get("avatar_url", ""),
                "kampus": "Universitas Gadjah Mada",
                "jurusan": "Teknik Informatika",
                "semester": 1,
                "jam_tidur": "23:00",
                "jam_bangun": "06:00",
                "kronotipe": "pagi",
                "target_fokus_jam": 4.0,
                "focus_whitelist": [
                    "elearning.ugm.ac.id", "docs.google.com", "notion.so",
                    "github.com", "journal.ugm.ac.id", "wikipedia.org",
                    "chatgpt.com", "canva.com"
                ],
                "focus_blacklist": ["Discord", "YouTube", "Instagram", "TikTok", "Steam"],
                "agent_action": "warn_then_close",
                "onboarded": True
            }
        return None

    d = dict(row)
    if u_row:
        u_dict = dict(u_row)
        if not d.get("nama") and u_dict.get("nama"):
            d["nama"] = u_dict["nama"]
        if not d.get("email") and u_dict.get("email"):
            d["email"] = u_dict["email"]
        if not d.get("avatar_url") and u_dict.get("avatar_url"):
            d["avatar_url"] = u_dict["avatar_url"]

    try:
        d["focus_whitelist"] = json.loads(d.get("focus_whitelist") or "[]")
    except Exception:
        d["focus_whitelist"] = []
    try:
        d["focus_blacklist"] = json.loads(d.get("focus_blacklist") or "[]")
    except Exception:
        d["focus_blacklist"] = []
    d["onboarded"] = bool(d.get("onboarded"))
    return d

def local_save_workload_item(item_dict: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    w_id = item_dict.get("id") or str(uuid.uuid4())
    u_id = deterministic_uuid(item_dict["user_id"])
    now_iso = datetime.now(WIB).isoformat()

    c.execute("SELECT id FROM workload_items WHERE id = ?", (w_id,))
    exists = c.fetchone()

    if exists:
        c.execute("""
            UPDATE workload_items SET
                judul = ?, jenis = ?, deadline = ?, est_jam = ?, effort = ?,
                status = ?, google_event_id = ?, source = ?, mata_kuliah = ?
            WHERE id = ?
        """, (
            item_dict.get("judul", "Tugas"),
            item_dict.get("jenis", "tugas"),
            item_dict.get("deadline", now_iso),
            float(item_dict.get("est_jam") or 2.0),
            int(item_dict.get("effort") or 3),
            item_dict.get("status", "belum"),
            item_dict.get("google_event_id"),
            item_dict.get("source", "local"),
            item_dict.get("mata_kuliah"),
            w_id
        ))
    else:
        c.execute("""
            INSERT INTO workload_items (
                id, user_id, judul, jenis, deadline, est_jam, effort,
                status, google_event_id, source, mata_kuliah, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            w_id, u_id,
            item_dict.get("judul", "Tugas"),
            item_dict.get("jenis", "tugas"),
            item_dict.get("deadline", now_iso),
            float(item_dict.get("est_jam") or 2.0),
            int(item_dict.get("effort") or 3),
            item_dict.get("status", "belum"),
            item_dict.get("google_event_id"),
            item_dict.get("source", "local"),
            item_dict.get("mata_kuliah"),
            now_iso
        ))
    conn.commit()
    c.execute("SELECT * FROM workload_items WHERE id = ?", (w_id,))
    row = dict(c.fetchone())
    conn.close()
    return row

def local_list_workload_items(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    u_uuid = deterministic_uuid(user_id)
    if status:
        c.execute(
            "SELECT * FROM workload_items WHERE (user_id = ? OR user_id = ?) AND status = ? ORDER BY deadline ASC",
            (user_id, u_uuid, status)
        )
    else:
        c.execute(
            "SELECT * FROM workload_items WHERE (user_id = ? OR user_id = ?) ORDER BY deadline ASC",
            (user_id, u_uuid)
        )
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def local_update_workload_item(item_id: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM workload_items WHERE id = ?", (item_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None
    curr = dict(row)
    curr.update({k: v for k, v in patch.items() if v is not None})
    c.execute("""
        UPDATE workload_items SET
            judul = ?, jenis = ?, deadline = ?, est_jam = ?, effort = ?,
            status = ?, google_event_id = ?, source = ?, mata_kuliah = ?
        WHERE id = ?
    """, (
        curr.get("judul"), curr.get("jenis"), curr.get("deadline"),
        float(curr.get("est_jam") or 2.0), int(curr.get("effort") or 3), curr.get("status"),
        curr.get("google_event_id"), curr.get("source"), curr.get("mata_kuliah"),
        item_id
    ))
    conn.commit()
    c.execute("SELECT * FROM workload_items WHERE id = ?", (item_id,))
    updated = dict(c.fetchone())
    conn.close()
    return updated

def local_delete_workload_item(item_id: str) -> bool:
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM workload_items WHERE id = ?", (item_id,))
    deleted = c.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def local_bulk_sync_google_events(user_id: str, events: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    c = conn.cursor()
    u_uuid = deterministic_uuid(user_id)
    synced_count = 0
    now_iso = datetime.now(WIB).isoformat()

    for ev in events:
        g_id = ev.get("id") or ev.get("google_event_id")
        if not g_id:
            continue
        c.execute(
            "SELECT id FROM workload_items WHERE (user_id = ? OR user_id = ?) AND google_event_id = ?",
            (user_id, u_uuid, g_id)
        )
        existing = c.fetchone()
        judul = ev.get("summary") or ev.get("judul") or "Agenda Google"
        summary_lower = judul.lower()
        if any(k in summary_lower for k in ["kuliah", "praktikum", "asistensi", "kelas", "lab"]):
            jenis = "kuliah"
        elif any(k in summary_lower for k in ["rapat", "meeting", "diskusi", "tm "]):
            jenis = "rapat"
        elif any(k in summary_lower for k in ["uas", "uts", "kuis", "ujian", "evaluasi"]):
            jenis = "ujian"
        else:
            jenis = "tugas"

        deadline = ev.get("end") or ev.get("start") or ev.get("deadline") or now_iso
        effort = 4 if jenis in ["ujian"] else (3 if jenis in ["tugas"] else 2)
        est_jam = float(ev.get("est_jam") or 2.0)

        if existing:
            c.execute("""
                UPDATE workload_items SET
                    judul = ?, jenis = ?, deadline = ?, est_jam = ?, effort = ?,
                    source = 'google'
                WHERE id = ?
            """, (judul, jenis, deadline, est_jam, effort, existing[0]))
        else:
            new_id = str(uuid.uuid4())
            c.execute("""
                INSERT INTO workload_items (
                    id, user_id, judul, jenis, deadline, est_jam, effort,
                    status, google_event_id, source, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'belum', ?, 'google', ?)
            """, (new_id, u_uuid, judul, jenis, deadline, est_jam, effort, g_id, now_iso))
        synced_count += 1

    conn.commit()
    conn.close()
    return synced_count

def local_save_intervention(user_id: str, tipe: str, durasi: int = 60, selesai: bool = True) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    u_uuid = deterministic_uuid(user_id)
    new_id = str(uuid.uuid4())
    now_iso = datetime.now(WIB).isoformat()
    selesai_val = 1 if selesai else 0

    c.execute("""
        INSERT INTO interventions (id, user_id, tipe, durasi, selesai, ts, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (new_id, u_uuid, tipe, durasi, selesai_val, now_iso, now_iso))
    conn.commit()

    c.execute("SELECT * FROM interventions WHERE id = ?", (new_id,))
    row = dict(c.fetchone())
    row["selesai"] = bool(row["selesai"])
    conn.close()
    return row

def local_list_interventions(user_id: str, days: int = 7) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    u_uuid = deterministic_uuid(user_id)
    start_time = (datetime.now(WIB) - timedelta(days=days)).isoformat()

    c.execute("""
        SELECT * FROM interventions
        WHERE (user_id = ? OR user_id = ?) AND ts >= ?
        ORDER BY ts DESC
    """, (user_id, u_uuid, start_time))

    rows = []
    for r in c.fetchall():
        d = dict(r)
        d["selesai"] = bool(d["selesai"])
        rows.append(d)
    conn.close()
    return rows
