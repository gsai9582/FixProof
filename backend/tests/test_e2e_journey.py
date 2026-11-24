import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app"] == "FixProof"

def test_login_demo_users():
    # Citizen Login
    res_c = client.post("/api/auth/login", json={"email": "citizen@fixproof.org", "password": "citizen123"})
    assert res_c.status_code == 200
    assert "access_token" in res_c.json()
    assert res_c.json()["user"]["role"] == "citizen"

    # Officer Login
    res_o = client.post("/api/auth/login", json={"email": "officer@fixproof.org", "password": "officer123"})
    assert res_o.status_code == 200
    assert res_o.json()["user"]["role"] == "officer"

    # Admin Login
    res_a = client.post("/api/auth/login", json={"email": "admin@fixproof.org", "password": "admin123"})
    assert res_a.status_code == 200
    assert res_a.json()["user"]["role"] == "admin"

def test_get_reports_and_filters():
    res = client.get("/api/reports")
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) >= 40
    
    # Check category filter
    res_pothole = client.get("/api/reports?category=pothole")
    assert res_pothole.status_code == 200
    for r in res_pothole.json():
        assert r["category"] == "pothole"

def test_get_demo_scenario_a_verified_fix():
    res = client.get("/api/reports/1")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 1
    assert data["status"] == "verified_fixed"
    assert data["latest_resolution"] is not None
    assert data["latest_resolution"]["verification"] is not None
    assert data["latest_resolution"]["verification"]["verdict"] == "verified_fix"
    assert data["latest_resolution"]["verification"]["geo_pass"] is True

def test_get_demo_scenario_b_fake_fix_rejected():
    res = client.get("/api/reports/2")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 2
    assert data["status"] == "rejected"
    assert data["latest_resolution"] is not None
    assert data["latest_resolution"]["verification"] is not None
    assert data["latest_resolution"]["verification"]["verdict"] == "rejected"
    assert data["latest_resolution"]["verification"]["geo_pass"] is False
    assert data["latest_resolution"]["verification"]["geo_distance_meters"] > 3000.0

def test_accountability_summary_metrics():
    res = client.get("/api/accountability/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_reports"] >= 40
    assert data["claimed_closures"] >= 1
    assert data["verified_closures"] >= 1
    assert data["rejected_closures"] >= 1
    assert len(data["wards"]) >= 3
    assert len(data["departments"]) >= 3

def test_officer_queue_requires_role():
    # Public request should fail with 401
    res = client.get("/api/officer/queue")
    assert res.status_code == 401

    # Login as officer and access queue
    login_res = client.post("/api/auth/login", json={"email": "officer@fixproof.org", "password": "officer123"})
    token = login_res.json()["access_token"]
    res_auth = client.get("/api/officer/queue", headers={"Authorization": f"Bearer {token}"})
    assert res_auth.status_code == 200
    queue = res_auth.json()
    assert len(queue) > 0
    # Confirm queue is sorted by priority_score descending
    scores = [r["priority_score"] for r in queue]
    assert scores == sorted(scores, reverse=True)
