# FixProof – Hackathon Live Demo Script (2 Minutes)

## Tagline
> **"Don't just report it. Prove it's fixed."**

---

### Step 1: The Problem & The Citizen Perspective (0:00 – 0:35)
1. **Open Landing Page (`/`)**:
   - Point to the live stats counter: *"Every civic app lets citizens file complaints. But after status changes to 'Resolved', how many potholes are actually fixed?"*
   - Show the **Closure Integrity Score** metric (78%).
2. **One-Click Demo as Citizen Ananya**:
   - Click **"Citizen Ananya"** in the top bar or login page.
3. **Open Report Defect (`/report`)**:
   - Upload sample photo from `/demo-assets/before_pothole_1.jpg`.
   - Click **AI Auto-Classify**: Explain that in **AI Mode**, Gemini Vision parses visual cues, suggests severity (4/5) and hazard factors. If no API key is set, FixProof operates in honest **Basic Heuristic Mode** using keyword rules and blur checking.
   - Show the **Spatial Duplicate Detection**: If someone reported a defect within 50m, FixProof prompts the citizen to *support the existing ticket* rather than cluttering municipal databases with duplicate tickets.
   - Explain the **Explainable Priority Score**: Formula is transparent (`0.35·Severity + 0.25·Exposure + 0.20·Corroboration + 0.20·Ageing`). Nearby schools and hospitals from OpenStreetMap boost the exposure score.

---

### Step 2: The Officer Queue & "The Fake Fix Caught Live" (0:35 – 1:15)
1. **Switch to Officer Suresh**:
   - Click **"Inspector Suresh"** or navigate to `/queue`.
   - Show the ranked queue: Tickets are prioritized by safety urgency and SLA breach, not arbitrary ticket numbers.
2. **Execute Demo Scenario B (The Fake Fix Live)**:
   - Click **Resolve with Proof** on Ticket #2 (Trench on Usman Road, T. Nagar).
   - Upload after-photo (`demo-assets/after_pothole_1_fake.jpg`).
   - Click the shortcut **`[Fake: Marina Beach 4.2km away]`** to simulate an officer trying to close the complaint using a photo taken at the beach.
   - Click **Submit & Trigger Verification Engine**.
3. **The Reveal on Screen**:
   - The engine returns **`REJECTED`** with a red badge!
   - Highlight the 3 pillars:
     - **Geo-proximity FAIL**: Coordinates are **4,240m away** (threshold is 30m).
     - **Scene Match FAIL**: Visual features show a sandy promenade instead of the commercial street.
     - Reason logged: *"Suspected false closure attempt flagged to municipal integrity vigilance."*

---

### Step 3: The Valid Fix & Community Re-Verification (1:15 – 1:45)
1. **Open Ticket #1 (Lattice Bridge Road, Adyar)**:
   - Show **`VERIFIED FIX`** badge.
   - Drag the **Before vs After Split Slider**: Show how judges can interactively compare the crater with the asphalt patch.
   - Show the **Community 72-Hour Re-Verification Window**:
     - Neighboring citizens voted: *"Confirmed resolved."*
2. **Show Scenario D (Reopened by Community)**:
   - Open Ticket #4 (Broken Streetlight in Anna Nagar).
   - An authority declared it resolved, but 2 citizens voted **"No, Still Defective"**. FixProof automatically changed status to **`REOPENED`** and boosted its priority score!

---

### Step 4: The Public Accountability Scorecard (1:45 – 2:00)
1. **Open Accountability Dashboard (`/accountability`)**:
   - Point to the **Ward Leaderboard**: Wards and departments are ranked by their **Closure Integrity Score** (verified closures divided by claimed closures).
   - Point out the **Small Sample Size Warning** (`n < 5` warning): No fabricated benchmarks; rigorous, evidence-based civic data.
2. **Closing Line**:
   - *"Reporting is cheap. Proof is what builds trust. FixProof turns 'resolved' from an unverified claim into proof you can see."*
