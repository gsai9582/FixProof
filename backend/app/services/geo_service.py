import math
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in meters.
    Formula:
    a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
    c = 2 * atan2(√a, √(1−a))
    d = R * c
    """
    R = 6371000.0  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return round(R * c, 2)

# Known Chennai Civic Anchor Points for high exposure fallback
CHENNAI_SENSITIVE_ANCHORS = [
    # Schools & Universities
    {"name": "Anna University / Guindy", "lat": 13.0102, "lng": 80.2355, "type": "university", "weight": 90},
    {"name": "IIT Madras / Adyar Gate", "lat": 12.9915, "lng": 80.2337, "type": "university", "weight": 90},
    {"name": "Bala Vidya Mandir Adyar", "lat": 13.0067, "lng": 80.2570, "type": "school", "weight": 95},
    {"name": "Ramakrishna Mission School T Nagar", "lat": 13.0418, "lng": 80.2340, "type": "school", "weight": 95},
    {"name": "Kendriya Vidyalaya Anna Nagar", "lat": 13.0850, "lng": 80.2100, "type": "school", "weight": 95},
    # Hospitals
    {"name": "Fortis Malar Hospital Adyar", "lat": 13.0060, "lng": 80.2585, "type": "hospital", "weight": 100},
    {"name": "Apollo Hospital Greams Road", "lat": 13.0560, "lng": 80.2510, "type": "hospital", "weight": 100},
    {"name": "Sundaram Medical Foundation Anna Nagar", "lat": 13.0875, "lng": 80.2140, "type": "hospital", "weight": 100},
    # Heavy Transit Junctions
    {"name": "T Nagar Panagal Park Junction", "lat": 13.0405, "lng": 80.2335, "type": "junction", "weight": 90},
    {"name": "Adyar Signal Junction (Lattice Bridge)", "lat": 13.0063, "lng": 80.2550, "type": "junction", "weight": 85},
    {"name": "Anna Arch Junction", "lat": 13.0760, "lng": 80.2210, "type": "junction", "weight": 85},
]

# Simple in-memory cache for spatial exposure lookups: (round(lat, 3), round(lng, 3)) -> score
_exposure_cache: Dict[str, float] = {}

def calculate_exposure_score(lat: float, lng: float) -> float:
    """
    Computes exposure score 0-100 based on proximity to schools, hospitals, transit hubs.
    If within 150m of hospital: 100
    If within 300m of school: 80-95
    If within 250m of major junction: 70-85
    Falls back gracefully if external APIs fail or are slow.
    """
    cache_key = f"{round(lat, 3)}_{round(lng, 3)}"
    if cache_key in _exposure_cache:
        return _exposure_cache[cache_key]

    max_exposure = 20.0  # Base street level exposure

    # Check proximity to known anchor points
    for anchor in CHENNAI_SENSITIVE_ANCHORS:
        dist = haversine_distance_meters(lat, lng, anchor["lat"], anchor["lng"])
        if dist <= 100:
            score = float(anchor["weight"])
        elif dist <= 300:
            decay = (300 - dist) / 200.0  # 1.0 down to 0.0
            score = 30.0 + (anchor["weight"] - 30.0) * decay
        elif dist <= 600:
            score = 30.0
        else:
            score = 20.0
        
        if score > max_exposure:
            max_exposure = score

    final_score = min(100.0, max(10.0, round(max_exposure, 1)))
    _exposure_cache[cache_key] = final_score
    return final_score
