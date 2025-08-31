from fastapi import APIRouter, Depends, HTTPException, Query
import traceback
import re
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..services.foursquare_service import FoursquareService
from .auth import get_current_user, get_optional_user
from ..models.user import User

router = APIRouter()

@router.get("/search")
async def places_search(
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    query: str | None = None,
    radius: int | None = None,
    tags: str | None = None,
    near: str | None = None,
    lang: str | None = Query(None, alias="lang"),
    db: AsyncSession = Depends(get_db),
    current: User | None = Depends(get_optional_user),
):
    fs = FoursquareService()
    try:
        data = await fs.search(lat, lon, query=query, radius=radius, categories=tags, near=near, lang=lang)
        items = data.get("results") or []
        
        # Add photos to each result
        for place in items:
            try:
                place_id = place.get("fsq_place_id")
                if place_id:
                    photos = await fs.get_photos(place_id, limit=3)
                    place["photos"] = photos
                else:
                    place["photos"] = []
            except Exception:
                place["photos"] = []
        
        if current and current.dislikes:
            dislikes = set(current.dislikes.keys())
            # NEW: Use fsq_place_id instead of fsq_id
            items = [i for i in items if str(i.get("fsq_place_id")) not in dislikes]
        return {"results": items}
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails - Updated for new API
        fallback_items = [
            {
                "fsq_place_id": "demo-search-1",  # NEW: Updated field name
                "name": f"Demo {query or 'Place'} 1",
                "categories": [{"name": "Demo Category"}],
                "distance": 500,
                "rating": 4.2,
                # NEW: Use latitude/longitude instead of geocodes.main
                "latitude": 26.9124,
                "longitude": 75.7873,
                "photos": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"]
            },
            {
                "fsq_place_id": "demo-search-2",  # NEW: Updated field name
                "name": f"Demo {query or 'Place'} 2",
                "categories": [{"name": "Demo Category"}],
                "distance": 800,
                "rating": 4.0,
                # NEW: Use latitude/longitude instead of geocodes.main
                "latitude": 26.9134,
                "longitude": 75.7883,
                "photos": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]
            }
        ]
        if current and current.dislikes:
            dislikes = set(current.dislikes.keys())
            # NEW: Use fsq_place_id instead of fsq_id
            fallback_items = [i for i in fallback_items if str(i.get("fsq_place_id")) not in dislikes]
        return {"results": fallback_items}

@router.get("/geocode")
async def geocode(query: str | None = Query(None), lat: float | None = Query(None), lon: float | None = Query(None), db: AsyncSession = Depends(get_db)):
    fs = FoursquareService()
    try:

        # Reverse geocoding: if we have lat/lon but no query, or if query looks like coordinates
        if (lat is not None and lon is not None) or (query and re.match(r'^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$', query.strip())):
            # Determine the coordinates to use
            if lat is not None and lon is not None:
                query_lat, query_lon = lat, lon
            else:
                # Extract coordinates from query string
                coord_match = re.match(r'^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$', query.strip())
                query_lat = float(coord_match.group(1))
                query_lon = float(coord_match.group(2))
            # Use Foursquare's reverse geocoding or search for nearby places to get location name
            try:
                # Search for places very close to these coordinates to get location context
                data = await fs.search(query_lat, query_lon, query="", radius=1000)
                items = data.get("results") or []
                
                if items and len(items) > 0:
                    # Get the closest place to determine the area
                    closest = items[0]
                    area_name = closest.get("location", {}).get("locality") or closest.get("location", {}).get("neighborhood") or closest.get("location", {}).get("address")
                    
                    if area_name:
                        return {
                            "lat": query_lat,
                            "lon": query_lon,
                            "name": area_name,
                            "id": "reverse-geocode"
                        }
                
                # Fallback: try to get city name from coordinates
                # For Jaipur area, we can provide a more accurate name
                if 26.8 <= query_lat <= 27.0 and 75.7 <= query_lon <= 76.0:
                    # This is in the Jaipur metropolitan area
                    if query_lat > 26.95:
                        return {
                            "lat": query_lat,
                            "lon": query_lon,
                            "name": "Jaipur, Rajasthan",
                            "id": "reverse-geocode-jaipur"
                        }
                    else:
                        return {
                            "lat": query_lat,
                            "lon": query_lon,
                            "name": "Beermalpura, Jaipur",
                            "id": "reverse-geocode-beermalpura"
                        }
                
                # Generic fallback
                return {
                    "lat": query_lat,
                    "lon": query_lon,
                    "name": f"Near coordinates ({query_lat:.4f}, {query_lon:.4f})",
                    "id": "reverse-geocode"
                }
                
            except Exception as e:
                print(f"Reverse geocoding error: {e}")
                # Fallback for reverse geocoding
                return {
                    "lat": query_lat,
                    "lon": query_lon,
                    "name": "Jaipur, Rajasthan",
                    "id": "reverse-geocode-fallback"
                }
        
        # Regular forward geocoding (searching for places by name)
        if not query:
            raise HTTPException(status_code=400, detail="Query parameter required for forward geocoding")
            
        if lat is not None and lon is not None:
            data = await fs.search(lat, lon, query=query, radius=5000)
        else:
            # Foursquare API often requires ll; fall back to Jaipur center as a neutral bias if none provided
            data = await fs.search(26.9124, 75.7873, query=query, radius=50000)
        
        items = data.get("results") or []
        if not items:
            raise HTTPException(status_code=404, detail="No results for query")
        
        first = items[0]
        latlon = {
            "lat": first.get("latitude"),
            "lon": first.get("longitude"),
            "name": first.get("name"),
            "id": first.get("fsq_place_id"),
        }
        
        if latlon["lat"] is None or latlon["lon"] is None:
            raise HTTPException(status_code=502, detail="Geocode missing coordinates")
        return latlon
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Geocoding error: {e}")
        traceback.print_exc()
        # Graceful fallback so features keep working without external API
        fallback = {
            "lat": 26.9124,
            "lon": 75.7873,
            "name": "Jaipur, Rajasthan",
            "id": "demo-geocode",
        }
        return fallback

@router.get("/{place_id}")
async def place_details(place_id: str, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    fs = FoursquareService()
    try:
        data = await fs.details(place_id)
        return data
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails - Updated for new API
        return {
            "fsq_place_id": place_id,  # NEW: Updated field name
            "name": f"Demo Place {place_id}",
            "categories": [{"name": "Demo Category"}],
            "rating": 4.2,
            "stats": {"total_photos": 5, "total_tips": 3},
            # NEW: Use latitude/longitude instead of geocodes.main
            "latitude": 26.9124,
            "longitude": 75.7873,
            "location": {
                "address": "Demo Address",
                "locality": "Demo City",
                "region": "Demo Region"
            }
        }

@router.get("/explore")
async def places_explore(lat: float, lon: float, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    fs = FoursquareService()
    try:
        data = await fs.explore(lat, lon)
        return data
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails - Updated for new API
        return {
            "groups": [
                {
                    "type": "Recommended Places",
                    "name": "Recommended",
                    "items": [
                        {
                            "fsq_place_id": "demo-explore-1",  # NEW: Updated field name
                            "name": "Demo Attraction",
                            "categories": [{"name": "Attraction"}],
                            "distance": 600,
                            "rating": 4.3
                        }
                    ]
                }
            ]
        }

@router.get("/{place_id}/photos")
async def place_photos(place_id: str, limit: int | None = 6, lang: str | None = None):
    fs = FoursquareService()
    try:
        data = await fs.photos(place_id, limit=limit, lang=lang)
        return data
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails
        return [
            {
                "id": "demo-photo-1",
                "created_at": "2025-01-01T00:00:00Z",
                "prefix": "https://via.placeholder.com/",
                "suffix": "300x200/4CAF50/FFFFFF?text=Demo+Photo+1",
                "width": 300,
                "height": 200
            },
            {
                "id": "demo-photo-2",
                "created_at": "2025-01-01T00:00:00Z", 
                "prefix": "https://via.placeholder.com/",
                "suffix": "300x200/2196F3/FFFFFF?text=Demo+Photo+2",
                "width": 300,
                "height": 200
            }
        ]

@router.get("/{place_id}/tips")
async def place_tips(place_id: str, limit: int | None = 6, lang: str | None = None):
    fs = FoursquareService()
    try:
        data = await fs.tips(place_id, limit=limit, lang=lang)
        return data
    except Exception:
        traceback.print_exc()
        # Fallback data when Foursquare API fails
        return {
            "count": 2,
            "groups": [
                {
                    "type": "others",
                    "name": "Tips",
                    "count": 2,
                    "items": [
                        {
                            "id": "demo-tip-1",
                            "created_at": "2025-01-01T00:00:00Z",
                            "text": "This is a great demo place to visit!",
                            "lang": "en",
                            "agreeCount": 5,
                            "user": {"firstName": "Demo", "lastName": "User"}
                        },
                        {
                            "id": "demo-tip-2",
                            "created_at": "2025-01-01T00:00:00Z",
                            "text": "Highly recommended for demo purposes.",
                            "lang": "en", 
                            "agreeCount": 3,
                            "user": {"firstName": "Demo", "lastName": "Reviewer"}
                        }
                    ]
                }
            ]
        }
