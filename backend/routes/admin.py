from fastapi import APIRouter, HTTPException
from schemas import (
    ReportApproval, ReportAssignWorker, ReportReject, 
    ReportAdminResponse, WorkerResponse, WorkerStatusUpdate,
    DepartmentResponse, DepartmentCreate, AdminStats, DepartmentStats
)
from database import db
from typing import List

router = APIRouter()

# ===== DEPARTMENTS =====

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments():
    """Get all departments"""
    try:
        query = "SELECT * FROM departments WHERE status = 'active' ORDER BY name"
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(department: DepartmentCreate):
    """Create a new department"""
    try:
        query = """
            INSERT INTO departments (name, description, icon, color)
            VALUES (%s, %s, %s, %s)
        """
        params = (department.name, department.description, department.icon, department.color)
        db.execute_query(query, params)
        
        result = db.execute_query("SELECT * FROM departments ORDER BY id DESC LIMIT 1", fetch=True)
        return result[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== ADMIN STATS =====

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        query = "SELECT * FROM admin_stats_view"
        result = db.execute_query(query, fetch=True)
        return result[0] if result else {}
    except Exception as e:
        # Fallback if view doesn't exist
        try:
            stats = {
                "pending_count": db.execute_query("SELECT COUNT(*) as cnt FROM reports WHERE status = 'pending'", fetch=True)[0]['cnt'],
                "approved_count": db.execute_query("SELECT COUNT(*) as cnt FROM reports WHERE status = 'approved'", fetch=True)[0]['cnt'],
                "in_progress_count": db.execute_query("SELECT COUNT(*) as cnt FROM reports WHERE status IN ('assigned', 'in-progress')", fetch=True)[0]['cnt'],
                "completed_count": db.execute_query("SELECT COUNT(*) as cnt FROM reports WHERE status IN ('completed', 'done')", fetch=True)[0]['cnt'],
                "rejected_count": db.execute_query("SELECT COUNT(*) as cnt FROM reports WHERE status = 'rejected'", fetch=True)[0]['cnt'],
                "available_workers": db.execute_query("SELECT COUNT(*) as cnt FROM users WHERE role = 'worker' AND worker_status = 'available'", fetch=True)[0]['cnt'],
                "busy_workers": db.execute_query("SELECT COUNT(*) as cnt FROM users WHERE role = 'worker' AND worker_status = 'busy'", fetch=True)[0]['cnt'],
            }
            return stats
        except Exception as e2:
            raise HTTPException(status_code=400, detail=str(e2))

# ===== PENDING REPORTS FOR ADMIN =====

@router.get("/reports/pending")
async def get_pending_reports():
    """Get all pending reports for admin review"""
    try:
        query = """
            SELECT 
                r.*,
                u.name as citizen_name,
                u.email as citizen_email,
                u.phone as citizen_phone,
                d.name as suggested_department_name
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN departments d ON r.suggested_department_id = d.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        """
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== APPROVE REPORT =====

@router.post("/reports/{report_id}/approve")
async def approve_report(report_id: int, approval: ReportApproval):
    """Admin approves a report and assigns it to a department"""
    try:
        # Check if report exists and is pending
        check = db.execute_query("SELECT * FROM reports WHERE id = %s", (report_id,), fetch=True)
        if not check:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if check[0]['status'] != 'pending':
            raise HTTPException(status_code=400, detail="Report is not in pending status")
        
        # Update report
        query = """
            UPDATE reports SET 
                status = 'approved',
                admin_approved = TRUE,
                department_id = %s,
                priority = %s,
                admin_notes = %s,
                approved_at = NOW()
            WHERE id = %s
        """
        params = (approval.department_id, approval.priority, approval.admin_notes, report_id)
        db.execute_query(query, params)
        
        # Log history
        history_query = """
            INSERT INTO report_history (report_id, changed_by, old_status, new_status, new_department_id, action, notes)
            VALUES (%s, %s, 'pending', 'approved', %s, 'approved', %s)
        """
        # TODO: Get actual admin user ID from auth
        db.execute_query(history_query, (report_id, 1, approval.department_id, approval.admin_notes))
        
        return {"message": "Report approved and assigned to department", "report_id": report_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== REJECT REPORT =====

@router.post("/reports/{report_id}/reject")
async def reject_report(report_id: int, rejection: ReportReject):
    """Admin rejects a report"""
    try:
        check = db.execute_query("SELECT * FROM reports WHERE id = %s", (report_id,), fetch=True)
        if not check:
            raise HTTPException(status_code=404, detail="Report not found")
        
        query = """
            UPDATE reports SET 
                status = 'rejected',
                admin_notes = %s
            WHERE id = %s
        """
        db.execute_query(query, (rejection.reason, report_id))
        
        return {"message": "Report rejected", "report_id": report_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== DEPARTMENT REPORTS =====

@router.get("/departments/{department_id}/reports")
async def get_department_reports(department_id: int, status: str = None):
    """Get all reports for a specific department"""
    try:
        query = """
            SELECT 
                r.*,
                u.name as citizen_name,
                u.email as citizen_email,
                w.name as worker_name,
                w.worker_status,
                d.name as department_name
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN users w ON r.assigned_worker_id = w.id
            LEFT JOIN departments d ON r.department_id = d.id
            WHERE r.department_id = %s
        """
        params = [department_id]
        
        if status:
            query += " AND r.status = %s"
            params.append(status)
        else:
            query += " AND r.status IN ('approved', 'assigned', 'in-progress')"
        
        query += " ORDER BY CASE r.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, r.created_at DESC"
        
        result = db.execute_query(query, params, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== DEPARTMENT WORKERS =====

@router.get("/departments/{department_id}/workers")
async def get_department_workers(department_id: int):
    """Get all workers for a specific department with their status and active tasks"""
    try:
        query = """
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
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN reports r ON r.assigned_worker_id = u.id AND r.status IN ('assigned', 'in-progress')
            WHERE u.role = 'worker' AND u.status = 'active' AND u.department_id = %s
            GROUP BY u.id
            ORDER BY u.worker_status = 'available' DESC, u.name
        """
        result = db.execute_query(query, (department_id,), fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== ASSIGN WORKER TO REPORT =====

@router.post("/reports/{report_id}/assign")
async def assign_worker(report_id: int, assignment: ReportAssignWorker):
    """Department manager assigns a worker to a report"""
    try:
        # Check if report exists and is approved
        check = db.execute_query("SELECT * FROM reports WHERE id = %s", (report_id,), fetch=True)
        if not check:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if check[0]['status'] not in ['approved', 'assigned']:
            raise HTTPException(status_code=400, detail="Report must be approved before assigning a worker")
        
        # Check if worker exists and is available
        worker = db.execute_query("SELECT * FROM users WHERE id = %s AND role = 'worker'", (assignment.worker_id,), fetch=True)
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        # Update report
        query = """
            UPDATE reports SET 
                status = 'assigned',
                assigned_worker_id = %s,
                department_notes = %s,
                updated_at = NOW()
            WHERE id = %s
        """
        db.execute_query(query, (assignment.worker_id, assignment.department_notes, report_id))
        
        # Update worker status to busy
        db.execute_query("UPDATE users SET worker_status = 'busy' WHERE id = %s", (assignment.worker_id,))
        
        # Log history
        history_query = """
            INSERT INTO report_history (report_id, changed_by, old_status, new_status, new_worker_id, action, notes)
            VALUES (%s, %s, %s, 'assigned', %s, 'worker_assigned', %s)
        """
        db.execute_query(history_query, (report_id, 1, check[0]['status'], assignment.worker_id, assignment.department_notes))
        
        return {"message": "Worker assigned to report", "report_id": report_id, "worker_id": assignment.worker_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== UPDATE WORKER STATUS =====

@router.put("/workers/{worker_id}/status")
async def update_worker_status(worker_id: int, status_update: WorkerStatusUpdate):
    """Update worker's availability status"""
    try:
        query = "UPDATE users SET worker_status = %s WHERE id = %s AND role = 'worker'"
        db.execute_query(query, (status_update.worker_status, worker_id))
        return {"message": "Worker status updated", "worker_id": worker_id, "status": status_update.worker_status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET ALL WORKERS =====

@router.get("/workers", response_model=List[WorkerResponse])
async def get_all_workers():
    """Get all workers with their department and task info"""
    try:
        query = """
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
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN reports r ON r.assigned_worker_id = u.id AND r.status IN ('assigned', 'in-progress')
            WHERE u.role = 'worker' AND u.status = 'active'
            GROUP BY u.id
            ORDER BY d.name, u.name
        """
        result = db.execute_query(query, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET ALL REPORTS FOR ADMIN =====

@router.get("/reports")
async def get_all_reports(status: str = None, department_id: int = None):
    """Get all reports with full details for admin view"""
    try:
        query = """
            SELECT 
                r.*,
                u.name as citizen_name,
                u.email as citizen_email,
                w.name as worker_name,
                w.worker_status,
                d.name as department_name
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN users w ON r.assigned_worker_id = w.id
            LEFT JOIN departments d ON r.department_id = d.id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND r.status = %s"
            params.append(status)
        
        if department_id:
            query += " AND r.department_id = %s"
            params.append(department_id)
        
        query += " ORDER BY r.created_at DESC"
        
        result = db.execute_query(query, params if params else None, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== SUGGEST DEPARTMENT BASED ON CATEGORY =====

@router.get("/suggest-department/{category}")
async def suggest_department(category: str):
    """Suggest a department based on report category"""
    try:
        query = """
            SELECT d.id, d.name, d.icon, d.color
            FROM category_department_map cdm
            JOIN departments d ON cdm.department_id = d.id
            WHERE LOWER(cdm.category) LIKE LOWER(%s)
            LIMIT 1
        """
        result = db.execute_query(query, (f"%{category}%",), fetch=True)
        
        if not result:
            # Return "Other" department as default
            result = db.execute_query("SELECT id, name, icon, color FROM departments WHERE name = 'Other'", fetch=True)
        
        return result[0] if result else {"id": None, "name": "Unknown", "icon": "help-circle", "color": "#6B7280"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== DEPARTMENT STATS =====

@router.get("/departments/{department_id}/stats")
async def get_department_stats(department_id: int):
    """Get statistics for a specific department"""
    try:
        dept = db.execute_query("SELECT * FROM departments WHERE id = %s", (department_id,), fetch=True)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        
        stats = {
            "department_id": department_id,
            "department_name": dept[0]['name'],
            "pending_count": db.execute_query(
                "SELECT COUNT(*) as cnt FROM reports WHERE department_id = %s AND status = 'approved'", 
                (department_id,), fetch=True
            )[0]['cnt'],
            "assigned_count": db.execute_query(
                "SELECT COUNT(*) as cnt FROM reports WHERE department_id = %s AND status = 'assigned'", 
                (department_id,), fetch=True
            )[0]['cnt'],
            "in_progress_count": db.execute_query(
                "SELECT COUNT(*) as cnt FROM reports WHERE department_id = %s AND status = 'in-progress'", 
                (department_id,), fetch=True
            )[0]['cnt'],
            "completed_count": db.execute_query(
                "SELECT COUNT(*) as cnt FROM reports WHERE department_id = %s AND status IN ('completed', 'done')", 
                (department_id,), fetch=True
            )[0]['cnt'],
            "total_workers": db.execute_query(
                "SELECT COUNT(*) as cnt FROM users WHERE department_id = %s AND role = 'worker'", 
                (department_id,), fetch=True
            )[0]['cnt'],
            "available_workers": db.execute_query(
                "SELECT COUNT(*) as cnt FROM users WHERE department_id = %s AND role = 'worker' AND worker_status = 'available'", 
                (department_id,), fetch=True
            )[0]['cnt'],
        }
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== REPORT HISTORY =====

@router.get("/reports/{report_id}/history")
async def get_report_history(report_id: int):
    """Get the history of a report"""
    try:
        query = """
            SELECT 
                rh.*,
                u.name as changed_by_name
            FROM report_history rh
            JOIN users u ON rh.changed_by = u.id
            WHERE rh.report_id = %s
            ORDER BY rh.created_at DESC
        """
        result = db.execute_query(query, (report_id,), fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
