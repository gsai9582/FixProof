import os
import random
from PIL import Image, ImageDraw, ImageFont

def create_labeled_demo_image(
    filename: str,
    title: str,
    subtitle: str,
    bg_color: tuple,
    badge_text: str = "DEMO ASSET - FIXPROOF",
    accent_color: tuple = (234, 88, 12)
):
    width, height = 800, 600
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw grid texture / street aesthetic
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(bg_color[0]+12, bg_color[1]+12, bg_color[2]+12), width=1)
    for x in range(0, width, 40):
        draw.line([(x, 0), (x, height)], fill=(bg_color[0]+12, bg_color[1]+12, bg_color[2]+12), width=1)

    # Central card
    margin = 50
    draw.rectangle([margin, margin, width - margin, height - margin], outline=accent_color, width=3)

    # Header banner
    draw.rectangle([margin, margin, width - margin, margin + 60], fill=accent_color)
    draw.text((margin + 20, margin + 20), badge_text, fill=(255, 255, 255))

    # Title & details
    draw.text((margin + 30, margin + 100), title, fill=(255, 255, 255))
    draw.text((margin + 30, margin + 150), subtitle, fill=(200, 210, 225))

    # Visual representation box
    box_y = margin + 200
    draw.rectangle([margin + 30, box_y, width - margin - 30, height - margin - 60], fill=(20, 24, 33), outline=(80, 90, 110), width=2)
    
    # Draw sample visual indicators
    if "pothole" in title.lower() and "repaired" in subtitle.lower():
        # Clean smooth dark patch
        draw.ellipse([width//2 - 120, height//2 - 20, width//2 + 120, height//2 + 100], fill=(45, 52, 65), outline=(100, 200, 120), width=3)
        draw.text((width//2 - 80, height//2 + 30), "[Fresh Asphalt Compacted]", fill=(120, 230, 140))
    elif "pothole" in title.lower():
        # Crater
        draw.ellipse([width//2 - 120, height//2 - 20, width//2 + 120, height//2 + 100], fill=(15, 17, 22), outline=(220, 60, 60), width=4)
        draw.text((width//2 - 80, height//2 + 30), "[Severe Crater / Defect]", fill=(240, 100, 100))
    elif "garbage" in title.lower() and "cleared" in subtitle.lower():
        draw.rectangle([width//2 - 140, height//2 - 20, width//2 + 140, height//2 + 90], fill=(30, 45, 38), outline=(60, 180, 110), width=3)
        draw.text((width//2 - 90, height//2 + 25), "[Pavement Swept & Sanitized]", fill=(120, 240, 150))
    elif "garbage" in title.lower():
        draw.rectangle([width//2 - 140, height//2 - 20, width//2 + 140, height//2 + 90], fill=(50, 35, 25), outline=(240, 120, 50), width=3)
        draw.text((width//2 - 85, height//2 + 25), "[Solid Waste Dump 1.5m]", fill=(255, 160, 80))
    elif "fake" in title.lower() or "different" in subtitle.lower():
        # Deliberate fake: showing an interior office room or beach miles away
        draw.rectangle([width//2 - 150, height//2 - 40, width//2 + 150, height//2 + 100], fill=(24, 45, 75), outline=(240, 50, 50), width=4)
        draw.text((width//2 - 130, height//2 + 15), "[WRONG LOCATION: Marina Beach]", fill=(255, 100, 100))
        draw.text((width//2 - 110, height//2 + 45), "(Coordinates 4.2 km away)", fill=(255, 180, 180))

    # Watermark footer
    draw.text((margin + 30, height - margin - 40), "SYNTHETIC DEMO ASSET - FOR VERIFICATION DEMO PURPOSES ONLY", fill=(140, 150, 170))

    img.save(filename, "JPEG", quality=90)
    print(f"Generated {filename}")

def generate_all_demo_assets():
    dirs = ["demo-assets", "backend/uploads"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    assets = [
        # Pair 1: Pothole Valid Fix
        ("before_pothole_1.jpg", "BEFORE: Deep Road Pothole", "Lattice Bridge Rd, Adyar - 0.8m diameter crater", (35, 40, 48), "CIVIC REPORT EVIDENCE #1", (220, 38, 38)),
        ("after_pothole_1_valid.jpg", "AFTER: Pothole Asphalt Repair", "Lattice Bridge Rd, Adyar - Fresh asphalt patch compacted", (28, 38, 34), "FIELD OFFICER RESOLUTION #1", (16, 185, 129)),
        ("after_pothole_1_fake.jpg", "FAKE AFTER: Incorrect Location / Distant Scene", "Marina Beach Promenade - Uploaded for Adyar Pothole Claim", (45, 28, 30), "SUSPICIOUS FIX EVIDENCE (DEMO FAKE)", (239, 68, 68)),

        # Pair 2: Garbage Solid Waste
        ("before_garbage_2.jpg", "BEFORE: Uncollected Solid Waste", "Panagal Park, T. Nagar - Roadside commercial waste dump", (40, 34, 30), "CIVIC REPORT EVIDENCE #2", (234, 88, 12)),
        ("after_garbage_2_valid.jpg", "AFTER: Garbage Cleared & Bin Installed", "Panagal Park, T. Nagar - Cleaned by conservancy team", (25, 40, 32), "FIELD OFFICER RESOLUTION #2", (16, 185, 129)),

        # Pair 3: Streetlight
        ("before_streetlight_3.jpg", "BEFORE: Broken Sodium Streetlight", "2nd Avenue, Anna Nagar - Inoperative fixture at pedestrian cross", (30, 32, 45), "CIVIC REPORT EVIDENCE #3", (217, 119, 6)),
        ("after_streetlight_3_valid.jpg", "AFTER: New LED Luminaire Installed", "2nd Avenue, Anna Nagar - Repaired and fully illuminated", (35, 45, 40), "FIELD OFFICER RESOLUTION #3", (16, 185, 129)),

        # Pair 4: Water Leakage
        ("before_leakage_4.jpg", "BEFORE: Burst Water Main", "Gandhi Nagar 4th Main, Adyar - Potable water gushing onto tarmac", (24, 38, 50), "CIVIC REPORT EVIDENCE #4", (2, 132, 199)),
        ("after_leakage_4_valid.jpg", "AFTER: Water Pipeline Replaced", "Gandhi Nagar 4th Main, Adyar - Pipe joint sealed and resurfaced", (26, 42, 38), "FIELD OFFICER RESOLUTION #4", (16, 185, 129)),
    ]

    for fname, title, sub, bg, badge, accent in assets:
        for d in dirs:
            path = os.path.join(d, fname)
            create_labeled_demo_image(path, title, sub, bg, badge, accent)

if __name__ == "__main__":
    generate_all_demo_assets()
