"""
MODULE 2 · Camera-Based Speed Estimation
─────────────────────────────────────────
Estimates vehicle ego-speed purely from camera frames:

1. Define a road ROI (lower portion of frame).
2. Apply a perspective transform → bird's-eye view.
3. Dense optical flow (Farnebäck) between consecutive bird-eye frames.
4. Median pixel displacement per frame → displacement per second.
5. Multiply by a calibration factor → km/h.

The calibration factor (`PIXELS_PER_METER`) must be set once per camera
setup.  A reasonable default is provided for a typical dashcam at ~720p.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np


# ── Calibration & defaults ───────────────────────────────────────────────────
PIXELS_PER_METER: float = 8.0       # bird-eye pixels that correspond to 1 real-world meter
DEFAULT_FPS: float = 30.0
SPEED_SMOOTHING: int = 5            # rolling-average window


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class SpeedResult:
    speed_kmph: float = 0.0
    raw_displacement: float = 0.0    # pixels/frame in bird-eye view
    flow_magnitude: float = 0.0


# ── Perspective helpers ──────────────────────────────────────────────────────
def _default_perspective(w: int, h: int):
    """Return (src, dst) point sets for a simple road perspective warp."""
    # Source: trapezoidal region in bottom half of frame
    src = np.float32([
        [w * 0.1,  h],        # bottom-left
        [w * 0.45, h * 0.6],  # top-left
        [w * 0.55, h * 0.6],  # top-right
        [w * 0.9,  h],        # bottom-right
    ])
    # Destination: rectangle (bird-eye)
    dst = np.float32([
        [w * 0.2, h],
        [w * 0.2, 0],
        [w * 0.8, 0],
        [w * 0.8, h],
    ])
    return src, dst


# ── Detector Class ───────────────────────────────────────────────────────────
class SpeedEstimator:
    """Stateful speed estimator based on dense optical flow."""

    def __init__(
        self,
        fps: float = DEFAULT_FPS,
        ppm: float = PIXELS_PER_METER,
        smoothing: int = SPEED_SMOOTHING,
        perspective_src: Optional[np.ndarray] = None,
        perspective_dst: Optional[np.ndarray] = None,
    ) -> None:
        self.fps = fps
        self.ppm = ppm
        self.smoothing = smoothing

        self._prev_gray: Optional[np.ndarray] = None
        self._M: Optional[np.ndarray] = None          # perspective matrix
        self._src = perspective_src
        self._dst = perspective_dst
        self._history: list[float] = []

    # ── Public API ───────────────────────────────────────────────────────────
    def process(self, frame: np.ndarray) -> SpeedResult:
        """Estimate speed from a single BGR frame."""
        h, w = frame.shape[:2]

        # Lazy-init perspective matrix
        if self._M is None:
            src = self._src if self._src is not None else _default_perspective(w, h)[0]
            dst = self._dst if self._dst is not None else _default_perspective(w, h)[1]
            self._M = cv2.getPerspectiveTransform(src, dst)

        # Bird-eye warp → grayscale
        warped = cv2.warpPerspective(frame, self._M, (w, h))
        gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        result = SpeedResult()

        if self._prev_gray is None:
            self._prev_gray = gray
            return result

        # Dense optical flow (Farnebäck)
        flow = cv2.calcOpticalFlowFarneback(
            self._prev_gray, gray,
            None, 0.5, 3, 15, 3, 5, 1.2, 0,
        )
        self._prev_gray = gray

        # Magnitude of flow vectors
        mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])

        # Use median of upper-half magnitudes (road surface)
        roi_mag = mag[: h // 2, :]
        median_disp = float(np.median(roi_mag)) if roi_mag.size else 0.0

        # Convert to speed
        meters_per_frame = median_disp / self.ppm
        meters_per_sec = meters_per_frame * self.fps
        kmph = meters_per_sec * 3.6

        # Smooth
        self._history.append(kmph)
        if len(self._history) > self.smoothing:
            self._history.pop(0)
        smoothed = float(np.mean(self._history))

        result.speed_kmph = round(smoothed, 1)
        result.raw_displacement = round(median_disp, 3)
        result.flow_magnitude = round(float(np.mean(mag)), 3)
        return result

    def reset(self) -> None:
        self._prev_gray = None
        self._history.clear()

    # ── Drawing Utility ──────────────────────────────────────────────────────
    @staticmethod
    def draw(frame: np.ndarray, result: SpeedResult) -> np.ndarray:
        out = frame.copy()
        speed_txt = f"Speed: {result.speed_kmph:.0f} km/h"
        color = (0, 0, 255) if result.speed_kmph > 80 else (0, 255, 0)
        cv2.putText(out, speed_txt, (10, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        return out
