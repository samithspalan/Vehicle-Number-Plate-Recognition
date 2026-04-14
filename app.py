from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import pytesseract
import pandas as pd
import imutils
import numpy as np
import os
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/health")
def health():
    return jsonify({"message": "Vehicle Recognition API is running"}), 200

def is_valid_plate_format(text):
    """Check if text looks like a valid Indian plate (2 letters + digits + letters + digits)"""
    if len(text) < 8 or len(text) > 12:
        return False
    if not any(c.isalpha() for c in text) or not any(c.isdigit() for c in text):
        return False
    # More likely valid if starts with letters (state code)
    if text[:2].isalpha():
        return True
    # Accept if has good mix of letters/digits
    letters = sum(1 for c in text if c.isalpha())
    return letters >= 2 and letters <= 6

def detect_plate(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return ""
    
    from collections import Counter
    results = []
    
    # For small images, scale up first
    h, w = img.shape[:2]
    if w < 300 or h < 300:
        scale_factor = max(3, 400 // min(w, h))
        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
    
    # Try multiple image sizes
    for width in [300, 400, 500, 600]:
        img_resized = imutils.resize(img, width=width)
        original = img_resized.copy()
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        
        # Method 1: MSER-based detection (most reliable)
        try:
            mser = cv2.MSER_create()
            mser.setMinArea(60)
            mser.setMaxArea(6000)
            regions, _ = mser.detectRegions(gray)
            
            # Limit regions to check
            region_count = 0
            for region in regions:
                if region_count > 50:  # Limit for speed
                    break
                x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
                aspect = w / float(h) if h > 0 else 0
                
                if 1.5 <= aspect <= 7 and 30 < w < width * 0.85 and h > 8:
                    region_count += 1
                    pad = 5
                    y1, y2 = max(0, y-pad), min(gray.shape[0], y+h+pad)
                    x1, x2 = max(0, x-pad), min(gray.shape[1], x+w+pad)
                    
                    plate_region = gray[y1:y2, x1:x2]
                    if plate_region.size > 0:
                        plate_region = cv2.resize(plate_region, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
                        _, thresh = cv2.threshold(plate_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                        
                        text = pytesseract.image_to_string(thresh, config='--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
                        text = ''.join(c for c in text if c.isalnum()).upper()
                        
                        if is_valid_plate_format(text):
                            results.append(text)
        except:
            pass
        
        # Method 2: Contour-based with mask (backup)
        blur = cv2.bilateralFilter(gray, 11, 17, 17)
        edged = cv2.Canny(blur, 170, 200)
        cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:15]
        
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                mask = np.zeros(gray.shape, np.uint8)
                cv2.drawContours(mask, [approx], 0, 255, -1)
                new_img = cv2.bitwise_and(original, original, mask=mask)
                
                config = '-l eng --oem 1 --psm 3'
                text = pytesseract.image_to_string(new_img, config=config)
                text = ''.join(c for c in text if c.isalnum()).upper()
                
                if is_valid_plate_format(text):
                    results.append(text)
                break
    
    # Method 3: Region-based OCR only if no results yet
    if not results:
        for width in [400, 500, 600]:
            img_resized = imutils.resize(img, width=width)
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            
            # Try different vertical positions
            for y_start, y_end in [(0.3, 0.7), (0.4, 0.8), (0.35, 0.75), (0.45, 0.85)]:
                region = gray[int(gray.shape[0]*y_start):int(gray.shape[0]*y_end), :]
                _, thresh = cv2.threshold(region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                
                text = pytesseract.image_to_string(thresh, config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
                text = ''.join(c for c in text if c.isalnum()).upper()
                if is_valid_plate_format(text):
                    results.append(text)
    
    # Method 4: Scaled full image (for edge cases)
    if not results:
        scaled = cv2.resize(img, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = pytesseract.image_to_string(thresh, config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        for word in text.split():
            word = ''.join(c for c in word if c.isalnum()).upper()[:12]  # Trim to max 12 chars
            if is_valid_plate_format(word):
                results.append(word)
    
    # Return most common result
    if results:
        counts = Counter(results)
        return counts.most_common(1)[0][0]
    
    return ""

def similarity_score(s1, s2):
    """Calculate similarity between two strings (0-1)"""
    if len(s1) == 0 or len(s2) == 0:
        return 0
    # Use longest common subsequence approach
    shorter, longer = (s1, s2) if len(s1) <= len(s2) else (s2, s1)
    matches = sum(1 for c in shorter if c in longer)
    return matches / max(len(longer), 1)

def find_best_match(detected, plates):
    """Find the best matching plate from the database, allowing for OCR errors"""
    if not detected:
        return detected
    if detected in plates:
        return detected
    
    # Common OCR character confusions (bidirectional)
    ocr_confusions = {
        '0': ['O', 'D', 'Q'],
        'O': ['0', 'D', 'Q'],
        'D': ['0', 'O', 'Q'],
        'Q': ['0', 'O', 'D'],
        '1': ['I', 'L', '7'],
        'I': ['1', 'L', '7'],
        'L': ['1', 'I'],
        '2': ['Z', '7'],
        'Z': ['2'],
        '3': ['8', 'B', 'E'],
        '8': ['3', 'B'],
        'B': ['8', '3'],
        '4': ['A', 'H'],
        'A': ['4', 'H', 'R'],
        'H': ['4', 'A', 'N', 'R'],
        '5': ['S', '6'],
        'S': ['5', '8'],
        '6': ['G', '5', 'E', 'B'],
        'G': ['6', 'C'],
        '7': ['T', '1', 'Y'],
        'T': ['7', '1', 'Y'],
        '9': ['P', 'Q'],
        'E': ['6', 'F', 'R', 'B'],
        'R': ['A', 'K', 'H'],
        'U': ['V', 'W', 'D', 'O', 'Q'],
        'V': ['U', 'W', 'Y'],
        'N': ['H', 'M'],
        'M': ['N', 'W'],
    }
    
    def chars_similar(c1, c2):
        """Check if two characters are commonly confused by OCR"""
        if c1 == c2:
            return 1.0
        if c1 in ocr_confusions and c2 in ocr_confusions.get(c1, []):
            return 0.85
        if c2 in ocr_confusions and c1 in ocr_confusions.get(c2, []):
            return 0.85
        return 0
    
    best_plate = None
    best_score = 0.6  # Lower threshold for tolerance
    
    for plate in plates:
        if len(detected) == len(plate):
            # Same length - character by character comparison
            score = sum(chars_similar(d, p) for d, p in zip(detected, plate)) / len(plate)
        elif abs(len(detected) - len(plate)) <= 2:
            # Length difference of 1-2 - try alignment
            scores = []
            for offset in range(abs(len(detected) - len(plate)) + 1):
                shorter, longer = (detected, plate) if len(detected) < len(plate) else (plate, detected)
                aligned = longer[offset:offset + len(shorter)]
                if len(aligned) == len(shorter):
                    s = sum(chars_similar(a, b) for a, b in zip(shorter, aligned)) / len(longer)
                    scores.append(s)
            score = max(scores) if scores else 0
        else:
            # Too different in length
            score = similarity_score(detected, plate) * 0.5
        
        if score > best_score:
            best_score = score
            best_plate = plate
    
    return best_plate if best_plate else detected

@app.route("/api/recognize", methods=["POST"])
def api_recognize():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    plate = detect_plate(path)
    owner = "Unknown"
    vehicle = "Unknown"
    city = "Unknown"

    csv_path = os.path.join(BASE_DIR, "vehicle_data.csv")
    if os.path.exists(csv_path):
        data = pd.read_csv(csv_path)
        known_plates = data["number"].tolist()
        matched_plate = find_best_match(plate, known_plates)
        
        match = data[data["number"] == matched_plate]
        if not match.empty:
            plate = matched_plate
            owner = match.iloc[0]["owner"]
            vehicle = match.iloc[0]["vehicle"]
            city = match.iloc[0]["city"]

    return jsonify({
        "plate": plate,
        "owner": owner,
        "vehicle": vehicle,
        "city": city,
        "status": "success"
    })

@app.route("/", methods=["GET","POST"])
def index():

    plate = None
    owner = None
    vehicle = None
    city = None

    if request.method == "POST":

        file = request.files["image"]
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)

        plate = detect_plate(path)

        csv_path = os.path.join(BASE_DIR, "vehicle_data.csv")
        data = pd.read_csv(csv_path)

        # Try fuzzy matching against known plates
        known_plates = data["number"].tolist()
        matched_plate = find_best_match(plate, known_plates)
        
        match = data[data["number"] == matched_plate]

        if not match.empty:
            plate = matched_plate  # Use the matched plate for display
            owner = match.iloc[0]["owner"]
            vehicle = match.iloc[0]["vehicle"]
            city = match.iloc[0]["city"]

    return render_template("index.html", plate=plate, owner=owner, vehicle=vehicle, city=city)

if __name__ == "__main__":
    app.run(debug=True)