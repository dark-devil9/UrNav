from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

class TaskManager:
    def __init__(self):
        # In-memory storage for demo (in production, use Redis/PostgreSQL)
        self.task_sessions: Dict[str, Dict[str, Any]] = {}
        
    def _get_session_key(self, user_id: str, origin_lat: float, origin_lon: float) -> str:
        """Generate a unique session key based on user and location"""
        # Round coordinates to create location-based sessions
        lat_rounded = round(origin_lat, 4)
        lon_rounded = round(origin_lon, 4)
        return f"{user_id}_{lat_rounded}_{lon_rounded}"
    
    def get_or_create_session(self, user_id: str, origin_lat: float, origin_lon: float) -> Dict[str, Any]:
        """Get or create a task session for a user at a specific location"""
        session_key = self._get_session_key(user_id, origin_lat, origin_lon)
        
        if session_key not in self.task_sessions:
            self.task_sessions[session_key] = {
                "user_id": user_id,
                "origin": {"lat": origin_lat, "lng": origin_lon},
                "tasks": [],
                "created_at": datetime.now(),
                "last_updated": datetime.now()
            }
        
        return self.task_sessions[session_key]
    
    def add_tasks(self, user_id: str, origin_lat: float, origin_lon: float, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Add new tasks to a session"""
        session = self.get_or_create_session(user_id, origin_lat, origin_lon)
        
        # Add status to each task
        for task in tasks:
            task["status"] = "pending"
            task["added_at"] = datetime.now().isoformat()
        
        # Add new tasks to existing ones, avoiding duplicates
        existing_task_names = {t["task"] for t in session["tasks"]}
        
        for task in tasks:
            if task["task"] not in existing_task_names:
                session["tasks"].append(task)
        
        session["last_updated"] = datetime.now()
        return session
    
    def complete_task(self, user_id: str, origin_lat: float, origin_lon: float, task_name: str) -> Optional[Dict[str, Any]]:
        """Mark a task as completed"""
        session_key = self._get_session_key(user_id, origin_lat, origin_lon)
        
        if session_key not in self.task_sessions:
            return None
        
        session = self.task_sessions[session_key]
        
        # Find and mark the task as completed
        for task in session["tasks"]:
            if task["task"] == task_name:
                task["status"] = "completed"
                task["completed_at"] = datetime.now().isoformat()
                session["last_updated"] = datetime.now()
                return session
        
        return None
    
    def get_pending_tasks(self, user_id: str, origin_lat: float, origin_lon: float) -> List[Dict[str, Any]]:
        """Get only pending tasks for a session"""
        session = self.get_or_create_session(user_id, origin_lat, origin_lon)
        return [task for task in session["tasks"] if task["status"] == "pending"]
    
    def get_all_tasks(self, user_id: str, origin_lat: float, origin_lon: float) -> List[Dict[str, Any]]:
        """Get all tasks (pending and completed) for a session"""
        session = self.get_or_create_session(user_id, origin_lat, origin_lon)
        return session["tasks"]
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Remove old task sessions"""
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        expired_keys = [
            key for key, session in self.task_sessions.items()
            if session["last_updated"] < cutoff
        ]
        
        for key in expired_keys:
            del self.task_sessions[key]
    
    def get_session_summary(self, user_id: str, origin_lat: float, origin_lon: float) -> Dict[str, Any]:
        """Get a summary of the task session"""
        session = self.get_or_create_session(user_id, origin_lat, origin_lon)
        
        total_tasks = len(session["tasks"])
        completed_tasks = len([t for t in session["tasks"] if t["status"] == "completed"])
        pending_tasks = total_tasks - completed_tasks
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }
