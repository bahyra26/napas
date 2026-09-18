from fastapi import APIRouter, HTTPException
from db import supabase, now_wib
from schemas import MetricBatch

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
