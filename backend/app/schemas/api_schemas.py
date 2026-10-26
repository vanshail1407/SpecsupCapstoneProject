from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

# ----------------- Auth Schemas -----------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None

# ----------------- Frame Schemas -----------------
class FrameCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    brand: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., ge=0)
    image_url: str = Field(..., min_length=5)
    quantity: int = Field(..., ge=0)
    description: Optional[str] = None
    lens_width_mm: Optional[float] = Field(None, ge=30, le=75)
    lens_height_mm: Optional[float] = Field(None, ge=20, le=65)
    bridge_width_mm: Optional[float] = Field(None, ge=10, le=30)
    frame_shape: Optional[str] = None
    frame_material: Optional[str] = None
    frame_status: Optional[str] = "active"

class FrameUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    brand: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    image_url: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    lens_width_mm: Optional[float] = Field(None, ge=30, le=75)
    lens_height_mm: Optional[float] = Field(None, ge=20, le=65)
    bridge_width_mm: Optional[float] = Field(None, ge=10, le=30)
    frame_shape: Optional[str] = None
    frame_material: Optional[str] = None
    frame_status: Optional[str] = None

class FrameResponse(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    image_url: str
    quantity: int
    description: Optional[str] = None
    lens_width_mm: Optional[float] = None
    lens_height_mm: Optional[float] = None
    bridge_width_mm: Optional[float] = None
    frame_shape: Optional[str] = None
    frame_material: Optional[str] = None
    frame_status: Optional[str] = "active"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ----------------- Reservation Schemas -----------------
class ReservationCreateRequest(BaseModel):
    frame_id: str

class ReservationResponse(BaseModel):
    id: str
    customer_id: str
    frame_id: str
    reservation_date: str
    frame_name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

# ----------------- Prescription Schemas -----------------
class PrescriptionCreateRequest(BaseModel):
    checkup_date: str
    right_sph: float
    right_cyl: float
    right_axis: int = Field(..., ge=0, le=180)
    right_pd: float
    left_sph: float
    left_cyl: float
    left_axis: int = Field(..., ge=0, le=180)
    left_pd: float
    notes: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    customer_id: str
    checkup_date: str
    right_sph: float
    right_cyl: float
    right_axis: int
    right_pd: float
    left_sph: float
    left_cyl: float
    left_axis: int
    left_pd: float
    notes: Optional[str] = None
    created_at: Optional[str] = None

# ----------------- Analysis Schemas -----------------
class TrendMetric(BaseModel):
    right_sph: float
    left_sph: float
    right_cyl: float
    left_cyl: float

class AnalysisResponse(BaseModel):
    status: str
    message: Optional[str] = None
    recommended_checkup_date: Optional[str] = None
    suggested_interval_months: Optional[int] = None
    trend_classification: Optional[str] = None
    trend: Optional[TrendMetric] = None
    explanation: Optional[str] = None
    disclaimer: str
    latest_prescription: Optional[PrescriptionResponse] = None
    history: List[PrescriptionResponse] = []

# ----------------- Recommendation Schemas -----------------
class OpticalMetricBreakdown(BaseModel):
    spherical_equivalent_od: float
    spherical_equivalent_os: float
    dominant_power: float
    prescription_category: str
    patient_pd: Optional[float] = None
    frame_pd: Optional[float] = None
    decentration_mm: Optional[float] = None
    width_penalty: float = 0.0
    height_penalty: float = 0.0
    decentration_penalty: float = 0.0
    material_bonus: float = 0.0
    shape_bonus: float = 0.0

class FrameRecommendationItem(BaseModel):
    frame: FrameResponse
    score: Optional[float] = None
    compatibility: str
    compatibility_label: str
    reasons: List[str] = []
    warnings: List[str] = []
    optical_metrics: Optional[OpticalMetricBreakdown] = None

class RecommendedFramesResponse(BaseModel):
    status: str
    message: Optional[str] = None
    latest_prescription: Optional[PrescriptionResponse] = None
    patient_summary: Optional[dict] = None
    recommendations: List[FrameRecommendationItem] = []
    disclaimer: str


