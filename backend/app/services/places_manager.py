from typing import Dict, List, Optional, Any
from .foursquare_service import FoursquareService
import re
import json

class PlacesManager:
    def __init__(self):
        self.foursquare = FoursquareService()
        
        # Task to category mapping for better place search
        self.task_categories = {
            "coffee": ["coffee", "cafe", "breakfast", "coffee shop", "espresso"],
            "food": ["restaurant", "food", "dining", "eatery", "bistro", "kitchen"],
            "shopping": ["shop", "store", "mall", "market", "shopping center", "plaza"],
            "groceries": ["grocery", "supermarket", "market", "convenience store", "food store"],
            "flowers": ["florist", "flower", "garden center", "flower shop", "nursery"],
            "post": ["post office", "courier", "shipping", "mail", "logistics"],
            "bank": ["bank", "atm", "financial", "credit union", "savings"],
            "pharmacy": ["pharmacy", "drugstore", "chemist", "medical store", "health store"],
            "park": ["park", "garden", "recreation", "playground", "green space"],
            "gym": ["gym", "fitness", "health club", "fitness center", "workout"],
            "entertainment": ["cinema", "theater", "museum", "gallery", "amusement"],
            "transport": ["bus stop", "train station", "taxi stand", "transport hub"],
            "beauty": ["salon", "spa", "beauty salon", "nail salon", "barber"],
            "clothing": ["clothing store", "fashion", "apparel", "boutique", "outlet"],
            "electronics": ["electronics store", "mobile shop", "computer store", "tech store"],
            "automotive": ["gas station", "car wash", "auto repair", "dealership"]
        }
        
        # Task to search query mapping
        self.task_queries = {
            "get coffee": ["coffee", "cafe", "coffee shop"],
            "buy coffee": ["coffee", "cafe", "coffee shop"],
            "get breakfast": ["breakfast", "cafe", "restaurant", "coffee shop"],
            "buy bouquets": ["florist", "flower shop", "gift shop"],
            "buy flowers": ["florist", "flower shop", "gift shop"],
            "buy groceries": ["grocery", "supermarket", "market", "convenience store"],
            "visit post office": ["post office", "courier", "shipping"],
            "meet friend": ["cafe", "restaurant", "park", "coffee shop"],
            "go shopping": ["shop", "mall", "market", "store", "shopping center"],
            "get food": ["restaurant", "food", "dining", "eatery"],
            "go to gym": ["gym", "fitness", "health club", "fitness center"],
            "visit park": ["park", "garden", "recreation", "playground"],
            "go to bank": ["bank", "atm", "financial", "credit union"],
            "get medicine": ["pharmacy", "drugstore", "chemist", "medical store"],
            "buy clothes": ["clothing store", "fashion", "apparel", "boutique"],
            "get haircut": ["salon", "barber", "hair salon", "beauty salon"],
            "watch movie": ["cinema", "movie theater", "multiplex", "theater"],
            "get gas": ["gas station", "petrol pump", "fuel station"],
            "buy books": ["bookstore", "library", "book shop"],
            "get nails done": ["nail salon", "beauty salon", "spa"],
            "buy electronics": ["electronics store", "mobile shop", "computer store"]
        }
        
        # Fallback data for when Foursquare API fails
        self.fallback_places = {
            "coffee": [
                {"name": "Local Coffee Shop", "category": "Cafe", "distance": 200, "rating": 4.2},
                {"name": "Corner Café", "category": "Cafe", "distance": 450, "rating": 4.0},
                {"name": "Morning Brew", "category": "Coffee Shop", "distance": 800, "rating": 4.3}
            ],
            "cafe": [
                {"name": "Local Coffee Shop", "category": "Cafe", "distance": 200, "rating": 4.2},
                {"name": "Corner Café", "category": "Cafe", "distance": 450, "rating": 4.0},
                {"name": "Morning Brew", "category": "Coffee Shop", "distance": 800, "rating": 4.3}
            ],
            "florist": [
                {"name": "Flower Paradise", "category": "Florist", "distance": 300, "rating": 4.5},
                {"name": "Garden Blooms", "category": "Florist", "distance": 600, "rating": 4.1},
                {"name": "Fresh Flowers", "category": "Florist", "distance": 1200, "rating": 4.3}
            ],
            "grocery": [
                {"name": "Local Market", "category": "Grocery Store", "distance": 150, "rating": 4.0},
                {"name": "Fresh Foods", "category": "Supermarket", "distance": 400, "rating": 4.2},
                {"name": "City Mart", "category": "Convenience Store", "distance": 700, "rating": 3.8}
            ],
            "restaurant": [
                {"name": "Local Restaurant", "category": "Restaurant", "distance": 250, "rating": 4.1},
                {"name": "Food Corner", "category": "Restaurant", "distance": 500, "rating": 4.3},
                {"name": "Tasty Bites", "category": "Restaurant", "distance": 900, "rating": 4.0}
            ],
            "park": [
                {"name": "Central Park", "category": "Park", "distance": 300, "rating": 4.4},
                {"name": "Garden Square", "category": "Garden", "distance": 600, "rating": 4.1},
                {"name": "Riverside Walk", "category": "Walking Trail", "distance": 800, "rating": 4.5}
            ]
        }
    
    def _extract_task_keywords(self, task: str) -> List[str]:
        """Extract relevant keywords from a task for place search"""
        task_lower = task.lower()
        
        # Check exact matches first
        for task_pattern, queries in self.task_queries.items():
            if task_pattern in task_lower:
                return queries
        
        # Check category matches
        for category, keywords in self.task_categories.items():
            if any(keyword in task_lower for keyword in keywords):
                return keywords
        
        # Fallback: extract nouns and common words
        words = re.findall(r'\b\w+\b', task_lower)
        # Filter out common stop words
        stop_words = {'get', 'buy', 'go', 'to', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'of', 'with', 'by'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return keywords[:3]  # Limit to 3 keywords
    
    async def _get_llm_search_categories(self, task: str) -> List[str]:
        """Ask the LLM to determine the best search categories for a task"""
        try:
            from ..services.mistral_service import MistralService
            
            prompt = f"""
            Given this task: "{task}"
            
            Determine the best 2-3 Foursquare API search categories to find places for this task.
            Return ONLY a JSON array of category strings, nothing else.
            
            Examples:
            - Task: "Get coffee" → ["coffee shop", "cafe", "coffee"]
            - Task: "Buy flowers" → ["florist", "flower shop", "gift shop"]
            - Task: "Get groceries" → ["grocery store", "supermarket", "convenience store"]
            - Task: "Go to gym" → ["gym", "fitness center", "health club"]
            - Task: "Watch movie" → ["movie theater", "cinema", "entertainment"]
            - Task: "Get haircut" → ["hair salon", "barber", "beauty salon"]
            - Task: "Buy clothes" → ["clothing store", "fashion", "apparel store"]
            - Task: "Get medicine" → ["pharmacy", "drugstore", "medical store"]
            - Task: "Visit park" → ["park", "garden", "recreation"]
            - Task: "Go to bank" → ["bank", "atm", "financial"]
            
            Return the JSON array:
            """
            
            mistral = MistralService()
            response = await mistral.chat(prompt)
            
            # Try to extract JSON from the response
            try:
                # Look for JSON array in the response
                start_idx = response.find('[')
                end_idx = response.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = response[start_idx:end_idx]
                    categories = json.loads(json_str)
                    
                    if isinstance(categories, list) and len(categories) > 0:
                        print(f"🤖 LLM suggested categories for '{task}': {categories}")
                        return categories[:3]  # Limit to 3 categories
            except (json.JSONDecodeError, IndexError):
                pass
            
            # Fallback to keyword extraction if LLM fails
            print(f"⚠️ LLM category extraction failed for '{task}', using fallback keywords")
            return self._extract_task_keywords(task)
            
        except Exception as e:
            print(f"❌ Error getting LLM categories for '{task}': {e}")
            # Fallback to keyword extraction
            return self._extract_task_keywords(task)
    
    def _get_broad_categories(self, task: str) -> List[str]:
        """Get broader category searches for a task"""
        task_lower = task.lower()
        
        # Map tasks to broader search categories
        if any(word in task_lower for word in ["coffee", "cafe", "drink", "breakfast"]):
            return ["cafe", "coffee shop", "restaurant"]
        elif any(word in task_lower for word in ["food", "eat", "lunch", "dinner"]):
            return ["restaurant", "food", "dining"]
        elif any(word in task_lower for word in ["shop", "buy", "purchase", "mall"]):
            return ["shop", "store", "mall", "market"]
        elif any(word in task_lower for word in ["flower", "bouquet", "gift"]):
            return ["florist", "flower shop", "gift shop"]
        elif any(word in task_lower for word in ["grocery", "food", "vegetable"]):
            return ["grocery", "supermarket", "market"]
        elif any(word in task_lower for word in ["bank", "atm", "money"]):
            return ["bank", "atm", "financial"]
        elif any(word in task_lower for word in ["park", "garden", "walk"]):
            return ["park", "garden", "recreation"]
        elif any(word in task_lower for word in ["gym", "fitness", "exercise"]):
            return ["gym", "fitness", "health club"]
        else:
            return ["place", "business", "establishment"]
    
    def _calculate_relevance_score(self, place: Dict[str, Any], task: str, keywords: List[str]) -> float:
        """Calculate how relevant a place is to a task"""
        score = 0.0
        task_lower = task.lower()
        place_name = place.get("name", "").lower()
        place_categories = [cat.get("name", "").lower() for cat in place.get("categories", [])]
        
        # Score based on name matches
        for keyword in keywords:
            if keyword.lower() in place_name:
                score += 2.0
            if any(keyword.lower() in cat for cat in place_categories):
                score += 1.5
        
        # Score based on distance (closer is better)
        distance = place.get("distance", 999999)
        if distance < 500:
            score += 1.0
        elif distance < 1000:
            score += 0.5
        
        # Score based on rating
        rating = place.get("rating", 0)
        score += rating * 0.2
        
        return score
    
    def _generate_fallback_coordinates(self, origin_lat: float, origin_lon: float, index: int) -> tuple[float, float]:
        """Generate realistic fallback coordinates around the origin"""
        # Create a more realistic pattern around the origin
        import math
        
        # Use different angles and distances for variety
        if index == 0:
            # First place: close to origin
            angle = 0.3  # radians
            radius = 0.0005  # degrees (roughly 50m)
        elif index == 1:
            # Second place: medium distance
            angle = 1.2  # radians
            radius = 0.001  # degrees (roughly 100m)
        elif index == 2:
            # Third place: further away
            angle = 2.1  # radians
            radius = 0.0015  # degrees (roughly 150m)
        else:
            # Additional places: spiral pattern
            angle = index * 0.8  # radians
            radius = (index + 1) * 0.0008  # degrees
        
        lat_offset = radius * math.cos(angle)
        lon_offset = radius * math.sin(angle)
        
        return (origin_lat + lat_offset, origin_lon + lon_offset)
    
    def _get_fallback_place(self, keyword: str, origin_lat: float, origin_lon: float, index: int) -> Dict[str, Any]:
        """Get fallback place data when Foursquare API fails"""
        # Find the best matching fallback category
        best_match = None
        for category, places in self.fallback_places.items():
            if category in keyword.lower():
                best_match = places[min(index, len(places) - 1)]
                break
        
        if not best_match:
            # Generic fallback
            best_match = {
                "name": f"Local {keyword.title()} Place",
                "category": "General",
                "distance": (index + 1) * 200,
                "rating": 4.0
            }
        
        # Generate realistic coordinates
        fallback_lat, fallback_lon = self._generate_fallback_coordinates(origin_lat, origin_lon, index)
        
        return {
            "name": best_match["name"],
            "lat": fallback_lat,
            "lng": fallback_lon,
            "category": best_match["category"],
            "distance": best_match["distance"],
            "rating": best_match["rating"],
            "fsq_id": f"fallback_{keyword}_{index}"
        }
    
    async def find_place_for_task(self, task: str, origin_lat: float, origin_lon: float, radius: int = 25000, task_index: int = 0) -> Optional[Dict[str, Any]]:
        """Find a suitable place for a given task near the origin coordinates"""
        try:
            print(f"🔍 Searching for task: '{task}' at ({origin_lat}, {origin_lon})")
            
            # Strategy 1: Get LLM-suggested search categories
            print(f"🤖 Attempting to get LLM categories for task: '{task}'")
            try:
                search_categories = await self._get_llm_search_categories(task)
                print(f"🤖 LLM suggested categories: {search_categories}")
            except Exception as e:
                print(f"❌ LLM method failed: {e}")
                search_categories = self._extract_task_keywords(task)
                print(f"🔄 Using fallback keywords: {search_categories}")
            
            if not search_categories:
                return None
            
            # Strategy 2: Search with LLM categories, prioritizing closer places
            radiuses_to_try = [5000, 10000, 15000, 20000]  # Start with smaller radiuses for closer places
            
            for search_radius in radiuses_to_try:
                all_places = []
                
                # Search with each category
                for category in search_categories:
                    try:
                        print(f"🔎 Searching for '{category}' with radius {search_radius}m")
                        search_result = await self.foursquare.search(
                            lat=origin_lat,
                            lon=origin_lon,
                            query=category,
                            radius=search_radius,
                            limit=20
                        )
                        
                        places = search_result.get("results", [])
                        print(f"📍 Found {len(places)} places for '{category}' with radius {search_radius}m")
                        
                        if places:
                            # Filter places with valid coordinates
                            valid_places = []
                            for place in places:
                                lat = place.get("latitude") or place.get("lat")
                                lng = place.get("longitude") or place.get("lon")
                                
                                if lat and lng:
                                    place_data = {
                                        "name": place.get("name", "Unknown"),
                                        "lat": lat,
                                        "lng": lng,
                                        "category": place.get("categories", [{}])[0].get("name", "Place") if place.get("categories") else "Place",
                                        "distance": place.get("distance", 0),
                                        "rating": place.get("rating", 0),
                                        "fsq_id": place.get("fsq_place_id", ""),
                                        "search_category": category
                                    }
                                    valid_places.append(place_data)
                            
                            all_places.extend(valid_places)
                    
                    except Exception as e:
                        print(f"❌ Error searching for '{category}' with radius {search_radius}m: {e}")
                        continue
                
                # If we found places, select the best one
                if all_places:
                    # Sort by distance (closest first) and then by relevance
                    all_places.sort(key=lambda x: (x["distance"], -self._calculate_relevance_score(x, task, search_categories)))
                    
                    best_place = all_places[0]
                    print(f"✅ Found best place: {best_place['name']} ({best_place['category']}) at {best_place['lat']}, {best_place['lng']} - {best_place['distance']}m away")
                    return best_place
                
                print(f"📍 No places found with radius {search_radius}m, trying larger radius...")
            
            # Strategy 3: Fallback to original keyword search if no places found
            print(f"🔄 Fallback: Using original keyword search for '{task}'")
            search_keywords = self._extract_task_keywords(task)
            print(f"📝 Fallback keywords: {search_keywords}")
            
            for keyword in search_keywords:
                try:
                    search_result = await self.foursquare.search(
                        lat=origin_lat,
                        lon=origin_lon,
                        query=keyword,
                        radius=radius,
                        limit=15
                    )
                    
                    places = search_result.get("results", [])
                    if places:
                        for place in places:
                            lat = place.get("latitude") or place.get("lat")
                            lng = place.get("longitude") or place.get("lon")
                            
                            if lat and lng:
                                place_data = {
                                    "name": place.get("name", "Unknown"),
                                    "lat": lat,
                                    "lng": lng,
                                    "category": place.get("categories", [{}])[0].get("name", "Place") if place.get("categories") else "Place",
                                    "distance": place.get("distance", 0),
                                    "rating": place.get("rating", 0),
                                    "fsq_id": place.get("fsq_place_id", "")
                                }
                                print(f"✅ Fallback: Found place: {place_data['name']} at {lat}, {lng}")
                                return place_data
                                
                except Exception as e:
                    continue
            
            # Only use fallback if all API strategies fail
            print(f"All API strategies failed for task: {task}, using fallback")
            fallback_place = self._get_fallback_place(search_categories[0], origin_lat, origin_lon, task_index)
            return fallback_place
            
        except Exception as e:
            print(f"Critical error in find_place_for_task: {e}")
            fallback_place = self._get_fallback_place("general", origin_lat, origin_lon, task_index)
            return fallback_place
    
    async def find_places_for_tasks(self, tasks: List[str], origin_lat: float, origin_lon: float, radius: int = 25000) -> List[Dict[str, Any]]:
        """Find places for multiple tasks"""
        places = []
        
        for i, task in enumerate(tasks):
            place = await self.find_place_for_task(task, origin_lat, origin_lon, radius, i)
            if place:
                places.append({
                    "task": task,
                    "place": place["name"],
                    "lat": place["lat"],
                    "lng": place["lng"],
                    "category": place["category"],
                    "distance": place["distance"],
                    "rating": place["rating"],
                    "fsq_id": place["fsq_id"]
                })
            else:
                # This shouldn't happen with fallback data, but just in case
                places.append({
                    "task": task,
                    "place": "No suitable place found",
                    "lat": None,
                    "lng": None,
                    "category": "Unknown",
                    "distance": None,
                    "rating": None,
                    "fsq_id": None
                })
        
        return places
