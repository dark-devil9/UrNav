from fastapi import APIRouter
import traceback
from typing import List, Any, Dict
from ..services.foursquare_service import FoursquareService
from ..services.places_manager import PlacesManager
from ..services.task_manager import TaskManager
from math import radians, cos, sin, asin, sqrt

router = APIRouter()

# Initialize services
places_manager = PlacesManager()
task_manager = TaskManager()

def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [a[1], a[0], b[1], b[0]])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(h))

@router.post("/plan-day")
async def plan_day(body: Dict[str, Any]):
    from ..services.mistral_service import MistralService
    
    try:
        # Extract parameters
        tasks: List[str] = body.get("tasks") or []
        text: str | None = body.get("text")
        origin = body.get("origin") or {"lat": 26.9124, "lng": 75.7873}
        user_id = body.get("user_id", "anonymous")
        
        # Clean up old sessions
        task_manager.cleanup_old_sessions()
        
        # Parse tasks from text if provided
        if text and not tasks:
            try:
                parsed = await MistralService().parse_plan(text)
                tasks = parsed.get("tasks", [])
            except Exception as e:
                print(f"Error parsing plan text: {e}")
                traceback.print_exc()
                tasks = ["Get coffee", "Buy bouquets"]
        
        if not tasks:
            return {"error": "No tasks provided or could not parse text"}
        
        # Find real places for each task using Foursquare API
        task_places = await places_manager.find_places_for_tasks(
            tasks, 
            origin["lat"], 
            origin["lng"]
        )
        
        # Add tasks to the session with their places
        session = task_manager.add_tasks(user_id, origin["lat"], origin["lng"], task_places)
        
        # Calculate route summary (only for pending tasks with valid coordinates)
        pending_tasks = [t for t in task_places if t["status"] == "pending" and t["lat"] and t["lng"]]
        
        total_distance = 0
        if len(pending_tasks) > 0:
            # Calculate distance from origin to first task
            if len(pending_tasks) > 0:
                first_task = (pending_tasks[0]["lat"], pending_tasks[0]["lng"])
                origin_coords = (origin["lat"], origin["lng"])
                total_distance += haversine(origin_coords, first_task)
            
            # Calculate total distance between remaining stops
            if len(pending_tasks) > 1:
                for i in range(len(pending_tasks) - 1):
                    current = (pending_tasks[i]["lat"], pending_tasks[i]["lng"])
                    next_stop = (pending_tasks[i + 1]["lat"], pending_tasks[i + 1]["lng"])
                    total_distance += haversine(current, next_stop)
        
        # Estimate travel time (assuming 4.5 km/h walking speed)
        eta_min = int(total_distance / 4.5 * 60)
        
        return {
            "origin": origin,
            "tasks": task_places,
            "summary": {
                "distance_km": round(total_distance, 1),
                "eta_min": eta_min,
                "total_tasks": len(task_places),
                "pending_tasks": len([t for t in task_places if t["status"] == "pending"]),
                "completed_tasks": len([t for t in task_places if t["status"] == "completed"])
            }
        }
        
    except Exception as e:
        print(f"Error in plan_day: {e}")
        traceback.print_exc()
        return {"error": f"Failed to plan day: {str(e)}"}

@router.post("/plan-day/complete")
async def complete_task(body: Dict[str, Any]):
    """Mark a task as completed"""
    try:
        task_name = body.get("task")
        user_id = body.get("user_id", "anonymous")
        origin = body.get("origin")
        
        if not task_name:
            return {"error": "Task name is required"}
        
        if not origin or "lat" not in origin or "lng" not in origin:
            return {"error": "Origin coordinates are required"}
        
        # Mark the task as completed
        session = task_manager.complete_task(user_id, origin["lat"], origin["lng"], task_name)
        
        if not session:
            return {"error": "Task not found or session not found"}
        
        # Get updated session summary
        summary = task_manager.get_session_summary(user_id, origin["lat"], origin["lng"])
        
        return {
            "success": True,
            "message": f"Task '{task_name}' marked as completed",
            "session_summary": summary,
            "updated_tasks": session["tasks"]
        }
        
    except Exception as e:
        print(f"Error completing task: {e}")
        traceback.print_exc()
        return {"error": f"Failed to complete task: {str(e)}"}

@router.get("/plan-day/status")
async def get_task_status(user_id: str, lat: float, lng: float):
    """Get current task status for a user at a location"""
    try:
        # Clean up old sessions
        task_manager.cleanup_old_sessions()
        
        # Get session summary
        summary = task_manager.get_session_summary(user_id, lat, lng)
        
        # Get all tasks
        tasks = task_manager.get_all_tasks(user_id, lat, lng)
        
        return {
            "session_summary": summary,
            "tasks": tasks
        }
        
    except Exception as e:
        print(f"Error getting task status: {e}")
        traceback.print_exc()
        return {"error": f"Failed to get task status: {str(e)}"}

@router.get("/free-places")
async def free_places(lat: float = 26.9124, lon: float = 75.9231):
    fs = FoursquareService()
    try:
        data = await fs.search(lat, lon, query="park", radius=3000)
        results = data.get("results", [])
        
        # Add photos to each result
        for place in results:
            try:
                place_id = place.get("fsq_place_id")
                if place_id:
                    photos = await fs.get_photos(place_id, limit=3)
                    place["photos"] = photos
                else:
                    place["photos"] = []
            except Exception:
                place["photos"] = []
        
        return {"results": results}
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails - Updated for new API
        return {
            "results": [
                {
                    "fsq_place_id": "demo-park-1",  # NEW: Updated field name
                    "name": "Central Park",
                    "categories": [{"name": "Park"}],
                    "distance": 400,
                    "rating": 4.3,
                    # NEW: Use latitude/longitude instead of geocodes.main
                    "latitude": lat + 0.001,
                    "longitude": lon + 0.001,
                    "photos": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-park-2",  # NEW: Updated field name
                    "name": "Garden Square",
                    "categories": [{"name": "Garden"}],
                    "distance": 600,
                    "rating": 4.1,
                    # NEW: Use latitude/longitude instead of geocodes.main
                    "latitude": lat - 0.001,
                    "longitude": lon - 0.001,
                    "photos": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-park-3",  # NEW: Updated field name
                    "name": "Riverside Walk",
                    "categories": [{"name": "Walking Trail"}],
                    "distance": 800,
                    "rating": 4.5,
                    # NEW: Use latitude/longitude instead of geocodes.main
                    "latitude": lat + 0.002,
                    "longitude": lon + 0.002,
                    "photos": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"]
                }
            ]
        }

@router.post("/meet-friend")
async def meet_friend(body: Dict[str, Any]):
    user = body.get("user") or {"lat": 26.9124, "lon": 75.7873}
    friend = body.get("friend") or {"lat": 26.9154, "lon": 75.7903}
    activity = body.get("activity")
    radius = body.get("radius", 1500)  # Default 1.5km, can be overridden
    
    # Calculate the actual midpoint between friends
    mid = {"lat": (user["lat"]+friend["lat"])/2, "lon": (user["lon"]+friend["lon"])/2}
    
    # Calculate distance between friends to ensure reasonable search
    distance_km = haversine((user["lat"], user["lon"]), (friend["lat"], friend["lon"]))
    
    # Adjust search radius based on distance between friends
    # Ensure we don't search too far from the midpoint
    max_radius = min(radius, int(distance_km * 1000 * 0.8))  # 80% of distance between friends
    search_radius = min(max_radius, 2000)  # Cap at 2km
    
    fs = FoursquareService()
    try:
        results = await fs.search(mid["lat"], mid["lon"], query=activity, radius=search_radius)
        payload = results.get("results", [])
        
        # Filter results to ensure they're reasonably between the two friends
        # Calculate distance from midpoint and filter out places that are too far
        filtered_payload = []
        for place in payload:
            place_lat = place.get("latitude") or place.get("lat")
            place_lon = place.get("longitude") or place.get("lon")
            
            if place_lat and place_lon:
                # Calculate distance from midpoint
                place_distance = haversine((mid["lat"], mid["lon"]), (place_lat, place_lon))
                # Only include places within reasonable distance from midpoint
                if place_distance <= (distance_km * 0.6):  # Within 60% of friends' distance
                    filtered_payload.append(place)
        
        # If no results after filtering, use original payload
        if not filtered_payload:
            filtered_payload = payload
            
    except Exception:
        traceback.print_exc()
        payload = [
            {
                "fsq_place_id": "demo-mf-1",  # NEW: Updated field name
                "name": "Midpoint Café",
                "categories": [{"name": "Cafe"}],
                "distance": 600,
                "rating": 4.4,
                "photos": ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop"]
            },
            {
                "fsq_place_id": "demo-mf-2",  # NEW: Updated field name
                "name": "City Park Meetup Spot",
                "categories": [{"name": "Park"}],
                "distance": 900,
                "rating": 4.5,
                "photos": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"]
            },
        ]
        filtered_payload = payload
    
    return {"midpoint": mid, "results": filtered_payload}

@router.get("/explorer")
async def explorer(lat: float = 26.9124, lon: float = 75.9231, radius: int = 20000):
    fs = FoursquareService()
    try:
        print(f"Explorer search: lat={lat}, lon={lon}, radius={radius}")
        
        # Search for various types of places with broader queries
        must = await fs.search(lat, lon, query="", radius=radius)  # General search
        food = await fs.search(lat, lon, query="restaurant", radius=radius)
        parks = await fs.search(lat, lon, query="park", radius=radius)
        cafes = await fs.search(lat, lon, query="cafe", radius=radius)
        shops = await fs.search(lat, lon, query="shop", radius=radius)
        
        # Combine all results into a single array
        all_results = []
        
        # Add general places
        if must.get("results"):
            all_results.extend(must["results"])
        
        # Add food places
        if food.get("results"):
            all_results.extend(food["results"])
        
        # Add parks
        if parks.get("results"):
            all_results.extend(parks["results"])
        
        # Add cafes
        if cafes.get("results"):
            all_results.extend(cafes["results"])
        
        # Add shops
        if shops.get("results"):
            all_results.extend(shops["results"])
        
        # Remove duplicates based on fsq_place_id
        seen_ids = set()
        unique_results = []
        for place in all_results:
            if place.get("fsq_place_id") and place["fsq_place_id"] not in seen_ids:
                seen_ids.add(place["fsq_place_id"])
                unique_results.append(place)
        
        # Sort by distance
        unique_results.sort(key=lambda x: x.get("distance", 999999))
        
        # Add photos to each result
        for place in unique_results:
            try:
                place_id = place.get("fsq_place_id")
                if place_id:
                    photos = await fs.get_photos(place_id, limit=3)
                    place["photos"] = photos
                else:
                    place["photos"] = []
            except Exception:
                place["photos"] = []
        
        print(f"Found {len(unique_results)} unique places")
        return {"results": unique_results}
        
    except Exception as e:
        print(f"Explorer error: {e}")
        traceback.print_exc()
        # Fallback data when Foursquare API fails - Updated for new API
        return {
            "results": [
                {
                    "fsq_place_id": "demo-attraction-1",
                    "name": "City Palace",
                    "categories": [{"name": "Historic Site"}],
                    "distance": 1200,
                    "rating": 4.6,
                    "latitude": lat + 0.001,
                    "longitude": lon + 0.001,
                    "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-attraction-2",
                    "name": "Hawa Mahal",
                    "categories": [{"name": "Palace"}],
                    "distance": 800,
                    "rating": 4.4,
                    "latitude": lat - 0.001,
                    "longitude": lon - 0.001,
                    "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-food-1",
                    "name": "Local Restaurant",
                    "categories": [{"name": "Restaurant"}],
                    "distance": 500,
                    "rating": 4.2,
                    "latitude": lat + 0.002,
                    "longitude": lon + 0.002,
                    "photos": ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-park-1",
                    "name": "Central Park",
                    "categories": [{"name": "Park"}],
                    "distance": 400,
                    "rating": 4.3,
                    "latitude": lat - 0.002,
                    "longitude": lon - 0.002,
                    "photos": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"]
                },
                {
                    "fsq_place_id": "demo-cafe-1",
                    "name": "Local Café",
                    "categories": [{"name": "Cafe"}],
                    "distance": 600,
                    "rating": 4.1,
                    "latitude": lat + 0.003,
                    "longitude": lon + 0.003,
                    "photos": ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"]
                }
            ]
        }
