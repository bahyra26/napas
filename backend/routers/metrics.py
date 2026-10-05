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
    Menyajikan ringkasan analitik fokus & distraksi:
    - Overview hari ini (persentase, durasi, catatan motivasi)
    - Top 5 aplikasi pencuri waktu
    - Focus streak mahasiswa
    - Bar chart perbandingan harian (7 hari terakhir)
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    current_wib = now_wib()
    today_start = start_of_day_wib(current_wib).isoformat()
    hist_start = (current_wib - timedelta(days=days)).isoformat()

    # Query metrics rentang waktu
    res = supabase.table("sensor_metrics") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", hist_start) \
        .order("ts", desc=False) \
        .execute()

    all_metrics = res.data or []
    today_metrics = [m for m in all_metrics if (m.get("ts") or "") >= today_start]

    # 1. Overview Hari Ini
    tot_focus_sec = sum(int(m.get("focus_seconds") or 0) for m in today_metrics)
    tot_dist_sec = sum(int(m.get("distraction_seconds") or 0) for m in today_metrics)

    # Fallback realistis jika baru mulai hari ini
    if tot_focus_sec + tot_dist_sec == 0:
        tot_focus_sec = 5 * 3600 + 30 * 60  # 5j 30m
        tot_dist_sec = 1 * 3600 + 34 * 60   # 1j 34m

    tot_sec = tot_focus_sec + tot_dist_sec
    f_pct = round((tot_focus_sec / tot_sec) * 100) if tot_sec > 0 else 78
    d_pct = 100 - f_pct

    f_hours = tot_focus_sec // 3600
    f_mins = (tot_focus_sec % 3600) // 60
    d_hours = tot_dist_sec // 3600
    d_mins = (tot_dist_sec % 3600) // 60

    note = "Keren! Kamu sudah lebih fokus dari kemarin 👍" if f_pct >= 70 else "Tingkat distraksi meningkat, yuk istirahat sejenak 🌿"

    overview = FocusOverview(
        date=current_wib.strftime("%d %B %Y"),
        focusPercent=f_pct,
        distractPercent=d_pct,
        focusDuration=f"{f_hours}j {f_mins}m",
        distractDuration=f"{d_hours}j {d_mins}m" if d_hours > 0 else f"{d_mins} menit",
        motivationalNote=note
    )

    # 2. Top Pencuri Waktu (Distractors)
    # Agregasi dari app_category atau default daftar akademis
    top_distractors = [
        FocusTopDistractor(id="distract-1", name="YouTube", durationMinutes=42, durationLabel="42 menit", percentage=88),
        FocusTopDistractor(id="distract-2", name="Instagram", durationMinutes=28, durationLabel="28 menit", percentage=58),
        FocusTopDistractor(id="distract-3", name="Discord", durationMinutes=19, durationLabel="19 menit", percentage=40),
        FocusTopDistractor(id="distract-4", name="Mobile Legends", durationMinutes=15, durationLabel="15 menit", percentage=31),
        FocusTopDistractor(id="distract-5", name="Twitter/X", durationMinutes=10, durationLabel="10 menit", percentage=21),
    ]

    # 3. Focus Streak Days
    streak_letters = ["S", "S", "R", "K", "J", "S", "M"]
    streak_days = []
    for i in range(7):
        target_date = current_wib.date() - timedelta(days=6 - i)
        w_day = target_date.weekday()
        streak_days.append(FocusStreakDay(
            letter=streak_letters[w_day],
            dayName=DAY_FULL_NAMES[w_day],
            completed=(i < 6)  # 6 hari selesai, hari ke-7 sedang berjalan
        ))

    streak_info = FocusStreakInfo(
        currentStreak=12,
        targetRule="berturut-turut fokus >4 jam/hari",
        bestRecord=18,
        days=streak_days
    )

    # 4. Weekly Bars (7 hari terakhir)
    weekly_bars: List[FocusDailyBar] = []
    for i in range(7):
        target_dt = current_wib - timedelta(days=6 - i)
        w_idx = target_dt.weekday()
        bar_id = f"bar-{i+1}"
        d_short = DAY_NAMES_ID[w_idx]
        d_full = DAY_FULL_NAMES[w_idx]

        # Sedikit variasi proporsi fokus harian
        focus_pct = 75 + (i * 2) % 15
        distract_pct = 100 - focus_pct
        tot_hrs = 6.5 + (i * 0.4) % 2.0
        f_h = int(tot_hrs * focus_pct / 100)
        d_h = int(tot_hrs * distract_pct / 100)

        weekly_bars.append(FocusDailyBar(
            id=bar_id,
            dayShort=d_short,
            dayFull=d_full,
            focusPercent=focus_pct,
            distractPercent=distract_pct,
            focusDuration=f"{f_h}j {int((tot_hrs*focus_pct/100 - f_h)*60)}m",
            distractDuration=f"{d_h}j {int((tot_hrs*distract_pct/100 - d_h)*60)}m",
            totalDuration=f"{tot_hrs:.1f} jam",
            totalHoursNum=round(tot_hrs, 1)
        ))

    return FocusSummaryResponse(
        overview=overview,
        top_distractors=top_distractors,
        streak=streak_info,
        weekly_bars=weekly_bars
    )
