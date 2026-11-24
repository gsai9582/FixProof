import io
import os
import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageOps, ExifTags
import imagehash
import cv2
import numpy as np

def _convert_to_degrees(value) -> float:
    """Helper to convert the GPS coordinates stored in the EXIF to degrees in float format"""
    d0 = value[0]
    d1 = value[1]
    d2 = value[2]
    
    # Handle IFDRational or tuple/float types
    d = float(d0.numerator) / float(d0.denominator) if hasattr(d0, 'numerator') else float(d0)
    m = float(d1.numerator) / float(d1.denominator) if hasattr(d1, 'numerator') else float(d1)
    s = float(d2.numerator) / float(d2.denominator) if hasattr(d2, 'numerator') else float(d2)

    return d + (m / 60.0) + (s / 3600.0)

def extract_exif_metadata(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts GPS coordinates and DateTimeOriginal from EXIF metadata if present.
    """
    metadata: Dict[str, Any] = {
        "gps_lat": None,
        "gps_lng": None,
        "taken_at": None
    }
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif = image.getexif()
        if not exif:
            return metadata

        # Find EXIF IFD and GPS IFD
        gps_info = {}
        for tag_id, value in exif.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                gps_info = value
            elif tag == "DateTimeOriginal":
                try:
                    metadata["taken_at"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                except Exception:
                    pass

        # Also check GPS IFD if get_ifd is available
        if hasattr(exif, "get_ifd"):
            try:
                gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
                if gps_ifd:
                    gps_info = gps_ifd
            except Exception:
                pass

        if gps_info:
            gps_tags = {}
            for t, val in gps_info.items():
                sub_tag = ExifTags.GPSTAGS.get(t, t)
                gps_tags[sub_tag] = val

            lat_val = gps_tags.get("GPSLatitude")
            lat_ref = gps_tags.get("GPSLatitudeRef", "N")
            lng_val = gps_tags.get("GPSLongitude")
            lng_ref = gps_tags.get("GPSLongitudeRef", "E")

            if lat_val and lng_val:
                lat = _convert_to_degrees(lat_val)
                if lat_ref != "N":
                    lat = 0.0 - lat

                lng = _convert_to_degrees(lng_val)
                if lng_ref != "E":
                    lng = 0.0 - lng

                metadata["gps_lat"] = round(lat, 6)
                metadata["gps_lng"] = round(lng, 6)

    except Exception:
        pass

    return metadata

def compute_phash(image_bytes: bytes) -> str:
    """Computes a 64-bit perceptual hash string from image bytes."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert RGBA to RGB if needed
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        h = imagehash.phash(image)
        return str(h)
    except Exception:
        return "0000000000000000"

def evaluate_image_blur(image_bytes: bytes) -> float:
    """
    Computes the Laplacian variance using OpenCV.
    Higher values = sharp, crisp.
    Lower values (< 40) = blurry or poor quality.
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 50.0
        var = cv2.Laplacian(img, cv2.CV_64F).var()
        return round(float(var), 2)
    except Exception:
        return 50.0

def process_and_sanitize_image(
    image_bytes: bytes,
    upload_dir: str,
    prefix: str = "report"
) -> Tuple[str, str, Dict[str, Any], float]:
    """
    1. Extracts EXIF metadata (GPS/timestamp)
    2. Strips EXIF metadata completely to safeguard user privacy
    3. Normalizes orientation
    4. Computes perceptual hash
    5. Evaluates blur
    6. Saves sanitized JPEG to upload_dir
    Returns: (saved_relative_path, phash, metadata, blur_score)
    """
    os.makedirs(upload_dir, exist_ok=True)
    
    metadata = extract_exif_metadata(image_bytes)
    phash = compute_phash(image_bytes)
    blur_score = evaluate_image_blur(image_bytes)
    
    image = Image.open(io.BytesIO(image_bytes))
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass
        
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}.jpg"
    filepath = os.path.join(upload_dir, filename)
    
    # Save WITHOUT EXIF data to strip GPS and camera serial tags
    image.save(filepath, "JPEG", quality=85, optimize=True)
    
    # Relative path for API serving
    relative_path = f"/uploads/{filename}"
    return relative_path, phash, metadata, blur_score
