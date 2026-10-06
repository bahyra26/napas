"""
NAPAS Focus Agent (Windows Local Service)
Mendeteksi jendela aktif di laptop mahasiswa saat sesi fokus berjalan,
memberikan peringatan real-time ke Web Dashboard via WebSocket (ws://127.0.0.1:8765),
dan menutup / me-minimize tab atau aplikasi di luar whitelist belajar mahasiswa.

Arsitektur: Strict Whitelist (Default Deny)
- Tidak ada blacklist manual / keyword tebak-tebakan.
- Hanya website yang didaftarkan pada whitelist (berdasarkan Base Domain) yang diizinkan.
- Saat mahasiswa mendaftarkan URL (misal https://canva.com atau https://elearning.ugm.ac.id),
  seluruh halaman, sub-endpoint, parameter, dan modul di dalam base domain tersebut 100% bebas diakses.
- Bekerja 100% on-device & privacy-first.
"""

import sys
import os
import json
import time
import ctypes
import asyncio
import urllib.parse
import re
from typing import Optional, Set, Dict, Any

try:
    import websockets
except ImportError:
    print("[ERROR] websockets belum terinstall. Jalankan: pip install websockets")
    sys.exit(1)

try:
    import uiautomation as auto
    UIAUTOMATION_AVAILABLE = True
except Exception:
    UIAUTOMATION_AVAILABLE = False
    print("[WARN] uiautomation tidak tersedia, fallback ke window title matching.")

# Windows API constants & types
SW_MINIMIZE = 6
WM_CLOSE = 0x0010
VK_CONTROL = 0x11
VK_W = 0x57
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

def get_active_window_info() -> Dict[str, Any]:
    """Mengambil judul jendela aktif, PID, dan nama proses terkait."""
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return {"hwnd": 0, "title": "", "process": ""}

    length = user32.GetWindowTextLengthW(hwnd)
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    title = buff.value.strip()

    pid = ctypes.c_ulong()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

    process_name = ""
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    h_process = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if h_process:
        proc_buff = ctypes.create_unicode_buffer(1024)
        proc_size = ctypes.c_ulong(1024)
        if kernel32.QueryFullProcessImageNameW(h_process, 0, proc_buff, ctypes.byref(proc_size)):
            process_name = os.path.basename(proc_buff.value)
        kernel32.CloseHandle(h_process)

    return {
        "hwnd": hwnd,
        "title": title,
        "process": process_name
    }

def minimize_window(hwnd: int):
    """Me-minimize jendela tertentu."""
    if hwnd:
        user32.ShowWindow(hwnd, SW_MINIMIZE)

def force_foreground_window(hwnd: int) -> bool:
    """
    Memaksa jendela target menjadi foreground window di Windows,
    mengatasi proteksi Focus Stealing Prevention Windows dengan AttachThreadInput.
    """
    if not hwnd or not user32.IsWindow(hwnd):
        return False

    current_thread_id = kernel32.GetCurrentThreadId()
    foreground_hwnd = user32.GetForegroundWindow()
    foreground_thread_id = user32.GetWindowThreadProcessId(foreground_hwnd, None)

    attached = False
    if foreground_thread_id != current_thread_id:
        attached = bool(user32.AttachThreadInput(foreground_thread_id, current_thread_id, True))

    user32.ShowWindow(hwnd, 9)  # SW_RESTORE
    user32.SetForegroundWindow(hwnd)
    user32.BringWindowToTop(hwnd)

    if attached:
        user32.AttachThreadInput(foreground_thread_id, current_thread_id, False)

    return True

def find_and_focus_napas():
    """Mencari jendela browser yang membuka NAPAS Dashboard dan membawanya ke depan."""
    target_hwnd = None

    def enum_cb(hwnd, extra):
        nonlocal target_hwnd
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value.lower()
                if any(k in title for k in ["napas", "localhost:3000", "localhost:5173", "127.0.0.1", "kesehatan mental"]):
                    target_hwnd = hwnd
                    return False
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_int, ctypes.c_int)
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)

    if target_hwnd:
        return force_foreground_window(target_hwnd)
    return False

def close_window(hwnd: int, is_browser_tab: bool = False):
    """
    Menutup aplikasi jendela atau tab browser distraksi.
    Jika di browser, mengirim shortcut Ctrl+W untuk menutup tab aktif.
    Kemudian membawa jendela dashboard NAPAS kembali ke paling depan.
    """
    if not hwnd:
        return
    if is_browser_tab:
        user32.keybd_event(VK_CONTROL, 0, 0, 0)
        user32.keybd_event(VK_W, 0, 0, 0)
        time.sleep(0.06)
        user32.keybd_event(VK_W, 0, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
    else:
        user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)

    time.sleep(0.15)
    find_and_focus_napas()

def extract_base_domain(url_or_str: str) -> str:
    """
    Mengekstrak host/domain bersih dari URL atau string.
    Contoh:
    'https://www.canva.com/design/123/edit' -> 'canva.com'
    'canva.com' -> 'canva.com'
    'https://elearning.ugm.ac.id/mod/quiz' -> 'elearning.ugm.ac.id'
    'http://localhost:3000/fokus' -> 'localhost:3000'
    """
    if not url_or_str:
        return ""
    clean = url_or_str.strip().lower()
    if not clean.startswith("http://") and not clean.startswith("https://"):
        clean = "https://" + clean
    try:
        parsed = urllib.parse.urlparse(clean)
        netloc = parsed.netloc
        if ":" in netloc and "localhost" not in netloc:
            netloc = netloc.split(":")[0]
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.strip()
    except Exception:
        clean = re.sub(r"^https?://", "", url_or_str.lower().strip())
        clean = re.sub(r"^www\.", "", clean)
        return clean.split("/")[0].split("?")[0].strip()

ADDRESS_BAR_NAME_HINTS = ("address", "alamat", "location", "url", "omnibox", "search bar", "search or enter")

_url_cache: Dict[Any, Any] = {}

def looks_like_url(val: str) -> bool:
    """Validasi bahwa teks benar-benar URL/domain, bukan placeholder kolom pencarian."""
    if not val:
        return False
    v = val.strip().lower()
    if " " in v or len(v) < 4:
        return False
    if v.startswith(("http://", "https://", "localhost")):
        return True
    host = re.sub(r"^www\.", "", v).split("/")[0].split("?")[0].split(":")[0]
    # host harus berbentuk domain: label.label (tld huruf minimal 2)
    return bool(re.match(r"^[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$", host))

def _read_edit_value(edit) -> str:
    try:
        return (edit.GetValuePattern().Value or "").strip()
    except Exception:
        return ""

_last_uia_diag: Dict[str, str] = {"text": ""}

def get_browser_active_url(hwnd: int, title: str = "") -> Optional[str]:
    """
    Membaca URL tab aktif browser Chromium (Opera/Chrome/Edge/Brave) via UI Automation.

    Strategi:
    1. DocumentControl halaman (RootWebArea) — pada Chromium, ValuePattern-nya berisi URL
       tab aktif. Ini paling andal & kebal terhadap kolom pencarian di dalam halaman.
    2. Fallback: EditControl di toolbar (address bar) — isi halaman web tidak dijelajahi.

    Pencarian BFS (dangkal dulu), tab strip dilewati, berhenti begitu URL valid ditemukan.
    Hanya hasil SUKSES yang di-cache (hasil gagal selalu dicoba ulang di tick berikutnya,
    karena Chromium baru membangun pohon aksesibilitas setelah query pertama).
    """
    if not UIAUTOMATION_AVAILABLE or not hwnd:
        _last_uia_diag["text"] = "uia=unavailable"
        return None
    cache_key = (hwnd, title)
    cached = _url_cache.get(cache_key)
    if cached and time.time() - cached[1] < 30.0:
        return cached[0]

    result: Optional[str] = None
    n_docs = n_edits = visited = 0
    doc_samples = []
    try:
        root = auto.ControlFromHandle(hwnd)
        if root:
            CT = auto.ControlType
            skip_types = {CT.TabControl, CT.MenuBarControl, CT.TitleBarControl, CT.ScrollBarControl}
            queue = [(root, 0)]
            edits = []
            while queue and visited < 700 and result is None:
                ctrl, depth = queue.pop(0)
                if depth > 22:
                    continue
                try:
                    children = ctrl.GetChildren()
                except Exception:
                    continue
                for ch in children:
                    visited += 1
                    try:
                        ct = ch.ControlType
                    except Exception:
                        continue
                    if ct == CT.DocumentControl:
                        n_docs += 1
                        val = _read_edit_value(ch)
                        if len(doc_samples) < 2:
                            doc_samples.append(val[:60] or "<kosong>")
                        if looks_like_url(val):
                            result = val
                            break
                        continue  # jangan masuk ke isi halaman web
                    if ct == CT.EditControl:
                        n_edits += 1
                        edits.append(ch)
                        continue
                    if ct in skip_types:
                        continue
                    queue.append((ch, depth + 1))

            if result is None:
                def score(c):
                    name = (c.Name or "").lower()
                    return 0 if any(h in name for h in ADDRESS_BAR_NAME_HINTS) else 1
                for c in sorted(edits, key=score):
                    val = _read_edit_value(c)
                    if looks_like_url(val):
                        result = val
                        break
    except Exception as e:
        _last_uia_diag["text"] = f"uia-error={e}"
        return None

    _last_uia_diag["text"] = f"uia=docs:{n_docs} edits:{n_edits} nodes:{visited} docval={doc_samples}"
    if result:
        _url_cache[cache_key] = (result, time.time())
        if len(_url_cache) > 64:
            _url_cache.clear()
    return result

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "napas_agent.log")
_last_logged: Dict[str, Any] = {"key": None}

def log_decision(title: str, url: Optional[str], domain: str, verdict: str):
    """Catat keputusan agent ke napas_agent.log (hanya saat berubah) untuk diagnosa."""
    key = (title, verdict)
    if _last_logged["key"] == key:
        return
    _last_logged["key"] = key
    line = f"{time.strftime('%H:%M:%S')} | {verdict:<15} | url={url or '-'} | domain={domain or '-'} | title={title[:80]}"
    if not url:
        line += f" | {_last_uia_diag['text']}"
    print(f"[AGENT] {line}")
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

BASE_STUDY_APPS = {
    "code", "cursor", "visual studio", "devenv", "notepad", "sublime", "word", "winword",
    "excel", "powerpnt", "powerpoint", "acrobat", "foxit", "sumatra", "figma"
}

SYSTEM_SHELL_PROCS = {
    "explorer.exe", "shellexperiencehost.exe", "searchhost.exe", "taskmgr.exe",
    "lockapp.exe", "applicationframehost.exe", "systemsettings.exe"
}

NAPAS_PROJECT_IDENTIFIERS = {
    "napas", "localhost:3000", "localhost:5173", "127.0.0.1", "kesehatan mental", "ruang belajar"
}

TRANSITIONAL_BROWSER_TITLES = {
    "untitled", "new tab", "tab baru", "loading", "memuat", "about:blank",
    "opera", "google chrome", "microsoft edge", "brave", "firefox", "speed dial",
    "startpage", "opera://startpage"
}

class FocusAgentState:
    def __init__(self):
        self.is_active = False
        self.session_id: Optional[str] = None
        self.allowed_domains: Set[str] = set()
        self.allowed_tokens: Set[str] = set()
        self.action = "warn_then_close"  # 'warn_only', 'minimize', 'warn_then_close', 'close'
        self.focus_seconds = 0
        self.distraction_seconds = 0
        self.blocked_count = 0
        self.blocked_apps: Dict[str, int] = {}
        self.current_distraction_hwnd = 0
        self.distraction_start_time = 0.0
        self.active_study_site: Optional[str] = None
        self.study_grace_until: float = 0.0

    def start(self, session_id: str, whitelist=None, whitelist_keywords=None, action="warn_then_close"):
        self.is_active = True
        self.session_id = session_id
        self.allowed_domains = set()
        self.allowed_tokens = set()
        self.active_study_site = None
        self.study_grace_until = 0.0

        # Identifier NAPAS selalu aman
        for nid in NAPAS_PROJECT_IDENTIFIERS:
            self.allowed_tokens.add(nid)

        if whitelist:
            for w in whitelist:
                if not w:
                    continue
                dom = extract_base_domain(w)
                if dom:
                    self.allowed_domains.add(dom)
                    # Brand / sub-token (misal 'canva' dari 'canva.com', 'ugm' dari 'ugm.ac.id')
                    parts = dom.split(".")
                    for p in parts:
                        if len(p) >= 3 and p not in {"com", "net", "org", "edu", "id", "ac", "gov", "co", "io", "app"}:
                            self.allowed_tokens.add(p)

        if whitelist_keywords:
            for k in whitelist_keywords:
                if not k:
                    continue
                k_clean = k.lower().strip()
                # Hanya keyword berbentuk domain yang dipakai. Kata generik ("indonesia",
                # "learning", "google", ...) TIDAK dijadikan token judul agar tidak jadi celah.
                if "." in k_clean and " " not in k_clean and looks_like_url(k_clean):
                    dom = extract_base_domain(k_clean)
                    if dom:
                        self.allowed_domains.add(dom)

        self.action = action
        self.focus_seconds = 0
        self.distraction_seconds = 0
        self.blocked_count = 0
        self.blocked_apps = {}
        self.current_distraction_hwnd = 0
        self.distraction_start_time = 0.0
        print(f"[AGENT] Sesi fokus dimulai: {session_id} (action: {action})")
        print(f"[*] Base Domains Diizinkan: {list(self.allowed_domains)}")
        print(f"[*] Title Tokens Diizinkan: {list(self.allowed_tokens)}")
        try:
            with open(LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"\n===== {time.strftime('%Y-%m-%d %H:%M:%S')} SESI {session_id} =====\n")
                f.write(f"domains={sorted(self.allowed_domains)}\n")
                f.write(f"tokens={sorted(self.allowed_tokens)}\n")
        except Exception:
            pass

    def stop(self):
        self.is_active = False
        self.active_study_site = None
        self.study_grace_until = 0.0
        print(f"[AGENT] Sesi fokus selesai. Total fokus: {self.focus_seconds}s, distraksi: {self.distraction_seconds}s, diblokir: {self.blocked_count}x")


state = FocusAgentState()
connected_clients = set()

async def broadcast(message: dict):
    clients = list(connected_clients)
    if not clients:
        return
    raw = json.dumps(message)
    dead = set()
    for ws in clients:
        try:
            await ws.send(raw)
        except Exception:
            dead.add(ws)
    if dead:
        connected_clients.difference_update(dead)


async def focus_monitor_loop():
    """Loop pemantauan latar belakang setiap 1 detik saat sesi aktif."""
    while True:
        try:
            await asyncio.sleep(1.0)
            if not state.is_active:
                continue

            win = get_active_window_info()
            title_lower = win["title"].lower()
            proc_lower = win["process"].lower()
            hwnd = win["hwnd"]

            if not hwnd or not win["title"]:
                continue

            # 1. Dashboard project NAPAS selalu diizinkan
            is_napas = any(n in title_lower for n in NAPAS_PROJECT_IDENTIFIERS)

            # 2. OS Shell System (Explorer, Taskbar, Windows Settings)
            is_system_proc = any(sp in proc_lower for sp in SYSTEM_SHELL_PROCS)

            # 3. Software belajar/IDE bawaan (VS Code, Word, Acrobat, dll)
            is_study_app = any(app in proc_lower or app in title_lower for app in BASE_STUDY_APPS)

            is_browser = any(br in proc_lower for br in [
                "chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe", "launcher.exe"
            ])
            clean_title = win["title"].split(" - ")[0].strip()
            clean_title_lower = clean_title.lower()

            is_allowed = False
            detected_distraction_name = ""

            if is_napas or is_system_proc or is_study_app:
                is_allowed = True

            elif is_browser:
                # Cek grace period pembukaan situs belajar dari dashboard
                if time.time() < state.study_grace_until:
                    is_allowed = True
                else:
                    # Step A: Baca URL dari address bar browser (bukan kolom pencarian halaman)
                    active_url = get_browser_active_url(hwnd, win["title"])
                    active_domain = extract_base_domain(active_url) if active_url else ""

                    is_url_allowed = False
                    if active_domain:
                        for ad in state.allowed_domains:
                            if active_domain == ad or active_domain.endswith("." + ad):
                                is_url_allowed = True
                                break

                    # Step B: HANYA jika URL tidak terbaca -> fallback cek judul tab (nama merek domain)
                    is_title_allowed = False
                    if not active_domain:
                        for ad in state.allowed_domains:
                            if ad in title_lower:
                                is_title_allowed = True
                                break
                        if not is_title_allowed:
                            for tok in state.allowed_tokens:
                                if tok in title_lower:
                                    is_title_allowed = True
                                    break

                    # Step C: Tangani tab transisi ("New Tab", "Untitled", "Speed Dial")
                    is_transitional = (clean_title_lower in TRANSITIONAL_BROWSER_TITLES or len(clean_title) <= 2)

                    log_decision(win["title"], active_url, active_domain,
                                 "ALLOW-URL" if is_url_allowed else "ALLOW-TITLE" if is_title_allowed
                                 else "SKIP-TRANSITION" if is_transitional else "BLOCK")

                    if is_url_allowed or is_title_allowed:
                        is_allowed = True
                    elif is_transitional:
                        # Biarkan tab baru tanpa memicu false distraction
                        continue
                    else:
                        is_allowed = False
                        detected_distraction_name = active_domain or clean_title[:28] or "Tab Tidak Diizinkan"

            else:
                # Aplikasi desktop di luar BASE_STUDY_APPS (game, discord, spotify, launcher, dll)
                is_allowed = False
                detected_distraction_name = win["process"].replace(".exe", "").capitalize() or "Aplikasi Terlarang"

            if not is_allowed:
                state.distraction_seconds += 1
                app_display_name = detected_distraction_name or "Aplikasi Terlarang"
                state.blocked_apps[app_display_name] = state.blocked_apps.get(app_display_name, 0) + 1

                if state.action == "close":
                    state.blocked_count += 1
                    close_window(hwnd, is_browser_tab=is_browser)
                    await broadcast({
                        "type": "app_blocked",
                        "app": app_display_name,
                        "title": win["title"],
                        "action_taken": "closed",
                        "message": f"Tab/Aplikasi ({app_display_name}) ditutup dan otomatis kembali ke NAPAS!"
                    })
                elif state.action == "minimize":
                    state.blocked_count += 1
                    minimize_window(hwnd)
                    find_and_focus_napas()
                    await broadcast({
                        "type": "app_blocked",
                        "app": app_display_name,
                        "title": win["title"],
                        "action_taken": "minimized",
                        "message": f"Aplikasi ({app_display_name}) di-minimize. Otomatis beralih ke NAPAS!"
                    })
                elif state.action == "warn_then_close":
                    now_t = time.time()
                    if state.current_distraction_hwnd != hwnd:
                        state.current_distraction_hwnd = hwnd
                        state.distraction_start_time = now_t

                    elapsed = now_t - state.distraction_start_time
                    countdown = max(0, int(3 - elapsed))

                    await broadcast({
                        "type": "distraction_warning",
                        "app": app_display_name,
                        "title": win["title"],
                        "countdown": countdown,
                        "message": f"Peringatan: {app_display_name} di luar whitelist! Menutup & kembali ke project NAPAS dalam {countdown} detik."
                    })

                    if elapsed >= 3.0:
                        state.blocked_count += 1
                        close_window(hwnd, is_browser_tab=is_browser)
                        state.current_distraction_hwnd = 0
                        time.sleep(0.1)
                        find_and_focus_napas()
                        await broadcast({
                            "type": "app_blocked",
                            "app": app_display_name,
                            "title": win["title"],
                            "action_taken": "closed_after_timeout",
                            "message": f"{app_display_name} ditutup. Otomatis beralih kembali ke Ruang Belajar NAPAS! 🎯"
                        })
                else:  # warn_only
                    await broadcast({
                        "type": "distraction_warning",
                        "app": app_display_name,
                        "title": win["title"],
                        "countdown": 0,
                        "message": f"Kamu sedang membuka {app_display_name}. Yuk kembali fokus! 🎯"
                    })
            else:
                state.focus_seconds += 1
                state.current_distraction_hwnd = 0

            # Broadcast live status setiap siklus
            await broadcast({
                "type": "status",
                "active_window": win["title"] or win["process"] or "Desktop",
                "focus_seconds": state.focus_seconds,
                "distraction_seconds": state.distraction_seconds,
                "blocked_count": state.blocked_count,
                "is_active": state.is_active,
                "session_id": state.session_id
            })
        except Exception as e:
            print(f"[AGENT ERROR] Loop: {e}")
            await asyncio.sleep(1.0)


async def handler(websocket):
    connected_clients.add(websocket)
    print(f"[AGENT] Web Dashboard terhubung! Total client: {len(connected_clients)}")

    await websocket.send(json.dumps({
        "type": "agent_connected",
        "version": "2.0.0",
        "agent_running": True,
        "is_active": state.is_active,
        "focus_seconds": state.focus_seconds,
        "blocked_count": state.blocked_count
    }))

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "start_session":
                    state.start(
                        session_id=data.get("session_id", f"ses-{int(time.time())}"),
                        whitelist=data.get("whitelist"),
                        whitelist_keywords=data.get("whitelist_keywords"),
                        action=data.get("action", "warn_then_close")
                    )
                    await broadcast({
                        "type": "session_started",
                        "session_id": state.session_id,
                        "action": state.action
                    })

                elif msg_type == "set_study_site":
                    site = data.get("site")
                    keywords = data.get("keywords") or []
                    state.active_study_site = site
                    if site:
                        state.study_grace_until = time.time() + 15.0
                        for k in [site, *keywords]:
                            if not k:
                                continue
                            k_clean = k.lower().strip()
                            if " " not in k_clean and looks_like_url(k_clean):
                                d = extract_base_domain(k_clean)
                                if d:
                                    state.allowed_domains.add(d)
                        print(f"[AGENT] Website belajar aktif: {site} (grace period 15s)")
                    else:
                        state.study_grace_until = 0.0
                        print("[AGENT] Website belajar dinonaktifkan.")

                elif msg_type == "stop_session":
                    summary = {
                        "type": "session_stopped",
                        "session_id": state.session_id,
                        "focus_seconds": state.focus_seconds,
                        "distraction_seconds": state.distraction_seconds,
                        "blocked_count": state.blocked_count,
                        "blocked_apps": state.blocked_apps
                    }
                    state.stop()
                    await broadcast(summary)

                elif msg_type == "ping":
                    await websocket.send(json.dumps({"type": "pong", "time": time.time()}))

            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"[AGENT] Client disconnect: {e}")
    finally:
        connected_clients.discard(websocket)


def clear_port_8765():
    """Memastikan port 8765 bersih dari proses orphan sebelum mengikat socket."""
    try:
        import subprocess
        cmd = "Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
        subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, timeout=5)
        time.sleep(0.4)
    except Exception:
        pass

async def main():
    host = "127.0.0.1"
    port = 8765
    print("=" * 60)
    print("   NAPAS FOCUS AGENT v2 — Strict Whitelist Companion")
    print("=" * 60)

    clear_port_8765()

    print(f"[*] Berjalan di ws://{host}:{port}")
    print("[*] Menunggu instruksi sesi fokus dari Web Dashboard...")
    print("[*] Tekan Ctrl+C untuk menghentikan.")

    asyncio.create_task(focus_monitor_loop())

    async with websockets.serve(handler, host, port):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[AGENT] Dihentikan oleh pengguna.")
