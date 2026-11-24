import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.services.geo_service import haversine_distance_meters
from app.services.ai_service import (
    verify_closure_ai,
    compute_scene_similarity_orb
)
from app.core.config import settings

def run_closure_verification(
    before_image_bytes: Optional[bytes],
    after_image_bytes: bytes,
    report_lat: float,
    report_lng: float,
    after_lat: float,
    after_lng: float,
    report_created_at: datetime,
    after_timestamp: Optional[datetime],
    category: str
) -> Dict[str, Any]:
    """
    Executes the multi-signal Closure Verification Engine:
    1. Geolocation Proximity (Haversine <= 30m)
    2. Timestamp Validity (chronological & freshness)
    3. Visual Scene Alignment & Defect Resolution (AI or ORB heuristic)
    4. Composite Verdict & Confidence Calculation
    """
    now = datetime.now(timezone.utc)
    reasons: List[str] = []

    # 1. Geolocation Proximity Check
    geo_dist = haversine_distance_meters(report_lat, report_lng, after_lat, after_lng)
    geo_pass = geo_dist <= 30.0

    if geo_pass:
        reasons.append(f"Geo-proximity PASS: Officer after-photo captured within {geo_dist:.1f}m of report (threshold: 30m).")
    else:
        reasons.append(f"Geo-proximity FAIL: Officer after-photo is {geo_dist:.1f}m away from reported coordinates (exceeds 30m threshold).")

    # 2. Timestamp Validity Check
    if after_timestamp is None:
        after_timestamp = now
        
    if after_timestamp.tzinfo is None:
        after_timestamp = after_timestamp.replace(tzinfo=timezone.utc)
    if report_created_at.tzinfo is None:
        report_created_at = report_created_at.replace(tzinfo=timezone.utc)

    time_delta = (after_timestamp - report_created_at).total_seconds()
    future_skew = (after_timestamp - now).total_seconds()
    
    # Must be after report creation, not in future (> 300s), and not older than 30 days
    time_pass = (time_delta >= 0) and (future_skew <= 300) and ((now - after_timestamp).total_seconds() <= 86400 * 30)

    if time_pass:
        reasons.append("Timestamp PASS: Photo timestamp is chronological, recent, and valid.")
    else:
        reasons.append("Timestamp FAIL: Photo timestamp is invalid, preceded the complaint, or is in the future.")

    # 3. Visual Scene & Defect Resolution Check
    mode = "basic"
    scene_pass = True
    scene_similarity_score = 0.50
    defect_fixed = False
    ai_confidence = 0.65

    # Run AI mode if key is available and before image exists
    ai_attempted = False
    if settings.GEMINI_API_KEY and before_image_bytes:
        try:
            ai_res = verify_closure_ai(before_image_bytes, after_image_bytes, category)
            mode = "ai"
            ai_attempted = True
            
            ai_verdict = ai_res.get("verdict", "inconclusive").lower()
            scene_pass = bool(ai_res.get("scene_match", True))
            defect_fixed = bool(ai_res.get("defect_fixed", False))
            ai_confidence = float(ai_res.get("confidence", 0.85))
            
            for r in ai_res.get("reasons", []):
                reasons.append(f"Vision AI: {r}")
                
            if ai_verdict == "different_location":
                scene_pass = False
                defect_fixed = False
            elif ai_verdict == "not_fixed":
                defect_fixed = False
            elif ai_verdict == "fixed":
                defect_fixed = True
                scene_pass = True

            scene_similarity_score = 0.85 if scene_pass else 0.20
        except Exception as e:
            reasons.append(f"AI comparison exception ({type(e).__name__}); fell back to Basic OpenCV heuristic.")
            mode = "basic"

    # Fallback to Basic Mode (OpenCV ORB feature matching)
    if not ai_attempted:
        mode = "basic"
        if before_image_bytes:
            score, s_pass = compute_scene_similarity_orb(before_image_bytes, after_image_bytes)
            scene_similarity_score = score
            scene_pass = s_pass
            reasons.append(f"Basic Mode: ORB visual keypoint match score {score * 100:.1f}%.")
            if not scene_pass:
                reasons.append("Basic Mode: Insufficient structural keypoint overlap between before and after scene.")
        else:
            reasons.append("Basic Mode: No original before photo found; defaulting to inspection queue.")
            scene_pass = True
            scene_similarity_score = 0.50

    # 4. Multi-Signal Decision Matrix
    if not geo_pass:
        verdict = "rejected"
        confidence = 0.96
        reasons.append("Final Verdict: REJECTED due to geographic location mismatch.")
    elif not time_pass:
        verdict = "rejected"
        confidence = 0.95
        reasons.append("Final Verdict: REJECTED due to invalid or stale timestamp.")
    elif not scene_pass:
        verdict = "rejected"
        confidence = 0.90 if mode == "ai" else 0.75
        reasons.append("Final Verdict: REJECTED because after-photo was captured at a different location/scene.")
    else:
        # Geo and Time and Scene passed
        if mode == "ai":
            if defect_fixed and ai_confidence >= 0.70:
                verdict = "verified_fix"
                confidence = round(ai_confidence, 2)
                reasons.append("Final Verdict: VERIFIED FIX. All multi-signal integrity checks passed.")
            elif not defect_fixed:
                verdict = "rejected"
                confidence = round(ai_confidence, 2)
                reasons.append("Final Verdict: REJECTED. Defect is still present in after-photo.")
            else:
                verdict = "needs_review"
                confidence = round(ai_confidence, 2)
                reasons.append("Final Verdict: NEEDS REVIEW. Moderate confidence; escalated for supervisor verification.")
        else:
            # Basic Mode honest classification
            verdict = "needs_review"
            confidence = 0.65
            reasons.append("Final Verdict: NEEDS REVIEW (Basic Heuristic Mode). Cannot autonomously verify defect removal without Vision AI.")

    return {
        "geo_pass": geo_pass,
        "geo_distance_meters": geo_dist,
        "time_pass": time_pass,
        "time_delta_seconds": time_delta,
        "scene_pass": scene_pass,
        "scene_similarity_score": scene_similarity_score,
        "defect_fixed": defect_fixed,
        "confidence": confidence,
        "verdict": verdict,
        "reasons": reasons,
        "mode": mode
    }
