from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="CitizenApp Backend API",
    description="Shared backend for CitizenApp, WorkerApp, and AdminWeb",
    version="1.0.0"
)

# Enable CORS for all frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # CitizenApp
        "http://localhost:5174",  # WorkersApp
        "http://localhost:5175",  # GovtWeb
        "http://localhost:5176",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from routes import reports, donations, users, auth, uploads, chatbot, admin, worker

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["File Uploads"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin & Departments"])
app.include_router(worker.router, prefix="/api/worker", tags=["Worker"])


# Serve uploaded files as static files
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "CitizenApp Backend API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "reports": "/api/reports",
            "donations": "/api/donations",
            "docs": "/docs"
        }
    }

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
