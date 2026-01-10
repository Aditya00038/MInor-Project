from fastapi import APIRouter, HTTPException
from schemas import LoginRequest, AuthResponse, UserCreate
from database import db

router = APIRouter()

# ===== LOGIN =====
@router.post("/login")
async def login(request: LoginRequest):
    """Login user"""
    try:
        query = "SELECT * FROM users WHERE email = %s"
        result = db.execute_query(query, (request.email,), fetch=True)
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = result[0]
        
        # TODO: Verify password using bcrypt
        # For now, just return user info with dummy token
        
        return {
            "access_token": "dummy_token",
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== REGISTER =====
@router.post("/register")
async def register(user: UserCreate):
    """Register new user"""
    try:
        # Check if user exists
        check_query = "SELECT id FROM users WHERE email = %s"
        existing = db.execute_query(check_query, (user.email,), fetch=True)
        
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # TODO: Hash password using bcrypt
        
        query = """
            INSERT INTO users (email, name, phone, role)
            VALUES (%s, %s, %s, %s)
        """
        params = (user.email, user.name, user.phone, user.role)
        
        db.execute_query(query, params)
        
        # Get created user
        result = db.execute_query("SELECT * FROM users WHERE email = %s", (user.email,), fetch=True)
        
        return {
            "access_token": "dummy_token",
            "token_type": "bearer",
            "user": result[0] if result else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
