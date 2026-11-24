from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List, Optional
from app.services.geo_service import calculate_exposure_score
from app.schemas.schemas import PriorityBreakdown

CATEGORY_SLA_DAYS = {
    "pothole": 3,
    "garbage": 2,
    "water_leakage": 1,
    "broken_streetlight": 4,
    "drainage": 3,
    "unsafe_infrastructure": 1
}

def calculate_priority_score(
    severity: int,
    lat: float,
    lng: float,
    created_at: datetime,
    supports_count: int = 0,
    category: str = "pothole"
) -> Tuple[float, PriorityBreakdown]:
    """
    Priority = 0.35 * Severity + 0.25 * Exposure + 0.20 * Corroboration + 0.20 * Ageing
    Each component is strictly normalized to 0 - 100.
    Returns: (final_score, PriorityBreakdown)
    """
    # 1. Severity Score (0-100)
    # Severity 1=20, 2=40, 3=60, 4=80, 5=100
    sev_normalized = float(min(5, max(1, severity))) * 20.0

    # 2. Exposure Score (0-100)
    # Proximity to schools, hospitals, transit intersections
    exp_normalized = calculate_exposure_score(lat, lng)

    # 3. Corroboration Score (0-100)
    # Base = 15. Each citizen support / merged duplicate adds 20 points
    corrob_normalized = min(100.0, 15.0 + (supports_count * 20.0))

    # 4. Ageing Score (0-100)
    # Days elapsed relative to departmental SLA
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    delta_days = (now - created_at).total_seconds() / 86400.0
    sla_days = CATEGORY_SLA_DAYS.get(category.lower(), 3)
    
    if delta_days >= sla_days:
        # Breached SLA - high ageing urgency
        ageing_normalized = min(100.0, 80.0 + ((delta_days - sla_days) / sla_days) * 20.0)
    else:
        # Within SLA
        ageing_normalized = min(80.0, (delta_days / max(1.0, float(sla_days))) * 80.0)

    # Weighted composite formula
    final = (
        0.35 * sev_normalized +
        0.25 * exp_normalized +
        0.20 * corrob_normalized +
        0.20 * ageing_normalized
    )
    final_score = round(min(100.0, max(1.0, final)), 1)

    # Human-readable "Why this rank" breakdown
    reasons: List[str] = []
    
    if severity >= 4:
        reasons.append(f"High physical severity ({severity}/5) rated by intake assessment.")
    else:
        reasons.append(f"Moderate physical severity ({severity}/5).")

    if exp_normalized >= 75.0:
        reasons.append("High public exposure zone (near sensitive school, hospital, or transit corridor).")
    elif exp_normalized >= 40.0:
        reasons.append("Standard urban road exposure.")
    else:
        reasons.append("Residential lane exposure.")

    if supports_count > 0:
        reasons.append(f"Corroborated by {supports_count} citizen report(s) / merged duplicates.")
    else:
        reasons.append("Initial single-citizen report.")

    if delta_days >= sla_days:
        reasons.append(f"Departmental SLA breached ({round(delta_days, 1)} days open vs {sla_days}-day SLA target).")
    else:
        reasons.append(f"Within SLA window ({round(delta_days, 1)}/{sla_days} days elapsed).")

    breakdown = PriorityBreakdown(
        severity_score=round(sev_normalized, 1),
        exposure_score=round(exp_normalized, 1),
        corroboration_score=round(corrob_normalized, 1),
        ageing_score=round(ageing_normalized, 1),
        final_score=final_score,
        explanation=reasons
    )

    return final_score, breakdown
