from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import AnalyticsSummary, DepartmentScore, WardScore
from app.services.accountability_service import calculate_analytics_summary

router = APIRouter(prefix="/accountability", tags=["Accountability & Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Public live civic accountability overview:
    Closure Integrity Scores, reopen rates, SLA breaches, and ward leaderboards.
    """
    return calculate_analytics_summary(db)

@router.get("/departments", response_model=List[DepartmentScore])
def get_department_scores(db: Session = Depends(get_db)):
    summary = calculate_analytics_summary(db)
    return summary.departments

@router.get("/wards", response_model=List[WardScore])
def get_ward_scores(db: Session = Depends(get_db)):
    summary = calculate_analytics_summary(db)
    return summary.wards
