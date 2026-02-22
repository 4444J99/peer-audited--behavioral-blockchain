# Styx Anomaly Service (The Watcher) - Ironclad Directive

## 1. Module Definition
This service is the **Fraud Detection Engine**. It uses ML heuristics and statistical analysis to flag suspicious proofs *before* they reach the Fury Router.

## 2. Detection Vectors
1.  **pHash (Perceptual Hash)**: Detects duplicate images/videos even if resized/cropped.
2.  **EXIF Forensics**: Checks for `DateTimeOriginal` vs. `UploadTime` discrepancies (> 1 hour).
3.  **Statistical Anomaly**: Flags weight loss > 2% per week (The "Starvation Check").
4.  **Audio Fingerprinting**: Checks "Weigh-in Word" against the audio track (Future Phase).

## 3. Usage & Logic
- **Input**: Media File URL + Metadata (User ID, Timestamp).
- **Process**:
    1.  Compute pHash.
    2.  Query Redis for pHash collision (Hamming Distance < 5).
    3.  If Match -> **Auto-Reject**.
    4.  If No Match -> **Pass to Fury Router**.

## 4. Dependencies
- `ffmpeg` (for frame extraction).
- `imghash` / `videohash` libraries.
- Redis `GEO` commands (for location plausibility).

## 5. Error Handling
- If ML analysis times out (> 10s), **Fail Open** (Pass to Fury Router with "Unverified" flag) to prevent UX blocking. *Exception: pHash duplicates must always fail.*

## 6. Testing
- **Test Case 1**: Upload same image twice -> Second upload must return `409 Conflict`.
- **Test Case 2**: Upload image with stripped EXIF -> Return `400 Bad Request` (Metadata Required).
