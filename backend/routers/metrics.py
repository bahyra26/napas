from fastapi import APIRouter, HTTPException
from db import supabase
from schemas import BatchMetricsCreate

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.post("")
def ingest_batch_metrics(payload: BatchMetricsCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database belum terhubung. Pastikan file .env sudah diisi.")

    if not payload.metrics:
        return {"status": "ok", "inserted": 0}

    rows = []
    for m in payload.metrics:
        rows.append({
            "user_id": payload.user_id,
            "blink_rate": m.blink_rate,
            "brow_tension": m.brow_tension,
            "jaw_tension": m.jaw_tension,
            "gaze_minutes": m.gaze_minutes,
            "face_visible": m.face_visible,
            "focus_seconds": m.focus_seconds,
            "distraction_seconds": m.distraction_seconds,
            "app_category": m.app_category
        })

    res = supabase.table("sensor_metrics").insert(rows).execute()
    return {"status": "ok", "inserted": len(res.data or [])}
