import pytest
from datetime import datetime, timedelta, timezone
from app.services.geo_service import haversine_distance_meters, calculate_exposure_score
from app.services.priority_service import calculate_priority_score
from app.services.verification_engine import run_closure_verification
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

def test_haversine_distance_accuracy():
    # Distance between Adyar Signal (13.0063, 80.2550) and Fortis Malar (13.0060, 80.2585)
    # Approx 380 meters
    dist = haversine_distance_meters(13.0063, 80.2550, 13.0060, 80.2585)
    assert 360.0 <= dist <= 400.0, f"Expected ~380m, got {dist}m"

    # Exact same point should be 0.0m
    dist_zero = haversine_distance_meters(13.0063, 80.2550, 13.0063, 80.2550)
    assert dist_zero == 0.0

def test_exposure_score_proximity():
    # Right at Anna University Guindy anchor (13.0102, 80.2355)
    score_high = calculate_exposure_score(13.0102, 80.2355)
    assert score_high >= 85.0

    # Far away point in quiet suburb
    score_low = calculate_exposure_score(13.2000, 80.0500)
    assert score_low <= 35.0

def test_explainable_priority_score_calculation():
    now = datetime.now(timezone.utc)
    created_at = now - timedelta(days=5)  # 5 days old (breached 3-day SLA for pothole)
    
    score, breakdown = calculate_priority_score(
        severity=5,
        lat=13.0063,
        lng=80.2550,
        created_at=created_at,
        supports_count=3,
        category="pothole"
    )
    # High severity (100) + High exposure + Corroboration + Breached SLA Ageing
    assert score >= 75.0, f"Expected high priority for critical pothole, got {score}"
    assert breakdown.severity_score == 100.0
    assert len(breakdown.explanation) >= 3

def test_closure_verification_fake_fix_rejected():
    now = datetime.now(timezone.utc)
    report_lat, report_lng = 13.0068, 80.2565  # Adyar
    fake_lat, fake_lng = 13.0550, 80.2820      # Marina Beach (4.2 km away)

    res = run_closure_verification(
        before_image_bytes=None,
        after_image_bytes=b"sample_after_image_bytes",
        report_lat=report_lat,
        report_lng=report_lng,
        after_lat=fake_lat,
        after_lng=fake_lng,
        report_created_at=now - timedelta(days=2),
        after_timestamp=now,
        category="pothole"
    )
    assert res["geo_pass"] is False
    assert res["geo_distance_meters"] > 3000.0
    assert res["verdict"] == "rejected"
    assert any("Geo-proximity FAIL" in r for r in res["reasons"])

def test_closure_verification_valid_coordinates():
    now = datetime.now(timezone.utc)
    report_lat, report_lng = 13.0068, 80.2565
    after_lat, after_lng = 13.00685, 80.25655  # ~7 meters away

    res = run_closure_verification(
        before_image_bytes=None,
        after_image_bytes=b"sample_after_image_bytes",
        report_lat=report_lat,
        report_lng=report_lng,
        after_lat=after_lat,
        after_lng=after_lng,
        report_created_at=now - timedelta(days=1),
        after_timestamp=now,
        category="pothole"
    )
    assert res["geo_pass"] is True
    assert res["time_pass"] is True
    assert res["geo_distance_meters"] <= 30.0
    # In Basic Mode without API key, honest classification gives 'needs_review' rather than false 100% claim
    assert res["verdict"] in ("verified_fix", "needs_review")

def test_closure_verification_future_timestamp_rejected():
    now = datetime.now(timezone.utc)
    report_lat, report_lng = 13.0068, 80.2565

    res = run_closure_verification(
        before_image_bytes=None,
        after_image_bytes=b"sample_after_image_bytes",
        report_lat=report_lat,
        report_lng=report_lng,
        after_lat=report_lat,
        after_lng=report_lng,
        report_created_at=now - timedelta(days=1),
        after_timestamp=now + timedelta(days=2),  # Future date fraud
        category="pothole"
    )
    assert res["time_pass"] is False
    assert res["verdict"] == "rejected"

def test_auth_password_and_jwt_tokens():
    password = "SafeOfficerPassword2026!"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    token = create_access_token(subject=42, role="officer")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == "officer"
