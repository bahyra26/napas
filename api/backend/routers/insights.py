import os
import json
import urllib.request
import urllib.error
from fastapi import APIRouter, HTTPException, Query
from datetime import timedelta
from typing import List, Optional
from db import supabase, now_wib, ensure_uuid, get_valid_user_uuids
from schemas import (
    WeeklyInsightResponse,
    WellnessPlaybookItem,
    WeeklySummaryStat
)

router = APIRouter(prefix="/insights", tags=["Insights & Recommendations"])


def query_gemini_insight(
    user_name: str,
    avg_score: int,
    latest_zona: str,
    tot_inter: int,
    comp_inter: int,
    high_risk_days: int
) -> Optional[dict]:
    """Memanggil Google Gemini API untuk menghasilkan narasi insight mingguan personal jika GEMINI_API_KEY disetel."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not gemini_key:
        return None

    prompt = f"""Anda adalah asisten kesehatan mental akademik dan psikolog klinis untuk platform NAPAS (Radar Burnout Mahasiswa - JOINTS UGM).
Data telemetri mahasiswa selama 7 hari terakhir:
- Nama Mahasiswa: {user_name}
- Rata-rata Burnout Index: {avg_score}/100 (Zona: {latest_zona.upper()})
- Kepatuhan Intervensi Relaksasi: {comp_inter} dari {tot_inter} intervensi diselesaikan
- Hari Berisiko Tinggi (skor >= 60): {high_risk_days} hari

Tolong buat evaluasi klinis ringan dan rencana aksi mandiri (Wellness Playbook).
Balas HANYA dalam format JSON murni (valid RFC 8259, tanpa markdown backticks ```json, tanpa teks pengantar):
{{
  "title": "Judul empati dan menyemangati (1 kalimat)",
  "description": "Evaluasi narasi klinis ringan tentang beban dan energi mahasiswa (2-3 kalimat hangat)",
  "note": "Pesan praktis atau takeaway untuk mahasiswa (1 kalimat)",
  "playbook": [
    {{
      "title": "Langkah 1 konkret (misal batasi layar malam)",
      "description": "Penjelasan mengapa dan bagaimana melakukannya",
      "actionLabel": "Mulai malam ini"
    }},
    {{
      "title": "Langkah 2 konkret (misal jeda fisik / jalan kaki)",
      "description": "Penjelasan mengapa dan bagaimana melakukannya",
      "actionLabel": "Jadwalkan besok"
    }},
    {{
      "title": "Langkah 3 konkret (misal dukungan sosial / konseling)",
      "description": "Penjelasan mengapa dan bagaimana melakukannya",
      "actionLabel": "Saat kamu siap"
    }}
  ]
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json"
        }
    }

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                raw_clean = raw_text.strip()
                if raw_clean.startswith("```"):
                    raw_clean = raw_clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                return json.loads(raw_clean)
    except Exception as e:
        print(f"[Gemini AI] Evaluasi fallback (Gemini error: {e})")
        return None


@router.get("/weekly", response_model=WeeklyInsightResponse)
def get_weekly_insight(user_id: str):
    """
    Menghasilkan ringkasan insight mingguan dan Wellness Playbook berbasis LLM / AI Explainable.
    Menganalisis akumulasi index 7 hari terakhir dan kepatuhan intervensi.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    from local_db import local_list_interventions

    current_wib = now_wib()
    start_date = (current_wib.date() - timedelta(days=7)).isoformat()
    start_ts = (current_wib - timedelta(days=7)).isoformat()

    # Ambil nama user untuk personalisasi prompt
    user_name = "Mahasiswa"
    valid_uids = get_valid_user_uuids(user_id)
    try:
        u_res = supabase.table("users").select("nama").in_("id", valid_uids).execute()
        if u_res.data and len(u_res.data) > 0:
            user_name = u_res.data[0].get("nama") or "Mahasiswa"
    except Exception:
        pass

    # 1. Ambil 7 hari daily_index
    indices = []
    if supabase:
        try:
            idx_res = supabase.table("daily_index") \
                .select("tanggal, index, zona") \
                .in_("user_id", valid_uids) \
                .gte("tanggal", start_date) \
                .order("tanggal", desc=False) \
                .execute()
            indices = idx_res.data or []
        except Exception:
            pass

    if indices:
        avg_score = round(sum(float(i["index"]) for i in indices) / len(indices))
        latest_zona = indices[-1].get("zona") or "hijau"
    else:
        avg_score = 0
        latest_zona = "hijau"

    # 2. Ambil kepatuhan intervensi riil
    interventions = local_list_interventions(user_id, 7)
    known_ids = {i["id"] for i in interventions}
    if supabase:
        try:
            inter_res = supabase.table("interventions") \
                .select("*") \
                .in_("user_id", valid_uids) \
                .gte("ts", start_ts) \
                .execute()
            if inter_res.data:
                for item in inter_res.data:
                    if item.get("id") not in known_ids:
                        interventions.append(item)
        except Exception:
            pass

    tot_inter = len(interventions)
    comp_inter = sum(1 for i in interventions if i.get("selesai"))

    # Hari risiko tinggi (skor >= 60)
    high_risk_days = sum(1 for i in indices if float(i.get("index") or 0) >= 60)

    # 3. Coba panggil Gemini AI jika ada API Key
    ai_insight = query_gemini_insight(
        user_name=user_name,
        avg_score=avg_score,
        latest_zona=latest_zona,
        tot_inter=tot_inter,
        comp_inter=comp_inter,
        high_risk_days=high_risk_days
    )

    ai_provider = "Google Gemini 1.5 Flash" if ai_insight else "Clinical Wellbeing Engine"

    if ai_insight:
        title = ai_insight.get("title") or "Pola kelelahan dan adaptasi mingguan"
        desc = ai_insight.get("description") or f"Rata-rata indeks burnout Anda adalah {avg_score}% di zona {latest_zona}."
        note = ai_insight.get("note") or "Jaga keseimbangan antara tugas akademik dan istirahat."
        
        raw_playbook = ai_insight.get("playbook", [])
        playbook = []
        for idx, item in enumerate(raw_playbook[:3]):
            playbook.append(WellnessPlaybookItem(
                id=f"pb-{idx+1}",
                stepNumber=idx+1,
                title=item.get("title", f"Langkah {idx+1}"),
                description=item.get("description", "Aksi pemulihan terpandu"),
                actionLabel=item.get("actionLabel", "Mulai"),
                isPrimary=(idx == 0)
            ))
        if not playbook:
            playbook = _get_default_playbook()
    else:
        # Fallback klinis rule-based adaptif
        if latest_zona == "merah":
            title = "Pola kelelahan tinggi terdeteksi pekan ini."
            desc = f"Rata-rata skor burnout mencapai {avg_score}% dengan akumulasi deadline dan waktu tatap layar larut malam. Prioritaskan pemulihan fisik dan jangan ragu delegasikan beban."
            note = "Kondisi kritis — kami sangat menyarankan mengaktifkan istirahat teratur."
        elif latest_zona == "oranye":
            title = "Kamu sudah berusaha keras minggu ini."
            desc = f"Beban tugas dan pola tidurmu membuat energi menurun di tengah minggu. Kamu telah merespons {comp_inter} dari {tot_inter} intervensi yang muncul."
            note = "Lebih baik dari kemarin — terus beri ruang untuk pulih secara bertahap."
        elif latest_zona == "kuning":
            title = "Stabilitas terjaga, waspadai fluktuasi sore hari."
            desc = f"Rata-rata skor burnout pekan ini berada di angka {avg_score}%. Beban mulai terasa pada jam-jam akhir perkuliahan namun masih dalam ambang kendali."
            note = "Pertahankan ritme fokus dan lakukan jeda napas 4-7-8 secara teratur."
        else:
            title = "Kondisi mental dan fisik prima!"
            if avg_score > 0:
                desc = f"Rata-rata skor burnout pekan ini hanya {avg_score}%. Keseimbangan antara waktu akademik dan istirahat berjalan sangat baik."
            else:
                desc = "Belum ada akumulasi tekanan atau tugas berat tercatat pekan ini. Kondisi mental dan fisikmu terpantau prima!"
            note = "Luar biasa! Terus pertahankan pola produktivitas yang sehat ini."
        playbook = _get_default_playbook()

    selesai_label = f"{comp_inter} / {tot_inter}" if tot_inter > 0 else "0"

    summary_stats = [
        WeeklySummaryStat(id="stat-muncul", value=f"{tot_inter} kali", label="intervensi muncul", colorType="orange"),
        WeeklySummaryStat(id="stat-selesai", value=selesai_label, label="intervensi selesai", colorType="green"),
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
        summaryStats=summary_stats,
        ai_provider=ai_provider
    )


def _get_default_playbook() -> List[WellnessPlaybookItem]:
    return [
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
