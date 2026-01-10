# 🚀 Quick MySQL & Backend Commands

## Windows Command Line Quick Start

### Start MySQL Service
```bash
net start MySQL80
```

### Stop MySQL Service
```bash
net stop MySQL80
```

### Create Database from Schema
```bash
# From any directory:
mysql -u root -p < "d:\Minor Project\database\schema.sql"

# Or with full path:
cd d:\Minor Project\database
mysql -u root -p < schema.sql
```

### Login to MySQL Database
```bash
mysql -u root -p citizen_app_db
```

### Common MySQL Queries
```sql
-- View all users
SELECT * FROM users;

-- View all reports
SELECT * FROM reports;

-- View all donations
SELECT * FROM donations;

-- View leaderboard
SELECT * FROM leaderboard;

-- View active reports
SELECT * FROM active_reports;

-- View available donations
SELECT * FROM available_donations;

-- Count reports by status
SELECT status, COUNT(*) FROM reports GROUP BY status;

-- Find reports in specific city
SELECT * FROM reports WHERE city = 'Mumbai';

-- Find donations by category
SELECT * FROM donations WHERE category = 'electronics' AND status = 'available';

-- Update report status
UPDATE reports SET status = 'in-progress' WHERE id = 1;

-- Award points to user
CALL award_points(1, 10, 'Report bonus');

-- Update report with bonus
CALL update_report_status(1, 'done', 2);
```

---

## Backend Setup & Run

### First Time Setup
```bash
cd d:\Minor Project\backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env with your database credentials
```

### Run Backend Server
```bash
# Make sure you're in backend directory and venv is activated
python -m uvicorn main:app --reload

# Should show: Uvicorn running on http://127.0.0.1:8000
```

### Access API Documentation
```
Open browser: http://localhost:8000/docs
```

---

## Frontend Setup & Run

### CitizenApp Setup
```bash
cd d:\Minor Project\CitizenApp
npm install
npm run dev

# Should run on http://localhost:5173 or similar
```

### WorkerApp Setup
```bash
cd d:\Minor Project\WorkerApp
npm install
npm run dev
```

---

## Database Management Commands

### Backup Database
```bash
mysqldump -u root -p citizen_app_db > "d:\Minor Project\database\backup_$(date /+%Y%m%d_%H%M%S).sql"
```

### Export Specific Table
```bash
mysqldump -u root -p citizen_app_db reports > "d:\Minor Project\database\backup_reports.sql"
```

### Check Database Size
```bash
mysql -u root -p citizen_app_db -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = 'citizen_app_db' ORDER BY (data_length + index_length) DESC;"
```

### Optimize All Tables
```bash
mysql -u root -p citizen_app_db -e "OPTIMIZE TABLE users; OPTIMIZE TABLE reports; OPTIMIZE TABLE donations;"
```

### Reset Database (Careful!)
```bash
mysql -u root -p -e "DROP DATABASE citizen_app_db;"
mysql -u root -p < "d:\Minor Project\database\schema.sql"
```

---

## API Endpoints Reference

### Get All Users
```bash
curl http://localhost:8000/api/users/
```

### Get Leaderboard
```bash
curl http://localhost:8000/api/users/leaderboard/top
```

### Get All Reports
```bash
curl http://localhost:8000/api/reports/
```

### Get Report by ID
```bash
curl http://localhost:8000/api/reports/1
```

### Get Reports by Status
```bash
curl "http://localhost:8000/api/reports/?status=submitted"
```

### Get Reports by City
```bash
curl "http://localhost:8000/api/reports/city/Mumbai"
```

### Get All Donations
```bash
curl http://localhost:8000/api/donations/
```

### Get Available Donations
```bash
curl http://localhost:8000/api/donations/available/all
```

### Get Donations by Category
```bash
curl http://localhost:8000/api/donations/category/electronics
```

### Create Report (POST)
```bash
curl -X POST http://localhost:8000/api/reports/ \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pothole",
    "description": "Large pothole on Main Street",
    "location_text": "Mumbai, Maharashtra, India",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  }'
```

### Create Donation (POST)
```bash
curl -X POST http://localhost:8000/api/donations/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Old Laptop",
    "description": "Working laptop from 2018",
    "category": "electronics",
    "condition": "good",
    "location_text": "Delhi, Delhi, India",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India"
  }'
```

### Update Report Status
```bash
curl -X PUT http://localhost:8000/api/reports/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "assigned_worker_id": 5
  }'
```

### Update Donation Status
```bash
curl -X PUT http://localhost:8000/api/donations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "claimed",
    "claimed_by": 3
  }'
```

---

## File Locations Quick Reference

```
d:\Minor Project\
├── database\
│   ├── schema.sql          ← Database schema (run this first)
│   ├── SETUP_GUIDE.md      ← Full setup instructions
│   └── COMMANDS.md         ← This file
├── backend\
│   ├── main.py             ← FastAPI application
│   ├── database.py         ← Database connection
│   ├── schemas.py          ← Data models
│   ├── requirements.txt    ← Python dependencies
│   ├── .env.example        ← Configuration template
│   ├── .env                ← Your configuration (create from .env.example)
│   └── routes\
│       ├── auth.py         ← Authentication endpoints
│       ├── users.py        ← User endpoints
│       ├── reports.py      ← Report endpoints
│       └── donations.py    ← Donation endpoints
├── CitizenApp\
│   ├── src\
│   │   ├── pages\
│   │   │   ├── ReportProblem.jsx  ← Now uses location_text!
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── TrackReports.jsx
│   │   │   └── Donation.jsx
│   │   └── ...
│   └── ...
└── WorkerApp\
    └── ...
```

---

## Troubleshooting One-Liners

### MySQL not starting?
```bash
# Check if service exists
sc query MySQL80

# Try starting service
net start MySQL80

# Check firewall port 3306 is open
netstat -ano | findstr :3306
```

### Can't connect to database from backend?
```bash
# Test connection
mysql -h 127.0.0.1 -u root -p -e "SELECT 1;"

# Check if MySQL is running
tasklist | findstr mysql
```

### Port 8000 already in use?
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
python -m uvicorn main:app --reload --port 8001
```

### venv not activating?
```bash
# Try full path
d:\Minor Project\backend\venv\Scripts\activate

# Or run as batch
.\venv\Scripts\activate.bat
```

---

## Next Steps After Setup

1. ✅ Start MySQL: `net start MySQL80`
2. ✅ Create database: `mysql -u root -p < "d:\Minor Project\database\schema.sql"`
3. ✅ Verify tables: `mysql -u root -p citizen_app_db -e "SHOW TABLES;"`
4. ✅ Start backend: `cd backend && venv\Scripts\activate && python -m uvicorn main:app --reload`
5. ✅ Start frontend: `cd CitizenApp && npm run dev`
6. ✅ Test API: Open http://localhost:8000/docs
7. ✅ Test UI: Open http://localhost:5173

---

**All set! Your database and backend are ready! 🎉**
