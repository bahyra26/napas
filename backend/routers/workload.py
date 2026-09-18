from fastapi import APIRouter, HTTPException
from typing import List
from db import supabase
from schemas import WorkloadCreate, WorkloadUpdateStatus, WorkloadResponse

router = APIRouter(prefix="/workload", tags=["Workload"])

@router.post("", response_model=WorkloadResponse)
def create_workload_item(payload: WorkloadCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    res = supabase.table("workload_items").insert({
        "user_id": payload.user_id,
        "judul": payload.judul,
        "jenis": payload.jenis,
        "deadline": payload.deadline.isoformat(),
        "est_jam": payload.est_jam,
        "effort": payload.effort,
        "status": "belum"
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Gagal menyimpan workload item")

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
