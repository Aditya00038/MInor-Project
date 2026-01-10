from fastapi import APIRouter, HTTPException
from schemas import UserCreate, UserResponse, LeaderboardEntry
from database import db
from typing import List

router = APIRouter()

# ===== GET ALL USERS =====
@router.get("/", response_model=List[UserResponse])
async def get_users():
    """Get all users"""
    try:
        query = "SELECT id, email, name, phone, role, points, badge, reports_submitted, status, created_at FROM users"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET USER BY ID =====
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get user by ID"""
    try:
        query = "SELECT id, email, name, phone, role, points, badge, reports_submitted, status, created_at FROM users WHERE id = %s"
        result = db.execute_query(query, (user_id,), fetch=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET LEADERBOARD =====
@router.get("/leaderboard/top")
async def get_leaderboard():
    """Get leaderboard"""
    try:
        query = "SELECT * FROM leaderboard LIMIT 100"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET USER BY EMAIL =====
@router.get("/email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str):
    """Get user by email"""
    try:
        query = "SELECT id, email, name, phone, role, points, badge, reports_submitted, status, created_at FROM users WHERE email = %s"
        result = db.execute_query(query, (email,), fetch=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET WORKERS =====
@router.get("/role/worker")
async def get_workers():
    """Get all workers"""
    try:
        query = "SELECT id, email, name, phone, role, points, badge, reports_submitted, status, created_at FROM users WHERE role = 'worker' AND status = 'active'"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== UPDATE USER POINTS =====
@router.post("/{user_id}/points/{points}")
async def update_user_points(user_id: int, points: int):
    """Add points to user"""
    try:
        query = """
            UPDATE users 
            SET points = points + %s,
                badge = CASE 
                    WHEN points + %s >= 500 THEN 'platinum'
                    WHEN points + %s >= 300 THEN 'gold'
                    WHEN points + %s >= 200 THEN 'silver'
                    WHEN points + %s >= 100 THEN 'bronze'
                    ELSE 'citizen'
                END
            WHERE id = %s
        """
        params = (points, points, points, points, points, user_id)
        db.execute_query(query, params)
        
        # Get updated user
        result = db.execute_query("SELECT * FROM users WHERE id = %s", (user_id,), fetch=True)
        return result[0] if result else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
