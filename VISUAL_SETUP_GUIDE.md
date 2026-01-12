# 🏗️ DATABASE & BACKEND SETUP VISUAL GUIDE

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   CITIZENAPP ECOSYSTEM                       │
└─────────────────────────────────────────────────────────────┘

                      🌐 SHARED BACKEND
                   http://localhost:8000
                      (FastAPI + Python)
                              ↑
                              │
                ┌─────────────┼─────────────┐
                │             │             │
           🗄️ MYSQL          🗄️ MYSQL      🗄️ MYSQL
     (citizen_app_db)    (citizen_app_db) (citizen_app_db)
                │             │             │
                ↓             ↓             ↓
            ┌─────────┐  ┌─────────┐  ┌──────────┐
            │Citizen  │  │ Worker  │  │  Admin   │
            │  App    │  │   App   │  │   Web    │
            │ (React) │  │ (React) │  │ (React)  │
            │:5173    │  │:5174    │  │  :3000   │
            └─────────┘  └─────────┘  └──────────┘

            SINGLE DATABASE = ALL 3 APPS
```

---

## 📊 Database Schema Diagram

```
                    citizen_app_db
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───────┐          ┌────────┐        ┌──────────┐
    │ users │          │reports │        │donations │
    │       │          │        │        │          │
    ├───────┤          ├────────┤        ├──────────┤
    │id(PK) │          │id(PK)  │        │id(PK)    │
    │email  │◄─────────│user_id │        │user_id   │
    │name   │          │        │        │          │
    │role   │          │category│        │title     │
    │points │          │desc    │        │category  │
    │badge  │          │location│        │location  │
    │       │          │_text✨ │        │_text✨   │
    │       │          │image   │        │image     │
    │       │          │status  │        │status    │
    │       │          │points  │        │condition │
    └───────┘          └────────┘        └──────────┘
        ▲                                      
        │                            
        └─────────────────────────────────────

    ✨ NEW: location_text field = "City, State, Country"
            instead of "lat, long" coordinates
```

---

## 🚀 Setup Timeline

```
TIME      STEP                        COMMAND/ACTION
────────────────────────────────────────────────────────
0 min  → Start MySQL Service         net start MySQL80
        ↓
        (Wait 2 seconds)
        ↓
3 min  → Create Database             mysql -u root -p < schema.sql
        ↓
        (Wait 10-20 seconds)
        ↓
5 min  → Verify Tables               mysql -u root -p citizen_app_db -e "SHOW TABLES;"
        ↓
        (Should see 5 tables)
        ↓
7 min  → Setup Backend               cd backend
        ↓                              python -m venv venv
        ↓                              venv\Scripts\activate
        ↓                              pip install -r requirements.txt
        ↓
15 min → Configure Backend            copy .env.example .env
        ↓                              (Edit .env if needed)
        ↓
17 min → Start Backend                python -m uvicorn main:app --reload
        ↓
        (See: Uvicorn running on http://127.0.0.1:8000)
        ↓
18 min → Test API                     Open: http://localhost:8000/docs
        ↓
        (See: Swagger UI with all endpoints)
        ↓
20 min → Start Frontend               npm run dev (in CitizenApp folder)
        ↓
        (See: http://localhost:5173)
        ↓
22 min → Test Complete                ✅ Everything Working!
```

---

## 📁 File Organization

```
d:\Minor Project\
│
├── 📄 SETUP_COMPLETE.md ← START HERE!
├── 📄 DATABASE_MIGRATION_COMPLETE.md
│
├── 📂 database/
│   ├── 📄 schema.sql ⭐ RUN THIS FIRST!
│   ├── 📄 BUILD_COMMANDS.md ← Copy-paste SQL
│   ├── 📄 SETUP_GUIDE.md ← Detailed guide
│   ├── 📄 COMMANDS.md ← Quick reference
│   ├── 📄 RUN_THESE_COMMANDS.txt ← Step-by-step
│   └── 📂 backup/ (for backups)
│
├── 📂 backend/
│   ├── 📄 main.py ⭐ FastAPI app
│   ├── 📄 database.py (MySQL connector)
│   ├── 📄 schemas.py (data models)
│   ├── 📄 requirements.txt (dependencies)
│   ├── 📄 README.md (backend docs)
│   ├── 📄 .env.example (config template)
│   ├── 📄 .env (YOUR config - create this!)
│   └── 📂 routes/
│       ├── 📄 __init__.py
│       ├── 📄 auth.py
│       ├── 📄 users.py
│       ├── 📄 reports.py
│       └── 📄 donations.py
│
├── 📂 CitizenApp/
│   ├── src/pages/
│   │   └── 📄 ReportProblem.jsx ⭐ UPDATED!
│   └── ... other files
│
├── 📂 WorkerApp/
│   └── ... similar structure
│
└── 📂 AdminWeb/
    └── ... similar structure
```

---

## 🎯 Quick Reference Card

### Commands You'll Need

```bash
# Start MySQL
net start MySQL80

# Create database
mysql -u root -p < "d:\Minor Project\database\schema.sql"

# Verify
mysql -u root -p citizen_app_db -e "SHOW TABLES;"

# Setup backend
cd d:\Minor Project\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run backend
python -m uvicorn main:app --reload

# Run frontend
cd d:\Minor Project\CitizenApp
npm run dev
```

### URLs to Access

| URL | Purpose |
|-----|---------|
| `http://localhost:8000/docs` | API Documentation (test endpoints) |
| `http://localhost:8000/health` | API Health Check |
| `http://localhost:5173` | CitizenApp (or assigned port) |
| `http://localhost:5174` | WorkerApp (future) |
| `http://localhost:3000` | AdminWeb (future) |

---

## ✅ Validation Checklist

Print this and check off as you go:

```
MYSQL SERVICE
□ MySQL service started (net start MySQL80)
□ Can connect (mysql -u root -p)

DATABASE SETUP
□ Database created (citizen_app_db)
□ Users table created (5 rows)
□ Reports table created (location_text field exists)
□ Donations table created
□ Comments table created
□ Notifications table created

DATABASE FEATURES
□ Views created (3)
□ Procedures created (2)
□ Indexes created (15+)
□ Sample data loaded (5 users)

BACKEND SETUP
□ Python virtual environment created
□ Dependencies installed (requirements.txt)
□ .env file created and configured
□ main.py file exists
□ database.py file exists
□ routes folder with 4 files
□ Backend running (Uvicorn)

BACKEND TESTING
□ API docs accessible (localhost:8000/docs)
□ /api/users/ endpoint works
□ /api/users/leaderboard/top works
□ /api/reports/ endpoint works
□ /api/donations/ endpoint works

FRONTEND
□ CitizenApp running (npm run dev)
□ ReportProblem.jsx shows location_text format
□ Can submit report with location
□ Can view donations

INTEGRATION
□ Backend receives data from frontend
□ Data saved to MySQL database
□ Can retrieve data via API
□ Points system working
```

---

## 🎓 Key Concepts

### 1. Single Database for All Apps
```
All 3 frontends (CitizenApp, WorkerApp, AdminWeb)
              ↓
        Shared backend API
              ↓
      Single MySQL database
```

### 2. Location Storage (TEXT vs COORDINATES)
```
OLD (Coordinates):
  location = "28.7041, 77.1025" ❌

NEW (Text Address):
  location_text = "Delhi, Delhi, India" ✅

Advantages:
  ✅ More readable
  ✅ Easier to filter by city
  ✅ User-friendly display
  ✅ Still stores lat/long for maps
```

### 3. API-First Architecture
```
Frontend ←→ REST API ←→ MySQL Database
         (FastAPI)
```

---

## 🚨 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| MySQL won't start | `net start MySQL80` |
| Can't connect to DB | Check MySQL service running, verify .env |
| Table doesn't exist | Run `mysql -u root -p < schema.sql` again |
| Backend won't start | Check port 8000 available, venv activated |
| Port 8000 in use | Use `--port 8001` flag |
| No venv | Create: `python -m venv venv` |
| Packages missing | Reinstall: `pip install -r requirements.txt` |

---

## 🎁 Bonus: Database Backup

```bash
# Backup current database
mysqldump -u root -p citizen_app_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u root -p citizen_app_db < backup_20260110_120000.sql
```

---

## 📊 Database at a Glance

```
Database Name:      citizen_app_db
Tables:             5 (users, reports, donations, comments, notifications)
Views:              3 (leaderboard, active_reports, available_donations)
Procedures:         2 (award_points, update_report_status)
Rows (initial):     5 sample users
API Endpoints:      20+
Backend Framework:  FastAPI
Database Driver:    mysql-connector-python
Python Version:     3.11+
```

---

## 🏁 Final Checklist

✅ Database schema created
✅ Backend API built
✅ Location format changed to text
✅ Frontend updated
✅ Documentation complete
✅ Sample data included
✅ Ready for development

---

## 🎉 You're Ready to Build!

```
╔════════════════════════════════════════╗
║   CITIZENAPP SETUP COMPLETE! ✅        ║
║                                        ║
║   Database:    citizen_app_db          ║
║   Backend:     http://localhost:8000   ║
║   API Docs:    /docs                   ║
║   Frontend:    http://localhost:5173   ║
║                                        ║
║   START DEVELOPING! 🚀                 ║
╚════════════════════════════════════════╝
```

---

**Created:** January 10, 2026
**Status:** ✅ Ready for Development
**Next Step:** Run setup commands in RUN_THESE_COMMANDS.txt

