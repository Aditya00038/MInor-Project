from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ===== USER MODELS =====
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "citizen"  # citizen, worker, department, admin
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    points: Optional[int] = None
    department_id: Optional[int] = None
    worker_status: Optional[str] = None

class UserResponse(UserBase):
    id: int
    points: int
    badge: str
    reports_submitted: int
    status: str
    worker_status: Optional[str] = None
    department_name: Optional[str] = None
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

# ===== DEPARTMENT MODELS =====
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "building"
    color: str = "#3B82F6"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ===== ADMIN WORKFLOW MODELS =====
class ReportApproval(BaseModel):
    department_id: int
    priority: str = "medium"
    admin_notes: Optional[str] = None

class ReportAssignWorker(BaseModel):
    worker_id: int
    department_notes: Optional[str] = None

class ReportReject(BaseModel):
    reason: str

class WorkerStatusUpdate(BaseModel):
    worker_status: str  # available, busy, offline

# ===== EXTENDED REPORT RESPONSE FOR ADMIN =====
class ReportAdminResponse(ReportResponse):
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    admin_approved: bool = False
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    priority: str = "medium"
    admin_notes: Optional[str] = None
    department_notes: Optional[str] = None
    worker_notes: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    worker_name: Optional[str] = None
    worker_status: Optional[str] = None
    suggested_department_id: Optional[int] = None
    suggested_department_name: Optional[str] = None

# ===== WORKER RESPONSE FOR DEPARTMENT =====
class WorkerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    worker_status: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    active_tasks: int = 0

    class Config:
        from_attributes = True

# ===== STATS MODELS =====
class AdminStats(BaseModel):
    pending_count: int
    approved_count: int
    in_progress_count: int
    completed_count: int
    rejected_count: int
    available_workers: int
    busy_workers: int

class DepartmentStats(BaseModel):
    department_id: int
    department_name: str
    pending_count: int
    assigned_count: int
    in_progress_count: int
    completed_count: int
    total_workers: int
    available_workers: int
