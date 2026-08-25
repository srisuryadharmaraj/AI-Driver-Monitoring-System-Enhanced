"""
YOLO Obstacle & Object Detection Operational Evaluator.
Measures operational inference parameters (detections/frame, confidence distribution, latency).
Enforces Ground-Truth requirement for mAP metrics.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List

import cv2
from vision.obstacle import ObstacleDetector
from evaluation.dataset_loader import DatasetLoader


@dataclass
class ObstacleEvalResult:
    status: str
    requires_ground_truth: bool
    message: str
    required_annotations: List[str]
    operational_stats: Dict[str, Any]


class ObstacleEvaluator:
    def __init__(self, model_path: str | Path = "models/yolov8n.pt") -> None:
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            alt = Path(__file__).resolve().parent.parent / "models" / "yolov8n.pt"
            if alt.exists():
                self.model_path = alt

    def evaluate(self, dataset_dir: str | Path = "../videos/Data sets/images") -> ObstacleEvalResult:
        loader = DatasetLoader(dataset_dir)
        report = loader.load_and_validate()

        detector = ObstacleDetector(model_path=self.model_path)

        total_detections = 0
        total_time_sec = 0.0
        confidences: List[float] = []
        class_counts: Dict[str, int] = {}
        processed_frames = 0

        for frame_item in report.frames[:50]:  # Operational sample benchmark across dataset
            if not frame_item.is_valid:
                continue

            frame = cv2.imread(str(frame_item.filepath))
            if frame is None:
                continue

            t0 = time.perf_counter()
            res = detector.process(frame, ego_speed=60.0)
            t1 = time.perf_counter()

            total_time_sec += (t1 - t0)
            processed_frames += 1
            total_detections += res.obstacle_count

            for obs in res.obstacles:
                lbl = obs["label"]
                conf = obs["conf"]
                class_counts[lbl] = class_counts.get(lbl, 0) + 1
                confidences.append(conf)

        avg_latency_ms = round((total_time_sec / processed_frames) * 1000.0, 2) if processed_frames > 0 else 0.0
        approx_fps = round(processed_frames / total_time_sec, 2) if total_time_sec > 0 else 0.0
        avg_conf = round(sum(confidences) / len(confidences), 3) if confidences else 0.0

        return ObstacleEvalResult(
            status="EVALUATION PENDING - BOUNDING BOX GROUND TRUTH REQUIRED",
            requires_ground_truth=True,
            message=(
                "mAP@0.5 and mAP@0.5:0.95 metrics require manual bounding-box annotations (YOLO .txt / COCO .json format). "
                "The metrics reported below represent operational runtime statistics, NOT model detection accuracy."
            ),
            required_annotations=[
                "Manual bounding box coordinates (x_center, y_center, width, height normalized)",
                "Class labels for all target objects (vehicles, pedestrians, cyclists) in test frames",
            ],
            operational_stats={
                "model_name": "YOLOv8 Nano (yolov8n.pt)",
                "sample_frames_evaluated": processed_frames,
                "total_detections_found": total_detections,
                "avg_detections_per_frame": round(total_detections / processed_frames, 2) if processed_frames > 0 else 0.0,
                "avg_confidence_score": avg_conf,
                "detected_class_breakdown": class_counts,
                "avg_inference_latency_ms": avg_latency_ms,
                "approx_throughput_fps": approx_fps,
            },
        )
