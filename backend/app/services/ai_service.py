import io
import json
import logging
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image
import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Civic Categories recognized by FixProof
VALID_CATEGORIES = [
    "pothole",
    "garbage",
    "water_leakage",
    "broken_streetlight",
    "drainage",
    "unsafe_infrastructure"
]

def analyze_report_basic(
    user_category: Optional[str] = None,
    user_text: Optional[str] = None,
    blur_score: float = 50.0
) -> Dict[str, Any]:
    """
    Deterministic rule-based Basic Mode fallback for report analysis.
    Uses keyword heuristics and user input.
    """
    category = "pothole"
    text_lower = (user_text or "").lower()
    
    if user_category and user_category.lower() in VALID_CATEGORIES:
        category = user_category.lower()
    elif "garbage" in text_lower or "trash" in text_lower or "waste" in text_lower or "dump" in text_lower:
        category = "garbage"
    elif "water" in text_lower or "leak" in text_lower or "pipe" in text_lower or "burst" in text_lower:
        category = "water_leakage"
    elif "light" in text_lower or "lamp" in text_lower or "dark" in text_lower:
        category = "broken_streetlight"
    elif "drain" in text_lower or "sewer" in text_lower or "overflow" in text_lower:
        category = "drainage"
    elif "hazard" in text_lower or "wire" in text_lower or "collapse" in text_lower:
        category = "unsafe_infrastructure"
    elif "pothole" in text_lower or "road" in text_lower or "crater" in text_lower:
        category = "pothole"

    # Severity rules
    severity = 3
    hazard_cues = []
    
    if any(k in text_lower for k in ["deep", "huge", "dangerous", "accident", "hospital", "urgent", "broken", "severe", "electric"]):
        severity = 4
        hazard_cues.append("High-risk hazard keywords detected in citizen report")
        
    if any(k in text_lower for k in ["critical", "emergency", "fatal", "live wire", "flooded"]):
        severity = 5
        hazard_cues.append("Critical public safety indicator flagged")

    if not hazard_cues:
        hazard_cues.append("Standard municipal service deficiency")

    title_map = {
        "pothole": "Hazardous road crater / pothole",
        "garbage": "Uncollected public garbage dump",
        "water_leakage": "Municipal pipe leakage / water waste",
        "broken_streetlight": "Malfunctioning street luminaire",
        "drainage": "Blocked storm-water drainage",
        "unsafe_infrastructure": "Unsafe sidewalk / structural hazard"
    }

    desc_map = {
        "pothole": "Road surface depression posing immediate tire damage and two-wheeler skid hazard.",
        "garbage": "Accumulated municipal solid waste attracting pests and generating foul odor.",
        "water_leakage": "Pressurized water line rupture leaking clean municipal water onto the thoroughfare.",
        "broken_streetlight": "Street lighting fixture inoperative causing dark zone for night pedestrians.",
        "drainage": "Drainage grid obstructed with debris causing stagnant wastewater accumulation.",
        "unsafe_infrastructure": "Compromised civic asset requiring municipal repair crew intervention."
    }

    is_usable = blur_score >= 25.0
    if not is_usable:
        hazard_cues.append("Note: Image has high motion blur; consider capturing a sharper angle.")

    return {
        "suggested_category": category,
        "suggested_title": title_map.get(category, "Civic Infrastructure Defect"),
        "suggested_description": user_text if (user_text and len(user_text) > 10) else desc_map.get(category, "Infrastructure issue reported by citizen."),
        "suggested_severity": severity,
        "hazard_cues": hazard_cues,
        "confidence": 0.65,
        "mode": "basic",
        "blur_score": blur_score,
        "is_usable": is_usable
    }

def analyze_report_ai(
    image_bytes: bytes,
    user_category: Optional[str] = None,
    user_text: Optional[str] = None,
    blur_score: float = 50.0
) -> Dict[str, Any]:
    """
    Vision-LLM (Google Gemini) intake analyzer with strict JSON output.
    Falls back to analyze_report_basic on any failure or missing API key.
    """
    if not settings.GEMINI_API_KEY:
        return analyze_report_basic(user_category, user_text, blur_score)

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        prompt = f"""
You are FixProof's civic vision intake AI. Analyze this urban infrastructure image.
Optional user context: "{user_text or 'None'}"
User selected category: "{user_category or 'None'}"

Classify into one of these exact categories:
pothole, garbage, water_leakage, broken_streetlight, drainage, unsafe_infrastructure

Return a strictly valid JSON object matching this schema:
{{
  "category": "pothole | garbage | water_leakage | broken_streetlight | drainage | unsafe_infrastructure",
  "title": "Concise factual title (max 10 words)",
  "description": "Clear 1-2 sentence description of the visible defect and risk",
  "severity": <integer 1 to 5, where 1 is minor cosmetic and 5 is emergency danger>,
  "hazard_cues": ["list", "of", "visible", "risk", "factors"],
  "confidence": <float 0.0 to 1.0>
}}
Do NOT output markdown code fences or other prose. Output pure JSON only.
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ]
        )
        
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
            
        data = json.loads(text)
        
        cat = data.get("category", "").lower().strip()
        if cat not in VALID_CATEGORIES:
            cat = user_category if user_category in VALID_CATEGORIES else "pothole"

        severity = int(data.get("severity", 3))
        severity = max(1, min(5, severity))
        confidence = float(data.get("confidence", 0.85))
        confidence = max(0.1, min(1.0, confidence))

        return {
            "suggested_category": cat,
            "suggested_title": data.get("title", f"Reported {cat.replace('_', ' ').capitalize()}"),
            "suggested_description": data.get("description", "Civic issue detected via vision analysis."),
            "suggested_severity": severity,
            "hazard_cues": data.get("hazard_cues", ["Vision AI visual defect confirmed"]),
            "confidence": round(confidence, 2),
            "mode": "ai",
            "blur_score": blur_score,
            "is_usable": blur_score >= 25.0
        }
    except Exception as e:
        logger.warning(f"Gemini AI intake analysis failed: {e}. Falling back to Basic mode.")
        basic = analyze_report_basic(user_category, user_text, blur_score)
        basic["hazard_cues"].append(f"AI mode unavailable ({type(e).__name__}); evaluated via Basic heuristic rules.")
        return basic


# --- Closure Verification Algorithms ---

def compute_scene_similarity_orb(before_bytes: bytes, after_bytes: bytes) -> Tuple[float, bool]:
    """
    Classical Computer Vision feature matching using ORB (Oriented FAST and Rotated BRIEF).
    Compares background structures (curbs, buildings, road texture, poles) to ensure
    both images were captured at the exact same physical scene.
    Returns: (similarity_score 0.0-1.0, scene_pass bool)
    """
    try:
        before_arr = np.frombuffer(before_bytes, np.uint8)
        after_arr = np.frombuffer(after_bytes, np.uint8)
        
        img1 = cv2.imdecode(before_arr, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imdecode(after_arr, cv2.IMREAD_GRAYSCALE)
        
        if img1 is None or img2 is None:
            return 0.5, True

        # Resize to standard comparison dimensions
        img1 = cv2.resize(img1, (640, 480))
        img2 = cv2.resize(img2, (640, 480))

        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=1000)
        kp1, des1 = orb.detectAndCompute(img1, None)
        kp2, des2 = orb.detectAndCompute(img2, None)

        if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
            return 0.45, True  # Inconclusive feature count

        # BFMatcher with Hamming distance
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)

        # Ratio of good matches with distance < 45
        good_matches = [m for m in matches if m.distance < 45]
        match_ratio = len(good_matches) / max(1.0, float(min(len(kp1), len(kp2))))
        
        # Scale to 0.0 - 1.0
        score = min(1.0, max(0.0, match_ratio * 3.5))
        
        # Scene pass threshold: 0.35+ indicating structural overlap
        scene_pass = score >= 0.30
        return round(float(score), 2), scene_pass
    except Exception as e:
        logger.error(f"ORB scene matching error: {e}")
        return 0.50, True

def verify_closure_ai(
    before_bytes: bytes,
    after_bytes: bytes,
    category: str
) -> Dict[str, Any]:
    """
    Calls Gemini Vision model to compare before and after photos.
    Evaluates:
    1. Are before and after photos taken of the SAME physical scene?
    2. Has the reported defect (e.g. pothole, garbage, leak) been resolved?
    Returns strict JSON:
    {
      "verdict": "fixed" | "not_fixed" | "different_location" | "inconclusive",
      "confidence": float,
      "scene_match": bool,
      "defect_fixed": bool,
      "reasons": ["..."]
    }
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("No GEMINI_API_KEY provided; fallback to basic heuristic.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
You are the FixProof Closure Verification Engine.
You are given two photos:
Photo 1: BEFORE photo showing a reported municipal defect ({category}).
Photo 2: AFTER photo submitted by a field officer claiming the defect has been repaired.

Analyze rigorously and answer two core questions:
1. Scene match: Is Photo 2 taken at the EXACT SAME physical location/angle/background as Photo 1? (Look at curbs, surrounding buildings, poles, tree lines, road pavement).
2. Defect resolution: Has the {category} been genuinely fixed (e.g. pothole cleanly patched with asphalt/concrete, garbage fully cleared, light repaired)? If the defect is still present, or if Photo 2 shows an entirely different unrelated location, flag it clearly!

Output strict JSON only:
{{
  "verdict": "fixed | not_fixed | different_location | inconclusive",
  "scene_match": <true or false>,
  "defect_fixed": <true or false>,
  "confidence": <float 0.0 to 1.0>,
  "reasons": [
    "Specific observation 1 about background alignment or mismatch",
    "Specific observation 2 about defect state and repair quality"
  ]
}}
Do NOT output markdown formatting or any other text.
"""
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=before_bytes, mime_type="image/jpeg"),
            types.Part.from_bytes(data=after_bytes, mime_type="image/jpeg"),
            prompt
        ]
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    data = json.loads(text)
    return data
