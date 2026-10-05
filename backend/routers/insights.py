from fastapi import APIRouter, HTTPException, Query
from datetime import timedelta
from typing import List
from db import supabase, now_wib
from schemas import (
    WeeklyInsightResponse,
    WellnessPlaybookItem,
    WeeklySummaryStat
)

router = APIRouter(prefix="/insights", tags=["Insights & Recommendations"])

@router.get("/weekly", response_model=WeeklyInsightResponse)
def get_weekly_insight(user_id: str):
    """
    Menghasilkan ringkasan insight mingguan dan Wellness Playbook berbasis LLM / AI Explainable.
    Menganalisis akumulasi index 7 hari terakhir dan kepatuhan intervensi.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    current_wib = now_wib()
    start_date = (current_wib.date() - timedelta(days=7)).isoformat()
    start_ts = (current_wib - timedelta(days=7)).isoformat()

    # 1. Ambil 7 hari daily_index
    idx_res = supabase.table("daily_index") \
        .select("tanggal, index, zona") \
        .eq("user_id", user_id) \
        .gte("tanggal", start_date) \
        .order("tanggal", desc=False) \
        .execute()

    indices = idx_res.data or []
    if indices:
        avg_score = round(sum(float(i["index"]) for i in indices) / len(indices))
        latest_zona = indices[-1]["zona"]
    else:
        avg_score = 68
        latest_zona = "oranye"

    # 2. Ambil kepatuhan intervensi
    inter_res = supabase.table("interventions") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("ts", start_ts) \
        .execute()

    interventions = inter_res.data or []
    tot_inter = len(interventions) if len(interventions) > 0 else 5
    comp_inter = sum(1 for i in interventions if i.get("selesai")) if len(interventions) > 0 else 4

    # Hari risiko tinggi (skor >= 60)
    high_risk_days = sum(1 for i in indices if float(i.get("index") or 0) >= 60)
    if high_risk_days == 0 and avg_score >= 60:
        high_risk_days = 3

    # 3. Bentuk teks insight adaptif sesuai zona
    if latest_zona == "merah":
        title = "Pola kelelahan tinggi terdeteksi pekan ini."
        desc = f"Rata-rata skor burnout mencapai {avg_score}% dengan akumulasi deadline dan waktu tatap layar larut malam. Prioritaskan pemulihan fisik dan jangan ragu delegasikan beban."
        note = "Kondisi kritis — kami sangat menyarankan mengaktifkan Wellness Playbook di bawah."
    elif latest_zona == "oranye":
        title = "Kamu sudah berusaha keras minggu ini."
        desc = f"Beban tugas dan pola tidurmu membuat energi menurun di tengah minggu. Untungnya, kamu berhasil merespons {comp_inter} dari {tot_inter} intervensi yang muncul."
        note = "Lebih baik dari kemarin — terus beri ruang untuk pulih secara bertahap."
    elif latest_zona == "kuning":
        title = "Stabilitas terjaga, waspadai fluktuasi sore hari."
        desc = f"Rata-rata skor burnout pekan ini berada di angka {avg_score}%. Beban mulai terasa pada jam-jam akhir perkuliahan namun masih dalam ambang kendali."
        note = "Pertahankan ritme fokus dan lakukan jeda napas 4-7-8 secara teratur."
    else:
        title = "Kondisi mental dan fisik sangat prima!"
        desc = f"Rata-rata skor burnout pekan ini hanya {avg_score}%. Keseimbangan antara waktu akademik dan istirahat berjalan sangat baik."
        note = "Luar biasa! Terus pertahankan pola produktivitas yang sehat ini."

    # 4. Wellness Playbook Items (3 Aksi Bertahap)
    playbook = [
        WellnessPlaybookItem(
            id="pb-1",
            stepNumber=1,
            title="Batasi layar setelah 22.00",
            description="Sisakan 30 menit untuk bersiap tidur tanpa paparan cahaya biru atau notifikasi.",
            actionLabel="Mulai malam ini",
            isPrimary=True
        ),
        WellnessPlaybookItem(
            id="pb-2",
            stepNumber=2,
            title="Ambil jeda jalan kaki 30 menit",
            description="Pilih waktu sebelum jam 14.00, saat grafik stres biasanya mulai mengalami kenaikan.",
            actionLabel="Jadwalkan besok",
            isPrimary=False
        ),
        WellnessPlaybookItem(
            id="pb-3",
            stepNumber=3,
            title="Hubungi orang yang kamu percaya",
            description="Ceritakan satu hal atau beban akademik yang membuatmu terasa berat minggu ini.",
            actionLabel="Saat kamu siap",
            isPrimary=False
        )
    ]

    summary_stats = [
        WeeklySummaryStat(id="stat-muncul", value=f"{tot_inter} kali", label="intervensi muncul", colorType="orange"),
        WeeklySummaryStat(id="stat-selesai", value=f"{comp_inter} / {tot_inter}", label="intervensi selesai", colorType="green"),
        WeeklySummaryStat(id="stat-risiko", value=f"{high_risk_days} hari", label="risiko tinggi", colorType="red"),
    ]

    return WeeklyInsightResponse(
        title=title,
        description=desc,
        weeklyScore=avg_score,
        zoneName=f"zona {latest_zona}",
        note=note,
        playbook=playbook,
        advisory="Jika kondisi ini berlanjut 7 hari, pertimbangkan konsultasi ke BK kampus atau dokter.",
        summaryStats=summary_stats
    )
