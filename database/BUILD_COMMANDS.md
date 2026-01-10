# 🗄️ EXACT MySQL Commands to Build Database

## Copy-Paste Commands (Windows)

### Command 1: Start MySQL Service
```cmd
net start MySQL80
```

---

### Command 2: Run Schema Script

**FASTEST WAY** - Copy this exact command:

```cmd
mysql -u root -p < "d:\Minor Project\database\schema.sql"
```

It will ask for password. If you don't have one set, just press Enter.

---

### Command 3: Verify Database Created

```cmd
mysql -u root -p citizen_app_db -e "SHOW TABLES;"
```

**Expected Output:**
```
+--------------------------+
| Tables_in_citizen_app_db |
+--------------------------+
| donations                |
| notifications            |
| report_comments          |
| reports                  |
| users                    |
+--------------------------+
```

---

## Alternative: Manual SQL Approach

If the above doesn't work, do this step by step:

### Step 1: Login to MySQL
```cmd
mysql -u root -p
```

Press Enter if no password.

### Step 2: Paste ALL These Commands (one by one or all at once):

```sql
-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS citizen_app_db;
USE citizen_app_db;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('citizen', 'worker', 'admin') DEFAULT 'citizen',
    points INT DEFAULT 0,
    reports_submitted INT DEFAULT 0,
    reports_completed INT DEFAULT 0,
    badge ENUM('citizen', 'bronze', 'silver', 'gold', 'platinum') DEFAULT 'citizen',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_points (points DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. REPORTS TABLE (WITH location_text!)
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    description LONGTEXT NOT NULL,
    location_text VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    status ENUM('submitted', 'in-progress', 'done', 'rejected') DEFAULT 'submitted',
    assigned_worker_id INT,
    points INT DEFAULT 3,
    bonus_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_worker FOREIGN KEY (assigned_worker_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_worker_id (assigned_worker_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_city (city),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DONATIONS TABLE (WITH location_text!)
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    category ENUM('electronics', 'clothing', 'furniture', 'books', 'toys', 'sports', 'kitchen', 'home_decor', 'other') NOT NULL,
    condition ENUM('like-new', 'good', 'fair', 'need-repair') DEFAULT 'good',
    image_url VARCHAR(500),
    status ENUM('available', 'claimed', 'completed') DEFAULT 'available',
    claimed_by INT,
    location_text VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_donation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_donation_claimer FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_claimer_id (claimed_by),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_city (city),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. COMMENTS TABLE (Optional)
CREATE TABLE IF NOT EXISTS report_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    comment LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. NOTIFICATIONS TABLE (Optional)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_id INT,
    donation_id INT,
    type ENUM('report_assigned', 'report_updated', 'donation_claimed', 'reward_earned') NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. INSERT SAMPLE DATA
INSERT INTO users (email, name, phone, role, points, badge) VALUES
('citizen1@example.com', 'John Citizen', '9876543210', 'citizen', 150, 'bronze'),
('citizen2@example.com', 'Jane Citizen', '9876543211', 'citizen', 280, 'silver'),
('worker1@example.com', 'Mike Worker', '9876543212', 'worker', 450, 'gold'),
('worker2@example.com', 'Sarah Worker', '9876543213', 'worker', 320, 'silver'),
('admin@example.com', 'Admin User', '9876543214', 'admin', 1000, 'platinum');

-- 8. CREATE VIEWS
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    id, name, email, points, badge, reports_submitted, created_at,
    RANK() OVER (ORDER BY points DESC) AS rank
FROM users
WHERE role = 'citizen' AND status = 'active'
ORDER BY points DESC;

CREATE OR REPLACE VIEW active_reports AS
SELECT 
    r.id, r.category, r.status, u.name as citizen_name, u.email as citizen_email,
    r.location_text, r.city, r.created_at,
    w.name as worker_name, w.email as worker_email
FROM reports r
JOIN users u ON r.user_id = u.id
LEFT JOIN users w ON r.assigned_worker_id = w.id
WHERE r.status IN ('submitted', 'in-progress')
ORDER BY r.created_at DESC;

CREATE OR REPLACE VIEW available_donations AS
SELECT 
    id, title, category, condition, location_text, city,
    u.name as donor_name, u.email as donor_email, created_at
FROM donations d
JOIN users u ON d.user_id = u.id
WHERE status = 'available'
ORDER BY created_at DESC;

-- 9. CREATE STORED PROCEDURES
DELIMITER //
CREATE PROCEDURE award_points(
    IN p_user_id INT,
    IN p_points INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET points = points + p_points
    WHERE id = p_user_id;
    
    UPDATE users 
    SET badge = CASE 
        WHEN points >= 500 THEN 'platinum'
        WHEN points >= 300 THEN 'gold'
        WHEN points >= 200 THEN 'silver'
        WHEN points >= 100 THEN 'bronze'
        ELSE 'citizen'
    END
    WHERE id = p_user_id;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE update_report_status(
    IN p_report_id INT,
    IN p_status VARCHAR(50),
    IN p_bonus_points INT
)
BEGIN
    DECLARE v_user_id INT;
    
    UPDATE reports 
    SET status = p_status, bonus_points = p_bonus_points
    WHERE id = p_report_id;
    
    IF p_status = 'done' THEN
        SELECT user_id INTO v_user_id FROM reports WHERE id = p_report_id;
        CALL award_points(v_user_id, p_bonus_points, 'Report completed bonus');
        UPDATE reports SET completed_at = NOW() WHERE id = p_report_id;
    END IF;
END //
DELIMITER ;
```

Then exit MySQL:
```sql
EXIT;
```

---

## Verify Everything Worked

```cmd
mysql -u root -p citizen_app_db -e "SELECT * FROM users;"
```

Should show the 5 sample users.

---

## Quick Test Commands

### Check Users
```cmd
mysql -u root -p citizen_app_db -e "SELECT name, email, points, badge FROM users ORDER BY points DESC;"
```

### Check Tables Exist
```cmd
mysql -u root -p citizen_app_db -e "SHOW TABLES;"
```

### Check Reports Table Structure
```cmd
mysql -u root -p citizen_app_db -e "DESCRIBE reports;"
```

### Check Location Text Column
```cmd
mysql -u root -p citizen_app_db -e "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='reports' AND COLUMN_NAME='location_text';"
```

---

## Common Issues & Solutions

### "Access denied"
```cmd
# Try without password
mysql -u root

# Or reset password (if needed)
mysql -u root --skip-password
```

### "Can't connect to localhost"
```cmd
# Make sure MySQL service is running
net start MySQL80

# Check status
sc query MySQL80
```

### "Database already exists"
```cmd
# Drop and recreate
mysql -u root -p -e "DROP DATABASE citizen_app_db;"
mysql -u root -p < "d:\Minor Project\database\schema.sql"
```

### "File not found"
Make sure you're using correct path:
```cmd
# Correct
mysql -u root -p < "d:\Minor Project\database\schema.sql"

# Or use forward slashes
mysql -u root -p < "d:/Minor Project/database/schema.sql"

# Or change directory first
cd d:\Minor Project\database
mysql -u root -p < schema.sql
```

---

## What Gets Created

✅ **1 Database**: `citizen_app_db`

✅ **5 Tables**:
- `users` (Citizens, Workers, Admins)
- `reports` (Civic issues with location_text)
- `donations` (Marketplace items with location_text)
- `report_comments` (Comments on reports)
- `notifications` (System notifications)

✅ **3 Views**:
- `leaderboard` (Top users by points)
- `active_reports` (Reports being worked on)
- `available_donations` (Items available to claim)

✅ **2 Procedures**:
- `award_points()` (Add points to user)
- `update_report_status()` (Update report + award bonus)

✅ **5 Sample Users**:
- 2 Citizens (150, 280 points)
- 2 Workers (320, 450 points)
- 1 Admin (1000 points)

---

## 🎯 Key Field: location_text

All reports and donations now store location as TEXT:

```
❌ OLD: "28.7041, 77.1025" (coordinates)
✅ NEW: "Delhi, Delhi, India" (text address)
```

This makes data more human-readable and easier to query!

---

## 🚀 Next Step After Database Setup

```bash
# Backend
cd d:\Minor Project\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload
```

Then open: http://localhost:8000/docs

---

**That's it! Your database is ready!** ✨

