from fastapi import APIRouter
from typing import List, Dict, Any
from math import radians, cos, sin, asin, sqrt

router = APIRouter()


def haversine(a: Dict[str,float], b: Dict[str,float]) -> float:
    lat1, lon1, lat2, lon2 = map(radians, [a["lat"], a["lng"], b["lat"], b["lng"]])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    h = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return 6371 * 2 * asin(sqrt(h))

@router.post("/optimize")
async def optimize(body: Dict[str, Any]):
    stops: List[Dict[str,float]] = body.get("stops", [])
    distance_km = 0.0
    for i in range(len(stops)-1):
        distance_km += haversine(stops[i], stops[i+1])
    eta_min = int(distance_km / 4.5 * 60)
    return {"distance_km": round(distance_km, 1), "eta_min": eta_min, "stops": stops}
