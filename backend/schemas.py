from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ===== USER MODELS =====
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "citizen"  # citizen, worker, admin

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    points: Optional[int] = None

class UserResponse(UserBase):
    id: int
    points: int
    badge: str
    reports_submitted: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ===== REPORT MODELS =====
class ReportBase(BaseModel):
    category: str
    description: str
    location_text: str  # Text address instead of coordinates
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ReportCreate(ReportBase):
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    assigned_worker_id: Optional[int] = None
    bonus_points: Optional[int] = None

class ReportResponse(ReportBase):
    id: int
    user_id: int
    status: str
    points: int
    bonus_points: int
    assigned_worker_id: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===== DONATION MODELS =====
class DonationBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    condition: str = "good"
    location_text: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

class DonationCreate(DonationBase):
    image_url: Optional[str] = None

class DonationUpdate(BaseModel):
    status: Optional[str] = None
    claimed_by: Optional[int] = None

class DonationResponse(DonationBase):
    id: int
    user_id: int
    status: str
    claimed_by: Optional[int] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    claimed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===== AUTH MODELS =====
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ===== LEADERBOARD MODEL =====
class LeaderboardEntry(BaseModel):
    id: int
    name: str
    email: str
    points: int
    badge: str
    reports_submitted: int
    rank: int
