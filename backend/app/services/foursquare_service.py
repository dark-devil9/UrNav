import httpx
from typing import Any, Dict, Optional
from ..config import settings

# NEW: Updated for Foursquare Places API
BASE_URL = "https://places-api.foursquare.com"

class FoursquareService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.FOURSQUARE_API_KEY
        # NEW: Updated headers for Places API
        self.base_headers = {
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "",  # NEW: Use Bearer token
            "X-Places-Api-Version": "2025-06-17",  # NEW: Required version header
            "Accept": "application/json",
            "User-Agent": "urnav/0.1 (+https://example.local)",
        }

    async def _get(self, path: str, params: Dict[str, Any] | None = None, lang: str | None = None) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("FOURSQUARE_API_KEY is not configured. Please set the FOURSQUARE_API_KEY environment variable.")
        
        headers = dict(self.base_headers)
        if lang:
            headers["Accept-Language"] = lang
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(f"{BASE_URL}{path}", params=params, headers=headers)
            # Handle specific error codes before calling raise_for_status
            if r.status_code == 401:
                raise RuntimeError("FOURSQUARE_API_KEY is invalid or expired. Please check your API key.")
            elif r.status_code == 429:
                raise RuntimeError("Foursquare API rate limit exceeded. Please try again later.")
            elif r.status_code >= 400:
                raise RuntimeError(f"Foursquare API error: {r.status_code} - {r.text}")
            
            return r.json()

    async def search(
        self,
        lat: float | None = None,
        lon: float | None = None,
        query: str | None = None,
        radius: int | None = None,
        categories: str | None = None,
        near: str | None = None,
        limit: int | None = 20,
        sort: str | None = "DISTANCE",
        open_now: bool | None = None,
        lang: str | None = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if lat is not None and lon is not None:
            params["ll"] = f"{lat},{lon}"
        elif near:
            params["near"] = near
        if query:
            params["query"] = query
        if radius:
            params["radius"] = radius
        if categories:
            params["categories"] = categories
        if limit:
            params["limit"] = limit
        if sort:
            params["sort"] = sort
        if open_now is not None:
            params["open_now"] = str(open_now).lower()
        # NEW: Updated endpoint path (no /v3)
        return await self._get("/places/search", params, lang=lang)

    async def details(self, place_id: str, lang: str | None = None) -> Dict[str, Any]:
        # NEW: Updated endpoint path (no /v3)
        return await self._get(f"/places/{place_id}", lang=lang)

    async def explore(self, lat: float, lon: float, radius: int | None = None, lang: str | None = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"ll": f"{lat},{lon}"}
        if radius:
            params["radius"] = radius
        # NEW: Updated endpoint path (no /v3)
        return await self._get("/places/explore", params, lang=lang)

    async def photos(self, place_id: str, limit: int | None = 5, lang: str | None = None) -> list[Dict[str, Any]]:
        params: Dict[str, Any] = {}
        if limit:
            params["limit"] = limit
        # NEW: Updated endpoint path (no /v3)
        return await self._get(f"/places/{place_id}/photos", params, lang=lang)

    async def tips(self, place_id: str, limit: int | None = 5, lang: str | None = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if limit:
            params["limit"] = limit
        # NEW: Updated endpoint path (no /v3)
        return await self._get(f"/places/{place_id}/tips", params, lang=lang)

    async def match(self, name: str, address: str | None = None, lat: float | None = None, lon: float | None = None, lang: str | None = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"name": name}
        if address:
            params["address"] = address
        if lat is not None and lon is not None:
            params["ll"] = f"{lat},{lon}"
        # NEW: Updated endpoint path (no /v3)
        return await self._get("/places/match", params, lang=lang)

    async def get_photos(self, place_id: str, limit: int | None = 3) -> list[str]:
        """Get photo URLs for a place in a simple format"""
        try:
            photos_data = await self.photos(place_id, limit=limit)
            photo_urls = []
            
            if photos_data and "results" in photos_data:
                for photo in photos_data["results"]:
                    # Extract the photo URL from the response
                    if "prefix" in photo and "suffix" in photo:
                        # Construct the photo URL
                        photo_url = f"{photo['prefix']}400x300{photo['suffix']}"
                        photo_urls.append(photo_url)
                    elif "url" in photo:
                        photo_urls.append(photo["url"])
            
            return photo_urls
        except Exception:
            # Return empty list if photo fetch fails
            return []
