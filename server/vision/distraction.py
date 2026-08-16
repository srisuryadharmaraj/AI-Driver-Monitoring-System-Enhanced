"""
MODULE 1-B · Distraction Detection
───────────────────────────────────
Uses MediaPipe FaceLandmarker (Tasks API ≥ 0.10.14) to estimate:
  • Head pose (yaw / pitch / roll) via solvePnP
  • Gaze direction
  • Phone-in-hand via YOLOv8 object detection

A driver is "distracted" when head is turned away from road
or a cell-phone is detected near the driver's face.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

# ── Constants ────────────────────────────────────────────────────────────────
YAW_THRESHOLD: float = 30.0        # degrees off-centre → distracted
PITCH_THRESHOLD: float = 25.0      # looking up/down too far
GAZE_THRESHOLD: float = 0.35       # iris offset ratio → looking away

# Key FaceLandmarker landmark indices (canonical 478-point model)
_NOSE_TIP = 1
_CHIN = 152
_LEFT_EYE_CORNER = 263
_RIGHT_EYE_CORNER = 33
_LEFT_MOUTH = 287
_RIGHT_MOUTH = 57

# 3-D model points (generic face proportions, in mm)
_MODEL_POINTS = np.array([
    (0.0,    0.0,     0.0),     # Nose tip
    (0.0,   -330.0,  -65.0),    # Chin
    (-225.0, 170.0,  -135.0),   # Left eye left corner
    (225.0,  170.0,  -135.0),   # Right eye right corner
    (-150.0,-150.0,  -125.0),   # Left mouth corner
    (150.0, -150.0,  -125.0),   # Right mouth corner
], dtype=np.float64)

# Iris landmarks (MediaPipe FaceLandmarker)
_LEFT_IRIS  = [474, 475, 476, 477]
_RIGHT_IRIS = [469, 470, 471, 472]
_LEFT_EYE_H  = [362, 263]   # horizontal extremes
_RIGHT_EYE_H = [33, 133]

# MediaPipe Tasks API aliases
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
RunningMode = mp.tasks.vision.RunningMode


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class DistractionResult:
    distraction: int = 0       # 1 = distracted
    yaw: float = 0.0
    pitch: float = 0.0
    roll: float = 0.0
    gaze_ratio: float = 0.0   # 0 = centred, 1 = extreme
    phone: int = 0             # set externally by YOLO detector
    reason: str = ""


# ── Helper: rotation matrix → Euler angles ──────────────────────────────────
def _rotation_to_euler(R: np.ndarray) -> tuple[float, float, float]:
    sy = math.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
    singular = sy < 1e-6
    if not singular:
        x = math.atan2(R[2, 1], R[2, 2])
        y = math.atan2(-R[2, 0], sy)
        z = math.atan2(R[1, 0], R[0, 0])
    else:
        x = math.atan2(-R[1, 2], R[1, 1])
        y = math.atan2(-R[2, 0], sy)
        z = 0.0
    return (math.degrees(x), math.degrees(y), math.degrees(z))


# ── Detector Class ───────────────────────────────────────────────────────────
class DistractionDetector:
    """Stateless per-frame distraction detector using MediaPipe FaceLandmarker."""

    def __init__(
        self,
        model_path: str | Path = "models/face_landmarker.task",
        yaw_thresh: float = YAW_THRESHOLD,
        pitch_thresh: float = PITCH_THRESHOLD,
        gaze_thresh: float = GAZE_THRESHOLD,
    ) -> None:
        self.yaw_thresh = yaw_thresh
        self.pitch_thresh = pitch_thresh
        self.gaze_thresh = gaze_thresh

        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(model_path)),
            running_mode=RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
        )
        self._landmarker = FaceLandmarker.create_from_options(options)

    # ── Public API ───────────────────────────────────────────────────────────
    def process(self, frame: np.ndarray) -> DistractionResult:
        """Analyse a BGR frame; returns `DistractionResult`."""
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = self._landmarker.detect(mp_image)

        res = DistractionResult()

        if not results.face_landmarks:
            return res

        landmarks = results.face_landmarks[0]

        # ── Head Pose (solvePnP) ─────────────────────────────────────────────
        image_points = np.array([
            (landmarks[_NOSE_TIP].x * w,       landmarks[_NOSE_TIP].y * h),
            (landmarks[_CHIN].x * w,            landmarks[_CHIN].y * h),
            (landmarks[_LEFT_EYE_CORNER].x * w, landmarks[_LEFT_EYE_CORNER].y * h),
            (landmarks[_RIGHT_EYE_CORNER].x * w,landmarks[_RIGHT_EYE_CORNER].y * h),
            (landmarks[_LEFT_MOUTH].x * w,      landmarks[_LEFT_MOUTH].y * h),
            (landmarks[_RIGHT_MOUTH].x * w,     landmarks[_RIGHT_MOUTH].y * h),
        ], dtype=np.float64)

        focal_length = w
        cam_matrix = np.array([
            [focal_length, 0, w / 2],
            [0, focal_length, h / 2],
            [0, 0, 1],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        success, rvec, tvec = cv2.solvePnP(
            _MODEL_POINTS, image_points, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if success:
            R, _ = cv2.Rodrigues(rvec)
            pitch, yaw, roll = _rotation_to_euler(R)
            res.pitch, res.yaw, res.roll = round(pitch, 1), round(yaw, 1), round(roll, 1)

        # ── Gaze Ratio (iris position within eye) ────────────────────────────
        gaze = self._gaze_ratio(landmarks, w, h)
        res.gaze_ratio = round(gaze, 3)

        # ── Decision ─────────────────────────────────────────────────────────
        reasons: list[str] = []
        if abs(res.yaw) > self.yaw_thresh:
            reasons.append(f"yaw={res.yaw}°")
        if abs(res.pitch) > self.pitch_thresh:
            reasons.append(f"pitch={res.pitch}°")
        if gaze > self.gaze_thresh:
            reasons.append(f"gaze={gaze:.2f}")

        if reasons:
            res.distraction = 1
            res.reason = "; ".join(reasons)

        return res

    # ── Gaze helper ──────────────────────────────────────────────────────────
    def _gaze_ratio(self, lm, w: int, h: int) -> float:
        """Return 0-1 how far the irises are from the eye centre."""
        try:
            def _iris_offset(iris_ids, eye_h_ids):
                ix = np.mean([lm[i].x for i in iris_ids])
                ex_left = lm[eye_h_ids[0]].x
                ex_right = lm[eye_h_ids[1]].x
                eye_w = abs(ex_right - ex_left) + 1e-6
                centre = (ex_left + ex_right) / 2.0
                return abs(ix - centre) / eye_w

            left = _iris_offset(_LEFT_IRIS, _LEFT_EYE_H)
            right = _iris_offset(_RIGHT_IRIS, _RIGHT_EYE_H)
            return (left + right) / 2.0
        except (IndexError, Exception):
            return 0.0

    # ── Drawing Utility ──────────────────────────────────────────────────────
    @staticmethod
    def draw(frame: np.ndarray, result: DistractionResult) -> np.ndarray:
        out = frame.copy()
        color = (0, 0, 255) if result.distraction else (0, 255, 0)
        label = f"Head  Y:{result.yaw:.0f} P:{result.pitch:.0f} R:{result.roll:.0f}"
        cv2.putText(out, label, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        state = "DISTRACTED" if result.distraction else "ATTENTIVE"
        cv2.putText(out, state, (10, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        if result.reason:
            cv2.putText(out, result.reason, (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)
        return out

    def release(self) -> None:
        self._landmarker.close()
