import json
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, Department, Report, ReportMedia, ReportSupport,
    Resolution, Verification, CommunityConfirmation, StatusEvent
)
from app.services.priority_service import calculate_priority_score
from app.services.exif_service import compute_phash

def seed_database():
    print("Scaffolding and dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    now = datetime.now(timezone.utc)

    print("Seeding Users...")
    users = [
        User(
            name="Ananya Sharma",
            email="citizen@fixproof.org",
            role="citizen",
            language="en",
            password_hash=get_password_hash("citizen123"),
            created_at=now - timedelta(days=60)
        ),
        User(
            name="Inspector R. Suresh",
            email="officer@fixproof.org",
            role="officer",
            language="en",
            password_hash=get_password_hash("officer123"),
            created_at=now - timedelta(days=90)
        ),
        User(
            name="Dr. K. Ramanathan (Zonal Admin)",
            email="admin@fixproof.org",
            role="admin",
            language="en",
            password_hash=get_password_hash("admin123"),
            created_at=now - timedelta(days=120)
        ),
        User(
            name="Karthik Rajan",
            email="karthik@fixproof.org",
            role="citizen",
            language="ta",
            password_hash=get_password_hash("citizen123"),
            created_at=now - timedelta(days=45)
        ),
        User(
            name="Priya Venkat",
            email="priya@fixproof.org",
            role="citizen",
            language="hi",
            password_hash=get_password_hash("citizen123"),
            created_at=now - timedelta(days=30)
        )
    ]
    db.add_all(users)
    db.commit()
    for u in users:
        db.refresh(u)

    citizen_user = users[0]
    officer_user = users[1]
    admin_user = users[2]
    supporter_1 = users[3]
    supporter_2 = users[4]

    print("Seeding Departments across Chennai Wards...")
    departments = [
        Department(name="Roads & Highways Department", ward="Ward 172 - Adyar", sla_days=3),
        Department(name="Solid Waste Management", ward="Ward 113 - T. Nagar", sla_days=2),
        Department(name="Electrical & Street Lighting", ward="Ward 85 - Anna Nagar", sla_days=4),
        Department(name="Chennai Metro Water & Drainage", ward="Ward 172 - Adyar", sla_days=1),
        Department(name="Public Works & Infrastructure", ward="Ward 113 - T. Nagar", sla_days=3)
    ]
    db.add_all(departments)
    db.commit()
    for d in departments:
        db.refresh(d)

    # Ward anchors
    ward_anchors = {
        "Ward 172 - Adyar": {"lat": 13.0065, "lng": 80.2560},
        "Ward 113 - T. Nagar": {"lat": 13.0415, "lng": 80.2330},
        "Ward 85 - Anna Nagar": {"lat": 13.0860, "lng": 80.2120}
    }

    print("Seeding DEMO SCENARIO A: Valid Fix -> Verified Fixed...")
    # Scenario A: Pothole on Lattice Bridge Rd, Adyar
    lat_a, lng_a = 13.0068, 80.2565
    created_a = now - timedelta(days=4)
    p_score_a, pb_a = calculate_priority_score(4, lat_a, lng_a, created_a, 2, "pothole")
    
    rep_a = Report(
        reporter_id=citizen_user.id,
        category="pothole",
        title="Deep dangerous crater on Lattice Bridge Road",
        description="Hazardous 0.8m wide pothole near Adyar Signal causing two-wheeler accidents during peak hours.",
        lat=lat_a,
        lng=lng_a,
        address="Lattice Bridge Rd, near Adyar Signal, Ward 172",
        ward="Ward 172 - Adyar",
        department_id=departments[0].id,
        status="verified_fixed",
        severity=4,
        priority_score=p_score_a,
        priority_breakdown_json=json.dumps(pb_a.model_dump()),
        cluster_id="cluster_pothole_adyar_demo",
        language="en",
        is_demo=True,
        created_at=created_a,
        updated_at=now - timedelta(hours=12)
    )
    db.add(rep_a)
    db.commit()
    db.refresh(rep_a)

    # Before photo
    media_before_a = ReportMedia(
        report_id=rep_a.id,
        type="before",
        path="/uploads/before_pothole_1.jpg",
        phash="a1b2c3d4e5f60718",
        exif_gps_lat=lat_a,
        exif_gps_lng=lng_a,
        taken_at=created_a
    )
    # After photo (Genuine - taken 6m from report)
    media_after_a = ReportMedia(
        report_id=rep_a.id,
        type="after",
        path="/uploads/after_pothole_1_valid.jpg",
        phash="a1b2c3d4e5f60719",
        exif_gps_lat=lat_a + 0.00005,
        exif_gps_lng=lng_a + 0.00004,
        taken_at=now - timedelta(hours=12)
    )
    db.add_all([media_before_a, media_after_a])
    db.commit()

    # Resolution
    res_a = Resolution(
        report_id=rep_a.id,
        officer_id=officer_user.id,
        note="Excavated base, applied tar emulsion tack coat, and compacted 40mm bitumen hot-mix. Road surface levelled.",
        after_media_id=media_after_a.id,
        claimed_at=now - timedelta(hours=12)
    )
    db.add(res_a)
    db.commit()
    db.refresh(res_a)

    # Verification (Pass)
    v_a = Verification(
        resolution_id=res_a.id,
        report_id=rep_a.id,
        geo_pass=True,
        geo_distance_meters=7.2,
        time_pass=True,
        time_delta_seconds=3.5 * 86400,
        scene_pass=True,
        scene_similarity_score=0.88,
        defect_fixed=True,
        confidence=0.94,
        verdict="verified_fix",
        reasons_json=json.dumps([
            "Geo-proximity PASS: After-photo location is 7.2m from defect (threshold: 30m).",
            "Timestamp PASS: Valid chronological in-app capture.",
            "Vision AI: Background curb line and building facade align with before photo.",
            "Vision AI: Pothole defect completely filled and compacted with asphalt."
        ]),
        mode="ai",
        created_at=now - timedelta(hours=12)
    )
    db.add(v_a)

    # Community Confirmations
    db.add(CommunityConfirmation(report_id=rep_a.id, user_id=supporter_1.id, answer="fixed", note="Drove past this morning, repair is smooth!"))
    db.add(CommunityConfirmation(report_id=rep_a.id, user_id=supporter_2.id, answer="fixed", note="Confirmed resolved."))
    
    # Status Events
    db.add(StatusEvent(report_id=rep_a.id, from_status="none", to_status="reported", actor_id=citizen_user.id, actor_role="citizen", notes="Initial complaint submitted with geotagged photo."))
    db.add(StatusEvent(report_id=rep_a.id, from_status="reported", to_status="verified_fixed", actor_id=officer_user.id, actor_role="officer", notes="Officer submitted after-photo; Closure Verification Engine returned VERIFIED FIX."))
    db.commit()


    print("Seeding DEMO SCENARIO B: Fake Fix -> Rejected...")
    # Scenario B: Pothole on Usman Rd, T. Nagar. Officer uploads photo from 4.2 km away!
    lat_b, lng_b = 13.0425, 80.2338
    created_b = now - timedelta(days=2)
    p_score_b, pb_b = calculate_priority_score(5, lat_b, lng_b, created_b, 4, "pothole")

    rep_b = Report(
        reporter_id=citizen_user.id,
        category="pothole",
        title="Dangerous trench across Usman Road pedestrian crossing",
        description="Heavy trench left open following cable laying; poses serious fall hazard near bus stop.",
        lat=lat_b,
        lng=lng_b,
        address="Usman Road near Panagal Park, Ward 113",
        ward="Ward 113 - T. Nagar",
        department_id=departments[0].id,
        status="rejected",
        severity=5,
        priority_score=p_score_b,
        priority_breakdown_json=json.dumps(pb_b.model_dump()),
        cluster_id="cluster_usman_pothole",
        language="en",
        is_demo=True,
        created_at=created_b,
        updated_at=now - timedelta(hours=3)
    )
    db.add(rep_b)
    db.commit()
    db.refresh(rep_b)

    media_before_b = ReportMedia(
        report_id=rep_b.id,
        type="before",
        path="/uploads/before_pothole_1.jpg",
        phash="b2c3d4e5f6071829",
        exif_gps_lat=lat_b,
        exif_gps_lng=lng_b,
        taken_at=created_b
    )
    # Fake After photo - coordinates 4.2 km away at Marina Beach!
    media_after_b = ReportMedia(
        report_id=rep_b.id,
        type="after",
        path="/uploads/after_pothole_1_fake.jpg",
        phash="9999888877776666",
        exif_gps_lat=13.0550,
        exif_gps_lng=80.2820,
        taken_at=now - timedelta(hours=3)
    )
    db.add_all([media_before_b, media_after_b])
    db.commit()

    res_b = Resolution(
        report_id=rep_b.id,
        officer_id=officer_user.id,
        note="Contractor reported trench backfilled and sealed.",
        after_media_id=media_after_b.id,
        claimed_at=now - timedelta(hours=3)
    )
    db.add(res_b)
    db.commit()
    db.refresh(res_b)

    v_b = Verification(
        resolution_id=res_b.id,
        report_id=rep_b.id,
        geo_pass=False,
        geo_distance_meters=4240.5,
        time_pass=True,
        time_delta_seconds=1.8 * 86400,
        scene_pass=False,
        scene_similarity_score=0.12,
        defect_fixed=False,
        confidence=0.98,
        verdict="rejected",
        reasons_json=json.dumps([
            "Geo-proximity FAIL: After-photo coordinates are 4,240m away from complaint site (limit: 30m).",
            "Scene mismatch FAIL: Background features show a coastal promenade rather than Usman Road commercial arcade.",
            "Suspected false closure attempt flagged to municipal integrity vigilance."
        ]),
        mode="ai",
        created_at=now - timedelta(hours=3)
    )
    db.add(v_b)

    db.add(StatusEvent(report_id=rep_b.id, from_status="none", to_status="reported", actor_id=citizen_user.id, actor_role="citizen", notes="Urgent pedestrian safety hazard reported."))
    db.add(StatusEvent(report_id=rep_b.id, from_status="reported", to_status="rejected", actor_id=officer_user.id, actor_role="officer", notes="False closure rejected by FixProof engine: photo submitted was 4.2km away."))
    db.commit()


    print("Seeding DEMO SCENARIO C: Fix awaiting Community Confirmation...")
    # Scenario C: Garbage cleared at Panagal Park, awaiting 72-hour community confirmation
    lat_c, lng_c = 13.0410, 80.2332
    created_c = now - timedelta(days=1, hours=8)
    p_score_c, pb_c = calculate_priority_score(3, lat_c, lng_c, created_c, 3, "garbage")

    rep_c = Report(
        reporter_id=supporter_1.id,
        category="garbage",
        title="Overflowing commercial garbage dump near Panagal Park",
        description="Piles of rotting vegetable crates and food waste blocking sidewalk; stray animals congregating.",
        lat=lat_c,
        lng=lng_c,
        address="Panagal Park South Perimeter, Ward 113",
        ward="Ward 113 - T. Nagar",
        department_id=departments[1].id,
        status="claimed_resolved",
        severity=3,
        priority_score=p_score_c,
        priority_breakdown_json=json.dumps(pb_c.model_dump()),
        cluster_id="cluster_panagal_waste",
        language="ta",
        is_demo=True,
        created_at=created_c,
        updated_at=now - timedelta(hours=6)
    )
    db.add(rep_c)
    db.commit()
    db.refresh(rep_c)

    media_before_c = ReportMedia(
        report_id=rep_c.id,
        type="before",
        path="/uploads/before_garbage_2.jpg",
        phash="c3d4e5f60718293a",
        exif_gps_lat=lat_c,
        exif_gps_lng=lng_c,
        taken_at=created_c
    )
    media_after_c = ReportMedia(
        report_id=rep_c.id,
        type="after",
        path="/uploads/after_garbage_2_valid.jpg",
        phash="c3d4e5f60718293b",
        exif_gps_lat=lat_c + 0.00008,
        exif_gps_lng=lng_c + 0.00006,
        taken_at=now - timedelta(hours=6)
    )
    db.add_all([media_before_c, media_after_c])
    db.commit()

    res_c = Resolution(
        report_id=rep_c.id,
        officer_id=officer_user.id,
        note="Conservancy compactors cleared 1.8 tons of waste. Bleaching powder sprayed.",
        after_media_id=media_after_c.id,
        claimed_at=now - timedelta(hours=6)
    )
    db.add(res_c)
    db.commit()
    db.refresh(res_c)

    v_c = Verification(
        resolution_id=res_c.id,
        report_id=rep_c.id,
        geo_pass=True,
        geo_distance_meters=11.4,
        time_pass=True,
        time_delta_seconds=1.2 * 86400,
        scene_pass=True,
        scene_similarity_score=0.84,
        defect_fixed=True,
        confidence=0.89,
        verdict="verified_fix",
        reasons_json=json.dumps([
            "Geo-proximity PASS: Distance 11.4m from report coordinates.",
            "Timestamp PASS: Valid recent capture.",
            "Vision AI: Pavement cleared, waste bin visible, no debris remaining."
        ]),
        mode="ai",
        created_at=now - timedelta(hours=6)
    )
    db.add(v_c)

    # 1 confirmation so far, waiting for more community input
    db.add(CommunityConfirmation(report_id=rep_c.id, user_id=citizen_user.id, answer="fixed", note="Looks clean now."))
    db.add(StatusEvent(report_id=rep_c.id, from_status="reported", to_status="claimed_resolved", actor_id=officer_user.id, actor_role="officer", notes="Resolution claimed. 72-hour community confirmation window active."))
    db.commit()


    print("Seeding DEMO SCENARIO D: Reopened Report by Community Consensus...")
    # Scenario D: Streetlight in Anna Nagar marked resolved, but 2 citizens voted "Not Fixed"
    lat_d, lng_d = 13.0865, 80.2125
    created_d = now - timedelta(days=7)
    p_score_d, pb_d = calculate_priority_score(3, lat_d, lng_d, created_d, 1, "broken_streetlight")

    rep_d = Report(
        reporter_id=supporter_2.id,
        category="broken_streetlight",
        title="Dead street lamp on 2nd Avenue causing dark alley",
        description="Light has been flickering and dead for 10 days. Night safety concern for women walking to metro.",
        lat=lat_d,
        lng=lng_d,
        address="2nd Avenue near Roundtana, Ward 85",
        ward="Ward 85 - Anna Nagar",
        department_id=departments[2].id,
        status="reopened",
        severity=3,
        priority_score=p_score_d + 15.0,  # Elevated priority on reopen
        priority_breakdown_json=json.dumps(pb_d.model_dump()),
        cluster_id=None,
        language="hi",
        is_demo=True,
        created_at=created_d,
        updated_at=now - timedelta(hours=4)
    )
    db.add(rep_d)
    db.commit()
    db.refresh(rep_d)

    media_before_d = ReportMedia(
        report_id=rep_d.id,
        type="before",
        path="/uploads/before_streetlight_3.jpg",
        phash="d4e5f60718293a4b",
        exif_gps_lat=lat_d,
        exif_gps_lng=lng_d,
        taken_at=created_d
    )
    db.add(media_before_d)
    db.commit()

    # Community re-verification voted NOT FIXED
    db.add(CommunityConfirmation(report_id=rep_d.id, user_id=citizen_user.id, answer="not_fixed", note="Walked by at 9 PM yesterday, light is completely dead!"))
    db.add(CommunityConfirmation(report_id=rep_d.id, user_id=supporter_1.id, answer="not_fixed", note="Still not working. Only bulb casing was cleaned."))
    db.add(StatusEvent(report_id=rep_d.id, from_status="reported", to_status="claimed_resolved", actor_id=officer_user.id, actor_role="officer", notes="Contractor marked ticket closed."))
    db.add(StatusEvent(report_id=rep_d.id, from_status="claimed_resolved", to_status="reopened", actor_id=citizen_user.id, actor_role="community", notes="Reopened automatically: community members verified defect was not fixed."))
    db.commit()


    print("Seeding ~36 additional realistic civic reports across Chennai Wards...")
    categories = ["pothole", "garbage", "water_leakage", "broken_streetlight", "drainage", "unsafe_infrastructure"]
    statuses = ["reported", "in_progress", "verified_fixed", "needs_review", "reported", "verified_fixed"]
    wards = list(ward_anchors.keys())

    titles_by_cat = {
        "pothole": [
            "Severe pothole cluster near junction", "Road depression outside school gate",
            "Asphalt breakage on bus lane", "Submerged pothole filled with rainwater",
            "Dangerous edge crater along stormwater drain", "Unpaved patch following pipeline repair"
        ],
        "garbage": [
            "Unattended municipal waste bin overflow", "Construction debris dumped on sidewalk",
            "Commercial vegetable market litter", "Plastic waste accumulation near canal bank",
            "Illegal nocturnal trash dumping spot", "Stagnant organic compost spillover"
        ],
        "water_leakage": [
            "Potable water gushing from distribution valve", "Continuous pipe seepage flooding road",
            "Broken air valve spilling clean water", "High pressure pipeline flange leak",
            "Underground pipe burst uplifting road tiles", "Drinking water fountain valve failure"
        ],
        "broken_streetlight": [
            "Dark stretch: 3 consecutive streetlights offline", "Damaged pole leaning precariously",
            "Underground cable fault leaving junction dark", "Flickering high-mast sodium lamp",
            "Exposed electrical junction box on street pole", "Solar street luminaire battery drained"
        ],
        "drainage": [
            "Stormwater drain choked with plastic silt", "Manhole cover displaced on carriageway",
            "Monsoon drain overflowing onto main road", "Foul smelling wastewater backflow",
            "Broken iron grating over pedestrian drain", "Clogged gully trap causing waterlogging"
        ],
        "unsafe_infrastructure": [
            "Broken concrete slab on pedestrian footway", "Dangling disconnected telecom cable",
            "Collapsed divider curb near U-turn", "Rusting pedestrian overbridge handrail",
            "Uncovered utility pit without warning signs", "Eroded bridge abutment joint"
        ]
    }

    sample_images = [
        "/uploads/before_pothole_1.jpg",
        "/uploads/before_garbage_2.jpg",
        "/uploads/before_streetlight_3.jpg",
        "/uploads/before_leakage_4.jpg"
    ]

    for i in range(5, 41):
        cat = random.choice(categories)
        ward = random.choice(wards)
        anchor = ward_anchors[ward]
        status_choice = random.choice(statuses)
        sev = random.randint(1, 5)
        
        # Jitter coordinates within ~1.2 km of ward anchor
        lat_offset = (random.random() - 0.5) * 0.018
        lng_offset = (random.random() - 0.5) * 0.018
        rep_lat = round(anchor["lat"] + lat_offset, 6)
        rep_lng = round(anchor["lng"] + lng_offset, 6)

        created_days_ago = random.uniform(0.5, 12.0)
        rep_created = now - timedelta(days=created_days_ago)

        title = random.choice(titles_by_cat[cat])
        dept = next((d for d in departments if d.ward == ward), departments[0])

        cluster = f"cluster_{cat}_{ward.split()[-1].lower()}" if random.random() < 0.3 else None
        supports = random.randint(0, 5)

        priority, pb = calculate_priority_score(sev, rep_lat, rep_lng, rep_created, supports, cat)

        r = Report(
            reporter_id=random.choice(users).id,
            category=cat,
            title=f"{title} - {ward.split('-')[-1].strip()}",
            description=f"Citizen reported municipal issue: {title}. Location requires field inspection and scheduled crew response.",
            lat=rep_lat,
            lng=rep_lng,
            address=f"Street No. {random.randint(12, 140)}, {ward}",
            ward=ward,
            department_id=dept.id,
            status=status_choice,
            severity=sev,
            priority_score=priority,
            priority_breakdown_json=json.dumps(pb.model_dump()),
            cluster_id=cluster,
            language=random.choice(["en", "ta", "hi"]),
            is_demo=True,
            created_at=rep_created,
            updated_at=now - timedelta(hours=random.randint(1, 24))
        )
        db.add(r)
        db.commit()
        db.refresh(r)

        # Before media
        img_path = random.choice(sample_images)
        media_b = ReportMedia(
            report_id=r.id,
            type="before",
            path=img_path,
            phash=compute_phash(b"fake" + str(i).encode()),
            exif_gps_lat=rep_lat,
            exif_gps_lng=rep_lng,
            taken_at=rep_created
        )
        db.add(media_b)

        # If verified_fixed or needs_review, add resolution & verification
        if status_choice in ("verified_fixed", "needs_review"):
            res_claimed = rep_created + timedelta(hours=random.randint(12, 48))
            res = Resolution(
                report_id=r.id,
                officer_id=officer_user.id,
                note=f"Field resolution executed for {cat}. Standard departmental repair protocol followed.",
                after_media_id=media_b.id,
                claimed_at=res_claimed
            )
            db.add(res)
            db.commit()
            db.refresh(res)

            is_ver = (status_choice == "verified_fixed")
            v = Verification(
                resolution_id=res.id,
                report_id=r.id,
                geo_pass=True,
                geo_distance_meters=round(random.uniform(4.0, 22.0), 1),
                time_pass=True,
                time_delta_seconds=36000,
                scene_pass=True,
                scene_similarity_score=round(random.uniform(0.72, 0.94), 2),
                defect_fixed=is_ver,
                confidence=round(random.uniform(0.80, 0.95), 2),
                verdict="verified_fix" if is_ver else "needs_review",
                reasons_json=json.dumps([
                    "Location coordinates match within tolerance.",
                    "Timestamp verified.",
                    "Scene features aligned with report location."
                ]),
                mode="ai" if random.random() < 0.7 else "basic",
                created_at=res_claimed
            )
            db.add(v)

        # Status event
        db.add(StatusEvent(
            report_id=r.id,
            from_status="none",
            to_status=status_choice,
            actor_id=r.reporter_id,
            actor_role="citizen",
            notes="Report logged in FixProof civic database."
        ))

    db.commit()
    print("Database seeding completed successfully with 40 realistic reports across 3 Chennai wards!")
    db.close()

if __name__ == "__main__":
    seed_database()
