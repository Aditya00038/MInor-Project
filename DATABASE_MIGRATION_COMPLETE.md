# 🗄️ Database Migration & Backend Setup Guide

## Overview

You've successfully set up:
- ✅ **MySQL Database** with shared schema for all 3 apps
- ✅ **FastAPI Backend** with CRUD endpoints
- ✅ **Text-based Location Storage** (City, State, Country format)
- ✅ **ReportProblem.jsx** updated to use text locations

---

## 📁 New Folder Structure

```
d:\Minor Project\
├── database/                    ← SHARED BY ALL 3 APPS
│   ├── schema.sql              ← MySQL database schema (RUN THIS FIRST!)
│   ├── SETUP_GUIDE.md          ← Detailed setup instructions
│   ├── COMMANDS.md             ← Quick command reference
│   └── backup/                 ← For database backups
│
├── backend/                     ← SHARED BY ALL 3 APPS
│   ├── main.py                 ← FastAPI application
│   ├── database.py             ← MySQL connection
│   ├── schemas.py              ← Pydantic models
│   ├── requirements.txt        ← Python dependencies
│   ├── README.md               ← Backend documentation
│   ├── .env.example            ← Configuration template
│   ├── .env                    ← Your config (CREATE THIS!)
│   │
│   └── routes/
│       ├── __init__.py
│       ├── auth.py             ← Login/Register endpoints
│       ├── users.py            ← User management endpoints
│       ├── reports.py          ← Report CRUD endpoints
│       └── donations.py        ← Donation CRUD endpoints
│
├── CitizenApp/                 ← FRONTEND (Updated)
│   └── src/pages/
│       └── ReportProblem.jsx   ← NOW USES location_text!
│
├── WorkerApp/
│   └── (Similar structure)
│
└── AdminWeb/
    └── (Similar structure)
```

---

## 🚀 Step-by-Step Setup

### STEP 1: Start MySQL Service (Windows)

```bash
# Open Command Prompt as Administrator
net start MySQL80

# Verify it's running
mysql -u root -p

# If it asks for password and you don't have one, just press Enter
```

---

### STEP 2: Create Database Schema

**Option A: Command Line (Quickest)**

```bash
cd d:\Minor Project\database

mysql -u root -p < schema.sql
```

**Option B: MySQL Interactive**

```bash
mysql -u root -p

mysql> USE citizen_app_db;
mysql> SOURCE "d:\Minor Project\database\schema.sql";
mysql> SHOW TABLES;
```

**Option C: MySQL Workbench (GUI)**

1. Open MySQL Workbench
2. File → Open SQL Script → Select `schema.sql`
3. Click Execute (lightning bolt)
4. Done!

---

### STEP 3: Verify Database Creation

```bash
mysql -u root -p citizen_app_db

# Should output these 5 tables:
SHOW TABLES;

# Output:
# +--------------------------+
# | Tables_in_citizen_app_db |
# +--------------------------+
# | donations                |
# | notifications            |
# | report_comments          |
# | reports                  |
# | users                    |
# +--------------------------+
```

---

### STEP 4: Set Up Backend

```bash
# Navigate to backend folder
cd d:\Minor Project\backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Edit .env with your database credentials
```

**Your .env should look like:**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=citizen_app_db
DB_PORT=3306

PORT=8000
ENV=development
```

---

### STEP 5: Start Backend Server

```bash
# From backend folder (with venv activated)
python -m uvicorn main:app --reload

# Should show:
# Uvicorn running on http://127.0.0.1:8000
# Press CTRL+C to quit
```

---

### STEP 6: Test API

Open in browser:

```
http://localhost:8000/docs
```

You'll see interactive API documentation where you can test all endpoints!

---

## 📊 Database Schema Overview

### Users Table
Stores citizen, worker, and admin information with points system

```sql
- id (Primary Key)
- email (Unique)
- name
- phone
- role (citizen | worker | admin)
- points (Starts at 0)
- badge (citizen | bronze | silver | gold | platinum)
- status (active | inactive | suspended)
- created_at, updated_at
```

### Reports Table
Stores civic problem reports WITH TEXT LOCATION

```sql
- id (Primary Key)
- user_id (FK to users)
- category (Pothole, Drainage, etc.)
- description (Text of the problem)
- location_text ⭐ TEXT: "Mumbai, Maharashtra, India"
- latitude, longitude (For map features)
- image_url (Path to photo)
- video_url (Path to video)
- status (submitted | in-progress | done | rejected)
- points (Default 3)
- bonus_points (0 initially)
- assigned_worker_id (FK to users)
- created_at, updated_at, completed_at
```

### Donations Table
Stores donation marketplace items WITH TEXT LOCATION

```sql
- id (Primary Key)
- user_id (FK to users)
- title (Item name)
- description (Item details)
- category (electronics | clothing | furniture | etc.)
- condition (like-new | good | fair | need-repair)
- image_url (Item photo)
- location_text ⭐ TEXT: "Delhi, Delhi, India"
- status (available | claimed | completed)
- claimed_by (FK to users)
- created_at, updated_at, claimed_at
```

---

## 🔄 How It All Works Together

```
1. USER OPENS REPORT PAGE
   ↓
2. CLICKS "AUTO LOCATION"
   ↓
3. BROWSER GETS GPS COORDINATES (latitude, longitude)
   ↓
4. GPS COORDINATES SENT TO NOMINATIM API
   ↓
5. NOMINATIM RETURNS ADDRESS: "Mumbai, Maharashtra, India"
   ↓
6. SHOWS TEXT ADDRESS IN INPUT FIELD ← location_text stored!
   ↓
7. USER SUBMITS REPORT
   ↓
8. TEXT ADDRESS "Mumbai, Maharashtra, India" SAVED TO DATABASE
   ↓
9. +3 POINTS AWARDED TO USER
   ↓
10. REPORT VISIBLE ON TRACK PAGE AND TO WORKERS
```

---

## 💻 API Endpoints Quick Reference

### Users
```
GET /api/users/                           → Get all users
GET /api/users/{id}                       → Get user by ID
GET /api/users/email/{email}              → Get user by email
GET /api/users/leaderboard/top            → Get leaderboard (top 100)
GET /api/users/role/worker                → Get all workers
POST /api/users/{id}/points/{points}      → Add points to user
```

### Reports
```
GET /api/reports/                         → Get all reports
GET /api/reports?status=submitted         → Get reports by status
GET /api/reports?category=Pothole         → Get reports by category
GET /api/reports/{id}                     → Get report by ID
GET /api/reports/city/{city}              → Get reports in city
POST /api/reports/                        → Create new report ✨
PUT /api/reports/{id}                     → Update report status
DELETE /api/reports/{id}                  → Delete report
```

### Donations
```
GET /api/donations/                       → Get available donations
GET /api/donations?category=electronics   → Filter by category
GET /api/donations/{id}                   → Get donation by ID
POST /api/donations/                      → Create new donation ✨
PUT /api/donations/{id}                   → Update donation/claim
DELETE /api/donations/{id}                → Delete donation
GET /api/donations/available/all          → Get all available
GET /api/donations/category/{category}    → By category
```

---

## 🎯 Location Storage Changes

### BEFORE (Coordinates - OLD)
```javascript
formData.location = "28.7041°N, 77.1025°E"  // Latitude, Longitude
```

### NOW (Text Address - NEW) ✨
```javascript
formData.location_text = "Delhi, Delhi, India"  // City, State, Country
```

### In Database
```sql
-- OLD (coordinates)
SELECT * FROM reports WHERE location LIKE '28.%';

-- NEW (text address)
SELECT * FROM reports WHERE location_text = 'Delhi, Delhi, India';
SELECT * FROM reports WHERE city = 'Delhi';
```

---

## 🔧 Common Commands

### Start Everything

```bash
# Terminal 1: Start MySQL
net start MySQL80

# Terminal 2: Start Backend
cd d:\Minor Project\backend
venv\Scripts\activate
python -m uvicorn main:app --reload

# Terminal 3: Start Frontend
cd d:\Minor Project\CitizenApp
npm run dev
```

### Database Queries

```bash
# View all users with their points
mysql -u root -p citizen_app_db -e "SELECT name, email, points, badge FROM users ORDER BY points DESC;"

# View all reports with locations
mysql -u root -p citizen_app_db -e "SELECT id, category, location_text, status FROM reports;"

# View available donations
mysql -u root -p citizen_app_db -e "SELECT title, category, location_text FROM donations WHERE status = 'available';"

# Check report counts by city
mysql -u root -p citizen_app_db -e "SELECT city, COUNT(*) as count FROM reports GROUP BY city;"
```

### Backup Database

```bash
# Full backup
mysqldump -u root -p citizen_app_db > "d:\Minor Project\database\backup_$(date +%Y%m%d_%H%M%S).sql"

# Specific table
mysqldump -u root -p citizen_app_db reports > "d:\Minor Project\database\backup_reports.sql"
```

---

## ⚠️ Troubleshooting

### MySQL Won't Start
```bash
# Check if service exists
sc query MySQL80

# Force start
net start MySQL80

# Or use Task Manager → Services → MySQL80 → Right-click → Start
```

### Can't Connect to Database
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check port 3306 is accessible
netstat -ano | findstr :3306
```

### "Access denied" Error
```bash
# Try without password
mysql -u root

# Or set password
mysql -u root -p

# If stuck, try resetting:
mysql -u root --skip-password
```

### Backend Server Not Starting
```bash
# Check port 8000 is available
netstat -ano | findstr :8000

# Use different port if needed
python -m uvicorn main:app --reload --port 8001

# Check venv is activated (look for (venv) in prompt)
```

### Python Packages Not Found
```bash
# Make sure venv is activated
venv\Scripts\activate

# Reinstall packages
pip install -r requirements.txt --force-reinstall
```

---

## 📱 For Frontend Development

The ReportProblem.jsx now uses:

```javascript
// State
const [formData, setFormData] = useState({
  location_text: '',    // "City, State, Country"
  latitude: null,       // Still stored for map features
  longitude: null       // Still stored for map features
});

// When creating report
const reportData = {
  category: formData.category,
  description: formData.description,
  location_text: formData.location_text,  // ← Send this to backend
  latitude: formData.latitude,
  longitude: formData.longitude
};

// Backend receives and stores location_text in database
```

---

## 🎁 Sample Data

Database includes 5 sample users:

```
citizen1@example.com  - 150 points (Bronze)
citizen2@example.com  - 280 points (Silver)
worker1@example.com   - 450 points (Gold)
worker2@example.com   - 320 points (Silver)
admin@example.com     - 1000 points (Platinum)
```

You can test with these immediately!

---

## ✅ Setup Verification Checklist

- [ ] MySQL Server installed and running
- [ ] Database created: `citizen_app_db`
- [ ] All 5 tables created
- [ ] Sample data inserted
- [ ] Backend .env file created and configured
- [ ] Python virtual environment created
- [ ] Requirements installed: `pip install -r requirements.txt`
- [ ] Backend server started: `python -m uvicorn main:app --reload`
- [ ] API docs accessible: `http://localhost:8000/docs`
- [ ] Frontend running: `npm run dev`
- [ ] Report page shows text location format

---

## 🚀 Next Steps

1. **Test the System**
   - Create a test report with location
   - Verify it's stored in database as text
   - Check leaderboard shows points

2. **Connect Frontend to Backend**
   - Update API calls to use new backend endpoints
   - Remove Firebase dependencies for reports/donations
   - Test end-to-end flow

3. **Worker App**
   - Set up WorkerApp to receive reports from database
   - Add ability to update status (submitted → in-progress → done)
   - Show available reports in city/category

4. **Admin Web**
   - View analytics dashboard
   - Monitor all reports and donations
   - Manage users and workers

5. **Production Deployment**
   - Set up proper database user with limited permissions
   - Configure JWT authentication
   - Deploy backend to cloud server
   - Deploy database to managed service (AWS RDS, etc.)

---

## 📞 Quick Reference Files

| File | Purpose |
|------|---------|
| `database/schema.sql` | Database schema (run first) |
| `database/SETUP_GUIDE.md` | Detailed setup instructions |
| `database/COMMANDS.md` | Quick command reference |
| `backend/README.md` | Backend documentation |
| `backend/.env.example` | Environment template |
| `backend/main.py` | FastAPI app entry point |
| `CitizenApp/src/pages/ReportProblem.jsx` | Updated with location_text |

---

## 🎉 You're All Set!

Your system is now configured with:

✅ Single MySQL database for all 3 apps (Citizens, Workers, Admin)
✅ Text-based location storage (City, State, Country)
✅ FastAPI backend with full CRUD operations
✅ 5 database tables with proper relationships
✅ Views for leaderboard, active reports, available donations
✅ Procedures for points management
✅ Comprehensive documentation and quick commands

**Start developing!** 🚀

---

## 📚 Learning Resources

- **MySQL**: https://dev.mysql.com/doc/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **Python mysql-connector**: https://dev.mysql.com/doc/connector-python/en/

