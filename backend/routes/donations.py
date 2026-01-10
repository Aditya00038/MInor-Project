from fastapi import APIRouter, HTTPException
from schemas import DonationCreate, DonationUpdate, DonationResponse
from database import db
from typing import List

router = APIRouter()

# ===== CREATE DONATION =====
@router.post("/", response_model=DonationResponse)
async def create_donation(donation: DonationCreate):
    """Create a new donation listing"""
    try:
        query = """
            INSERT INTO donations 
            (user_id, title, description, category, condition, image_url, 
             location_text, city, state, country)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            1,  # TODO: Get from auth token
            donation.title,
            donation.description,
            donation.category,
            donation.condition,
            donation.image_url,
            donation.location_text,
            donation.city,
            donation.state,
            donation.country
        )
        
        db.execute_query(query, params)
        
        # Get the created donation
        select_query = "SELECT * FROM donations ORDER BY id DESC LIMIT 1"
        result = db.execute_query(select_query, fetch=True)
        
        return result[0] if result else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET ALL DONATIONS =====
@router.get("/", response_model=List[DonationResponse])
async def get_donations(status: str = "available", category: str = None):
    """Get all donations with optional filtering"""
    try:
        query = "SELECT * FROM donations WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY created_at DESC"
        
        result = db.execute_query(query, params if params else None, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET DONATION BY ID =====
@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(donation_id: int):
    """Get a specific donation"""
    try:
        query = "SELECT * FROM donations WHERE id = %s"
        result = db.execute_query(query, (donation_id,), fetch=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== UPDATE DONATION =====
@router.put("/{donation_id}", response_model=DonationResponse)
async def update_donation(donation_id: int, donation: DonationUpdate):
    """Update a donation"""
    try:
        query = "SELECT * FROM donations WHERE id = %s"
        existing = db.execute_query(query, (donation_id,), fetch=True)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        update_query = "UPDATE donations SET"
        params = []
        updates = []
        
        if donation.status:
            updates.append(" status = %s")
            params.append(donation.status)
        
        if donation.claimed_by:
            updates.append(" claimed_by = %s")
            params.append(donation.claimed_by)
            updates.append(" claimed_at = NOW()")
        
        if updates:
            updates.append(" updated_at = NOW()")
            update_query += "," .join(updates)
            update_query += " WHERE id = %s"
            params.append(donation_id)
            
            db.execute_query(update_query, params)
        
        # Return updated donation
        result = db.execute_query("SELECT * FROM donations WHERE id = %s", (donation_id,), fetch=True)
        return result[0] if result else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== DELETE DONATION =====
@router.delete("/{donation_id}")
async def delete_donation(donation_id: int):
    """Delete a donation"""
    try:
        query = "DELETE FROM donations WHERE id = %s"
        db.execute_query(query, (donation_id,))
        return {"message": "Donation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET DONATIONS BY CATEGORY =====
@router.get("/category/{category}", response_model=List[DonationResponse])
async def get_donations_by_category(category: str):
    """Get all available donations in a category"""
    try:
        query = "SELECT * FROM donations WHERE category = %s AND status = 'available' ORDER BY created_at DESC"
        result = db.execute_query(query, (category,), fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET AVAILABLE DONATIONS VIEW =====
@router.get("/available/all")
async def get_available_donations():
    """Get all available donations from view"""
    try:
        query = "SELECT * FROM available_donations"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
