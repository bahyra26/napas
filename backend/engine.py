from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple

def calculate_load_score(workload_items: List[Dict[str, Any]], now: datetime = None) -> Tuple[float, List[str]]:
    """
    Menghitung skor beban tugas 7 hari ke depan.
    Rentang: 0 - 100.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    total_score = 0.0
    upcoming_count = 0
    urgent_count = 0
    night_penalty = 0.0
    alasan = []

    for item in workload_items:
        if item.get("status") == "selesai":
            continue

        raw_dl = item.get("deadline")
        if isinstance(raw_dl, str):
            dl = datetime.fromisoformat(raw_dl.replace("Z", "+00:00"))
        else:
            dl = raw_dl

        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)

        diff = dl - now
        hours_until = diff.total_seconds() / 3600.0

        # Hanya hitung deadline yang belum lewat dan dalam kurun waktu 7 hari (168 jam)
        if -2 <= hours_until <= 168:
            upcoming_count += 1
            effort = float(item.get("effort") or 3)
            effort_mult = effort / 3.0

            if hours_until <= 24:
                total_score += 28.0 * effort_mult
                urgent_count += 1
            elif hours_until <= 72:
                total_score += 15.0 * effort_mult
            else:
                total_score += 8.0 * effort_mult

            # Deteksi jadwal larut malam (antara jam 22.00 s.d 04.00)
            if dl.hour >= 22 or dl.hour <= 4:
                night_penalty = 10.0

    load_score = min(100.0, max(0.0, total_score + night_penalty))

    if urgent_count > 0:
        alasan.append(f"{urgent_count} deadline mendesak (< 24 jam)")
    elif upcoming_count > 0:
        alasan.append(f"{upcoming_count} agenda/tugas dalam 7 hari ke depan")
    if night_penalty > 0:
        alasan.append("Terdapat agenda/tugas larut malam (>22:00)")

    return round(load_score, 1), alasan


def calculate_stress_score(metrics_list: List[Dict[str, Any]], baseline_blink: float = 18.0) -> Tuple[float, List[str]]:
    """
    Menghitung skor stres dari data telemetri biovisual kamera.
    Rentang: 0 - 100.
    """
    alasan = []
    if not metrics_list:
        # Graceful degradation jika tidak ada data sensor
        return 20.0, ["Sensor biovisual nonaktif / baseline normal"]

    valid_samples = [m for m in metrics_list if m.get("face_visible") is not False]
    if not valid_samples:
        return 20.0, ["Pengguna tidak terdeteksi di depan laptop"]

    avg_blink = sum(m.get("blink_rate", baseline_blink) or baseline_blink for m in valid_samples) / len(valid_samples)
    avg_brow = sum(m.get("brow_tension", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)
    avg_jaw = sum(m.get("jaw_tension", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)
    avg_gaze = sum(m.get("gaze_minutes", 0.0) or 0.0 for m in valid_samples) / len(valid_samples)

    # 1. Blink Deficit
    blink_drop_pct = 0.0
    if avg_blink < baseline_blink:
        blink_drop_pct = ((baseline_blink - avg_blink) / baseline_blink) * 100.0
    blink_score = min(100.0, blink_drop_pct * 1.5)

    # 2. Facial Muscle Tension
    tension_score = min(100.0, (avg_brow * 60.0) + (avg_jaw * 40.0))

    # 3. Screen Gaze Duration
    gaze_score = min(100.0, (avg_gaze / 50.0) * 100.0)

    stress_score = (0.40 * blink_score) + (0.40 * tension_score) + (0.20 * gaze_score)
    stress_score = min(100.0, max(0.0, stress_score))

    if blink_drop_pct >= 25.0:
        alasan.append(f"Kedipan mata turun {int(blink_drop_pct)}% di bawah normal")
    if tension_score >= 45.0:
        alasan.append("Ketegangan otot wajah/alis konsisten tinggi")
    if avg_gaze >= 40.0:
        alasan.append(f"Tatap layar terus-menerus rata-rata {int(avg_gaze)} menit tanpa jeda")

    return round(stress_score, 1), alasan


def calculate_distraction_score(metrics_list: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
    """
    Menghitung rasio distraksi dari Focus Guard.
    Rentang: 0 - 100.
    """
    alasan = []
    if not metrics_list:
        return 0.0, []

    total_focus = sum(m.get("focus_seconds", 0) or 0 for m in metrics_list)
    total_distraction = sum(m.get("distraction_seconds", 0) or 0 for m in metrics_list)
    total_time = total_focus + total_distraction

    if total_time <= 0:
        return 0.0, []

    ratio = (total_distraction / total_time) * 100.0
    dist_minutes = int(total_distraction / 60)

    if ratio >= 25.0 and dist_minutes >= 10:
        alasan.append(f"Waktu distraksi {dist_minutes} menit ({int(ratio)}% dari jam kerja)")

    return round(min(100.0, ratio), 1), alasan


def calculate_checkin_score(latest_checkin: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Menormalkan check-in subjektif (1 s.d 5) menjadi skor kelelahan (0 s.d 100).
    """
    alasan = []
    if not latest_checkin:
        return 35.0, []

    skor = latest_checkin.get("skor", 3)
    stress_mapping = {
        1: (100.0, "Kondisi subjektif: Sangat lelah / tertekan"),
        2: (75.0, "Kondisi subjektif: Cukup lelah"),
        3: (50.0, "Kondisi subjektif: Biasa saja"),
        4: (25.0, "Kondisi subjektif: Segar"),
        5: (0.0, "Kondisi subjektif: Sangat berenergi / prima")
    }

    norm_score, label = stress_mapping.get(skor, (50.0, "Kondisi subjektif moderat"))
    if skor <= 2:
        alasan.append(label)

    return norm_score, alasan


def calculate_burnout_index(
    load_score: float,
    stress_score: float,
    dist_score: float,
    checkin_score: float,
    trend_up_3days: bool,
    alasan_list: List[str]
) -> Tuple[float, str, List[str]]:
    """
    Agregasi akhir Burnout Index + modifikator tren + penentuan zona warna.
    """
    base_index = (
        (0.35 * load_score)
        + (0.35 * stress_score)
        + (0.20 * dist_score)
        + (0.10 * checkin_score)
    )

    final_alasan = list(alasan_list)

    if trend_up_3days:
        base_index += 10.0
        final_alasan.append("Tren Burnout Index meningkat 3 hari berturut-turut (+10)")

    final_index = round(min(100.0, max(0.0, base_index)), 1)

    if final_index < 30.0:
        zona = "hijau"
    elif final_index < 60.0:
        zona = "kuning"
    elif final_index < 80.0:
        zona = "oranye"
    else:
        zona = "merah"

    return final_index, zona, final_alasan
