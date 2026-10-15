from fastapi import APIRouter, HTTPException
from typing import List
from db import supabase, ensure_uuid, ensure_user_in_supabase
from local_db import (
    local_save_workload_item,
    local_list_workload_items,
    local_update_workload_item,
    local_delete_workload_item,
    deterministic_uuid
)
from schemas import WorkloadCreate, WorkloadUpdateStatus, WorkloadResponse

router = APIRouter(prefix="/workload", tags=["Workload"])

@router.post("", response_model=WorkloadResponse)
def create_workload_item(payload: WorkloadCreate):
    u_id = ensure_uuid(payload.user_id)
    ensure_user_in_supabase(u_id)

    row = {
        "user_id": u_id,
        "judul": payload.judul,
        "jenis": payload.jenis,
        "deadline": payload.deadline.isoformat(),
        "est_jam": payload.est_jam,
        "effort": payload.effort,
        "status": "belum",
        "source": "manual"
    }
    if payload.mata_kuliah:
        row["mata_kuliah"] = payload.mata_kuliah

    # 1. Simpan ke SQLite Lokal
    local_saved = local_save_workload_item(row)

    # 2. Coba simpan ke Supabase jika terhubung
    if supabase:
        try:
            res = supabase.table("workload_items").insert({**row, "id": local_saved["id"]}).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    return local_saved

@router.patch("/{item_id}")
def update_workload_item(item_id: str, payload: dict):
    upd = {}
    if "judul" in payload and payload["judul"] is not None: upd["judul"] = payload["judul"]
    if "deadline" in payload and payload["deadline"] is not None: upd["deadline"] = payload["deadline"]
    if "est_jam" in payload and payload["est_jam"] is not None: upd["est_jam"] = payload["est_jam"]
    if "effort" in payload and payload["effort"] is not None: upd["effort"] = payload["effort"]
    if "mata_kuliah" in payload and payload["mata_kuliah"] is not None: upd["mata_kuliah"] = payload["mata_kuliah"]
    if "status" in payload and payload["status"] is not None: upd["status"] = payload["status"]

    local_updated = local_update_workload_item(item_id, upd)

    if supabase:
        try:
            res = supabase.table("workload_items").update(upd).eq("id", item_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    if not local_updated:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    return local_updated


@router.get("/{user_id}", response_model=List[WorkloadResponse])
def get_user_workloads(user_id: str):
    u_uuid = deterministic_uuid(user_id)
    u_id = ensure_uuid(user_id)
    items = []

    if supabase:
        try:
            res = supabase.table("workload_items") \
                .select("*") \
                .in_("user_id", [user_id, u_id, u_uuid]) \
                .order("deadline", desc=False) \
                .execute()
            if res.data:
                items = list(res.data)
        except Exception:
            pass

    if not items:
        items = local_list_workload_items(u_uuid)
        if not items and user_id != u_uuid:
            items = local_list_workload_items(user_id)

    # DEDUPLIKASI KETAT: jangan biarkan agenda ganda tampil di daftar tugas
    deduped = []
    seen_google_ids = set()
    seen_title_date = set()

    for item in items:
        gid = item.get("google_event_id")
        if gid:
            if gid in seen_google_ids:
                continue
            seen_google_ids.add(gid)

        title_clean = (item.get("judul") or "").strip().lower()
        date_prefix = str(item.get("deadline") or "")[:10]
        key = (title_clean, date_prefix)
        if key in seen_title_date:
            continue
        seen_title_date.add(key)
        deduped.append(item)

    return deduped

@router.patch("/{item_id}/status", response_model=WorkloadResponse)
def update_workload_status(item_id: str, payload: WorkloadUpdateStatus):
    local_updated = local_update_workload_item(item_id, {"status": payload.status})

    if supabase:
        try:
            res = supabase.table("workload_items") \
                .update({"status": payload.status}) \
                .eq("id", item_id) \
                .execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    if not local_updated:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    return local_updated

@router.delete("/{item_id}")
def delete_workload_item(item_id: str):
    """Menghapus item workload dari database."""
    local_delete_workload_item(item_id)
    if supabase:
        try:
            supabase.table("workload_items").delete().eq("id", item_id).execute()
        except Exception:
            pass
    return {"status": "ok", "deleted_id": item_id}
