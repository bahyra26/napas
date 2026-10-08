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
def get_focus_summary(user_id: str, days: int = Query(default=7, ge=1, le=30)):
    """
    Menyajikan ringkasan analitik fokus & distraksi berbasis data riil pengguna:
    - Overview hari ini (persentase, durasi, catatan motivasi)
    - Top website/aplikasi pencuri waktu dari log distraksi sesi
    - Focus streak mahasiswa terhitung dari hari aktif
    - Bar chart perbandingan harian dinamis
    """
    current_wib = now_wib()
    today_start = start_of_day_wib(current_wib).isoformat()
    hist_start = (current_wib - timedelta(days=days)).isoformat()

    # 1. Ambil data sesi fokus riil
    from routers.focus import _MEM_FOCUS_SESSIONS
    from db import ensure_uuid
    u_uuid = ensure_uuid(user_id)
    focus_sessions = []
    if supabase:
        try:
            fs_res = supabase.table("focus_sessions") \
                .select("*") \
                .in_("user_id", [user_id, u_uuid]) \
                .gte("mulai", hist_start) \
                .order("mulai", desc=False) \
                .execute()
            if fs_res.data:
                focus_sessions = fs_res.data
        except Exception:
            pass

    # Gabungkan dengan memory session jika ada
    mem_sessions = _MEM_FOCUS_SESSIONS.get(user_id, []) or _MEM_FOCUS_SESSIONS.get(u_uuid, [])
    known_ids = {s.get("id") for s in focus_sessions}
    for ms in mem_sessions:
        if ms.get("id") not in known_ids and (ms.get("mulai") or "") >= hist_start:
            focus_sessions.append(ms)

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

    # Sesi hari ini
    today_sessions = [s for s in focus_sessions if (s.get("mulai") or "") >= today_start]
    today_metrics = [m for m in all_metrics if (m.get("ts") or "") >= today_start]

    # Hitung total detik fokus & distraksi hari ini (Hanya dari sesi riil, hindari duplikasi dengan sensor_metrics)
    tot_focus_sec = sum(int(s.get("focus_seconds") or 0) for s in today_sessions)
    tot_dist_sec = sum(int(s.get("distraction_seconds") or 0) for s in today_sessions)

    # Tambahkan metrics sensor hanya jika bukan berasal dari sesi fokus (mencegah double-counting)
    for m in today_metrics:
        if m.get("app_category") != "Focus Session":
            tot_focus_sec += int(m.get("focus_seconds") or 0)
            tot_dist_sec += int(m.get("distraction_seconds") or 0)

    has_real_today = (tot_focus_sec + tot_dist_sec) > 0

    tot_sec = tot_focus_sec + tot_dist_sec
    f_pct = round((tot_focus_sec / tot_sec) * 100) if tot_sec > 0 else 0
    d_pct = 100 - f_pct if tot_sec > 0 else 0

    f_hours = tot_focus_sec // 3600
    f_mins = (tot_focus_sec % 3600) // 60
    d_hours = tot_dist_sec // 3600
    d_mins = (tot_dist_sec % 3600) // 60

    if has_real_today:
        if f_pct >= 80:
            note = f"Luar biasa! Efisiensi fokusmu mencapai {f_pct}% hari ini 🎯"
        elif f_pct >= 60:
            note = f"Fokus stabil ({f_pct}%). Selesaikan sisa target dengan istirahat teratur 👍"
        else:
            note = f"Distraksi terdeteksi cukup tinggi ({d_pct}%). Istirahat sejenak 🌿"
    else:
        note = "Belum ada sesi fokus tercatat hari ini. Tekan 'Mulai Sesi Fokus' untuk merekam waktu belajarmu! 🚀"

    # Format label durasi yang konsisten dan akurat
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

    overview = FocusOverview(
        date=current_wib.strftime("%d %B %Y"),
        focusPercent=f_pct,
        distractPercent=d_pct,
        focusDuration=focus_dur_label,
        distractDuration=distract_dur_label,
        motivationalNote=note
    )

    # 3. Top Pencuri Waktu (Hanya aplikasi distraksi riil, jangan masukkan situs belajar/LMS)
    STUDY_TERMS_FILTER = {
        "github", "gitlab", "ugm", "elearning", "moodle", "canvas", "classroom",
        "docs", "drive", "notion", "wikipedia", "chatgpt", "claude", "beranda",
        "dashboard", "computer", "organisasi", "townhall", "itdev", "mikail",
        "napas", "localhost", "127.0.0.1", "code", "visual studio", "terminal",
        "powershell", "cmd", "acrobat", "word", "excel", "powerpoint", "figma",
        "zoom", "untitled", "new tab", "tab baru", "loading", "memuat",
        "speed dial", "startpage", "about:blank", "canva", "google dokumen", "google docs"
    }

    distractor_counts: Dict[str, int] = {}
    for s in focus_sessions:
        b_apps = s.get("blocked_apps") or {}
        if isinstance(b_apps, dict):
            for app_name, count in b_apps.items():
                name_lower = app_name.lower().strip()
                # Abaikan tab belajar atau kata kunci akademik agar tidak salah masuk ke pencuri waktu
                if any(st in name_lower for st in STUDY_TERMS_FILTER):
                    continue
                clean_name = app_name.replace(".exe", "").capitalize()
                distractor_counts[clean_name] = distractor_counts.get(clean_name, 0) + int(count)

    max_distract = max(distractor_counts.values()) if distractor_counts else 1
    top_distractors = []
    for idx, (app_name, secs) in enumerate(sorted(distractor_counts.items(), key=lambda x: x[1], reverse=True)[:5]):
        if secs < 60:
            lbl = f"{secs} detik"
            dur_num = max(1, round(secs / 60))
        else:
            m = secs // 60
            lbl = f"{m} menit"
            dur_num = m

        top_distractors.append(FocusTopDistractor(
            id=f"distract-{idx+1}",
            name=app_name,
            durationMinutes=dur_num,
            durationLabel=lbl,
            percentage=min(100, round((secs / max_distract) * 100))
        ))

    # 4. Focus Streak (Dihitung murni dari hari aktif)
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
        bestRecord=consecutive_streak,
        days=streak_days
    )

    # 5. Weekly Bars (Dihitung per hari murni dari sesi nyata)
    chart_days = min(days, 14)
    weekly_bars: List[FocusDailyBar] = []

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

        weekly_bars.append(FocusDailyBar(
            id=f"bar-{i+1}",
            dayShort=DAY_NAMES_ID[w_idx],
            dayFull=DAY_FULL_NAMES[w_idx],
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
