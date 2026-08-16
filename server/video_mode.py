"""
Video-Mode Processing Pipeline
──────────────────────────────
Processes an uploaded video file frame-by-frame through every detection
module and returns aggregated analytics.  Now includes obstacle/collision
detection and alarm signalling.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator, Optional

import cv2
import numpy as np

from vision.fatigue import FatigueDetector, FatigueResult
from vision.distraction import DistractionDetector, DistractionResult
from vision.speed import SpeedEstimator, SpeedResult
from vision.lane import LaneDetector, LaneResult
from vision.plate import PlateDetector, PlateResult
from vision.obstacle import ObstacleDetector, ObstacleResult
from risk.risk_engine import RiskEngine, RiskResult


# ── Per-frame bundle ─────────────────────────────────────────────────────────
@dataclass
class FrameBundle:
    """All analysis results for a single frame."""
    frame_idx: int = 0
    timestamp_sec: float = 0.0
    annotated_frame: Optional[np.ndarray] = field(default=None, repr=False)
    fatigue: FatigueResult = field(default_factory=FatigueResult)
    distraction: DistractionResult = field(default_factory=DistractionResult)
    speed: SpeedResult = field(default_factory=SpeedResult)
    lane: LaneResult = field(default_factory=LaneResult)
    plate: PlateResult = field(default_factory=PlateResult)
    obstacle: ObstacleResult = field(default_factory=ObstacleResult)
    risk: RiskResult = field(default_factory=RiskResult)


# ── Aggregated summary ──────────────────────────────────────────────────────
@dataclass
class VideoSummary:
    total_frames: int = 0
    duration_sec: float = 0.0
    fps: float = 0.0
    fatigue_frames: int = 0
    distraction_frames: int = 0
    max_speed: float = 0.0
    overspeed_events: int = 0
    collision_warnings: int = 0
    obstacle_frames: int = 0
    plates_detected: list = field(default_factory=list)
    avg_risk: float = 0.0
    max_risk: float = 0.0
    total_alarms: int = 0
    speed_timeline: list = field(default_factory=list)
    risk_timeline: list = field(default_factory=list)
    ear_timeline: list = field(default_factory=list)
    danger_timeline: list = field(default_factory=list)
    alert_moments: list = field(default_factory=list)


# ── Processor ────────────────────────────────────────────────────────────────
class VideoProcessor:
    """Process a video file through the full detection pipeline."""

    def __init__(
        self,
        predictor_path: str = "models/shape_predictor_68_face_landmarks.dat",
        yolo_path: str = "models/yolov8n.pt",
        face_landmarker_path: str = "models/face_landmarker.task",
        speed_limit: float = 80.0,
        skip_frames: int = 0,
    ) -> None:
        self.fatigue_det = FatigueDetector(predictor_path=predictor_path)
        self.distraction_det = DistractionDetector(model_path=face_landmarker_path)
        self.speed_est = SpeedEstimator()
        self.lane_det = LaneDetector()
        self.plate_det = PlateDetector(model_path=yolo_path, speed_limit=speed_limit)
        self.obstacle_det = ObstacleDetector(model_path=yolo_path)
        self.risk_engine = RiskEngine(speed_limit=speed_limit)
        self.skip = skip_frames

    # ── Generator API ────────────────────────────────────────────────────────
    def stream(self, video_path: str | Path) -> Generator[FrameBundle, None, None]:
        """Yield a ``FrameBundle`` for every processed frame."""
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.speed_est.fps = fps

        idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            idx += 1
            if self.skip and idx % (self.skip + 1) != 0:
                continue

            bundle = self._process_frame(frame, idx, fps)
            yield bundle

        cap.release()
        self._reset()

    # ── Batch API ────────────────────────────────────────────────────────────
    def run(self, video_path: str | Path, progress_cb=None) -> VideoSummary:
        """Process full video, return ``VideoSummary``."""
        cap = cv2.VideoCapture(str(video_path))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        cap.release()

        summary = VideoSummary(total_frames=total, fps=fps,
                               duration_sec=round(total / fps, 2))
        risks, speeds, ears, dangers = [], [], [], []

        for bundle in self.stream(video_path):
            if bundle.fatigue.fatigue:
                summary.fatigue_frames += 1
            if bundle.distraction.distraction:
                summary.distraction_frames += 1
            if bundle.speed.speed_kmph > summary.max_speed:
                summary.max_speed = bundle.speed.speed_kmph
            if bundle.plate.overspeed:
                summary.overspeed_events += 1
            if bundle.obstacle.collision_risk:
                summary.collision_warnings += 1
            if bundle.obstacle.obstacle_detected:
                summary.obstacle_frames += 1
            if bundle.risk.alarm:
                summary.total_alarms += 1
            if bundle.plate.plate_text:
                summary.plates_detected.append({
                    "text": bundle.plate.plate_text,
                    "speed": bundle.plate.speed,
                    "time": bundle.timestamp_sec,
                })
            if bundle.risk.alarm:
                summary.alert_moments.append({
                    "frame": bundle.frame_idx,
                    "time": bundle.timestamp_sec,
                    "score": bundle.risk.score,
                    "reasons": bundle.risk.alarm_labels,
                })

            speeds.append(bundle.speed.speed_kmph)
            risks.append(bundle.risk.score)
            ears.append(bundle.fatigue.ear)
            dangers.append(bundle.obstacle.danger_score)

            if progress_cb:
                progress_cb(bundle.frame_idx, total)

        summary.speed_timeline = speeds
        summary.risk_timeline = risks
        summary.ear_timeline = ears
        summary.danger_timeline = dangers
        summary.avg_risk = round(float(np.mean(risks)) if risks else 0, 3)
        summary.max_risk = round(float(np.max(risks)) if risks else 0, 3)
        return summary

    # ── Internal ─────────────────────────────────────────────────────────────
    def _process_frame(self, frame: np.ndarray, idx: int, fps: float) -> FrameBundle:
        ts = round(idx / fps, 3)

        fat = self.fatigue_det.process(frame)
        dis = self.distraction_det.process(frame)
        spd = self.speed_est.process(frame)
        lane = self.lane_det.process(frame)
        obs = self.obstacle_det.process(frame, spd.speed_kmph)
        plate = self.plate_det.process(frame, spd.speed_kmph)
        risk = self.risk_engine.compute(
            fatigue=fat.fatigue,
            distraction=dis.distraction,
            speed_kmph=spd.speed_kmph,
            phone=dis.phone,
            collision_risk=obs.collision_risk,
            danger_score=obs.danger_score,
            overspeed=plate.overspeed,
        )

        # Build annotated frame
        vis = frame.copy()
        vis = self.fatigue_det.draw(vis, fat)
        vis = self.distraction_det.draw(vis, dis)
        vis = self.speed_est.draw(vis, spd)
        vis = self.lane_det.draw(vis, lane)
        vis = self.obstacle_det.draw(vis, obs)
        vis = self.plate_det.draw(vis, plate)

        # Risk badge
        color = risk.level.color_bgr
        cv2.putText(vis, f"RISK: {risk.score:.2f} [{risk.level.value}]",
                    (10, vis.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # Alarm badge
        if risk.alarm:
            cv2.putText(vis, "!! ALARM !!",
                        (vis.shape[1] - 220, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

        return FrameBundle(
            frame_idx=idx,
            timestamp_sec=ts,
            annotated_frame=vis,
            fatigue=fat,
            distraction=dis,
            speed=spd,
            lane=lane,
            plate=plate,
            obstacle=obs,
            risk=risk,
        )

    def _reset(self):
        self.fatigue_det.reset()
        self.speed_est.reset()
        self.obstacle_det.reset()
        self.risk_engine.reset()
