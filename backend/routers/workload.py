from fastapi import APIRouter, HTTPException
from typing import List
from db import supabase
from schemas import WorkloadCreate, WorkloadUpdateStatus, WorkloadResponse

router = APIRouter(prefix="/workload", tags=["Workload"])

@router.post("", response_model=WorkloadResponse)
def create_workload_item(payload: WorkloadCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    row = {
        "user_id": payload.user_id,
        "judul": payload.judul,
        "jenis": payload.jenis,
        "deadline": payload.deadline.isoformat(),
        "est_jam": payload.est_jam,
        "effort": payload.effort,
        "status": "belum"
    }
    if payload.mata_kuliah:
        row["mata_kuliah"] = payload.mata_kuliah

    try:
        res = supabase.table("workload_items").insert(row).execute()
        if res.data:
            return res.data[0]
    except Exception:
        if "mata_kuliah" in row:
            del row["mata_kuliah"]
        res = supabase.table("workload_items").insert(row).execute()
        if res.data:
            item = res.data[0]
            item["mata_kuliah"] = payload.mata_kuliah
            return item

    raise HTTPException(status_code=400, detail="Gagal menyimpan workload item")

@router.patch("/{item_id}")
def update_workload_item(item_id: str, payload: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung.")

    upd = {}
    if "judul" in payload and payload["judul"] is not None: upd["judul"] = payload["judul"]
    if "deadline" in payload and payload["deadline"] is not None: upd["deadline"] = payload["deadline"]
    if "est_jam" in payload and payload["est_jam"] is not None: upd["est_jam"] = payload["est_jam"]
    if "effort" in payload and payload["effort"] is not None: upd["effort"] = payload["effort"]
    if "mata_kuliah" in payload and payload["mata_kuliah"] is not None: upd["mata_kuliah"] = payload["mata_kuliah"]
    if "status" in payload and payload["status"] is not None: upd["status"] = payload["status"]

    res = supabase.table("workload_items").update(upd).eq("id", item_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    return res.data[0]


@router.get("/{user_id}", response_model=List[WorkloadResponse])
def get_user_workloads(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("workload_items") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("deadline", desc=False) \
        .execute()

    return res.data or []

@router.patch("/{item_id}/status", response_model=WorkloadResponse)
def update_workload_status(item_id: str, payload: WorkloadUpdateStatus):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("workload_items") \
        .update({"status": payload.status}) \
        .eq("id", item_id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")

    return res.data[0]

@router.delete("/{item_id}")
def delete_workload_item(item_id: str):
    """Menghapus item workload dari database."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("workload_items").delete().eq("id", item_id).execute()
    return {"status": "ok", "deleted_id": item_id}
