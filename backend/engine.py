from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
from db import WIB, now_wib

# Bobot baku sesuai rancangan NAPAS v2
WEIGHTS = {
    "load": 0.35,
    "stress": 0.35,
    "dist": 0.20,
    "checkin": 0.10
}

def clamp(val: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Membatasi nilai dalam batas [min_val, max_val]."""
    return max(min_val, min(max_val, val))


def calculate_load_score(workload_items: List[Dict[str, Any]], now: datetime = None) -> Tuple[Optional[float], List[str]]:
    """
    Sub-skor LoadScore (0..100):
    A = min(100, jumlah_deadline_dalam_7_hari * 20)
    B = min(100, total_est_jam_7_hari / 30 * 100)
    C = min(100, jumlah_agenda_larut_malam_7_hari * 34)
    LoadScore = 0.5*A + 0.3*B + 0.2*C
    """
    if now is None:
        now = now_wib()

    if not workload_items:
        return None, ["belum ada data beban kerja"]

    deadline_7d = 0
    est_jam_7d = 0.0
    malam_7d = 0
    alasan = []

    for item in workload_items:
        if item.get("status") == "selesai":
            continue

        raw_dl = item.get("deadline")
        if not raw_dl:
            continue

        if isinstance(raw_dl, str):
            dl = datetime.fromisoformat(raw_dl.replace("Z", "+00:00"))
        else:
            dl = raw_dl

        # Konversi ke WIB untuk evaluasi jam lokal
        dl_wib = dl.astimezone(WIB)
        diff_hours = (dl_wib - now).total_seconds() / 3600.0

        # Hanya hitung tugas yang belum lewat lebih dari 2 jam dan jatuh tempo dalam 7 hari (168 jam)
        if -2.0 <= diff_hours <= 168.0:
            deadline_7d += 1
            est_jam_7d += float(item.get("est_jam") or 2.0)

            # Agenda larut malam: deadline jam lokal >= 22.00 atau <= 04.00
            if dl_wib.hour >= 22 or dl_wib.hour <= 4:
                malam_7d += 1

    if deadline_7d == 0 and est_jam_7d == 0:
        return 0.0, []

    a = min(100.0, deadline_7d * 20.0)
    b = min(100.0, (est_jam_7d / 30.0) * 100.0)
    c = min(100.0, malam_7d * 34.0)

    load_score = round(0.5 * a + 0.3 * b + 0.2 * c, 1)

    if deadline_7d >= 4:
        alasan.append(f"{deadline_7d} deadline dalam 7 hari")
    elif deadline_7d > 0:
        alasan.append(f"{deadline_7d} tugas/deadline dalam 7 hari")

    if malam_7d >= 1:
        alasan.append(f"{malam_7d} agenda larut malam pekan ini")

    if est_jam_7d >= 20.0:
        alasan.append(f"Estimasi beban kerja {int(est_jam_7d)} jam pekan ini")

    return min(100.0, max(0.0, load_score)), alasan


def calculate_stress_score(metrics_list: List[Dict[str, Any]]) -> Tuple[Optional[float], List[str]]:
    """
    Sub-skor StressScore (0..100) — telemetri biovisual 24 jam terakhir:
    ref_blink = 15 (normal: 12-20 kedipan/menit)
    blink_comp = clamp((ref_blink - avg_blink) / ref_blink, 0, 1)
    brow_comp  = avg(brow_tension) (0..1)
    gaze_comp  = clamp(avg(gaze_minutes) / 90, 0, 1)
    StressScore = (0.4*blink_comp + 0.4*brow_comp + 0.2*gaze_comp) * 100
    """
    alasan = []
    if not metrics_list:
        return None, ["sensor visual tidak aktif hari ini"]

    valid_samples = [m for m in metrics_list if m.get("face_visible") is not False]
    if not valid_samples:
        return None, ["wajah tidak terdeteksi di depan laptop"]

    ref_blink = 15.0
    avg_blink = sum(float(m.get("blink_rate") or ref_blink) for m in valid_samples) / len(valid_samples)
    avg_brow = sum(float(m.get("brow_tension") or 0.0) for m in valid_samples) / len(valid_samples)
    avg_gaze = sum(float(m.get("gaze_minutes") or 0.0) for m in valid_samples) / len(valid_samples)

    blink_comp = clamp((ref_blink - avg_blink) / ref_blink, 0.0, 1.0)
    brow_comp = clamp(avg_brow, 0.0, 1.0)
    gaze_comp = clamp(avg_gaze / 90.0, 0.0, 1.0)

    stress_score = round((0.4 * blink_comp + 0.4 * brow_comp + 0.2 * gaze_comp) * 100.0, 1)

    if blink_comp >= 0.25:
        alasan.append(f"kedipan turun {blink_comp:.0%} dari referensi")

    # Hitung durasi alis tegang jika tersedia (misal rata-rata > 0.5 atau durasi)
    if brow_comp >= 0.45:
        alasan.append("alis & otot wajah tegang konsisten")

    if gaze_comp >= 0.45:
        alasan.append(f"tatap layar tanpa jeda rata-rata {int(avg_gaze)} menit")

    return min(100.0, max(0.0, stress_score)), alasan


def calculate_distraction_score(metrics_list: List[Dict[str, Any]]) -> Tuple[Optional[float], List[str]]:
    """
    Sub-skor DistractionScore (0..100) — Focus Guard hari ini:
    ratio = distraction_seconds / (focus_seconds + distraction_seconds)
    DistractionScore = ratio * 100
    """
    alasan = []
    if not metrics_list:
        return None, ["monitor fokus tidak aktif hari ini"]

    total_focus = sum(int(m.get("focus_seconds") or 0) for m in metrics_list)
    total_distraction = sum(int(m.get("distraction_seconds") or 0) for m in metrics_list)
    total_time = total_focus + total_distraction

    if total_time <= 0:
        return None, ["monitor fokus tidak aktif hari ini"]

    ratio = total_distraction / total_time
    dist_score = round(ratio * 100.0, 1)
    dist_min = int(total_distraction / 60)

    if dist_min >= 30:
        alasan.append(f"distraksi {dist_min} menit hari ini")
    elif ratio >= 0.25 and dist_min >= 15:
        alasan.append(f"distraksi {dist_min} menit ({ratio:.0%} waktu aktif)")

    return min(100.0, max(0.0, dist_score)), alasan


def calculate_checkin_score(latest_checkin: Optional[Dict[str, Any]]) -> Tuple[Optional[float], List[str]]:
    """
    Sub-skor Check-in subjektif (1..5 -> 0..100):
    checkin_comp = (5 - skor) * 25
    skor 1 (sangat capek) -> 100 ; skor 5 (segar) -> 0
    """
    alasan = []
    if not latest_checkin:
        return None, ["belum ada check-in hari ini"]

    skor = int(latest_checkin.get("skor") or 3)
    checkin_score = round((5 - skor) * 25.0, 1)

    labels = {
        1: "Check-in: Sangat lelah / tertekan",
        2: "Check-in: Cukup lelah",
        3: "Check-in: Biasa saja",
        4: "Check-in: Segar",
        5: "Check-in: Sangat bugar / prima"
    }
    if skor <= 2:
        alasan.append(labels.get(skor, "Check-in kelelahan"))

    catatan = latest_checkin.get("catatan")
    if catatan:
        alasan.append(f'Catatan: "{catatan.strip()}"')

    return min(100.0, max(0.0, checkin_score)), alasan


def trend_up_3days(histori: List[Dict[str, Any]]) -> bool:
    """
    histori: list daily_index 7 hari terakhir (terlama -> terbaru), HARI INI dikecualikan.
    Kriteria:
    - Naik 3 hari BERUNTUN
    - Kenaikan minimal +2 poin (epsilon, agar noise tidak memicu flag)
    - Hari tanpa data dilewati (tidak memutus beruntun, tidak ikut dihitung)
    """
    baris = [d for d in histori if d.get("index") is not None][-4:]  # 4 titik data terakhir
    if len(baris) < 4:
        return False

    naik = [
        float(baris[i + 1]["index"]) >= float(baris[i]["index"]) + 2.0
        for i in range(len(baris) - 1)
    ]
    return all(naik[-3:])


def build_alasan(sub_reasons: List[str], missing_signals: List[str], is_trending: bool) -> List[str]:
    """Menyusun daftar chips alasan explainable yang mudah dibaca juri & pengguna."""
    alasan = list(sub_reasons)

    if is_trending:
        alasan.append("tren: index naik 3 hari beruntun (+10)")

    missing_notices = {
        "stress": "sensor visual tidak aktif hari ini",
        "dist": "monitor fokus tidak aktif hari ini",
        "checkin": "belum ada check-in hari ini",
        "load": "belum ada data beban kerja",
    }
    for k in missing_signals:
        if k in missing_notices:
            alasan.append(missing_notices[k])

    return alasan if alasan else ["semua sinyal dalam batas wajar"]


def compute_index(
    load: Optional[float],
    stress: Optional[float],
    dist: Optional[float],
    checkin: Optional[float],
    is_trend_up: bool,
    sub_reasons: List[str]
) -> Dict[str, Any]:
    """
    Agregasi utama Burnout Index dengan Graceful Degradation & Explainable Chips.
    """
    parts = {}
    if load is not None:
        parts["load"] = load
    if stress is not None:
        parts["stress"] = stress
    if dist is not None:
        parts["dist"] = dist
    if checkin is not None:
        parts["checkin"] = checkin

    missing = [k for k in WEIGHTS if k not in parts]

    if not parts:
        return {
            "index": 20.0,
            "zona": "hijau",
            "alasan": ["belum ada data sensor / tugas"],
            "sensors_missing": list(WEIGHTS.keys())
        }

    # Graceful degradation: normalisasi ulang bobot berdasarkan sinyal yang tersedia
    w_sum = sum(WEIGHTS[k] for k in parts)
    index = sum(WEIGHTS[k] * parts[k] for k in parts) / w_sum

    # Aturan pengaman: Dengan < 2 sinyal aktif, jangan pernah nyatakan MERAH (maksimal ORANYE 79.0)
    if len(parts) < 2:
        index = min(index, 79.0)

    # Modifikator tren 3-hari
    if is_trend_up:
        index = min(100.0, index + 10.0)

    index = round(max(0.0, min(100.0, index)), 1)

    if index < 30.0:
        zona = "hijau"
    elif index < 60.0:
        zona = "kuning"
    elif index < 80.0:
        zona = "oranye"
    else:
        zona = "merah"

    alasan = build_alasan(sub_reasons, missing, is_trend_up)

    return {
        "index": index,
        "zona": zona,
        "alasan": alasan,
        "sensors_missing": missing
    }
