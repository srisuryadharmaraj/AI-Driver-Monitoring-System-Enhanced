"""
MODULE 4 · Risk Prediction Engine
──────────────────────────────────
Computes a composite 0-1 risk score from driver behaviour signals:

    risk = 0.30 × fatigue
         + 0.25 × distraction
         + 0.30 × collision_danger
         + 0.15 × sudden_motion

Alarm is triggered when:
  • risk score > 0.6 (HIGH)
  • fatigue detected
  • collision_risk is True (obstacle approaching + not braking)
  • overspeed detected

Risk levels:
    <0.3   → Low
    0.3–0.6 → Medium
    >0.6   → High
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

import numpy as np


# ── Risk Level Enum ──────────────────────────────────────────────────────────
class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

    @staticmethod
    def from_score(score: float) -> "RiskLevel":
        if score < 0.3:
            return RiskLevel.LOW
        elif score <= 0.6:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH

    @property
    def color_bgr(self) -> tuple[int, int, int]:
        return {
            RiskLevel.LOW: (0, 200, 0),
            RiskLevel.MEDIUM: (0, 180, 255),
            RiskLevel.HIGH: (0, 0, 255),
        }[self]


# ── Alarm Reason Bitmask ────────────────────────────────────────────────────
class AlarmReason:
    NONE = 0
    FATIGUE = 1
    DISTRACTION = 2
    COLLISION = 4
    OVERSPEED = 8
    HIGH_RISK = 16

    @staticmethod
    def to_list(bits: int) -> list[str]:
        reasons = []
        if bits & AlarmReason.FATIGUE:
            reasons.append("Drowsiness detected")
        if bits & AlarmReason.DISTRACTION:
            reasons.append("Driver distracted")
        if bits & AlarmReason.COLLISION:
            reasons.append("Collision warning — obstacle ahead, speed not reducing")
        if bits & AlarmReason.OVERSPEED:
            reasons.append("Overspeed")
        if bits & AlarmReason.HIGH_RISK:
            reasons.append("Critically high risk score")
        return reasons


# ── Result Container ────────────────────────────────────────────────────────
@dataclass
class RiskResult:
    score: float = 0.0
    level: RiskLevel = RiskLevel.LOW
    fatigue_w: float = 0.0
    distraction_w: float = 0.0
    collision_w: float = 0.0
    motion_w: float = 0.0
    alarm: bool = False
    alarm_reasons: int = 0  # bitmask of AlarmReason

    @property
    def alarm_labels(self) -> list[str]:
        return AlarmReason.to_list(self.alarm_reasons)


# ── Risk Engine ──────────────────────────────────────────────────────────────
class RiskEngine:
    """Weighted risk scoring engine with alarm logic."""

    def __init__(
        self,
        w_fatigue: float = 0.30,
        w_distraction: float = 0.25,
        w_collision: float = 0.30,
        w_motion: float = 0.15,
        speed_limit: float = 80.0,
        speed_max: float = 160.0,
    ) -> None:
        self.w = {
            "fatigue": w_fatigue,
            "distraction": w_distraction,
            "collision": w_collision,
            "motion": w_motion,
        }
        self.speed_limit = speed_limit
        self.speed_max = speed_max

        # Rolling history for sudden-motion detection
        self._prev_speed: Optional[float] = None
        self._speed_deltas: list[float] = []
        self._max_delta_window: int = 10

    # ── Public API ───────────────────────────────────────────────────────────
    def compute(
        self,
        fatigue: int,              # 0 or 1
        distraction: int,          # 0 or 1
        speed_kmph: float,         # current speed
        phone: int = 0,            # 0 or 1 (merged into distraction)
        collision_risk: bool = False,   # from ObstacleDetector
        danger_score: float = 0.0,      # 0-1 from ObstacleDetector
        overspeed: bool = False,
    ) -> RiskResult:
        """Return composite risk score, level, and alarm flags."""

        # Distraction includes phone usage
        distraction_signal = min(1.0, distraction + phone)

        # Sudden motion: large speed change between frames
        sudden = self._sudden_motion(speed_kmph)

        score = (
            self.w["fatigue"] * fatigue
            + self.w["distraction"] * distraction_signal
            + self.w["collision"] * danger_score
            + self.w["motion"] * sudden
        )
        score = round(min(score, 1.0), 3)
        level = RiskLevel.from_score(score)

        # ── Alarm logic ──────────────────────────────────────────────────────
        alarm_reasons = AlarmReason.NONE
        if fatigue:
            alarm_reasons |= AlarmReason.FATIGUE
        if distraction_signal > 0.5:
            alarm_reasons |= AlarmReason.DISTRACTION
        if collision_risk:
            alarm_reasons |= AlarmReason.COLLISION
        if overspeed:
            alarm_reasons |= AlarmReason.OVERSPEED
        if level == RiskLevel.HIGH:
            alarm_reasons |= AlarmReason.HIGH_RISK

        alarm = alarm_reasons != AlarmReason.NONE

        return RiskResult(
            score=score,
            level=level,
            fatigue_w=round(self.w["fatigue"] * fatigue, 3),
            distraction_w=round(self.w["distraction"] * distraction_signal, 3),
            collision_w=round(self.w["collision"] * danger_score, 3),
            motion_w=round(self.w["motion"] * sudden, 3),
            alarm=alarm,
            alarm_reasons=alarm_reasons,
        )

    def reset(self) -> None:
        self._prev_speed = None
        self._speed_deltas.clear()

    # ── Internal ─────────────────────────────────────────────────────────────
    def _sudden_motion(self, speed: float) -> float:
        if self._prev_speed is None:
            self._prev_speed = speed
            return 0.0

        delta = abs(speed - self._prev_speed)
        self._prev_speed = speed
        self._speed_deltas.append(delta)
        if len(self._speed_deltas) > self._max_delta_window:
            self._speed_deltas.pop(0)

        # Normalise: big delta → 1
        max_delta = max(self._speed_deltas) if self._speed_deltas else 1.0
        return min(delta / max(max_delta, 1.0), 1.0)
