from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from datetime import timedelta
from db import supabase, now_wib, ensure_uuid, ensure_user_in_supabase, get_valid_user_uuids
from schemas import InterventionCreate, InterventionResponse

router = APIRouter(prefix="/interventions", tags=["Interventions"])

from local_db import local_save_intervention, local_list_interventions, deterministic_uuid

@router.post("", response_model=InterventionResponse)
def log_intervention(payload: InterventionCreate):
    u_id = ensure_uuid(payload.user_id)
    ensure_user_in_supabase(u_id)

    # Simpan di local SQLite
    local_item = local_save_intervention(
        user_id=u_id,
        tipe=payload.tipe,
        durasi=payload.durasi,
        selesai=payload.selesai
    )

    if supabase:
        try:
            res = supabase.table("interventions").insert({
                "id": local_item["id"],
                "user_id": u_id,
                "tipe": payload.tipe,
                "durasi": payload.durasi,
                "selesai": payload.selesai
            }).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    return local_item

@router.get("")
def get_interventions(user_id: str, days: int = Query(default=7, ge=1, le=90)):
    """
    Mengambil riwayat intervensi beserta ringkasan statistik
    untuk ditampilkan pada halaman Laporan / Wellness Web Dashboard.
    """
    # 1. Ambil dari SQLite lokal
    local_items = local_list_interventions(user_id, days)
    known_ids = {i["id"] for i in local_items}

    # 2. Ambil dari Supabase jika ada
    if supabase:
        try:
            start_time = (now_wib() - timedelta(days=days)).isoformat()
            res = supabase.table("interventions") \
                .select("*") \
                .in_("user_id", get_valid_user_uuids(user_id)) \
                .gte("ts", start_time) \
                .order("ts", desc=True) \
                .execute()
            if res.data:
                for item in res.data:
                    if item.get("id") not in known_ids:
                        local_items.append(item)
        except Exception:
            pass

    # Urutkan berdasarkan ts desc
    local_items.sort(key=lambda x: x.get("ts") or "", reverse=True)

    completed_count = sum(1 for i in local_items if i.get("selesai"))

    type_counts = {}
    for i in local_items:
        t = i.get("tipe", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "user_id": user_id,
        "days": days,
        "total": len(local_items),
        "completed": completed_count,
        "by_type": type_counts,
        "items": local_items
    }
