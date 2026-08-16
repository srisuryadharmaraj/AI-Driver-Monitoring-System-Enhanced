"""
MODULE · Forward-Collision & Obstacle Detection
────────────────────────────────────────────────
Uses YOLOv8 to detect obstacles (vehicles, pedestrians, cyclists) in the
dashcam view.  Tracks bounding-box growth over time to estimate whether
obstacles are approaching.  If an obstacle is getting closer but the
vehicle's ego-speed is NOT decreasing, a **collision warning** is raised
so an alarm can alert the unconscious / inattentive driver.

Flow:
  1. YOLOv8 detects objects in road classes (person, bicycle, car, …).
  2. Track the closest / largest obstacle across frames (IOU matching).
  3. If bbox area is growing AND speed not decreasing → collision_risk.
  4. Provide a 0-1 danger score based on approach rate + speed trend.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


# ── Constants ────────────────────────────────────────────────────────────────
# COCO-80 class ids that are road obstacles
_OBSTACLE_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
    9: "traffic light",
    11: "stop sign",
}
_MIN_CONF = 0.40  # Minimum detection confidence
_AREA_HISTORY = 8  # Number of frames to track bbox area trend
_SPEED_HISTORY = 8  # Number of frames to track speed trend
_APPROACH_RATE_THRESH = 0.06  # bbox-area growth rate to consider "approaching"
_CLOSE_DISTANCE_RATIO = 0.12  # bbox area / frame area → object is dangerously close


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class ObstacleResult:
    """Per-frame obstacle detection output."""
    obstacle_detected: bool = False
    obstacle_label: str = ""
    obstacle_count: int = 0
    closest_bbox: Optional[tuple] = None  # (x1, y1, x2, y2) largest/closest box
    closest_area_ratio: float = 0.0       # bbox_area / frame_area
    approaching: bool = False             # bbox growing across frames
    approach_rate: float = 0.0            # rate of area growth
    speed_decreasing: bool = False        # is ego speed trending down?
    collision_risk: bool = False          # approaching + NOT braking
    danger_score: float = 0.0            # 0-1 composite danger metric
    obstacles: list = field(default_factory=list)  # all detected [{label, conf, bbox}]


# ── Detector Class ───────────────────────────────────────────────────────────
class ObstacleDetector:
    """YOLOv8-based forward-obstacle tracker with collision risk estimation."""

    def __init__(
        self,
        model_path: str = "models/yolov8n.pt",
        min_conf: float = _MIN_CONF,
    ) -> None:
        self.min_conf = min_conf
        self.model = YOLO(str(model_path)) if YOLO else None

        # Rolling histories
        self._area_history: list[float] = []   # closest obstacle area ratios
        self._speed_history: list[float] = []  # ego-speed values

    # ── Public API ───────────────────────────────────────────────────────────
    def process(self, frame: np.ndarray, ego_speed: float) -> ObstacleResult:
        """Analyse a single BGR frame for obstacles."""
        result = ObstacleResult()
        h, w = frame.shape[:2]
        frame_area = h * w

        if self.model is None:
            return result

        # Track speed history
        self._speed_history.append(ego_speed)
        if len(self._speed_history) > _SPEED_HISTORY:
            self._speed_history.pop(0)

        # Run YOLO detection
        detections = self.model(frame, verbose=False)[0]

        obstacles = []
        largest_area = 0
        closest_bbox = None
        closest_label = ""

        for box in detections.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            if cls_id not in _OBSTACLE_CLASSES or conf < self.min_conf:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)
            label = _OBSTACLE_CLASSES[cls_id]

            obstacles.append({
                "label": label,
                "conf": round(conf, 2),
                "bbox": (x1, y1, x2, y2),
            })

            if area > largest_area:
                largest_area = area
                closest_bbox = (x1, y1, x2, y2)
                closest_label = label

        result.obstacle_count = len(obstacles)
        result.obstacles = obstacles

        if not obstacles:
            # No obstacle → record zero area, reset
            self._area_history.append(0.0)
            if len(self._area_history) > _AREA_HISTORY:
                self._area_history.pop(0)
            return result

        result.obstacle_detected = True
        result.obstacle_label = closest_label
        result.closest_bbox = closest_bbox
        area_ratio = largest_area / frame_area
        result.closest_area_ratio = round(area_ratio, 4)

        # Track bbox area history
        self._area_history.append(area_ratio)
        if len(self._area_history) > _AREA_HISTORY:
            self._area_history.pop(0)

        # ── Determine if obstacle is approaching ─────────────────────────────
        approach_rate = self._compute_approach_rate()
        result.approach_rate = round(approach_rate, 4)
        result.approaching = approach_rate > _APPROACH_RATE_THRESH

        # ── Determine if speed is decreasing ─────────────────────────────────
        result.speed_decreasing = self._is_speed_decreasing()

        # ── Collision risk: approaching + NOT braking ────────────────────────
        result.collision_risk = result.approaching and not result.speed_decreasing

        # Also flag if obstacle is extremely close regardless of approach
        if area_ratio > _CLOSE_DISTANCE_RATIO:
            result.collision_risk = True

        # ── Danger score (0-1) ───────────────────────────────────────────────
        # Combine proximity + approach rate + braking status
        proximity_factor = min(area_ratio / _CLOSE_DISTANCE_RATIO, 1.0)
        approach_factor = min(approach_rate / 0.15, 1.0) if approach_rate > 0 else 0.0
        brake_penalty = 0.0 if result.speed_decreasing else 0.5

        danger = (0.35 * proximity_factor
                  + 0.35 * approach_factor
                  + 0.30 * brake_penalty)
        result.danger_score = round(min(danger, 1.0), 3)

        return result

    # ── Internals ────────────────────────────────────────────────────────────
    def _compute_approach_rate(self) -> float:
        """Compute rate of change of obstacle bbox area (positive = growing)."""
        if len(self._area_history) < 3:
            return 0.0

        # Linear regression slope over recent area values
        y = np.array(self._area_history[-_AREA_HISTORY:])
        x = np.arange(len(y), dtype=float)
        if len(x) < 2:
            return 0.0

        # Normalised slope
        slope = float(np.polyfit(x, y, 1)[0])
        return max(slope, 0.0)  # only interested in growth

    def _is_speed_decreasing(self) -> bool:
        """Check if ego speed is trending downward over recent frames."""
        if len(self._speed_history) < 3:
            return False

        recent = self._speed_history[-_SPEED_HISTORY:]
        y = np.array(recent)
        x = np.arange(len(y), dtype=float)
        slope = float(np.polyfit(x, y, 1)[0])
        return slope < -0.3  # speed is meaningfully decreasing

    def reset(self) -> None:
        self._area_history.clear()
        self._speed_history.clear()

    # ── Drawing Utility ──────────────────────────────────────────────────────
    @staticmethod
    def draw(frame: np.ndarray, result: ObstacleResult) -> np.ndarray:
        out = frame.copy()

        # Draw all detected obstacle bboxes
        for obs in result.obstacles:
            x1, y1, x2, y2 = obs["bbox"]
            color = (0, 0, 255) if result.collision_risk else (0, 200, 255)
            cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
            lbl = f"{obs['label']} {obs['conf']:.0%}"
            cv2.putText(out, lbl, (x1, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Collision warning overlay
        if result.collision_risk:
            cv2.putText(out, "!! COLLISION WARNING !!",
                        (10, out.shape[0] - 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Obstacle count
        cv2.putText(out, f"Obstacles: {result.obstacle_count}",
                    (10, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)

        return out
