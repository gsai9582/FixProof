import os
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Report, ReportMedia, Resolution, Verification, StatusEvent, User
from app.schemas.schemas import ReportOut, VerificationOut
from app.routers.auth import get_current_user, require_roles
from app.routers.reports import map_report_to_out
from app.services.exif_service import process_and_sanitize_image
from app.services.verification_engine import run_closure_verification

router = APIRouter(prefix="/officer", tags=["Officer Operations"])

@router.get("/queue", response_model=List[ReportOut])
def get_officer_queue(
    ward: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["officer", "admin"]))
):
    """
    Returns ranked complaints queue sorted strictly by explainable Priority Score descending.
    """
    query = db.query(Report)

    if ward:
        query = query.filter(Report.ward == ward)
    if category:
        query = query.filter(Report.category == category)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    else:
        # Default queue shows actionable unresolved reports
        query = query.filter(Report.status.in_(["reported", "in_progress", "reopened", "needs_review"]))

    reports = query.order_by(Report.priority_score.desc(), Report.created_at.asc()).limit(limit).all()
    return [map_report_to_out(r, current_user.id) for r in reports]

@router.post("/reports/{report_id}/resolve", response_model=ReportOut)
async def resolve_report(
    report_id: int,
    note: str = Form(...),
    after_lat: float = Form(...),
    after_lng: float = Form(...),
    after_timestamp: Optional[str] = Form(None),
    after_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["officer", "admin"]))
):
    """
    The centerpiece resolution endpoint.
    Officer submits after-photo evidence + GPS coordinates.
    FixProof triggers multi-signal Closure Verification Engine:
    Geo proximity + Timestamp validity + Scene/Defect comparison.
    """
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    image_bytes = await after_image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="After-photo evidence is mandatory for closure claim")

    # 1. Process and sanitize after-photo (strip EXIF for public display, preserve metadata for check)
    saved_path, phash, exif_meta, blur = process_and_sanitize_image(
        image_bytes=image_bytes,
        upload_dir=settings.UPLOAD_DIR,
        prefix="after"
    )

    # Resolve timestamp
    parsed_after_time = None
    if after_timestamp:
        try:
            parsed_after_time = datetime.fromisoformat(after_timestamp.replace("Z", "+00:00"))
        except Exception:
            pass
    if not parsed_after_time:
        parsed_after_time = exif_meta.get("taken_at") or datetime.now(timezone.utc)

    # Fallback to EXIF GPS coordinates if officer device coordinates are 0
    resolved_after_lat = after_lat
    resolved_after_lng = after_lng
    if resolved_after_lat == 0.0 and resolved_after_lng == 0.0:
        if exif_meta["gps_lat"] and exif_meta["gps_lng"]:
            resolved_after_lat = exif_meta["gps_lat"]
            resolved_after_lng = exif_meta["gps_lng"]

    # 2. Retrieve original before-photo bytes for visual scene comparison
    before_bytes = None
    before_media = db.query(ReportMedia).filter(
        ReportMedia.report_id == report_id,
        ReportMedia.type == "before"
    ).first()

    if before_media and before_media.path:
        # Load local file
        local_rel = before_media.path.lstrip("/")
        if os.path.exists(local_rel):
            with open(local_rel, "rb") as f:
                before_bytes = f.read()

    # 3. Trigger Closure Verification Engine
    v_result = run_closure_verification(
        before_image_bytes=before_bytes,
        after_image_bytes=image_bytes,
        report_lat=rep.lat,
        report_lng=rep.lng,
        after_lat=resolved_after_lat,
        after_lng=resolved_after_lng,
        report_created_at=rep.created_at,
        after_timestamp=parsed_after_time,
        category=rep.category
    )

    # 4. Save after media record
    now = datetime.now(timezone.utc)
    after_media_record = ReportMedia(
        report_id=rep.id,
        type="after",
        path=saved_path,
        phash=phash,
        exif_gps_lat=exif_meta.get("gps_lat") or resolved_after_lat,
        exif_gps_lng=exif_meta.get("gps_lng") or resolved_after_lng,
        taken_at=parsed_after_time
    )
    db.add(after_media_record)
    db.commit()
    db.refresh(after_media_record)

    # 5. Create Resolution claim
    resolution = Resolution(
        report_id=rep.id,
        officer_id=current_user.id,
        note=note,
        after_media_id=after_media_record.id,
        claimed_at=now
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)

    # 6. Store Verification result
    verification = Verification(
        resolution_id=resolution.id,
        report_id=rep.id,
        geo_pass=v_result["geo_pass"],
        geo_distance_meters=v_result["geo_distance_meters"],
        time_pass=v_result["time_pass"],
        time_delta_seconds=v_result["time_delta_seconds"],
        scene_pass=v_result["scene_pass"],
        scene_similarity_score=v_result["scene_similarity_score"],
        defect_fixed=v_result["defect_fixed"],
        confidence=v_result["confidence"],
        verdict=v_result["verdict"],
        reasons_json=json.dumps(v_result["reasons"]),
        mode=v_result["mode"],
        created_at=now
    )
    db.add(verification)

    # 7. Update Report Status based on verification verdict
    old_status = rep.status
    verdict = v_result["verdict"]
    
    if verdict == "verified_fix":
        new_status = "verified_fixed"
    elif verdict == "needs_review":
        new_status = "needs_review"
    else:  # rejected
        new_status = "rejected"

    rep.status = new_status
    rep.updated_at = now

    event = StatusEvent(
        report_id=rep.id,
        from_status=old_status,
        to_status=new_status,
        actor_id=current_user.id,
        actor_role=current_user.role,
        notes=f"Closure verification completed with verdict: {verdict.upper()}. Reasons: {'; '.join(v_result['reasons'][:2])}"
    )
    db.add(event)

    db.commit()
    db.refresh(rep)

    return map_report_to_out(rep, current_user.id)
