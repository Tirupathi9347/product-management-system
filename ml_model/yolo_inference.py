"""
Smart Product Management System - YOLOv8 Date Detection & Keyword OCR Engine
---------------------------------------------------------------------------
Combines:
1. Custom-trained YOLOv8 object detection to locate 'exp_date' and 'mfg_date' bounding boxes.
2. Keyword-guided Optical Character Recognition (OCR via EasyOCR / regex).
3. Text normalization and ISO-8601 date parsing.
"""

import os
import re
from pathlib import Path
from PIL import Image
import numpy as np

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_PATH = BASE_DIR / "weights" / "best.pt"

# Global model caches
yolo_model = None
ocr_reader = None

def get_yolo_model():
    global yolo_model
    if yolo_model is None and YOLO_AVAILABLE:
        if WEIGHTS_PATH.exists():
            print(f"[YOLO Engine] Loading trained weights from {WEIGHTS_PATH}")
            yolo_model = YOLO(str(WEIGHTS_PATH))
        else:
            print(f"[YOLO Engine] Warning: {WEIGHTS_PATH} not found.")
    return yolo_model

def get_ocr_reader():
    global ocr_reader
    if ocr_reader is None and EASYOCR_AVAILABLE:
        try:
            print("[OCR Engine] Initializing EasyOCR Reader (English)...")
            ocr_reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            print(f"[OCR Engine] Could not load EasyOCR: {e}")
    return ocr_reader

MONTH_MAP = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
}

MFG_KEYWORDS = [
    'MFG DATE', 'MFG', 'MFD', 'MANUFACTURED', 'DATE OF MFG',
    'PKD ON', 'PKD', 'PACKED', 'DOM', 'PROD DATE', 'PROD', 'B.DATE'
]

EXP_KEYWORDS = [
    'EXP DATE', 'EXPIRY DATE', 'EXPIRY', 'EXP', 'BEST BEFORE',
    'BEST BY', 'USE BY', 'USE BEFORE', 'BB', 'EXPIRATION',
    'VALID TILL', 'VALID UPTO', 'CONSUME BEFORE', 'SHELF LIFE'
]

BATCH_KEYWORDS = ['BATCH NO', 'BATCH', 'LOT NO', 'LOT', 'B.NO', 'BN']

def normalize_date_string(raw: str) -> str | None:
    """Normalizes raw date text to YYYY-MM-DD"""
    if not raw:
        return None
    raw = raw.strip().upper()

    # Match 1: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    m1 = re.search(r'(\d{1,2})[./-](\d{1,2})[./-](\d{4})', raw)
    if m1:
        d, m, y = m1.groups()
        if 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

    # Match 2: YYYY-MM-DD
    m2 = re.search(r'(\d{4})[./-](\d{1,2})[./-](\d{1,2})', raw)
    if m2:
        y, m, d = m2.groups()
        if 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

    # Match 3: DD/MM/YY
    m3 = re.search(r'(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b', raw)
    if m3:
        d, m, y_short = m3.groups()
        y = f"20{y_short}"
        if 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

    # Match 4: MM/YYYY
    m4 = re.search(r'(\d{1,2})[./-](\d{4})', raw)
    if m4:
        m, y = m4.groups()
        if 1 <= int(m) <= 12:
            return f"{y}-{m.zfill(2)}-01"

    # Match 5: 15 OCT 2025 or OCT 2025
    m5 = re.search(r'(?:(\d{1,2})[\s./-]*)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s./-]*((?:20)?\d{2})', raw)
    if m5:
        d, mon, y = m5.groups()
        month = MONTH_MAP.get(mon)
        if len(y) == 2:
            y = f"20{y}"
        day = d.zfill(2) if d else "01"
        if month:
            return f"{y}-{month}-{day}"

    return None

def extract_keyword_dates_from_text(text: str):
    """
    Scans a block of text for packaging keywords (MFG, EXP, BATCH)
    and extracts the dates and batch codes linked to them.
    """
    detected_keywords = set()
    keyword_matches = []
    mfg_date = None
    exp_date = None
    batch_num = None

    lines = [line.strip() for line in text.split('\n') if line.strip()]

    for i, line in enumerate(lines):
        line_upper = line.upper()
        lookahead = f"{line} {lines[i+1]}" if i + 1 < len(lines) else line
        upper_lookahead = lookahead.upper()

        # Check EXPIRY
        if not exp_date:
            for kw in EXP_KEYWORDS:
                if kw in upper_lookahead:
                    detected_keywords.add(kw)
                    idx = upper_lookahead.find(kw)
                    sub = lookahead[idx + len(kw):idx + len(kw) + 35]
                    norm = normalize_date_string(sub)
                    if norm:
                        exp_date = norm
                        keyword_matches.append({
                            "keyword": kw,
                            "extracted_value": norm,
                            "field": "expiry_date"
                        })
                        break

        # Check MFG
        if not mfg_date:
            for kw in MFG_KEYWORDS:
                if kw in upper_lookahead:
                    detected_keywords.add(kw)
                    idx = upper_lookahead.find(kw)
                    sub = lookahead[idx + len(kw):idx + len(kw) + 35]
                    norm = normalize_date_string(sub)
                    if norm:
                        mfg_date = norm
                        keyword_matches.append({
                            "keyword": kw,
                            "extracted_value": norm,
                            "field": "manufacturing_date"
                        })
                        break

        # Check BATCH
        if not batch_num:
            for kw in BATCH_KEYWORDS:
                if kw in upper_lookahead:
                    detected_keywords.add(kw)
                    batch_match = re.search(r'(?:' + kw + r')[:\s#-]*([A-Z0-9\/-]{3,15})', upper_lookahead)
                    if batch_match:
                        batch_num = batch_match.group(1).strip()
                        keyword_matches.append({
                            "keyword": kw,
                            "extracted_value": batch_num,
                            "field": "batch_number"
                        })
                        break

    return {
        "mfg_date": mfg_date,
        "exp_date": exp_date,
        "batch_number": batch_num,
        "detected_keywords": list(detected_keywords),
        "keyword_matches": keyword_matches
    }

def extract_dates_with_yolo(pil_image: Image.Image, conf_threshold: float = 0.20):
    """
    Runs YOLOv8 model inference on PIL image, crops date bounding boxes,
    and runs keyword-guided OCR to accurately extract manufacturing and expiry dates.
    """
    model = get_yolo_model()
    reader = get_ocr_reader()

    detections = []
    highest_conf = 0.0
    detected_keywords = set()
    keyword_matches = []
    
    mfg_date = None
    exp_date = None
    batch_number = None
    full_ocr_text = []

    # 1. Run YOLOv8 detection to locate packaging bounding boxes
    if model is not None:
        try:
            results = model.predict(source=pil_image, conf=conf_threshold, verbose=False)
            if results and len(results) > 0:
                boxes = results[0].boxes
                names = results[0].names  # {0: 'exp_date', 1: 'mfg_date'}

                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    class_name = names.get(cls_id, f"class_{cls_id}")
                    confidence = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()

                    detections.append({
                        "class": class_name,
                        "confidence": round(confidence, 4),
                        "box": [round(coord, 2) for coord in xyxy]
                    })

                    if confidence > highest_conf:
                        highest_conf = confidence

                    # Crop detected box region for targeted keyword OCR
                    crop_box = (max(0, int(xyxy[0])), max(0, int(xyxy[1])), int(xyxy[2]), int(xyxy[3]))
                    try:
                        cropped = pil_image.crop(crop_box)
                        if reader is not None:
                            crop_np = np.array(cropped)
                            ocr_results = reader.readtext(crop_np, detail=0)
                            cropped_text = " ".join(ocr_results)
                            full_ocr_text.append(cropped_text)

                            parsed_date = normalize_date_string(cropped_text)
                            if "exp" in class_name.lower():
                                detected_keywords.add("EXP_BOX")
                                if parsed_date and not exp_date:
                                    exp_date = parsed_date
                            elif "mfg" in class_name.lower():
                                detected_keywords.add("MFG_BOX")
                                if parsed_date and not mfg_date:
                                    mfg_date = parsed_date
                    except Exception as crop_err:
                        print(f"[YOLO OCR] Crop reading error: {crop_err}")
        except Exception as e:
            print(f"[YOLO Engine] Inference error: {e}")

    # 2. Run full-image Keyword OCR if dates were not completely extracted from boxes
    if (not mfg_date or not exp_date) and reader is not None:
        try:
            print("[Keyword OCR] Running full image OCR pass for packaging date keywords...")
            img_np = np.array(pil_image)
            full_results = reader.readtext(img_np, detail=0)
            combined_text = "\n".join(full_results)
            full_ocr_text.append(combined_text)

            keyword_data = extract_keyword_dates_from_text(combined_text)
            if not mfg_date and keyword_data["mfg_date"]:
                mfg_date = keyword_data["mfg_date"]
            if not exp_date and keyword_data["exp_date"]:
                exp_date = keyword_data["exp_date"]
            if not batch_number and keyword_data["batch_number"]:
                batch_number = keyword_data["batch_number"]

            for kw in keyword_data["detected_keywords"]:
                detected_keywords.add(kw)
            keyword_matches.extend(keyword_data["keyword_matches"])
        except Exception as full_ocr_err:
            print(f"[Keyword OCR] Full image scan error: {full_ocr_err}")

    return {
        "success": True,
        "model": "YOLOv8-Keyword-OCR-PackagingNet",
        "detections_count": len(detections),
        "detections": detections,
        "max_confidence": round(highest_conf, 2),
        "manufacturing_date": mfg_date,
        "expiry_date": exp_date,
        "batch_number": batch_number,
        "detected_keywords": list(detected_keywords),
        "keyword_matches": keyword_matches,
        "raw_ocr_snippet": " | ".join(full_ocr_text)[:300] if full_ocr_text else ""
    }

def test_inference_on_file(image_path: str, save_output: bool = True):
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"[Error] File not found: {image_path}")
        return

    img = Image.open(img_path).convert("RGB")
    print(f"\n🔍 Running YOLOv8 + Keyword OCR Detection on: {img_path.name}")
    result = extract_dates_with_yolo(img)
    print(f"✅ Found {result['detections_count']} bounding boxes")
    print(f"📅 Extracted MFG Date: {result.get('manufacturing_date')}")
    print(f"📅 Extracted EXP Date: {result.get('expiry_date')}")
    print(f"🏷️ Detected Keywords: {result.get('detected_keywords')}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_inference_on_file(sys.argv[1])
    else:
        print("Usage: python yolo_inference.py path/to/image.jpg")
