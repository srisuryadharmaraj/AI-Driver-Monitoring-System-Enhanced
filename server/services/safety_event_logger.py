"""
Safety Event Logger Service
────────────────────────────
Provides fail-safe, stateful event logging for Live Camera and Upload Video.
Implements leading-edge detection (False -> True) and a 3.0s cooldown per event type
to prevent duplicate database insertions during continuous risk episodes.
"""

from __future__ import annotations

import time
import uuid
from typing import Dict, Optional, List
from database.db import execute_db


class SafetyEventLogger:
    """Stateful logger with leading-edge duplicate suppression & cooldown protection."""

    def __init__(self, journey_id: Optional[str] = None, cooldown_sec: float = 3.0) -> None:
        self.journey_id = journey_id
        self.cooldown = cooldown_sec

        # Active state tracking for leading-edge detection (False -> True)
        self.active_states: Dict[str, bool] = {
            "Fatigue": False,
            "Distraction": False,
            "Overspeed": False,
            "Obstacle Hazard": False,
            "Critical Risk": False,
        }

        # Timestamp tracking for cooldown protection
        self.last_logged_time: Dict[str, float] = {
            "Fatigue": 0.0,
            "Distraction": 0.0,
            "Overspeed": 0.0,
            "Obstacle Hazard": 0.0,
            "Critical Risk": 0.0,
        }

    def process_signals(
        self,
        fatigue: int,
        distraction: int,
        overspeed: bool,
        collision_risk: bool,
        risk_level_val: str,
        risk_score: float,
        timestamp_sec: float = 0.0,
        alarm_reasons: Optional[List[str]] = None,
    ) -> None:
        """
        Evaluates frame-level detection signals against active state map.
        Performs database insertion ONCE on the leading edge (False -> True) of an episode.
        """
        now = time.time()

        # Define detection triggers
        triggers = {
            "Fatigue": (fatigue == 1),
            "Distraction": (distraction == 1),
            "Overspeed": bool(overspeed),
            "Obstacle Hazard": bool(collision_risk),
            "Critical Risk": (risk_level_val == "High" or risk_score >= 0.60),
        }

        descriptions = {
            "Fatigue": "Driver drowsiness detected (Low Eye Aspect Ratio)",
            "Distraction": "Driver distraction detected (Off-center head pose / gaze)",
            "Overspeed": "Vehicle speed exceeded set speed limit",
            "Obstacle Hazard": "Forward collision warning — obstacle approaching",
            "Critical Risk": "Critically high overall risk score threshold exceeded",
        }

        severities = {
            "Fatigue": "High" if risk_score >= 0.5 else "Medium",
            "Distraction": "Medium",
            "Overspeed": "Medium",
            "Obstacle Hazard": "High",
            "Critical Risk": "Critical",
        }

        for evt_type, is_active in triggers.items():
            if is_active:
                was_active = self.active_states[evt_type]
                time_since_last = now - self.last_logged_time[evt_type]

                # Leading edge trigger: state turned True AND cooldown passed
                if (not was_active) and (time_since_last >= self.cooldown):
                    desc = descriptions[evt_type]
                    if alarm_reasons:
                        desc += f" ({'; '.join(alarm_reasons)})"
                    
                    sev = severities[evt_type]
                    
                    self._log_to_db(
                        event_type=evt_type,
                        severity=sev,
                        description=desc,
                        risk_score=risk_score,
                        timestamp_sec=timestamp_sec,
                    )
                    
                    self.active_states[evt_type] = True
                    self.last_logged_time[evt_type] = now
            else:
                # Trailing edge: reset active state when condition clears
                self.active_states[evt_type] = False

    def _log_to_db(
        self,
        event_type: str,
        severity: str,
        description: str,
        risk_score: float,
        timestamp_sec: float,
    ) -> None:
        """Fail-safe database insertion for a single safety event."""
        try:
            event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
            execute_db(
                """
                INSERT INTO safety_events (
                    event_id, journey_id, timestamp_sec, event_type, severity,
                    description, risk_score, resolution_status, supervisor_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', '')
                """,
                (
                    event_id,
                    self.journey_id,
                    round(timestamp_sec, 2),
                    event_type,
                    severity,
                    description,
                    round(risk_score, 3),
                ),
            )
        except Exception as _e:
            # Fail-safe: database error will NEVER interrupt live stream or video processing
            print(f"[SafetyEventLogger Warning] Failed to insert event: {_e}")

    def reset(self) -> None:
        """Reset state tracking between sessions."""
        for k in self.active_states:
            self.active_states[k] = False
            self.last_logged_time[k] = 0.0
