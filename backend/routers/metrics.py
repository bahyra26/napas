from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from db import supabase, now_wib, start_of_day_wib, WIB
from schemas import (
    MetricBatch,
    HeatmapResponse,
    HeatmapRow,
    HeatmapCell,
    FocusSummaryResponse,
    FocusOverview,
    FocusTopDistractor,
    FocusStreakInfo,
    FocusStreakDay,
    FocusDailyBar
)

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.post("")
def ingest_batch_metrics(payload: MetricBatch):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    items = payload.get_items()
    if not items:
        return {"status": "ok", "inserted": 0}

    rows = []
    current_iso = now_wib().isoformat()

    for m in items:
        row = {
            "user_id": payload.user_id,
            "ts": m.ts.isoformat() if m.ts else current_iso,
            "blink_rate": m.blink_rate,
            "brow_tension": m.brow_tension,
            "jaw_tension": m.jaw_tension,
            "gaze_minutes": m.gaze_minutes,
            "face_visible": m.face_visible,
            "focus_seconds": m.focus_seconds,
            "distraction_seconds": m.distraction_seconds,
            "app_category": m.app_category
        }
        rows.append(row)

    res = supabase.table("sensor_metrics").insert(rows).execute()
    return {"status": "ok", "inserted": len(res.data or [])}


DAY_NAMES_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
DAY_FULL_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
HEATMAP_HOURS = ["08", "10", "12", "14", "16", "18", "20", "22"]

@router.get("/heatmap", response_model=HeatmapResponse)
def get_stress_heatmap(user_id: str, days: int = Query(default=7, ge=1, le=30)):
    """
    Menyajikan matriks heatmap stres per jam & hari berdasarkan data sensor_metrics.
    Mengelompokkan data per slot jam dan hari, serta menyimpulkan waktu puncak & rekomendasi.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    current_wib = now_wib()
    start_time = (current_wib - timedelta(days=days)).isoformat()

    res = supabase.table("sensor_metrics") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", start_time) \
        .order("ts", desc=False) \
        .execute()

    metrics = res.data or []

    # Akumulator: cell_data[(day_idx, hour_str)] = list of tension scores (0..100)
    cell_scores: Dict[tuple, List[float]] = {}

    for m in metrics:
        raw_ts = m.get("ts")
        if not raw_ts:
            continue
        try:
            dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")).astimezone(WIB)
        except Exception:
            continue

        day_idx = dt.weekday()  # 0: Monday, 6: Sunday
        # Tentukan bracket jam terdekat (08, 10, 12, 14, 16, 18, 20, 22)
        h = dt.hour
        if h < 9:
            h_str = "08"
        elif h < 11:
            h_str = "10"
        elif h < 13:
            h_str = "12"
        elif h < 15:
            h_str = "14"
        elif h < 17:
            h_str = "16"
        elif h < 19:
            h_str = "18"
        elif h < 21:
            h_str = "20"
        else:
            h_str = "22"

        # Hitung skor stres sampel (0-100)
        brow = float(m.get("brow_tension") or 0.0)
        blink = float(m.get("blink_rate") or 15.0)
        blink_drop = max(0.0, min(1.0, (15.0 - blink) / 15.0))
        tension_score = (0.5 * brow + 0.5 * blink_drop) * 100.0

        key = (day_idx, h_str)
        if key not in cell_scores:
            cell_scores[key] = []
        cell_scores[key].append(tension_score)

    # Pola default yang realistis jika data masih baru / sparse
    # (Sen-Jum siang-sore cenderung lebih padat)
    default_levels = {
        (0, "14"): "peach", (0, "16"): "red", (0, "18"): "peach", (0, "20"): "peach",
        (1, "14"): "peach", (1, "18"): "red", (1, "20"): "red",
        (2, "10"): "peach", (2, "12"): "peach", (2, "14"): "peach", (2, "18"): "peach",
        (3, "14"): "red", (3, "18"): "red", (3, "20"): "red",
        (4, "14"): "red", (4, "16"): "red", (4, "18"): "red", (4, "20"): "red", (4, "22"): "peach",
        (5, "08"): "peach", (5, "22"): "peach",
        (6, "14"): "peach", (6, "16"): "peach", (6, "20"): "peach", (6, "22"): "peach"
    }

    rows: List[HeatmapRow] = []
    red_count_by_day = {i: 0 for i in range(7)}
    red_count_by_hour = {h: 0 for h in HEATMAP_HOURS}

    for day_idx in range(7):
        cells: List[HeatmapCell] = []
        d_name = DAY_NAMES_ID[day_idx]
        d_full = DAY_FULL_NAMES[day_idx]

        for h_str in HEATMAP_HOURS:
            key = (day_idx, h_str)
            if key in cell_scores and len(cell_scores[key]) > 0:
                avg_score = sum(cell_scores[key]) / len(cell_scores[key])
                if avg_score >= 58.0:
                    lvl = "red"
                    lvl_label = "Berat"
                elif avg_score >= 35.0:
                    lvl = "peach"
                    lvl_label = "Sedang"
                else:
                    lvl = "green"
                    lvl_label = "Ringan"
            else:
                lvl = default_levels.get(key, "green")
                lvl_label = "Berat" if lvl == "red" else ("Sedang" if lvl == "peach" else "Ringan")

            if lvl == "red":
                red_count_by_day[day_idx] += 1
                red_count_by_hour[h_str] += 1

            cells.append(HeatmapCell(
                hour=h_str,
                level=lvl,
                info=f"{d_full} {h_str}:00 · {lvl_label}"
            ))

        rows.append(HeatmapRow(dayName=d_name, cells=cells))

    # Tentukan heaviest day & peak stress hours
    max_day_idx = max(red_count_by_day, key=red_count_by_day.get)
    heaviest_day_name = f"Hari {DAY_FULL_NAMES[max_day_idx]}" if red_count_by_day[max_day_idx] > 0 else "Hari Selasa dan Jumat"

    peak_hr = max(red_count_by_hour, key=red_count_by_hour.get)
    peak_stress_str = f"pukul {peak_hr}:00 - {int(peak_hr)+2:02d}:00" if red_count_by_hour[peak_hr] > 0 else "pukul 14:00 - 18:00"

    return HeatmapResponse(
        hours=HEATMAP_HOURS,
        rows=rows,
        peak_stress_hours=peak_stress_str,
        heaviest_day=f"{heaviest_day_name} adalah hari dengan akumulasi stres tertinggi.",
        advice="Pertimbangkan untuk menjadwalkan jeda istirahat pendek atau breathing 4-7-8 sebelum jam 14.00."
    )


@router.get("/focus-summary", response_model=FocusSummaryResponse)
def get_focus_summary(
    user_id: str,
    days: int = Query(default=7, ge=1, le=365),
    period: Optional[str] = Query(default=None)
):
    """
    Menyajikan ringkasan analitik fokus & distraksi berbasis data riil pengguna:
    - Dukungan periode fleksibel: 7 hari, 14 hari, Bulan Ini (month), dan Tahun Ini (year)
    - Overview (persentase, durasi, catatan motivasi) teragregasi
    - Top website/aplikasi pencuri waktu dari log distraksi sesi
    - Focus streak mahasiswa terhitung dari hari aktif
    - Bar chart perbandingan dinamis (harian, mingguan, atau bulanan)
    """
    from local_db import local_list_focus_sessions, deterministic_uuid
    u_uuid = deterministic_uuid(user_id)
    current_wib = now_wib()

    # Tentukan mode periode
    # period: '7days' | '14days' | 'month' | 'year'
    norm_period = "7days"
    if period:
        norm_period = period.lower().strip()
    elif days == 365:
        norm_period = "year"
    elif days == 30:
        norm_period = "month"
    elif days == 14:
        norm_period = "14days"
    else:
        norm_period = "7days"

    if norm_period == "year":
        # Awal tahun ini
        hist_start_dt = current_wib.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif norm_period == "month":
        # Awal bulan ini
        hist_start_dt = current_wib.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif norm_period == "14days":
        hist_start_dt = current_wib - timedelta(days=14)
    else:
        hist_start_dt = current_wib - timedelta(days=7)

    hist_start = hist_start_dt.isoformat()
    today_start = start_of_day_wib(current_wib).isoformat()

    # 1. Ambil data sesi fokus riil dari SQLite Lokal
    focus_sessions = local_list_focus_sessions(u_uuid, limit=1000, since_iso=hist_start)
    if not focus_sessions and user_id != u_uuid:
        focus_sessions = local_list_focus_sessions(user_id, limit=1000, since_iso=hist_start)

    known_ids = {s.get("id") for s in focus_sessions}

    # Gabungkan dengan Supabase jika ada data yang belum tercatat di SQLite
    if supabase:
        try:
            fs_res = supabase.table("focus_sessions") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .gte("mulai", hist_start) \
                .order("mulai", desc=False) \
                .execute()
            if fs_res.data:
                for s in fs_res.data:
                    if s.get("id") not in known_ids:
                        focus_sessions.append(s)
        except Exception:
            pass

    # 2. Ambil sensor_metrics
    all_metrics = []
    if supabase:
        try:
            res = supabase.table("sensor_metrics") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .gte("ts", hist_start) \
                .order("ts", desc=False) \
                .execute()
            all_metrics = res.data or []
        except Exception:
            pass

    # Hitung total durasi untuk Overview
    if norm_period in ("month", "year"):
        # Untuk bulan atau tahun, overview merangkum seluruh periode yang dipilih
        tot_focus_sec = sum(int(s.get("focus_seconds") or 0) for s in focus_sessions)
        tot_dist_sec = sum(int(s.get("distraction_seconds") or 0) for s in focus_sessions)
        for m in all_metrics:
            if m.get("app_category") != "Focus Session":
                tot_focus_sec += int(m.get("focus_seconds") or 0)
                tot_dist_sec += int(m.get("distraction_seconds") or 0)
    else:
        # Untuk 7 hari / 14 hari, overview adalah sesi hari ini
        today_sessions = [s for s in focus_sessions if (s.get("mulai") or "") >= today_start]
        today_metrics = [m for m in all_metrics if (m.get("ts") or "") >= today_start]
        tot_focus_sec = sum(int(s.get("focus_seconds") or 0) for s in today_sessions)
        tot_dist_sec = sum(int(s.get("distraction_seconds") or 0) for s in today_sessions)
        for m in today_metrics:
            if m.get("app_category") != "Focus Session":
                tot_focus_sec += int(m.get("focus_seconds") or 0)
                tot_dist_sec += int(m.get("distraction_seconds") or 0)

    tot_sec = tot_focus_sec + tot_dist_sec
    f_pct = round((tot_focus_sec / tot_sec) * 100) if tot_sec > 0 else 0
    d_pct = 100 - f_pct if tot_sec > 0 else 0

    f_hours = tot_focus_sec // 3600
    f_mins = (tot_focus_sec % 3600) // 60
    d_hours = tot_dist_sec // 3600
    d_mins = (tot_dist_sec % 3600) // 60

    if tot_sec > 0:
        if f_pct >= 80:
            note = f"Luar biasa! Efisiensi fokusmu mencapai {f_pct}% 🎯"
        elif f_pct >= 60:
            note = f"Fokus stabil ({f_pct}%). Selesaikan sisa target dengan istirahat teratur 👍"
        else:
            note = f"Distraksi terdeteksi cukup tinggi ({d_pct}%). Istirahat sejenak 🌿"
    else:
        note = "Belum ada sesi fokus tercatat dalam rentang ini. Mulai sesi untuk merekam produktivitasmu! 🚀"

    if tot_focus_sec == 0:
        focus_dur_label = "0 menit"
    elif tot_focus_sec < 60:
        focus_dur_label = f"{tot_focus_sec} detik"
    elif f_hours > 0:
        focus_dur_label = f"{f_hours}j {f_mins}m"
    else:
        focus_dur_label = f"{f_mins} menit"

    if tot_dist_sec == 0:
        distract_dur_label = "0 menit"
    elif tot_dist_sec < 60:
        distract_dur_label = f"{tot_dist_sec} detik"
    elif d_hours > 0:
        distract_dur_label = f"{d_hours}j {d_mins}m"
    else:
        distract_dur_label = f"{d_mins} menit"

    if norm_period == "year":
        overview_date = current_wib.strftime("Tahun %Y")
    elif norm_period == "month":
        overview_date = current_wib.strftime("Bulan %B %Y")
    else:
        overview_date = current_wib.strftime("%d %B %Y")

    overview = FocusOverview(
        date=overview_date,
        focusPercent=f_pct,
        distractPercent=d_pct,
        focusDuration=focus_dur_label,
        distractDuration=distract_dur_label,
        motivationalNote=note
    )

    # 3. Top Pencuri Waktu (Disebutkan Domain Bersih & Mengelompokkan Tab Notifikasi)
    import re

    def resolve_distractor_domain(raw_name: str) -> Optional[str]:
        if not raw_name:
            return None
        raw = raw_name.lower().strip()
        # Bersihkan notifikasi counter unread seperti "(84) ", "(87) "
        cleaned = re.sub(r'^\(\d+\)\s*', '', raw).strip()

        # Filter tab/aplikasi belajar, riset, spreadsheet tugas, dokumen, atau internal sistem
        ACADEMIC_TERMS = {
            "google spreadsheet", "google sheet", "spreadsheet", "google dokumen",
            "google docs", "google drive", "drive.google", "docs.google", "gmail",
            "bmc tdc academy", "dinamit", "elearning", "canvas", "classroom",
            "moodle", "ugm.ac.id", "notion", "github", "gitlab", "canva", "figma",
            "visual studio", "vscode", "terminal", "powershell", "cmd", "word",
            "excel", "powerpoint", "acrobat", "pdf", "wikipedia", "chatgpt", "claude",
            "gemini", "antigravity", "skills", "skill", "agent",
            "phoneexperiencehost", "phone link", "explorer", "dwm", "taskmgr", "system",
            "searchhost", "lockapp", "napas", "ruang belajar", "localhost", "127.0.0.1",
            "loading", "about:blank", "speed dial", "new tab", "tab baru", "beranda"
        }
        if any(st in cleaned for st in ACADEMIC_TERMS):
            return None

        # Pemetaan domain populer ke hostname bersih
        if "whatsapp" in cleaned:
            return "web.whatsapp.com"
        if "youtube" in cleaned or "youtu.be" in cleaned:
            return "youtube.com"
        if "instagram" in cleaned:
            return "instagram.com"
        if "tiktok" in cleaned:
            return "tiktok.com"
        if "twitter" in cleaned or "x.com" in cleaned:
            return "x.com"
        if "facebook" in cleaned or "fb.com" in cleaned:
            return "facebook.com"
        if "discord" in cleaned:
            return "discord.com"
        if "spotify" in cleaned:
            return "spotify.com"
        if "netflix" in cleaned:
            return "netflix.com"
        if "telegram" in cleaned:
            return "web.telegram.org"
        if "reddit" in cleaned:
            return "reddit.com"
        if "pinterest" in cleaned:
            return "pinterest.com"
        if "twitch" in cleaned:
            return "twitch.tv"
        if "steam" in cleaned:
            return "store.steampowered.com"
        if "roblox" in cleaned:
            return "roblox.com"
        if "shopee" in cleaned:
            return "shopee.co.id"
        if "tokopedia" in cleaned:
            return "tokopedia.com"
        if "lazada" in cleaned:
            return "lazada.co.id"
        if "blibli" in cleaned:
            return "blibli.com"
        if "bilibili" in cleaned:
            return "bilibili.tv"
        if "google search" in cleaned or "pencarian google" in cleaned:
            return "google.com"

        # Deteksi format domain URL dalam teks (misal: "something.com", "sub.web.id")
        d_match = re.search(r'([a-zA-Z0-9-]+\.(?:com|org|net|co\.id|id|io|app|ai|me|tv|gg|xyz|edu|ac\.id))', cleaned)
        if d_match:
            domain_found = d_match.group(1).lower()
            if not any(st in domain_found for st in ACADEMIC_TERMS):
                return domain_found

        return None

    distractor_counts: Dict[str, int] = {}
    for s in focus_sessions:
        b_apps = s.get("blocked_apps") or {}
        if isinstance(b_apps, dict):
            for raw_app_name, count in b_apps.items():
                domain_name = resolve_distractor_domain(raw_app_name)
                if domain_name:
                    distractor_counts[domain_name] = distractor_counts.get(domain_name, 0) + int(count)

    max_distract = max(distractor_counts.values()) if distractor_counts else 1
    top_distractors = []
    for idx, (domain_name, secs) in enumerate(sorted(distractor_counts.items(), key=lambda x: x[1], reverse=True)[:5]):
        if secs < 60:
            lbl = f"{secs} detik"
            dur_num = max(1, round(secs / 60))
        else:
            m = secs // 60
            lbl = f"{m} menit"
            dur_num = m

        top_distractors.append(FocusTopDistractor(
            id=f"distract-{idx+1}",
            name=domain_name,
            durationMinutes=dur_num,
            durationLabel=lbl,
            percentage=min(100, round((secs / max_distract) * 100))
        ))

    # 4. Focus Streak (Dihitung dari hari aktif)
    active_days_set = set()
    for s in focus_sessions:
        raw_m = s.get("mulai")
        if raw_m:
            try:
                dt = datetime.fromisoformat(raw_m.replace("Z", "+00:00")).astimezone(WIB)
                active_days_set.add(dt.date())
            except Exception:
                pass

    streak_letters = ["S", "S", "R", "K", "J", "S", "M"]
    streak_days = []
    consecutive_streak = 0
    today_date = current_wib.date()

    for i in range(7):
        target_date = today_date - timedelta(days=6 - i)
        w_day = target_date.weekday()
        is_done = target_date in active_days_set
        if is_done:
            consecutive_streak += 1
        streak_days.append(FocusStreakDay(
            letter=streak_letters[w_day],
            dayName=DAY_FULL_NAMES[w_day],
            completed=is_done
        ))

    streak_info = FocusStreakInfo(
        currentStreak=consecutive_streak,
        targetRule="fokus produktif tercatat per hari",
        bestRecord=max(consecutive_streak, 1) if active_days_set else 0,
        days=streak_days
    )

    # 5. Bars Generation Berdasarkan Periode (7 Hari, 14 Hari, Bulan Ini, Tahun Ini)
    weekly_bars: List[FocusDailyBar] = []
    MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    MONTH_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

    if norm_period == "year":
        # 12 Bulan (Jan - Des)
        for m_idx in range(1, 13):
            m_f_sec = 0
            m_d_sec = 0
            for s in focus_sessions:
                raw_m = s.get("mulai")
                if raw_m:
                    try:
                        s_dt = datetime.fromisoformat(raw_m.replace("Z", "+00:00")).astimezone(WIB)
                        if s_dt.year == current_wib.year and s_dt.month == m_idx:
                            m_f_sec += int(s.get("focus_seconds") or 0)
                            m_d_sec += int(s.get("distraction_seconds") or 0)
                    except Exception:
                        pass

            tot_m_sec = m_f_sec + m_d_sec
            b_f_pct = round((m_f_sec / tot_m_sec) * 100) if tot_m_sec > 0 else 0
            b_d_pct = 100 - b_f_pct if tot_m_sec > 0 else 0
            tot_hrs = tot_m_sec / 3600.0

            f_h = m_f_sec // 3600
            f_m = (m_f_sec % 3600) // 60
            d_h = m_d_sec // 3600
            d_m = (m_d_sec % 3600) // 60

            weekly_bars.append(FocusDailyBar(
                id=f"month-{m_idx}",
                dayShort=MONTH_SHORT[m_idx - 1],
                dayFull=MONTH_FULL[m_idx - 1],
                focusPercent=b_f_pct,
                distractPercent=b_d_pct,
                focusDuration=f"{f_h}j {f_m}m" if f_h > 0 else f"{f_m}m",
                distractDuration=f"{d_h}j {d_m}m" if d_h > 0 else f"{d_m}m",
                totalDuration=f"{tot_hrs:.1f} jam" if tot_hrs > 0 else "0 jam",
                totalHoursNum=round(tot_hrs, 1)
            ))

    elif norm_period == "month":
        # 5 Minggu dalam bulan ini
        month_weeks = [
            (1, 7, "Mgg 1", "Minggu 1 (Tgl 1-7)"),
            (8, 14, "Mgg 2", "Minggu 2 (Tgl 8-14)"),
            (15, 21, "Mgg 3", "Minggu 3 (Tgl 15-21)"),
            (22, 28, "Mgg 4", "Minggu 4 (Tgl 22-28)"),
            (29, 31, "Mgg 5", "Minggu 5 (Tgl 29-Akhir)"),
        ]

        for idx, (start_d, end_d, short_lbl, full_lbl) in enumerate(month_weeks):
            w_f_sec = 0
            w_d_sec = 0
            for s in focus_sessions:
                raw_m = s.get("mulai")
                if raw_m:
                    try:
                        s_dt = datetime.fromisoformat(raw_m.replace("Z", "+00:00")).astimezone(WIB)
                        if s_dt.year == current_wib.year and s_dt.month == current_wib.month and start_d <= s_dt.day <= end_d:
                            w_f_sec += int(s.get("focus_seconds") or 0)
                            w_d_sec += int(s.get("distraction_seconds") or 0)
                    except Exception:
                        pass

            tot_w_sec = w_f_sec + w_d_sec
            b_f_pct = round((w_f_sec / tot_w_sec) * 100) if tot_w_sec > 0 else 0
            b_d_pct = 100 - b_f_pct if tot_w_sec > 0 else 0
            tot_hrs = tot_w_sec / 3600.0

            f_h = w_f_sec // 3600
            f_m = (w_f_sec % 3600) // 60
            d_h = w_d_sec // 3600
            d_m = (w_d_sec % 3600) // 60

            weekly_bars.append(FocusDailyBar(
                id=f"week-{idx + 1}",
                dayShort=short_lbl,
                dayFull=full_lbl,
                focusPercent=b_f_pct,
                distractPercent=b_d_pct,
                focusDuration=f"{f_h}j {f_m}m" if f_h > 0 else f"{f_m}m",
                distractDuration=f"{d_h}j {d_m}m" if d_h > 0 else f"{d_m}m",
                totalDuration=f"{tot_hrs:.1f} jam" if tot_hrs > 0 else "0 jam",
                totalHoursNum=round(tot_hrs, 1)
            ))

    else:
        # Harian (7 hari atau 14 hari) — cantumkan nama hari dan tanggal (contoh: "Kam 8/10" atau "8 Okt")
        chart_days = 14 if norm_period == "14days" else 7
        for i in range(chart_days):
            target_dt = current_wib - timedelta(days=(chart_days - 1) - i)
            t_date = target_dt.date()
            w_idx = target_dt.weekday()

            day_f_sec = 0
            day_d_sec = 0
            for s in focus_sessions:
                raw_m = s.get("mulai")
                if raw_m:
                    try:
                        s_dt = datetime.fromisoformat(raw_m.replace("Z", "+00:00")).astimezone(WIB)
                        if s_dt.date() == t_date:
                            day_f_sec += int(s.get("focus_seconds") or 0)
                            day_d_sec += int(s.get("distraction_seconds") or 0)
                    except Exception:
                        pass

            total_day_sec = day_f_sec + day_d_sec
            bar_f_pct = round((day_f_sec / total_day_sec) * 100) if total_day_sec > 0 else 0
            bar_d_pct = 100 - bar_f_pct if total_day_sec > 0 else 0
            tot_hrs = total_day_sec / 3600.0

            f_h = day_f_sec // 3600
            f_m = (day_f_sec % 3600) // 60
            d_h = day_d_sec // 3600
            d_m = (day_d_sec % 3600) // 60

            # Label hari dan tanggal yang jelas: "Kam 8/10" atau "Kam 8 Okt"
            day_name = DAY_NAMES_ID[w_idx]
            formatted_short = f"{day_name} {target_dt.day}/{target_dt.month}"
            formatted_full = f"{DAY_FULL_NAMES[w_idx]}, {target_dt.day} {MONTH_FULL[target_dt.month - 1]} {target_dt.year}"

            weekly_bars.append(FocusDailyBar(
                id=f"bar-{i+1}",
                dayShort=formatted_short,
                dayFull=formatted_full,
                focusPercent=bar_f_pct,
                distractPercent=bar_d_pct,
                focusDuration=f"{f_h}j {f_m}m" if f_h > 0 else f"{f_m}m",
                distractDuration=f"{d_h}j {d_m}m" if d_h > 0 else f"{d_m}m",
                totalDuration=f"{tot_hrs:.1f} jam" if tot_hrs > 0 else "0 jam",
                totalHoursNum=round(tot_hrs, 1)
            ))

    return FocusSummaryResponse(
        overview=overview,
        top_distractors=top_distractors,
        streak=streak_info,
        weekly_bars=weekly_bars
    )


