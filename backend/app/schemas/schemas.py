from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth Schemas ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field("citizen", pattern="^(citizen|officer|admin)$")
    language: str = Field("en", pattern="^(en|ta|hi)$")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: str
    language: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Media Schemas ---
class MediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    path: str
    phash: Optional[str] = None
    exif_gps_lat: Optional[float] = None
    exif_gps_lng: Optional[float] = None
    taken_at: Optional[datetime] = None
    created_at: datetime

# --- Verification & Resolution Schemas ---
class VerificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resolution_id: int
    report_id: int
    geo_pass: bool
    geo_distance_meters: float
    time_pass: bool
    time_delta_seconds: float
    scene_pass: bool
    scene_similarity_score: float
    defect_fixed: bool
    confidence: float
    verdict: str  # verified_fix, needs_review, rejected
    reasons: List[str] = []
    mode: str  # ai, basic
    admin_override: bool = False
    admin_notes: Optional[str] = None
    created_at: datetime

class ResolutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_id: int
    officer_id: int
    officer_name: Optional[str] = None
    note: str
    claimed_at: datetime
    after_media: Optional[MediaOut] = None
    verification: Optional[VerificationOut] = None

class ResolveRequest(BaseModel):
    note: str = Field(..., min_length=5, max_length=1000)
    after_lat: float
    after_lng: float
    after_timestamp: Optional[datetime] = None

# --- Report Schemas ---
class PriorityBreakdown(BaseModel):
    severity_score: float
    exposure_score: float
    corroboration_score: float
    ageing_score: float
    final_score: float
    explanation: List[str] = []

class ReportAnalyzeResponse(BaseModel):
    suggested_category: str
    suggested_title: str
    suggested_description: str
    suggested_severity: int
    hazard_cues: List[str] = []
    confidence: float
    mode: str  # ai or basic
    blur_score: float
    is_usable: bool

class ReportCreate(BaseModel):
    category: str
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    lat: float
    lng: float
    address: str
    ward: Optional[str] = "Ward 172 - Adyar"
    severity: int = Field(3, ge=1, le=5)
    language: Optional[str] = "en"
    override_duplicate: Optional[bool] = False

class DuplicateCheckItem(BaseModel):
    id: int
    title: str
    category: str
    distance_meters: float
    created_at: datetime
    status: str
    supports_count: int

class DuplicateCheckResponse(BaseModel):
    has_duplicates: bool
    cluster_id: Optional[str] = None
    nearby_reports: List[DuplicateCheckItem] = []

class StatusEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    from_status: str
    to_status: str
    actor_id: Optional[int]
    actor_role: str
    notes: Optional[str]
    created_at: datetime

class CommunityConfirmationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    answer: str
    note: Optional[str]
    created_at: datetime

class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    title: str
    description: str
    lat: float
    lng: float
    address: str
    ward: str
    status: str
    severity: int
    priority_score: float
    priority_breakdown: Optional[PriorityBreakdown] = None
    cluster_id: Optional[str] = None
    language: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    
    # Sanitized reporter info (never expose real email/identity publicly)
    reporter_display_name: str = "Citizen"
    supports_count: int = 0
    user_has_supported: bool = False
    
    media: List[MediaOut] = []
    latest_resolution: Optional[ResolutionOut] = None
    confirmations_summary: Dict[str, int] = {"fixed": 0, "not_fixed": 0}
    status_events: List[StatusEventOut] = []

# --- Community Vote Schemas ---
class CommunityVoteRequest(BaseModel):
    answer: str = Field(..., pattern="^(fixed|not_fixed)$")
    note: Optional[str] = None

# --- Admin Override Schemas ---
class AdminOverrideRequest(BaseModel):
    verdict: str = Field(..., pattern="^(verified_fix|rejected)$")
    notes: str = Field(..., min_length=5)

# --- Accountability / Dashboard Schemas ---
class DepartmentScore(BaseModel):
    department_name: str
    ward: str
    claimed_closures: int
    verified_closures: int
    integrity_score: float  # verified / claimed (0-100%)
    reopen_rate: float
    median_resolution_hours: float
    sla_breaches: int
    duplicates_merged: int
    sample_size_warning: bool

class WardScore(BaseModel):
    ward_name: str
    claimed_closures: int
    verified_closures: int
    integrity_score: float
    reopen_rate: float
    active_reports: int
    sample_size_warning: bool

class AnalyticsSummary(BaseModel):
    total_reports: int
    active_reports: int
    claimed_closures: int
    verified_closures: int
    rejected_closures: int
    reopened_reports: int
    overall_integrity_score: float
    median_time_hours: float
    category_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    wards: List[WardScore]
    departments: List[DepartmentScore]
