"""
Live-Mode Processing Pipeline
─────────────────────────────
Real-time webcam / camera processing with the full detection pipeline.
Includes obstacle/collision detection and alarm signalling.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
import pygame

from vision.fatigue import FatigueDetector, FatigueResult
from vision.distraction import DistractionDetector, DistractionResult
from vision.speed import SpeedEstimator, SpeedResult
from vision.lane import LaneDetector, LaneResult
from vision.plate import PlateDetector, PlateResult
from vision.obstacle import ObstacleDetector, ObstacleResult
from risk.risk_engine import RiskEngine, RiskResult, RiskLevel


# ── Alert Manager ────────────────────────────────────────────────────────────
class AlertManager:
    """Manages cooldown-based audio + visual alerts."""

    def __init__(self, cooldown_sec: float = 3.0, sound_path: Optional[str] = None) -> None:
        self.cooldown = cooldown_sec
        self._last_alert: float = 0.0
        self._sound_ready = False

        if sound_path:
            try:
                pygame.mixer.init()
                self._alert_sound = pygame.mixer.Sound(sound_path)
                self._sound_ready = True
            except Exception:
                pass

    def trigger(self, reason: str = "") -> bool:
        """Returns True if alert was actually fired (respects cooldown)."""
        now = time.time()
        if now - self._last_alert < self.cooldown:
            return False
        self._last_alert = now
        if self._sound_ready:
            self._alert_sound.play()
        return True


# ── Live Session State ───────────────────────────────────────────────────────
@dataclass
class LiveState:
    """Mutable state carried across frames in live mode."""
    frame_count: int = 0
    fatigue: FatigueResult = field(default_factory=FatigueResult)
    distraction: DistractionResult = field(default_factory=DistractionResult)
    speed: SpeedResult = field(default_factory=SpeedResult)
    lane: LaneResult = field(default_factory=LaneResult)
    plate: PlateResult = field(default_factory=PlateResult)
    obstacle: ObstacleResult = field(default_factory=ObstacleResult)
    risk: RiskResult = field(default_factory=RiskResult)
    alarm_fired: bool = False
    alarm_reasons: list = field(default_factory=list)
    annotated_frame: Optional[np.ndarray] = field(default=None, repr=False)

    # Rolling histories for dashboard charts
    speed_history: list[float] = field(default_factory=list)
    risk_history: list[float] = field(default_factory=list)
    ear_history: list[float] = field(default_factory=list)
    danger_history: list[float] = field(default_factory=list)


# ── Live Processor ───────────────────────────────────────────────────────────
class LiveProcessor:
    """Processes webcam frames one at a time; keeps rolling state."""

    def __init__(
        self,
        predictor_path: str = "models/shape_predictor_68_face_landmarks.dat",
        yolo_path: str = "models/yolov8n.pt",
        face_landmarker_path: str = "models/face_landmarker.task",
        speed_limit: float = 80.0,
        alert_sound: Optional[str] = None,
        camera_index: int = 0,
    ) -> None:
        self.fatigue_det = FatigueDetector(predictor_path=predictor_path)
        self.distraction_det = DistractionDetector(model_path=face_landmarker_path)
        self.speed_est = SpeedEstimator()
        self.lane_det = LaneDetector()
        self.plate_det = PlateDetector(model_path=yolo_path, speed_limit=speed_limit)
        self.obstacle_det = ObstacleDetector(model_path=yolo_path)
        self.risk_engine = RiskEngine(speed_limit=speed_limit)
        self.alert_mgr = AlertManager(sound_path=alert_sound)

        self.camera_index = camera_index
        self.state = LiveState()
        self._cap: Optional[cv2.VideoCapture] = None

    # ── Camera Lifecycle ─────────────────────────────────────────────────────
    def open_camera(self) -> bool:
        self._cap = cv2.VideoCapture(self.camera_index)
        if self._cap.isOpened():
            fps = self._cap.get(cv2.CAP_PROP_FPS) or 30.0
            self.speed_est.fps = fps
            return True
        return False

    def close_camera(self) -> None:
        if self._cap and self._cap.isOpened():
            self._cap.release()
        self._cap = None
        self.fatigue_det.reset()
        self.speed_est.reset()
        self.obstacle_det.reset()
        self.risk_engine.reset()
        self.state = LiveState()

    @property
    def is_open(self) -> bool:
        return self._cap is not None and self._cap.isOpened()

    # ── Process One Camera Frame ─────────────────────────────────────────────
    def tick(self) -> Optional[LiveState]:
        """Read one frame from the camera, process it, update state."""
        if not self.is_open:
            return None

        ret, frame = self._cap.read()
        if not ret:
            return None

        return self.process_frame(frame)

    # ── Process External Frame ───────────────────────────────────────────────
    def process_frame(self, frame: np.ndarray) -> LiveState:
        """Process a single frame and update rolling state."""
        self.state.frame_count += 1

        # Run all detectors
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

        # Alarm: fire audio if risk engine says alarm
        alarm_fired = False
        if risk.alarm:
            alarm_fired = self.alert_mgr.trigger(
                reason="; ".join(risk.alarm_labels)
            )

        # Build annotated frame
        vis = frame.copy()
        vis = self.fatigue_det.draw(vis, fat)
        vis = self.distraction_det.draw(vis, dis)
        vis = self.speed_est.draw(vis, spd)
        vis = self.lane_det.draw(vis, lane)
        vis = self.obstacle_det.draw(vis, obs)
        vis = self.plate_det.draw(vis, plate)

        color = risk.level.color_bgr
        cv2.putText(vis, f"RISK: {risk.score:.2f} [{risk.level.value}]",
                    (10, vis.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        if risk.alarm:
            cv2.putText(vis, "!! ALARM !!",
                        (vis.shape[1] - 220, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

        # Update state
        self.state.fatigue = fat
        self.state.distraction = dis
        self.state.speed = spd
        self.state.lane = lane
        self.state.plate = plate
        self.state.obstacle = obs
        self.state.risk = risk
        self.state.alarm_fired = alarm_fired or risk.alarm
        self.state.alarm_reasons = risk.alarm_labels
        self.state.annotated_frame = vis

        # Rolling history (keep last 300 data points ≈ 10 s @ 30fps)
        self.state.speed_history.append(spd.speed_kmph)
        self.state.risk_history.append(risk.score)
        self.state.ear_history.append(fat.ear)
        self.state.danger_history.append(obs.danger_score)
        for h in (self.state.speed_history, self.state.risk_history,
                  self.state.ear_history, self.state.danger_history):
            if len(h) > 300:
                h.pop(0)

        return self.state
