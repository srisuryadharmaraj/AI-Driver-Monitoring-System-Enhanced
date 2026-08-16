"""
MODULE 2-support · Lane Detection
──────────────────────────────────
Simple OpenCV-based lane detection:

1. ROI masking (lower half of frame).
2. Canny edge detection.
3. Hough line transform.
4. Separate left / right lanes by slope.
5. Average & extrapolate lines.
6. Optional bird's-eye view warp.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class LaneResult:
    left_line: Optional[tuple] = None      # (x1,y1,x2,y2)
    right_line: Optional[tuple] = None
    lane_center_offset: float = 0.0        # px offset from frame centre
    lanes_detected: bool = False
    overlay: Optional[np.ndarray] = field(default=None, repr=False)


# ── Helpers ──────────────────────────────────────────────────────────────────
def _roi_mask(edges: np.ndarray) -> np.ndarray:
    h, w = edges.shape
    polygon = np.array([[
        (int(w * 0.05), h),
        (int(w * 0.45), int(h * 0.55)),
        (int(w * 0.55), int(h * 0.55)),
        (int(w * 0.95), h),
    ]])
    mask = np.zeros_like(edges)
    cv2.fillPoly(mask, polygon, 255)
    return cv2.bitwise_and(edges, mask)


def _average_lines(lines, h: int):
    """Separate lines by slope, average, and extrapolate to frame height."""
    left_fit, right_fit = [], []

    if lines is None:
        return None, None

    for line in lines:
        coords = np.asarray(line).reshape(-1)

        if coords.size < 4:
            continue

        x1, y1, x2, y2 = coords[:4]

        if x2 == x1:
            continue

        slope = (y2 - y1) / (x2 - x1)
        intercept = y1 - slope * x1

        if slope < -0.5:
            left_fit.append((slope, intercept))
        elif slope > 0.5:
            right_fit.append((slope, intercept))

    def _make_line(fits):
        if not fits:
            return None
        avg = np.mean(fits, axis=0)
        slope, intercept = avg
        y1 = h
        y2 = int(h * 0.6)
        x1 = int((y1 - intercept) / slope)
        x2 = int((y2 - intercept) / slope)
        return (x1, y1, x2, y2)

    return _make_line(left_fit), _make_line(right_fit)


# ── Detector Class ───────────────────────────────────────────────────────────
class LaneDetector:
    """Simple Canny + Hough lane detector."""

    def __init__(
        self,
        canny_low: int = 50,
        canny_high: int = 150,
        hough_threshold: int = 50,
        min_line_len: int = 40,
        max_line_gap: int = 150,
    ) -> None:
        self.canny_low = canny_low
        self.canny_high = canny_high
        self.hough_threshold = hough_threshold
        self.min_line_len = min_line_len
        self.max_line_gap = max_line_gap

    def process(self, frame: np.ndarray) -> LaneResult:
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, self.canny_low, self.canny_high)
        roi = _roi_mask(edges)

        lines = cv2.HoughLinesP(
            roi,
            rho=1,
            theta=np.pi / 180,
            threshold=self.hough_threshold,
            minLineLength=self.min_line_len,
            maxLineGap=self.max_line_gap,
        )

        left, right = _average_lines(lines, h)

        # Lane centre offset
        offset = 0.0
        if left and right:
            lane_mid = (left[0] + right[0]) / 2
            offset = lane_mid - w / 2

        result = LaneResult(
            left_line=left,
            right_line=right,
            lane_center_offset=round(offset, 1),
            lanes_detected=(left is not None or right is not None),
        )
        return result

    @staticmethod
    def draw(frame: np.ndarray, result: LaneResult) -> np.ndarray:
        overlay = frame.copy()
        if result.left_line:
            cv2.line(overlay, result.left_line[:2], result.left_line[2:], (0, 255, 0), 4)
        if result.right_line:
            cv2.line(overlay, result.right_line[:2], result.right_line[2:], (0, 255, 0), 4)

        # Fill lane polygon
        if result.left_line and result.right_line:
            pts = np.array([
                result.left_line[:2], result.left_line[2:],
                result.right_line[2:], result.right_line[:2],
            ], np.int32)
            cv2.fillPoly(overlay, [pts], (0, 255, 0))
            frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)

        # Offset text
        cv2.putText(
            frame,
            f"Lane offset: {result.lane_center_offset:.0f}px",
            (10, 170),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 0), 2,
        )
        return frame
