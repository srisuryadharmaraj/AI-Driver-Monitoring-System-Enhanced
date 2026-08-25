"""
Distraction Detection Model Evaluator.
Manages evaluation state and ground-truth validation for distraction analysis.
Enforces strict ground-truth rules: No circular or derived predictions permitted.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class DistractionEvalResult:
    status: str
    requires_ground_truth: bool
    message: str
    required_annotations: list[str]
    operational_stats: Dict[str, Any]


class DistractionEvaluator:
    def __init__(self) -> None:
        pass

    def evaluate(self) -> DistractionEvalResult:
        """
        Returns Evaluation Pending status until independent manual ground-truth labels are supplied.
        Enforces NO synthetic or circular metrics.
        """
        return DistractionEvalResult(
            status="EVALUATION PENDING - GROUND TRUTH REQUIRED",
            requires_ground_truth=True,
            message=(
                "Distraction metrics (Accuracy, Precision, Recall, F1) are currently pending independent manual "
                "ground-truth annotation. To prevent circular evaluation, ground truth cannot be derived from "
                "MediaPipe or model pose output."
            ),
            required_annotations=[
                "Independent frame-by-frame binary label (0 = Attentive, 1 = Distracted)",
                "Manual 3D head pose angle annotations (Yaw, Pitch, Roll reference)",
                "Manual cell-phone usage bounding box annotations",
            ],
            operational_stats={
                "pose_estimator": "MediaPipe FaceLandmarker (478 Canonical 3D Landmarks)",
                "yaw_threshold_deg": 30.0,
                "pitch_threshold_deg": 25.0,
                "gaze_ratio_threshold": 0.35,
            },
        )
