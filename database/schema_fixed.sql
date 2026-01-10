-- ============================================
-- CitizenApp Database Schema (Fixed)
-- MySQL Database for storing Reports & Donations
-- Shared across CitizenApp, WorkerApp, and AdminWeb
-- ============================================

-- Create Database
DROP DATABASE IF EXISTS citizen_app_db;
CREATE DATABASE citizen_app_db;
USE citizen_app_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
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

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    description LONGTEXT NOT NULL,
    
    -- Location Details (TEXT FORMAT - ADDRESS)
    location_text VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Media
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    
    -- Status & Worker Assignment
    status ENUM('submitted', 'in-progress', 'done', 'rejected') DEFAULT 'submitted',
    assigned_worker_id INT,
    
    -- Points System
    points INT DEFAULT 3,
    bonus_points INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_worker FOREIGN KEY (assigned_worker_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_worker_id (assigned_worker_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_city (city),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    category ENUM('electronics', 'clothing', 'furniture', 'books', 'toys', 'sports', 'kitchen', 'home_decor', 'other') NOT NULL,
    item_condition ENUM('like-new', 'good', 'fair', 'need-repair') DEFAULT 'good',
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

-- ============================================
-- REPORT_COMMENTS TABLE
-- ============================================
CREATE TABLE report_comments (
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

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
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

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

INSERT INTO users (email, name, phone, role, points, badge) VALUES
('citizen1@example.com', 'John Citizen', '9876543210', 'citizen', 150, 'bronze'),
('citizen2@example.com', 'Jane Citizen', '9876543211', 'citizen', 280, 'silver'),
('worker1@example.com', 'Mike Worker', '9876543212', 'worker', 450, 'gold'),
('worker2@example.com', 'Sarah Worker', '9876543213', 'worker', 320, 'silver'),
('admin@example.com', 'Admin User', '9876543214', 'admin', 1000, 'platinum');

-- ============================================
-- CREATE VIEWS
-- ============================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    id,
    name,
    email,
    points,
    badge,
    reports_submitted,
    created_at
FROM users
WHERE role = 'citizen' AND status = 'active'
ORDER BY points DESC;

CREATE OR REPLACE VIEW active_reports AS
SELECT 
    r.id,
    r.category,
    r.status,
    u.name as citizen_name,
    u.email as citizen_email,
    r.location_text,
    r.city,
    r.created_at,
    w.name as worker_name,
    w.email as worker_email
FROM reports r
JOIN users u ON r.user_id = u.id
LEFT JOIN users w ON r.assigned_worker_id = w.id
WHERE r.status IN ('submitted', 'in-progress')
ORDER BY r.created_at DESC;

CREATE OR REPLACE VIEW available_donations AS
SELECT 
    d.id,
    d.title,
    d.category,
    d.item_condition,
    d.location_text,
    d.city,
    u.name as donor_name,
    u.email as donor_email,
    d.created_at
FROM donations d
JOIN users u ON d.user_id = u.id
WHERE d.status = 'available'
ORDER BY d.created_at DESC;
