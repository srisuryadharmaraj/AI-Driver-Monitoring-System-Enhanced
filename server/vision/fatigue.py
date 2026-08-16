"""
MODULE 1-A · Driver Fatigue Detection
──────────────────────────────────────
Uses dlib 68-landmark predictor to compute the Eye Aspect Ratio (EAR).
Consecutive low-EAR frames trigger a fatigue flag.
"""

from __future__ import annotations

import cv2
import dlib
import numpy as np
from scipy.spatial import distance as dist
from imutils import face_utils
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

# ── Constants ────────────────────────────────────────────────────────────────
EAR_THRESHOLD: float = 0.25          # Below this → eyes considered closed
CONSEC_FRAMES_THRESH: int = 15       # Consecutive closed-eye frames → fatigue

# Landmark indices for eyes
_L_START, _L_END = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
_R_START, _R_END = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]


# ── Helpers ──────────────────────────────────────────────────────────────────
def _ear(eye: np.ndarray) -> float:
    """Compute Eye Aspect Ratio for a single eye (6-landmark array)."""
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class FatigueResult:
    """Per-frame fatigue analysis output."""
    fatigue: int = 0               # 1 = fatigued, 0 = normal
    ear: float = 0.0               # Average EAR of both eyes
    consec_frames: int = 0         # Running counter of closed-eye frames
    left_eye: Optional[np.ndarray] = field(default=None, repr=False)
    right_eye: Optional[np.ndarray] = field(default=None, repr=False)


# ── Detector Class ───────────────────────────────────────────────────────────
class FatigueDetector:
    """Stateful fatigue detector – keeps track of consecutive closed-eye frames."""

    def __init__(
        self,
        predictor_path: str | Path = "models/shape_predictor_68_face_landmarks.dat",
        ear_threshold: float = EAR_THRESHOLD,
        consec_frames: int = CONSEC_FRAMES_THRESH,
    ) -> None:
        self.ear_threshold = ear_threshold
        self.consec_thresh = consec_frames

        # dlib face detector + landmark predictor
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor(str(predictor_path))

        # Internal state
        self._consec_count: int = 0

    # ── Public API ───────────────────────────────────────────────────────────
    def process(self, frame: np.ndarray) -> FatigueResult:
        """Analyse a single BGR frame and return a `FatigueResult`."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector(gray, 0)

        result = FatigueResult()

        if len(faces) == 0:
            # No face → keep counter but not increment
            result.consec_frames = self._consec_count
            return result

        # Use first (closest) face
        shape = self.predictor(gray, faces[0])
        shape = face_utils.shape_to_np(shape)

        left_eye = shape[_L_START:_L_END]
        right_eye = shape[_R_START:_R_END]

        ear = (_ear(left_eye) + _ear(right_eye)) / 2.0

        if ear < self.ear_threshold:
            self._consec_count += 1
        else:
            self._consec_count = 0

        fatigue_flag = 1 if self._consec_count >= self.consec_thresh else 0

        return FatigueResult(
            fatigue=fatigue_flag,
            ear=round(ear, 4),
            consec_frames=self._consec_count,
            left_eye=left_eye,
            right_eye=right_eye,
        )

    def reset(self) -> None:
        """Reset consecutive-frame counter (e.g. between videos)."""
        self._consec_count = 0

    # ── Drawing Utility ──────────────────────────────────────────────────────
    @staticmethod
    def draw(frame: np.ndarray, result: FatigueResult) -> np.ndarray:
        """Overlay fatigue visualisation on a BGR frame (returns copy)."""
        out = frame.copy()
        if result.left_eye is not None:
            cv2.drawContours(out, [cv2.convexHull(result.left_eye)], -1, (0, 255, 255), 1)
            cv2.drawContours(out, [cv2.convexHull(result.right_eye)], -1, (0, 255, 255), 1)

        color = (0, 0, 255) if result.fatigue else (0, 255, 0)
        label = f"EAR: {result.ear:.2f}  {'FATIGUE!' if result.fatigue else 'OK'}"
        cv2.putText(out, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        return out
