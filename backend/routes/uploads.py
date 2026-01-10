import os
from fastapi import APIRouter, File, UploadFile, HTTPException
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file (image or video) for reports/donations
    Bypasses Firebase Storage CORS issues
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Limit file size to 50MB
        contents = await file.read()
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")
        
        # Generate unique filename
        timestamp = int(datetime.now().timestamp() * 1000)
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{timestamp}_{file.filename}"
        
        # Save file
        file_path = UPLOAD_DIR / unique_filename
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Return file URL
        file_url = f"/uploads/{unique_filename}"
        
        return {
            "success": True,
            "filename": unique_filename,
            "url": file_url,
            "size": len(contents),
            "timestamp": timestamp
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if upload service is running"""
    return {
        "status": "healthy",
        "upload_dir": str(UPLOAD_DIR),
        "can_write": UPLOAD_DIR.exists()
    }
