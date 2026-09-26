"""
Distraction Detection Model Evaluator.
Manages evaluation state and ground-truth validation for distraction analysis.
Enforces strict ground-truth rules: No circular or derived predictions permitted.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any

import cv2
from vision.distraction import DistractionDetector


@dataclass
class DistractionEvalResult:
    status: str
    requires_ground_truth: bool
    message: str
    required_annotations: list[str]
    operational_stats: Dict[str, Any]


class DistractionEvaluator:
    def __init__(self, model_path: str | Path = "models/face_landmarker.task") -> None:
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            alt = Path(__file__).resolve().parent.parent / "models" / "face_landmarker.task"
            if alt.exists():
                self.model_path = alt

    def evaluate(self, dataset_dir: str | Path = "../videos/Data sets/images") -> DistractionEvalResult:
        """
        Executes operational runtime evaluation of DistractionDetector across available test frames.
        Returns 'EVALUATION PENDING - GROUND TRUTH REQUIRED' for empirical accuracy metrics until
        independent manual ground-truth labels are supplied, preventing circular evaluation.
        """
        data_path = Path(dataset_dir)
        if not data_path.exists():
            alt_path = Path(__file__).resolve().parent.parent.parent / "videos" / "Data sets" / "images"
            if alt_path.exists():
                data_path = alt_path

        total_time_sec = 0.0
        processed_count = 0
        distraction_detected_count = 0

        if data_path.exists():
            files = sorted([f for f in os.listdir(data_path) if f.lower().endswith((".jpg", ".png", ".jpeg"))])
            detector = None
            try:
                detector = DistractionDetector(model_path=self.model_path)
                for f in files[:50]:  # Evaluate up to 50 sample frames for operational stats
                    img_path = data_path / f
                    img = cv2.imread(str(img_path))
                    if img is None:
                        continue

                    t0 = time.perf_counter()
                    res = detector.process(img)
                    t1 = time.perf_counter()

                    total_time_sec += (t1 - t0)
                    processed_count += 1
                    if res.distraction == 1:
                        distraction_detected_count += 1
            except Exception:
                pass
            finally:
                if detector is not None:
                    try:
                        detector.release()
                    except Exception:
                        pass

        avg_latency_ms = round((total_time_sec / processed_count) * 1000.0, 2) if processed_count > 0 else 0.0
        throughput_fps = round(processed_count / total_time_sec, 2) if total_time_sec > 0 else 0.0

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
                "sample_frames_evaluated": processed_count,
                "distraction_triggers_found": distraction_detected_count,
                "avg_inference_latency_ms": avg_latency_ms,
                "approx_throughput_fps": throughput_fps,
            },
        )

