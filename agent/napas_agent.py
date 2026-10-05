"""
NAPAS Focus Agent (Windows Local Service)
Mendeteksi jendela aktif di laptop mahasiswa saat sesi fokus berjalan,
memberikan peringatan real-time ke Web Dashboard via WebSocket (ws://127.0.0.1:8765),
dan menutup / me-minimize aplikasi distraksi sesuai preferensi mahasiswa.

Ethics & Privacy by Design:
- Hanya memeriksa judul jendela aktif & nama aplikasi (tidak merekam layar atau ketikan).
- Berjalan 100% on-device.
"""

import sys
import os
import json
import time
import ctypes
import asyncio
from typing import Optional, Set, Dict, Any

try:
    import websockets
except ImportError:
    print("[ERROR] websockets belum terinstall. Jalankan: pip install websockets")
    sys.exit(1)

# Windows API constants & types
SW_MINIMIZE = 6
WM_CLOSE = 0x0010
VK_CONTROL = 0x11
VK_W = 0x57
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

def get_active_window_info() -> Dict[str, str]:
    """Mengambil judul jendela aktif dan nama proses terkait."""
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return {"hwnd": 0, "title": "", "process": ""}

    # Ambil judul jendela
    length = user32.GetWindowTextLengthW(hwnd)
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    title = buff.value.strip()

    # Ambil Process ID
    pid = ctypes.c_ulong()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

    # Ambil Process Image Name
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

def close_window(hwnd: int, is_browser_tab: bool = False):
    """
    Menutup aplikasi jendela atau tab browser distraksi.
    Jika di browser, mengirim shortcut Ctrl+W untuk menutup tab aktif.
    """
    if not hwnd:
        return
    if is_browser_tab:
        # Kirim Ctrl+W untuk menutup tab aktif
        user32.keybd_event(VK_CONTROL, 0, 0, 0)
        user32.keybd_event(VK_W, 0, 0, 0)
        time.sleep(0.05)
        user32.keybd_event(VK_W, 0, KEYEVENTF_KEYUP, 0)
        user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
    else:
        user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)


class FocusAgentState:
    def __init__(self):
        self.is_active = False
        self.session_id: Optional[str] = None
        self.whitelist: Set[str] = {"code.exe", "notion", "docs.google", "word", "figma", "cursor"}
        self.blacklist: Set[str] = {"discord", "youtube", "instagram", "tiktok", "steam", "mobile legends", "netflix", "twitter", "x.com"}
        self.action = "warn_then_close"  # 'warn_only', 'minimize', 'warn_then_close', 'close'
        self.focus_seconds = 0
        self.distraction_seconds = 0
        self.blocked_count = 0
        self.blocked_apps: Dict[str, int] = {}
        self.current_distraction_hwnd = 0
        self.distraction_start_time = 0.0

    def start(self, session_id: str, whitelist=None, blacklist=None, action="warn_then_close"):
        self.is_active = True
        self.session_id = session_id
        if whitelist:
            self.whitelist = {w.lower().strip() for w in whitelist if w}
        if blacklist:
            self.blacklist = {b.lower().strip() for b in blacklist if b}
        self.action = action
        self.focus_seconds = 0
        self.distraction_seconds = 0
        self.blocked_count = 0
        self.blocked_apps = {}
        self.current_distraction_hwnd = 0
        self.distraction_start_time = 0.0
        print(f"[AGENT] Sesi fokus dimulai: {session_id} (action: {action})")

    def stop(self):
        self.is_active = False
        print(f"[AGENT] Sesi fokus selesai. Total fokus: {self.focus_seconds}s, distraksi: {self.distraction_seconds}s, diblokir: {self.blocked_count}x")


state = FocusAgentState()
connected_clients = set()

async def broadcast(message: dict):
    if not connected_clients:
        return
    raw = json.dumps(message)
    dead = set()
    for ws in connected_clients:
        try:
            await ws.send(raw)
        except Exception:
            dead.add(ws)
    connected_clients.difference_update(dead)


async def focus_monitor_loop():
    """Loop pemantauan latar belakang setiap 1 detik saat sesi aktif."""
    while True:
        await asyncio.sleep(1.0)
        if not state.is_active:
            continue

        win = get_active_window_info()
        title_lower = win["title"].lower()
        proc_lower = win["process"].lower()
        hwnd = win["hwnd"]

        # Cek apakah judul / proses masuk whitelist kerja
        is_whitelisted = any(w in title_lower or w in proc_lower for w in state.whitelist)

        # Cek apakah masuk blacklist distraksi
        matched_distraction = None
        if not is_whitelisted:
            for b in state.blacklist:
                if b in title_lower or b in proc_lower:
                    matched_distraction = b
                    break

        if matched_distraction:
            state.distraction_seconds += 1
            is_browser = any(br in proc_lower for br in ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe"])

            # Catat statistik aplikasi diblokir
            app_display_name = matched_distraction.capitalize()
            state.blocked_apps[app_display_name] = state.blocked_apps.get(app_display_name, 0) + 1

            if state.action == "close":
                state.blocked_count += 1
                close_window(hwnd, is_browser_tab=is_browser)
                await broadcast({
                    "type": "app_blocked",
                    "app": app_display_name,
                    "title": win["title"],
                    "action_taken": "closed",
                    "message": f"Aplikasi distraksi ({app_display_name}) otomatis ditutup untuk menjaga fokusmu."
                })
            elif state.action == "minimize":
                state.blocked_count += 1
                minimize_window(hwnd)
                await broadcast({
                    "type": "app_blocked",
                    "app": app_display_name,
                    "title": win["title"],
                    "action_taken": "minimized",
                    "message": f"Aplikasi distraksi ({app_display_name}) di-minimize."
                })
            elif state.action == "warn_then_close":
                now_t = time.time()
                if state.current_distraction_hwnd != hwnd:
                    state.current_distraction_hwnd = hwnd
                    state.distraction_start_time = now_t

                elapsed = now_t - state.distraction_start_time
                countdown = max(0, int(8 - elapsed))

                await broadcast({
                    "type": "distraction_warning",
                    "app": app_display_name,
                    "title": win["title"],
                    "countdown": countdown,
                    "message": f"Peringatan: {app_display_name} terbuka! Akan ditutup dalam {countdown}s."
                })

                if elapsed >= 8.0:
                    state.blocked_count += 1
                    close_window(hwnd, is_browser_tab=is_browser)
                    state.current_distraction_hwnd = 0
                    await broadcast({
                        "type": "app_blocked",
                        "app": app_display_name,
                        "title": win["title"],
                        "action_taken": "closed_after_timeout",
                        "message": f"{app_display_name} ditutup setelah peringatan diabaikan."
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


async def handler(websocket):
    connected_clients.add(websocket)
    print(f"[AGENT] Web Dashboard terhubung! Total client: {len(connected_clients)}")

    # Kirim status koneksi awal
    await websocket.send(json.dumps({
        "type": "agent_connected",
        "version": "1.0.0",
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
                        blacklist=data.get("blacklist"),
                        action=data.get("action", "warn_then_close")
                    )
                    await broadcast({
                        "type": "session_started",
                        "session_id": state.session_id,
                        "action": state.action
                    })

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


async def main():
    host = "127.0.0.1"
    port = 8765
    print("=" * 60)
    print("   NAPAS FOCUS AGENT — Privacy-First Desktop Companion")
    print("=" * 60)
    print(f"[*] Berjalan di ws://{host}:{port}")
    print("[*] Menunggu instruksi sesi fokus dari Web Dashboard...")
    print("[*] Tekan Ctrl+C untuk menghentikan.")

    asyncio.create_task(focus_monitor_loop())

    async with websockets.serve(handler, host, port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[AGENT] Dihentikan oleh pengguna.")
