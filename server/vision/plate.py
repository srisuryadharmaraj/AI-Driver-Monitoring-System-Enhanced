"""
MODULE 3 · Overspeed + License-Plate Detection & OCR
─────────────────────────────────────────────────────
When speed exceeds the limit:

1. YOLOv8 detects vehicles / license plates in the frame.
2. Crop the plate region.
3. Tesseract OCR reads the plate number.
4. Store (plate_number, timestamp, speed).
"""

from __future__ import annotations

import os
import re
import csv
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


# ── Constants ────────────────────────────────────────────────────────────────
SPEED_LIMIT_KMPH: float = 80.0
PLATE_CONF_THRESHOLD: float = 0.4
# COCO class ids used as fallback: car=2, motorbike=3, bus=5, truck=7
_VEHICLE_CLASSES = {2, 3, 5, 7}


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class PlateResult:
    overspeed: bool = False
    plate_text: str = ""
    plate_crop: Optional[np.ndarray] = field(default=None, repr=False)
    confidence: float = 0.0
    speed: float = 0.0
    timestamp: str = ""


# ── Detector Class ───────────────────────────────────────────────────────────
class PlateDetector:
    """YOLOv8-based license-plate detector + Tesseract OCR reader."""

    def __init__(
        self,
        model_path: str | Path = "models/yolov8n.pt",
        speed_limit: float = SPEED_LIMIT_KMPH,
        output_dir: str | Path = "outputs/plates",
        log_csv: str | Path = "outputs/overspeed_log.csv",
    ) -> None:
        self.speed_limit = speed_limit
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.log_csv = Path(log_csv)

        # Load YOLO model
        if YOLO is not None:
            self.model = YOLO(str(model_path))
        else:
            self.model = None

    # ── Public API ───────────────────────────────────────────────────────────
    def process(self, frame: np.ndarray, current_speed: float) -> PlateResult:
        result = PlateResult(speed=current_speed)

        if current_speed <= self.speed_limit:
            return result

        result.overspeed = True
        result.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if self.model is None:
            return result

        # Run YOLO detection
        detections = self.model(frame, verbose=False)[0]

        best_plate_crop = None
        best_conf = 0.0

        for box in detections.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            # Accept vehicle classes or any high-confidence detection
            # that might be a plate (small bounding box, high aspect ratio)
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bw, bh = x2 - x1, y2 - y1

            is_vehicle = cls_id in _VEHICLE_CLASSES
            is_plate_like = (bw > bh * 1.5) and (bh < frame.shape[0] * 0.15) and conf > PLATE_CONF_THRESHOLD

            if is_vehicle and conf > best_conf:
                # Crop bottom portion of vehicle box (likely plate area)
                plate_y1 = max(0, y2 - int(bh * 0.3))
                crop = frame[plate_y1:y2, x1:x2]
                if crop.size > 0:
                    best_plate_crop = crop
                    best_conf = conf
            elif is_plate_like and conf > best_conf:
                crop = frame[y1:y2, x1:x2]
                if crop.size > 0:
                    best_plate_crop = crop
                    best_conf = conf

        if best_plate_crop is not None:
            result.plate_crop = best_plate_crop
            result.confidence = round(best_conf, 2)
            result.plate_text = self._ocr(best_plate_crop)
            self._save(result)

        return result

    # ── OCR ──────────────────────────────────────────────────────────────────
    @staticmethod
    def _ocr(crop: np.ndarray) -> str:
        if pytesseract is None:
            return ""
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = pytesseract.image_to_string(thresh, config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        text = re.sub(r"[^A-Z0-9]", "", text.upper().strip())
        return text

    # ── Persist ──────────────────────────────────────────────────────────────
    def _save(self, result: PlateResult) -> None:
        # Save crop image
        if result.plate_crop is not None:
            fname = f"plate_{result.timestamp.replace(':', '-')}_{result.plate_text or 'UNKNOWN'}.jpg"
            cv2.imwrite(str(self.output_dir / fname), result.plate_crop)

        # Append to CSV log
        write_header = not self.log_csv.exists()
        with open(self.log_csv, "a", newline="") as f:
            w = csv.writer(f)
            if write_header:
                w.writerow(["timestamp", "speed_kmph", "plate_text", "confidence"])
            w.writerow([result.timestamp, result.speed, result.plate_text, result.confidence])

    # ── Drawing ──────────────────────────────────────────────────────────────
    @staticmethod
    def draw(frame: np.ndarray, result: PlateResult) -> np.ndarray:
        out = frame.copy()
        if result.overspeed:
            cv2.putText(out, f"OVERSPEED {result.speed:.0f} km/h",
                        (10, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        if result.plate_text:
            cv2.putText(out, f"Plate: {result.plate_text}",
                        (10, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        return out
