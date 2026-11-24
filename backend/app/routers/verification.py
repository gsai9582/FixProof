import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Verification, Report, StatusEvent, User
from app.schemas.schemas import VerificationOut, AdminOverrideRequest, ReportOut
from app.routers.auth import require_roles
from app.routers.reports import map_report_to_out

router = APIRouter(prefix="/verification", tags=["Verification Supervision"])

@router.get("/pending", response_model=List[ReportOut])
def get_pending_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Supervisor queue: reports where Closure Verification flagged 'needs_review'.
    """
    reports = db.query(Report).filter(Report.status == "needs_review").order_by(Report.priority_score.desc()).all()
    return [map_report_to_out(r, current_user.id) for r in reports]

@router.post("/{verification_id}/override", response_model=ReportOut)
def admin_override_verification(
    verification_id: int,
    override: AdminOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Allows a municipal administrator to manually override an ambiguous verification verdict.
    """
    v = db.query(Verification).filter(Verification.id == verification_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")

    rep = db.query(Report).filter(Report.id == v.report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = rep.status
    v.admin_override = True
    v.admin_notes = override.notes
    v.verdict = override.verdict

    new_status = "verified_fixed" if override.verdict == "verified_fix" else "rejected"
    rep.status = new_status
    rep.updated_at = datetime.now(timezone.utc)

    event = StatusEvent(
        report_id=rep.id,
        from_status=old_status,
        to_status=new_status,
        actor_id=current_user.id,
        actor_role="admin",
        notes=f"Supervisor manual override to {override.verdict.upper()}. Notes: {override.notes}"
    )
    db.add(event)
    db.commit()
    db.refresh(rep)

    return map_report_to_out(rep, current_user.id)
