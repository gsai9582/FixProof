from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False, default="citizen")  # citizen, officer, admin
    language = Column(String(10), default="en")  # en, ta, hi
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    resolutions = relationship("Resolution", back_populates="officer")
    supports = relationship("ReportSupport", back_populates="user")
    confirmations = relationship("CommunityConfirmation", back_populates="user")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    ward = Column(String(100), nullable=False)
    sla_days = Column(Integer, default=3)

    reports = relationship("Report", back_populates="department")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    address = Column(String(255), nullable=False)
    ward = Column(String(100), default="Ward 172 - Adyar", index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Status lifecycle: reported -> in_progress -> claimed_resolved -> [verified_fixed | needs_review | rejected] -> [community: verified_fixed | disputed | reopened]
    status = Column(String(50), nullable=False, default="reported", index=True)
    severity = Column(Integer, nullable=False, default=3)  # 1-5
    priority_score = Column(Float, nullable=False, default=50.0, index=True)
    priority_breakdown_json = Column(Text, nullable=True)
    cluster_id = Column(String(100), nullable=True, index=True)
    language = Column(String(10), default="en")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    department = relationship("Department", back_populates="reports")
    media = relationship("ReportMedia", back_populates="report", cascade="all, delete-orphan")
    supports = relationship("ReportSupport", back_populates="report", cascade="all, delete-orphan")
    resolutions = relationship("Resolution", back_populates="report", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="report", cascade="all, delete-orphan")
    confirmations = relationship("CommunityConfirmation", back_populates="report", cascade="all, delete-orphan")
    status_events = relationship("StatusEvent", back_populates="report", cascade="all, delete-orphan")

class ReportMedia(Base):
    __tablename__ = "report_media"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # before, after
    path = Column(String(500), nullable=False)
    phash = Column(String(64), nullable=True)
    exif_gps_lat = Column(Float, nullable=True)
    exif_gps_lng = Column(Float, nullable=True)
    taken_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="media")

class ReportSupport(Base):
    __tablename__ = "report_supports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="supports")
    user = relationship("User", back_populates="supports")

class Resolution(Base):
    __tablename__ = "resolutions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    after_media_id = Column(Integer, ForeignKey("report_media.id"), nullable=True)
    claimed_at = Column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="resolutions")
    officer = relationship("User", back_populates="resolutions")
    after_media = relationship("ReportMedia")
    verification = relationship("Verification", back_populates="resolution", uselist=False)

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False, unique=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    
    geo_pass = Column(Boolean, nullable=False)
    geo_distance_meters = Column(Float, nullable=False)
    
    time_pass = Column(Boolean, nullable=False)
    time_delta_seconds = Column(Float, nullable=False)
    
    scene_pass = Column(Boolean, nullable=False)
    scene_similarity_score = Column(Float, nullable=False)
    
    defect_fixed = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    verdict = Column(String(30), nullable=False)  # verified_fix, needs_review, rejected
    reasons_json = Column(Text, nullable=False)  # JSON list of strings
    mode = Column(String(20), nullable=False, default="basic")  # ai, basic
    
    admin_override = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    resolution = relationship("Resolution", back_populates="verification")
    report = relationship("Report", back_populates="verifications")

class CommunityConfirmation(Base):
    __tablename__ = "community_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    answer = Column(String(20), nullable=False)  # fixed, not_fixed
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="confirmations")
    user = relationship("User", back_populates="confirmations")

class StatusEvent(Base):
    __tablename__ = "status_events"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    actor_id = Column(Integer, nullable=True)
    actor_role = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="status_events")
