from fastapi import APIRouter, HTTPException
from schemas import ReportUpdate
from database import db
from typing import List

router = APIRouter()

# ===== GET WORKER'S ASSIGNED TASKS =====
@router.get("/{worker_id}/tasks")
async def get_worker_tasks(worker_id: int, status: str = None):
    """Get all tasks assigned to a specific worker"""
    try:
        query = """
            SELECT 
                r.*,
                u.name as citizen_name,
                u.phone as citizen_phone,
                d.name as department_name
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN departments d ON r.department_id = d.id
            WHERE r.assigned_worker_id = %s
        """
        params = [worker_id]
        
        if status:
            query += " AND r.status = %s"
            params.append(status)
        else:
            query += " AND r.status IN ('assigned', 'in-progress')"
        
        query += " ORDER BY CASE r.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, r.created_at DESC"
        
        result = db.execute_query(query, params, fetch=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== START WORKING ON TASK =====
@router.post("/tasks/{report_id}/start")
async def start_task(report_id: int, worker_id: int):
    """Worker starts working on a task"""
    try:
        # Verify task is assigned to this worker
        check = db.execute_query(
            "SELECT * FROM reports WHERE id = %s AND assigned_worker_id = %s",
            (report_id, worker_id), fetch=True
        )
        if not check:
            raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
        
        if check[0]['status'] != 'assigned':
            raise HTTPException(status_code=400, detail="Task is not in assigned status")
        
        # Update to in-progress
        db.execute_query(
            "UPDATE reports SET status = 'in-progress', updated_at = NOW() WHERE id = %s",
            (report_id,)
        )
        
        # Log history
        db.execute_query(
            """INSERT INTO report_history 
               (report_id, changed_by, old_status, new_status, action, notes)
               VALUES (%s, %s, 'assigned', 'in-progress', 'started', 'Worker started the task')""",
            (report_id, worker_id)
        )
        
        return {"message": "Task started", "report_id": report_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== COMPLETE TASK =====
@router.post("/tasks/{report_id}/complete")
async def complete_task(report_id: int, worker_id: int, notes: str = None):
    """Worker completes a task"""
    try:
        # Verify task
        check = db.execute_query(
            "SELECT * FROM reports WHERE id = %s AND assigned_worker_id = %s",
            (report_id, worker_id), fetch=True
        )
        if not check:
            raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
        
        if check[0]['status'] != 'in-progress':
            raise HTTPException(status_code=400, detail="Task is not in progress")
        
        # Update to completed
        db.execute_query(
            """UPDATE reports SET 
               status = 'completed', 
               worker_notes = %s,
               completed_at = NOW(),
               updated_at = NOW() 
               WHERE id = %s""",
            (notes, report_id)
        )
        
        # Update worker status back to available
        db.execute_query(
            "UPDATE users SET worker_status = 'available' WHERE id = %s",
            (worker_id,)
        )
        
        # Award points to citizen
        citizen_id = check[0]['user_id']
        bonus_points = check[0]['bonus_points'] or 0
        total_points = check[0]['points'] + bonus_points
        
        db.execute_query(
            """UPDATE users SET 
               points = points + %s,
               badge = CASE 
                   WHEN points + %s >= 500 THEN 'platinum'
                   WHEN points + %s >= 300 THEN 'gold'
                   WHEN points + %s >= 200 THEN 'silver'
                   WHEN points + %s >= 100 THEN 'bronze'
                   ELSE 'citizen'
               END
               WHERE id = %s""",
            (total_points, total_points, total_points, total_points, total_points, citizen_id)
        )
        
        # Log history
        db.execute_query(
            """INSERT INTO report_history 
               (report_id, changed_by, old_status, new_status, action, notes)
               VALUES (%s, %s, 'in-progress', 'completed', 'completed', %s)""",
            (report_id, worker_id, notes or 'Task completed successfully')
        )
        
        return {"message": "Task completed", "report_id": report_id, "points_awarded": total_points}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== ADD WORKER NOTE =====
@router.post("/tasks/{report_id}/note")
async def add_worker_note(report_id: int, worker_id: int, note: str):
    """Worker adds a note to a task"""
    try:
        db.execute_query(
            "UPDATE reports SET worker_notes = %s, updated_at = NOW() WHERE id = %s AND assigned_worker_id = %s",
            (note, report_id, worker_id)
        )
        return {"message": "Note added", "report_id": report_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== GET WORKER STATS =====
@router.get("/{worker_id}/stats")
async def get_worker_stats(worker_id: int):
    """Get worker's statistics"""
    try:
        assigned = db.execute_query(
            "SELECT COUNT(*) as count FROM reports WHERE assigned_worker_id = %s AND status = 'assigned'",
            (worker_id,), fetch=True
        )[0]['count']
        
        in_progress = db.execute_query(
            "SELECT COUNT(*) as count FROM reports WHERE assigned_worker_id = %s AND status = 'in-progress'",
            (worker_id,), fetch=True
        )[0]['count']
        
        completed = db.execute_query(
            "SELECT COUNT(*) as count FROM reports WHERE assigned_worker_id = %s AND status = 'completed'",
            (worker_id,), fetch=True
        )[0]['count']
        
        worker = db.execute_query(
            "SELECT worker_status FROM users WHERE id = %s",
            (worker_id,), fetch=True
        )
        
        return {
            "worker_id": worker_id,
            "worker_status": worker[0]['worker_status'] if worker else 'unknown',
            "assigned_count": assigned,
            "in_progress_count": in_progress,
            "completed_count": completed,
            "total_tasks": assigned + in_progress + completed
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===== UPDATE WORKER STATUS =====
@router.put("/{worker_id}/status")
async def update_status(worker_id: int, status: str):
    """Update worker's availability status"""
    try:
        if status not in ['available', 'busy', 'offline']:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        db.execute_query(
            "UPDATE users SET worker_status = %s WHERE id = %s AND role = 'worker'",
            (status, worker_id)
        )
        return {"message": "Status updated", "worker_id": worker_id, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
