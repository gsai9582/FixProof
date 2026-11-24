import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.models import (
    Report, ReportMedia, ReportSupport, CommunityConfirmation, StatusEvent, User, Department, Resolution, Verification
)
from app.schemas.schemas import (
    ReportOut, ReportAnalyzeResponse, DuplicateCheckResponse, DuplicateCheckItem,
    CommunityVoteRequest, PriorityBreakdown, MediaOut, ResolutionOut, VerificationOut, StatusEventOut
)
from app.routers.auth import get_current_user, get_optional_current_user
from app.services.exif_service import process_and_sanitize_image
from app.services.ai_service import analyze_report_ai
from app.services.duplicate_service import find_duplicates_for_report
from app.services.priority_service import calculate_priority_score

router = APIRouter(prefix="/reports", tags=["Reports"])

def map_report_to_out(rep: Report, current_user_id: Optional[int] = None) -> ReportOut:
    # Decode priority breakdown
    pb = None
    if rep.priority_breakdown_json:
        try:
            data = json.loads(rep.priority_breakdown_json)
            pb = PriorityBreakdown(**data)
        except Exception:
            pass

    # Media items
    media_list = [
        MediaOut(
            id=m.id,
            type=m.type,
            path=m.path,
            phash=m.phash,
            exif_gps_lat=m.exif_gps_lat,
            exif_gps_lng=m.exif_gps_lng,
            taken_at=m.taken_at,
            created_at=m.created_at
        )
        for m in rep.media
    ]

    # Supports
    supports_count = len(rep.supports) if rep.supports else 0
    user_supported = False
    if current_user_id and rep.supports:
        user_supported = any(s.user_id == current_user_id for s in rep.supports)

    # Latest Resolution & Verification
    latest_res_out = None
    if rep.resolutions:
        latest_res = rep.resolutions[-1]
        v_out = None
        if latest_res.verification:
            v = latest_res.verification
            reasons = []
            if v.reasons_json:
                try:
                    reasons = json.loads(v.reasons_json)
                except Exception:
                    pass
            v_out = VerificationOut(
                id=v.id,
                resolution_id=v.resolution_id,
                report_id=v.report_id,
                geo_pass=v.geo_pass,
                geo_distance_meters=v.geo_distance_meters,
                time_pass=v.time_pass,
                time_delta_seconds=v.time_delta_seconds,
                scene_pass=v.scene_pass,
                scene_similarity_score=v.scene_similarity_score,
                defect_fixed=v.defect_fixed,
                confidence=v.confidence,
                verdict=v.verdict,
                reasons=reasons,
                mode=v.mode,
                admin_override=v.admin_override,
                admin_notes=v.admin_notes,
                created_at=v.created_at
            )

        after_m_out = None
        if latest_res.after_media:
            am = latest_res.after_media
            after_m_out = MediaOut(
                id=am.id,
                type=am.type,
                path=am.path,
                phash=am.phash,
                exif_gps_lat=am.exif_gps_lat,
                exif_gps_lng=am.exif_gps_lng,
                taken_at=am.taken_at,
                created_at=am.created_at
            )

        latest_res_out = ResolutionOut(
            id=latest_res.id,
            report_id=latest_res.report_id,
            officer_id=latest_res.officer_id,
            officer_name=latest_res.officer.name if latest_res.officer else "Field Officer",
            note=latest_res.note,
            claimed_at=latest_res.claimed_at,
            after_media=after_m_out,
            verification=v_out
        )

    # Confirmations summary
    fixed_c = sum(1 for c in rep.confirmations if c.answer == "fixed")
    not_fixed_c = sum(1 for c in rep.confirmations if c.answer == "not_fixed")

    # Status events
    events_out = [
        StatusEventOut(
            id=e.id,
            from_status=e.from_status,
            to_status=e.to_status,
            actor_id=e.actor_id,
            actor_role=e.actor_role,
            notes=e.notes,
            created_at=e.created_at
        )
        for e in rep.status_events
    ]

    return ReportOut(
        id=rep.id,
        category=rep.category,
        title=rep.title,
        description=rep.description,
        lat=rep.lat,
        lng=rep.lng,
        address=rep.address,
        ward=rep.ward,
        status=rep.status,
        severity=rep.severity,
        priority_score=rep.priority_score,
        priority_breakdown=pb,
        cluster_id=rep.cluster_id,
        language=rep.language or "en",
        is_demo=rep.is_demo,
        created_at=rep.created_at,
        updated_at=rep.updated_at,
        reporter_display_name="Citizen",  # Privacy: hide real identity
        supports_count=supports_count,
        user_has_supported=user_supported,
        media=media_list,
        latest_resolution=latest_res_out,
        confirmations_summary={"fixed": fixed_c, "not_fixed": not_fixed_c},
        status_events=events_out
    )

@router.post("/analyze", response_model=ReportAnalyzeResponse)
async def analyze_report(
    image: UploadFile = File(...),
    user_category: Optional[str] = Form(None),
    user_text: Optional[str] = Form(None),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file received")

    # Assess blur and intake
    from app.services.exif_service import evaluate_image_blur
    blur = evaluate_image_blur(image_bytes)

    res = analyze_report_ai(
        image_bytes=image_bytes,
        user_category=user_category,
        user_text=user_text,
        blur_score=blur
    )
    return ReportAnalyzeResponse(**res)

@router.post("/check-duplicates", response_model=DuplicateCheckResponse)
def check_duplicates(
    lat: float = Query(...),
    lng: float = Query(...),
    category: str = Query(...),
    phash: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    has_dup, cluster_id, items = find_duplicates_for_report(
        db=db,
        lat=lat,
        lng=lng,
        category=category,
        phash=phash
    )
    return DuplicateCheckResponse(
        has_duplicates=has_dup,
        cluster_id=cluster_id,
        nearby_reports=items
    )

@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    address: str = Form(...),
    ward: str = Form("Ward 172 - Adyar"),
    severity: int = Form(3),
    language: str = Form("en"),
    cluster_id: Optional[str] = Form(None),
    override_duplicate: bool = Form(False),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Photo is required for civic complaint reporting")

    # Sanitize and store photo (strips EXIF from public image)
    saved_path, phash, exif_meta, blur_score = process_and_sanitize_image(
        image_bytes=image_bytes,
        upload_dir=settings.UPLOAD_DIR,
        prefix="before"
    )

    # Use EXIF coordinates if available and user coordinates were default/zero
    report_lat = lat
    report_lng = lng
    if (lat == 0.0 and lng == 0.0) and exif_meta["gps_lat"] and exif_meta["gps_lng"]:
        report_lat = exif_meta["gps_lat"]
        report_lng = exif_meta["gps_lng"]

    # Check for duplicates if not explicitly forced
    final_cluster_id = cluster_id
    if not override_duplicate and not final_cluster_id:
        has_dup, suggested_cluster, _ = find_duplicates_for_report(
            db=db,
            lat=report_lat,
            lng=report_lng,
            category=category,
            phash=phash
        )
        if has_dup:
            final_cluster_id = suggested_cluster

    # Calculate Explainable Priority Score
    now = datetime.now(timezone.utc)
    priority_score, breakdown = calculate_priority_score(
        severity=severity,
        lat=report_lat,
        lng=report_lng,
        created_at=now,
        supports_count=0,
        category=category
    )

    # Map department by ward/category
    dept = db.query(Department).filter(Department.ward == ward).first()

    new_report = Report(
        reporter_id=current_user.id,
        category=category,
        title=title,
        description=description,
        lat=report_lat,
        lng=report_lng,
        address=address,
        ward=ward,
        department_id=dept.id if dept else None,
        status="reported",
        severity=severity,
        priority_score=priority_score,
        priority_breakdown_json=json.dumps(breakdown.model_dump()),
        cluster_id=final_cluster_id,
        language=language,
        is_demo=False,
        created_at=now,
        updated_at=now
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Add initial photo
    media = ReportMedia(
        report_id=new_report.id,
        type="before",
        path=saved_path,
        phash=phash,
        exif_gps_lat=exif_meta.get("gps_lat"),
        exif_gps_lng=exif_meta.get("gps_lng"),
        taken_at=exif_meta.get("taken_at") or now
    )
    db.add(media)

    # Initial status event
    event = StatusEvent(
        report_id=new_report.id,
        from_status="none",
        to_status="reported",
        actor_id=current_user.id,
        actor_role=current_user.role,
        notes="Complaint submitted with geotagged photo evidence."
    )
    db.add(event)
    db.commit()
    db.refresh(new_report)

    return map_report_to_out(new_report, current_user.id)

@router.get("", response_model=List[ReportOut])
def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    ward: Optional[str] = None,
    min_priority: Optional[float] = None,
    cluster_id: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Report)

    if category:
        query = query.filter(Report.category == category)
    if status:
        query = query.filter(Report.status == status)
    if ward:
        query = query.filter(Report.ward == ward)
    if min_priority is not None:
        query = query.filter(Report.priority_score >= min_priority)
    if cluster_id:
        query = query.filter(Report.cluster_id == cluster_id)

    # Geographic bounding box for map view
    if min_lat is not None and max_lat is not None:
        query = query.filter(Report.lat >= min_lat, Report.lat <= max_lat)
    if min_lng is not None and max_lng is not None:
        query = query.filter(Report.lng >= min_lng, Report.lng <= max_lng)

    reports = query.order_by(Report.priority_score.desc(), Report.created_at.desc()).offset(offset).limit(limit).all()
    uid = current_user.id if current_user else None
    return [map_report_to_out(r, uid) for r in reports]

@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    uid = current_user.id if current_user else None
    return map_report_to_out(rep, uid)

@router.post("/{report_id}/support", response_model=ReportOut)
def support_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    existing = db.query(ReportSupport).filter(
        ReportSupport.report_id == report_id,
        ReportSupport.user_id == current_user.id
    ).first()

    if existing:
        # Toggle support off if clicked again
        db.delete(existing)
        action_note = "Citizen removed support."
    else:
        new_sup = ReportSupport(report_id=report_id, user_id=current_user.id)
        db.add(new_sup)
        action_note = "Citizen added corroborating support."

    db.commit()
    db.refresh(rep)

    # Recalculate priority score with updated corroboration count
    supports_count = len(rep.supports) if rep.supports else 0
    new_priority, breakdown = calculate_priority_score(
        severity=rep.severity,
        lat=rep.lat,
        lng=rep.lng,
        created_at=rep.created_at,
        supports_count=supports_count,
        category=rep.category
    )
    rep.priority_score = new_priority
    rep.priority_breakdown_json = json.dumps(breakdown.model_dump())
    
    event = StatusEvent(
        report_id=rep.id,
        from_status=rep.status,
        to_status=rep.status,
        actor_id=current_user.id,
        actor_role=current_user.role,
        notes=action_note
    )
    db.add(event)
    db.commit()
    db.refresh(rep)

    return map_report_to_out(rep, current_user.id)

@router.post("/{report_id}/confirm", response_model=ReportOut)
def community_confirm(
    report_id: int,
    vote: CommunityVoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    # Record or update user confirmation
    conf = db.query(CommunityConfirmation).filter(
        CommunityConfirmation.report_id == report_id,
        CommunityConfirmation.user_id == current_user.id
    ).first()

    if conf:
        conf.answer = vote.answer
        conf.note = vote.note
    else:
        conf = CommunityConfirmation(
            report_id=report_id,
            user_id=current_user.id,
            answer=vote.answer,
            note=vote.note
        )
        db.add(conf)

    db.commit()
    db.refresh(rep)

    # Evaluate community consensus
    all_confs = rep.confirmations
    not_fixed_votes = sum(1 for c in all_confs if c.answer == "not_fixed")
    fixed_votes = sum(1 for c in all_confs if c.answer == "fixed")

    old_status = rep.status
    if not_fixed_votes >= 2 and not_fixed_votes > fixed_votes:
        # Reopen complaint if citizens report problem is still there!
        rep.status = "reopened"
        event = StatusEvent(
            report_id=rep.id,
            from_status=old_status,
            to_status="reopened",
            actor_id=current_user.id,
            actor_role="community",
            notes=f"Reopened by community consensus ({not_fixed_votes} votes stating defect remains unfixed)."
        )
        db.add(event)
    elif fixed_votes >= 2 and fixed_votes > not_fixed_votes:
        rep.status = "verified_fixed"
        event = StatusEvent(
            report_id=rep.id,
            from_status=old_status,
            to_status="verified_fixed",
            actor_id=current_user.id,
            actor_role="community",
            notes=f"Confirmed fixed by community votes ({fixed_votes} confirmations)."
        )
        db.add(event)

    db.commit()
    db.refresh(rep)
    return map_report_to_out(rep, current_user.id)
