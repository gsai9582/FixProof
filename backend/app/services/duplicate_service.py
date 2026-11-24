import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
import imagehash
from app.models.models import Report, ReportMedia
from app.services.geo_service import haversine_distance_meters
from app.schemas.schemas import DuplicateCheckItem

def find_duplicates_for_report(
    db: Session,
    lat: float,
    lng: float,
    category: str,
    phash: Optional[str] = None,
    distance_threshold_meters: float = 50.0
) -> Tuple[bool, Optional[str], List[DuplicateCheckItem]]:
    """
    Scans existing unresolved reports within ~50m matching the same category.
    If matches exist, offers duplicate clustering to prevent ticket spam.
    Returns: (has_duplicates, cluster_id, list_of_matching_reports)
    """
    # Active / unresolved statuses that can be clustered
    active_statuses = ["reported", "in_progress", "needs_review", "reopened"]
    
    candidates = db.query(Report).filter(
        Report.category == category,
        Report.status.in_(active_statuses)
    ).all()

    nearby_items: List[DuplicateCheckItem] = []
    cluster_id = None

    for rep in candidates:
        dist = haversine_distance_meters(lat, lng, rep.lat, rep.lng)
        if dist <= distance_threshold_meters:
            # Check perceptual hash if both have phash
            is_visual_match = False
            if phash and rep.media:
                for m in rep.media:
                    if m.phash:
                        try:
                            h1 = imagehash.hex_to_hash(phash)
                            h2 = imagehash.hex_to_hash(m.phash)
                            diff = h1 - h2
                            if diff <= 12:  # strong visual scene match
                                is_visual_match = True
                                break
                        except Exception:
                            pass

            supports_count = len(rep.supports) if rep.supports else 0
            nearby_items.append(DuplicateCheckItem(
                id=rep.id,
                title=rep.title,
                category=rep.category,
                distance_meters=dist,
                created_at=rep.created_at,
                status=rep.status,
                supports_count=supports_count
            ))

            if not cluster_id:
                cluster_id = rep.cluster_id or f"cluster_{category}_{uuid.uuid4().hex[:8]}"

    has_duplicates = len(nearby_items) > 0
    return has_duplicates, cluster_id, nearby_items
