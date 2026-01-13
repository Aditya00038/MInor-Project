-- ============================================
-- CitizenApp Database Schema V2
-- Added: Departments, Admin Workflow, Worker Status
-- ============================================

USE citizen_app_db;

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'building',
    color VARCHAR(20) DEFAULT '#3B82F6',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default departments
INSERT INTO departments (name, description, icon, color) VALUES
('Roads & Transportation', 'Road maintenance, potholes, traffic signals', 'road', '#EF4444'),
('Water Supply', 'Water supply issues, leakage, contamination', 'droplet', '#3B82F6'),
('Sanitation', 'Garbage collection, sewage, cleanliness', 'trash', '#10B981'),
('Electricity', 'Street lights, power outages, electrical hazards', 'zap', '#F59E0B'),
('Parks & Recreation', 'Park maintenance, trees, public spaces', 'trees', '#22C55E'),
('Public Safety', 'Safety hazards, crime, emergency services', 'shield', '#8B5CF6'),
('Building & Construction', 'Illegal construction, building permits', 'building', '#6366F1'),
('Health', 'Public health issues, mosquito breeding, pollution', 'heart-pulse', '#EC4899'),
('Other', 'Miscellaneous civic issues', 'help-circle', '#6B7280')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- ALTER USERS TABLE - Add department_id for department managers
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id INT NULL AFTER role,
ADD COLUMN IF NOT EXISTS worker_status ENUM('available', 'busy', 'offline') DEFAULT 'available' AFTER status,
ADD CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Update role enum to include 'department'
ALTER TABLE users MODIFY COLUMN role ENUM('citizen', 'worker', 'department', 'admin') DEFAULT 'citizen';

-- ============================================
-- ALTER REPORTS TABLE - Add approval workflow
-- ============================================
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS department_id INT NULL AFTER assigned_worker_id,
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER admin_approved,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL AFTER approved_by,
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' AFTER approved_at,
ADD COLUMN IF NOT EXISTS suggested_department_id INT NULL AFTER department_id,
ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL AFTER priority,
ADD COLUMN IF NOT EXISTS department_notes TEXT NULL AFTER admin_notes,
ADD COLUMN IF NOT EXISTS worker_notes TEXT NULL AFTER department_notes,
ADD CONSTRAINT fk_report_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_report_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_report_suggested_dept FOREIGN KEY (suggested_department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Update status enum to include more states
ALTER TABLE reports MODIFY COLUMN status ENUM('pending', 'approved', 'assigned', 'in-progress', 'completed', 'rejected') DEFAULT 'pending';

-- ============================================
-- CATEGORY TO DEPARTMENT MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS category_department_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    UNIQUE KEY uk_category (category),
    CONSTRAINT fk_map_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert category mappings
INSERT INTO category_department_map (category, department_id) VALUES
('road', 1), ('pothole', 1), ('traffic', 1), ('footpath', 1),
('water', 2), ('pipeline', 2), ('leakage', 2), ('drainage', 2),
('garbage', 3), ('sewage', 3), ('cleanliness', 3), ('waste', 3),
('streetlight', 4), ('electricity', 4), ('power', 4),
('park', 5), ('tree', 5), ('garden', 5), ('playground', 5),
('safety', 6), ('crime', 6), ('emergency', 6),
('construction', 7), ('building', 7), ('encroachment', 7),
('health', 8), ('mosquito', 8), ('pollution', 8), ('stray', 8),
('other', 9)
ON DUPLICATE KEY UPDATE department_id = VALUES(department_id);

-- ============================================
-- REPORT HISTORY TABLE - Track status changes
-- ============================================
CREATE TABLE IF NOT EXISTS report_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_department_id INT,
    new_department_id INT,
    old_worker_id INT,
    new_worker_id INT,
    action VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_history_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- View: Pending Reports for Admin Review
CREATE OR REPLACE VIEW pending_reports_view AS
SELECT 
    r.id,
    r.category,
    r.description,
    r.location_text,
    r.city,
    r.state,
    r.image_url,
    r.video_url,
    r.status,
    r.priority,
    r.created_at,
    u.id as citizen_id,
    u.name as citizen_name,
    u.email as citizen_email,
    u.phone as citizen_phone,
    d.id as suggested_dept_id,
    d.name as suggested_dept_name
FROM reports r
JOIN users u ON r.user_id = u.id
LEFT JOIN departments d ON r.suggested_department_id = d.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

-- View: Department Dashboard
CREATE OR REPLACE VIEW department_reports_view AS
SELECT 
    r.id,
    r.category,
    r.description,
    r.location_text,
    r.city,
    r.image_url,
    r.status,
    r.priority,
    r.admin_notes,
    r.created_at,
    r.approved_at,
    r.department_id,
    d.name as department_name,
    u.name as citizen_name,
    w.id as worker_id,
    w.name as worker_name,
    w.worker_status
FROM reports r
JOIN users u ON r.user_id = u.id
JOIN departments d ON r.department_id = d.id
LEFT JOIN users w ON r.assigned_worker_id = w.id
WHERE r.status IN ('approved', 'assigned', 'in-progress')
ORDER BY 
    CASE r.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
    END,
    r.created_at DESC;

-- View: Workers by Department
CREATE OR REPLACE VIEW department_workers_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.worker_status,
    u.department_id,
    d.name as department_name,
    COUNT(r.id) as active_tasks
FROM users u
JOIN departments d ON u.department_id = d.id
LEFT JOIN reports r ON r.assigned_worker_id = u.id AND r.status IN ('assigned', 'in-progress')
WHERE u.role = 'worker' AND u.status = 'active'
GROUP BY u.id
ORDER BY d.name, u.name;

-- View: Admin Statistics
CREATE OR REPLACE VIEW admin_stats_view AS
SELECT 
    (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_count,
    (SELECT COUNT(*) FROM reports WHERE status = 'approved') as approved_count,
    (SELECT COUNT(*) FROM reports WHERE status IN ('assigned', 'in-progress')) as in_progress_count,
    (SELECT COUNT(*) FROM reports WHERE status = 'completed') as completed_count,
    (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_count,
    (SELECT COUNT(*) FROM users WHERE role = 'worker' AND worker_status = 'available') as available_workers,
    (SELECT COUNT(*) FROM users WHERE role = 'worker' AND worker_status = 'busy') as busy_workers;

-- ============================================
-- END OF SCHEMA V2
-- ============================================
