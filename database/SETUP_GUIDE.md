# 🗄️ MySQL Database Setup Guide

## Complete Database Setup for CitizenApp

This guide will help you set up the MySQL database for CitizenApp, WorkerApp, and AdminWeb.

---

## 📋 Prerequisites

- MySQL Server installed (version 8.0+ recommended)
- MySQL Workbench (optional but recommended)
- Basic knowledge of command line
- Database folder location: `d:\Minor Project\database\`

---

## 🚀 Quick Setup (Windows)

### Step 1: Open MySQL Command Line

```bash
# Open Command Prompt as Administrator
mysql -u root -p
```

If you don't have a password set, just press Enter:
```bash
mysql -u root
```

---

### Step 2: Create Database

Run all SQL commands from `database/schema.sql`

**Option A: Using Command Line**

```bash
mysql -u root -p < "d:\Minor Project\database\schema.sql"
```

**Option B: Using MySQL Interactive Mode**

```bash
mysql> SOURCE "d:\Minor Project\database\schema.sql";
```

**Option C: Using MySQL Workbench**

1. Open MySQL Workbench
2. Click "File" → "Open SQL Script"
3. Select `d:\Minor Project\database\schema.sql`
4. Click the lightning bolt icon to execute

---

## 📊 What Gets Created

When you run the schema, these tables are automatically created:

### 1. **users** table
```sql
- id (Primary Key)
- email (Unique)
- name
- phone
- role (citizen, worker, admin)
- points (default 0)
- badge (citizen, bronze, silver, gold, platinum)
- status (active, inactive, suspended)
- timestamps
```

### 2. **reports** table
```sql
- id (Primary Key)
- user_id (Foreign Key → users)
- category
- description
- location_text (TEXT ADDRESS - NOT COORDINATES!)
- city, state, country
- latitude, longitude (stored for reference)
- image_url, video_url
- status (submitted, in-progress, done, rejected)
- points (3 default)
- bonus_points
- assigned_worker_id
- timestamps
```

### 3. **donations** table
```sql
- id (Primary Key)
- user_id (Foreign Key → users)
- title, description
- category (electronics, clothing, furniture, etc.)
- condition (like-new, good, fair, need-repair)
- image_url
- status (available, claimed, completed)
- location_text (TEXT ADDRESS!)
- claimed_by, claimed_at
- timestamps
```

### 4. **report_comments** table (Optional)
- For comments on reports

### 5. **notifications** table (Optional)
- For system notifications

---

## 🔍 Verify Database Creation

After running the schema, verify everything was created:

```bash
# Connect to database
mysql -u root -p citizen_app_db

# List all tables
SHOW TABLES;

# Check users table structure
DESCRIBE users;

# Check reports table structure
DESCRIBE reports;

# Check donations table structure
DESCRIBE donations;
```

Expected output should show 5 tables:
```
+-------------------------+
| Tables_in_citizen_app   |
+-------------------------+
| users                   |
| reports                 |
| donations               |
| report_comments         |
| notifications           |
+-------------------------+
```

---

## 🔧 Complete Commands Reference

### Create Database from Scratch

```sql
-- Create the database
CREATE DATABASE citizen_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Switch to database
USE citizen_app_db;

-- Run all table creation scripts (see schema.sql for full SQL)
```

### Add Sample Data

```bash
# Login to database
mysql -u root -p citizen_app_db

# Insert sample users
INSERT INTO users (email, name, phone, role, points, badge) VALUES
('citizen1@example.com', 'John Citizen', '9876543210', 'citizen', 150, 'bronze'),
('citizen2@example.com', 'Jane Citizen', '9876543211', 'citizen', 280, 'silver'),
('worker1@example.com', 'Mike Worker', '9876543212', 'worker', 450, 'gold'),
('worker2@example.com', 'Sarah Worker', '9876543213', 'worker', 320, 'silver'),
('admin@example.com', 'Admin User', '9876543214', 'admin', 1000, 'platinum');

# Verify data
SELECT * FROM users;
```

### Check Database Views

```bash
mysql> USE citizen_app_db;

# View leaderboard
SELECT * FROM leaderboard;

# View active reports
SELECT * FROM active_reports;

# View available donations
SELECT * FROM available_donations;
```

---

## 🎯 Database Procedures

The schema includes helper procedures for common operations:

### Award Points to User
```sql
CALL award_points(1, 10, 'Report completed bonus');
```

This will:
- Add 10 points to user ID 1
- Automatically update badge based on new total

### Update Report Status
```sql
CALL update_report_status(1, 'done', 2);
```

This will:
- Change report 1 status to 'done'
- Award 2 bonus points
- Update completion timestamp

---

## 🔐 Security Best Practices

### 1. Set Root Password

```bash
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_secure_password';
mysql> FLUSH PRIVILEGES;
```

### 2. Create App User (Instead of using root)

```bash
mysql -u root -p

# Create application user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password_here';

# Grant permissions
GRANT ALL PRIVILEGES ON citizen_app_db.* TO 'app_user'@'localhost';

# Apply changes
FLUSH PRIVILEGES;
```

### 3. Update .env file

```env
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=app_password_here
DB_NAME=citizen_app_db
DB_PORT=3306
```

---

## 🐛 Troubleshooting

### Problem: "Access denied for user 'root'@'localhost'"

**Solution:**
```bash
# Try without password
mysql -u root

# Or reset MySQL root password (search for your MySQL version)
```

### Problem: "Database already exists"

**Solution:**
```bash
mysql> DROP DATABASE citizen_app_db;
mysql> SOURCE "d:\Minor Project\database\schema.sql";
```

### Problem: "Can't connect to local MySQL server"

**Solution:**
```bash
# Start MySQL service (Windows)
net start MySQL80

# Or in Services app: Find MySQL80 and click Start
```

### Problem: "File location not found"

**Solution:**
Use forward slashes or escape backslashes:
```bash
# Correct
mysql -u root -p < "d:/Minor Project/database/schema.sql"

# Or escape
mysql -u root -p < "d:\\Minor Project\\database\\schema.sql"
```

---

## 📦 Backup & Restore

### Backup Database

```bash
# Backup entire database
mysqldump -u root -p citizen_app_db > backup_citizen_app.sql

# Backup specific table
mysqldump -u root -p citizen_app_db reports > backup_reports.sql
```

### Restore Database

```bash
# Restore entire database
mysql -u root -p citizen_app_db < backup_citizen_app.sql

# Restore from different backup
mysql -u root -p < backup_citizen_app.sql
```

---

## 🔄 Database Maintenance

### Check Database Size

```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'citizen_app_db'
ORDER BY (data_length + index_length) DESC;
```

### Optimize Tables

```sql
OPTIMIZE TABLE users;
OPTIMIZE TABLE reports;
OPTIMIZE TABLE donations;
```

### Check for Errors

```sql
CHECK TABLE users;
CHECK TABLE reports;
CHECK TABLE donations;
```

---

## 📱 Using with FastAPI Backend

### 1. Install Python Requirements

```bash
cd d:\Minor Project\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure .env

```bash
# Copy example to .env
copy .env.example .env

# Edit .env with your database credentials
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=app_password_here
DB_NAME=citizen_app_db
```

### 3. Start Backend Server

```bash
# From backend directory
python -m uvicorn main:app --reload

# Should start on http://localhost:8000
```

### 4. Test API Endpoints

```bash
# Get all users
curl http://localhost:8000/api/users/

# Get leaderboard
curl http://localhost:8000/api/users/leaderboard/top

# Create report
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

---

## ✅ Final Checklist

- [ ] MySQL Server installed and running
- [ ] Database schema created (`citizen_app_db`)
- [ ] All 5 tables created (users, reports, donations, report_comments, notifications)
- [ ] Sample data inserted (optional)
- [ ] Views created (leaderboard, active_reports, available_donations)
- [ ] Procedures created (award_points, update_report_status)
- [ ] App user created with limited permissions (security best practice)
- [ ] .env file configured with correct database credentials
- [ ] FastAPI backend installed and dependencies ready
- [ ] Test connection from backend to database
- [ ] Backup taken of initial schema

---

## 🎉 You're Ready!

Your database is now set up and ready to store:
- ✅ User profiles with points and badges
- ✅ Civic reports with text-based locations
- ✅ Donation marketplace items
- ✅ User interactions and comments

Next steps:
1. Start FastAPI backend: `python -m uvicorn main:app --reload`
2. Start CitizenApp frontend: `npm run dev` (in CitizenApp folder)
3. Test creating reports and donations
4. Monitor points and badges system

---

**Need Help?**
- Check MySQL logs: `d:\ProgramData\MySQL\MySQL Server 8.0\Data\[hostname].err`
- MySQL Official Docs: https://dev.mysql.com/doc/
- FastAPI Docs: https://fastapi.tiangolo.com/

