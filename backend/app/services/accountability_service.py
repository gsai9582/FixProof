import statistics
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Report, Resolution, Verification, Department, CommunityConfirmation
from app.schemas.schemas import DepartmentScore, WardScore, AnalyticsSummary

def calculate_analytics_summary(db: Session) -> AnalyticsSummary:
    """
    Computes real-time Closure Integrity Scores, reopen rates, SLA breaches,
    and median resolution times across all wards and departments.
    """
    reports = db.query(Report).all()
    total_reports = len(reports)
    
    active_statuses = ["reported", "in_progress", "needs_review", "reopened"]
    active_reports = sum(1 for r in reports if r.status in active_statuses)
    
    # Resolutions & Verifications
    resolutions = db.query(Resolution).all()
    claimed_closures = len(resolutions)
    
    verifications = db.query(Verification).all()
    verified_closures = sum(1 for v in verifications if v.verdict == "verified_fix")
    rejected_closures = sum(1 for v in verifications if v.verdict == "rejected")
    reopened_reports = sum(1 for r in reports if r.status == "reopened")

    # Overall Closure Integrity Score: verified / claimed
    if claimed_closures > 0:
        overall_integrity = round((verified_closures / claimed_closures) * 100.0, 1)
    else:
        overall_integrity = 100.0 if total_reports == 0 else 0.0

    # Calculate median resolution time in hours for verified closures
    resolution_times_hours = []
    for r in reports:
        if r.status == "verified_fixed" and r.resolutions:
            res = r.resolutions[-1]
            diff = (res.claimed_at - r.created_at).total_seconds() / 3600.0
            if diff >= 0:
                resolution_times_hours.append(diff)
                
    median_time_hours = round(statistics.median(resolution_times_hours), 1) if resolution_times_hours else 24.0

    # Distributions
    category_dist: Dict[str, int] = {}
    status_dist: Dict[str, int] = {}
    for r in reports:
        category_dist[r.category] = category_dist.get(r.category, 0) + 1
        status_dist[r.status] = status_dist.get(r.status, 0) + 1

    # Ward-level computation
    wards_map: Dict[str, Dict[str, Any]] = {}
    for r in reports:
        w = r.ward or "Ward 172 - Adyar"
        if w not in wards_map:
            wards_map[w] = {
                "claimed": 0,
                "verified": 0,
                "reopened": 0,
                "active": 0,
                "total": 0
            }
        wards_map[w]["total"] += 1
        if r.status in active_statuses:
            wards_map[w]["active"] += 1
        if r.status == "reopened":
            wards_map[w]["reopened"] += 1
            
        for res in r.resolutions:
            wards_map[w]["claimed"] += 1
            if res.verification and res.verification.verdict == "verified_fix":
                wards_map[w]["verified"] += 1

    ward_scores: List[WardScore] = []
    for w_name, data in sorted(wards_map.items()):
        claimed = data["claimed"]
        verified = data["verified"]
        score = round((verified / claimed * 100.0), 1) if claimed > 0 else 0.0
        reopen_rate = round((data["reopened"] / max(1, data["total"]) * 100.0), 1)
        ward_scores.append(WardScore(
            ward_name=w_name,
            claimed_closures=claimed,
            verified_closures=verified,
            integrity_score=score,
            reopen_rate=reopen_rate,
            active_reports=data["active"],
            sample_size_warning=(claimed < 5)
        ))

    # Department-level computation
    departments = db.query(Department).all()
    dept_scores: List[DepartmentScore] = []
    
    for dept in departments:
        dept_reports = [r for r in reports if r.department_id == dept.id]
        claimed = 0
        verified = 0
        reopened = 0
        sla_breaches = 0
        dept_times = []
        cluster_set = set()

        for r in dept_reports:
            if r.status == "reopened":
                reopened += 1
            if r.cluster_id:
                cluster_set.add(r.cluster_id)
            
            # SLA breach check
            delta_days = (r.updated_at - r.created_at).total_seconds() / 86400.0
            if delta_days > dept.sla_days and r.status != "verified_fixed":
                sla_breaches += 1

            for res in r.resolutions:
                claimed += 1
                if res.verification and res.verification.verdict == "verified_fix":
                    verified += 1
                    diff = (res.claimed_at - r.created_at).total_seconds() / 3600.0
                    if diff >= 0:
                        dept_times.append(diff)

        score = round((verified / claimed * 100.0), 1) if claimed > 0 else 0.0
        reopen_rate = round((reopened / max(1, len(dept_reports)) * 100.0), 1)
        med_hours = round(statistics.median(dept_times), 1) if dept_times else 18.0

        dept_scores.append(DepartmentScore(
            department_name=dept.name,
            ward=dept.ward,
            claimed_closures=claimed,
            verified_closures=verified,
            integrity_score=score,
            reopen_rate=reopen_rate,
            median_resolution_hours=med_hours,
            sla_breaches=sla_breaches,
            duplicates_merged=len(cluster_set),
            sample_size_warning=(claimed < 5)
        ))

    return AnalyticsSummary(
        total_reports=total_reports,
        active_reports=active_reports,
        claimed_closures=claimed_closures,
        verified_closures=verified_closures,
        rejected_closures=rejected_closures,
        reopened_reports=reopened_reports,
        overall_integrity_score=overall_integrity,
        median_time_hours=median_time_hours,
        category_distribution=category_dist,
        status_distribution=status_dist,
        wards=ward_scores,
        departments=dept_scores
    )
