from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from schemas import ReportCreate, ReportUpdate, ReportResponse
from database import db
from typing import List, Dict
from utils.geocoding import GeocodingService
from utils.image_classification import ImageClassificationService

router = APIRouter()

# ===== GEOCODING ENDPOINT =====
@router.post("/geocode")
async def reverse_geocode(data: Dict):
    """
    Convert GPS coordinates to privacy-respecting address
    Privacy: No house numbers or exact addresses exposed
    """
    try:
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude required")
        
        # Validate coordinates
        if not await GeocodingService.validate_coordinates(latitude, longitude):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
        
        # Get privacy-safe address
        address = await GeocodingService.reverse_geocode(latitude, longitude)
        
        return {
            "success": True,
            "address": address,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")

# ===== IMAGE CLASSIFICATION ENDPOINT =====
@router.post("/classify-image")
async def classify_image(file: UploadFile = File(...)):
    """
    Classify civic problem from uploaded image
    Uses free Hugging Face API - no billing required
    Returns category suggestion with confidence score
    """
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Classify image
        result = await ImageClassificationService.classify_image(image_bytes)
        
        return {
            "success": True,
            "classification": result,
            "available_categories": ImageClassificationService.get_available_categories()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

# ===== CREATE REPORT =====
@router.post("/", response_model=ReportResponse)
async def create_report(report: ReportCreate):
    """Create a new report"""
    try:
        # Try to suggest department based on category
        suggested_dept_id = None
        try:
            dept_query = """
                SELECT d.id FROM category_department_map cdm
                JOIN departments d ON cdm.department_id = d.id
                WHERE LOWER(cdm.category) LIKE LOWER(%s)
                LIMIT 1
            """
            dept_result = db.execute_query(dept_query, (f"%{report.category}%",), fetch=True)
            if dept_result:
                suggested_dept_id = dept_result[0]['id']
        except:
            pass  # Ignore if category mapping doesn't exist
        
        query = """
            INSERT INTO reports 
            (user_id, category, description, location_text, city, state, country, 
             latitude, longitude, image_url, video_url, points, status, suggested_department_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            1,  # TODO: Get from auth token
            report.category,
            report.description,
            report.location_text,
            report.city,
            report.state,
            report.country,
            report.latitude,
            report.longitude,
            report.image_url,
            report.video_url,
            3,  # Default 3 points
            'pending',  # New reports start as pending
            suggested_dept_id
        )
        
        db.execute_query(query, params)
        
        # Get the created report
        select_query = "SELECT * FROM reports ORDER BY id DESC LIMIT 1"
        result = db.execute_query(select_query, fetch=True)
        
        return result[0] if result else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET ALL REPORTS =====
@router.get("/", response_model=List[ReportResponse])
async def get_reports(status: str = None, category: str = None):
    """Get all reports with optional filtering"""
    try:
        query = "SELECT * FROM reports WHERE 1=1"
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

# ===== GET REPORT BY ID =====
@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int):
    """Get a specific report"""
    try:
        query = "SELECT * FROM reports WHERE id = %s"
        result = db.execute_query(query, (report_id,), fetch=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== UPDATE REPORT =====
@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(report_id: int, report: ReportUpdate):
    """Update a report"""
    try:
        query = "SELECT * FROM reports WHERE id = %s"
        existing = db.execute_query(query, (report_id,), fetch=True)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Report not found")
        
        update_query = "UPDATE reports SET"
        params = []
        updates = []
        
        if report.status:
            updates.append(" status = %s")
            params.append(report.status)
        
        if report.assigned_worker_id:
            updates.append(" assigned_worker_id = %s")
            params.append(report.assigned_worker_id)
        
        if report.bonus_points is not None:
            updates.append(" bonus_points = %s")
            params.append(report.bonus_points)
        
        if updates:
            updates.append(" updated_at = NOW()")
            update_query += "," .join(updates)
            update_query += " WHERE id = %s"
            params.append(report_id)
            
            db.execute_query(update_query, params)
        
        # Return updated report
        result = db.execute_query("SELECT * FROM reports WHERE id = %s", (report_id,), fetch=True)
        return result[0] if result else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== DELETE REPORT =====
@router.delete("/{report_id}")
async def delete_report(report_id: int):
    """Delete a report"""
    try:
        query = "DELETE FROM reports WHERE id = %s"
        db.execute_query(query, (report_id,))
        return {"message": "Report deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET REPORTS BY CITY =====
@router.get("/city/{city}", response_model=List[ReportResponse])
async def get_reports_by_city(city: str):
    """Get all reports for a specific city"""
    try:
        query = "SELECT * FROM reports WHERE city = %s AND status != 'done' ORDER BY created_at DESC"
        result = db.execute_query(query, (city,), fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET LEADERBOARD =====
@router.get("/leaderboard/top")
async def get_leaderboard():
    """Get leaderboard"""
    try:
        query = "SELECT * FROM leaderboard LIMIT 50"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
