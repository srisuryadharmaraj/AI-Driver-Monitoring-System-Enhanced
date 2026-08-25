"""
Lane Detection Operational Evaluator.
Measures operational engineering metrics (Availability Rate, Dropout Rate, Offset Stability & Latency).
Does NOT claim model accuracy without pixel-level ground truth.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List

import cv2
import numpy as np
from vision.lane import LaneDetector
from evaluation.dataset_loader import DatasetLoader


@dataclass
class LaneEvalResult:
    status: str
    section_label: str
    message: str
    operational_stats: Dict[str, Any]


class LaneEvaluator:
    def __init__(self) -> None:
        pass

    def evaluate(self, dataset_dir: str | Path = "../videos/Data sets/images") -> LaneEvalResult:
        loader = DatasetLoader(dataset_dir)
        report = loader.load_and_validate()

        detector = LaneDetector()

        detected_count = 0
        offsets: List[float] = []
        total_time_sec = 0.0
        processed_count = 0

        for frame_item in report.frames:
            if not frame_item.is_valid:
                continue

            frame = cv2.imread(str(frame_item.filepath))
            if frame is None:
                continue

            t0 = time.perf_counter()
            res = detector.process(frame)
            t1 = time.perf_counter()

            total_time_sec += (t1 - t0)
            processed_count += 1

            if res.lanes_detected:
                detected_count += 1
                offsets.append(res.lane_center_offset)

        availability_rate = round((detected_count / processed_count) * 100.0, 2) if processed_count > 0 else 0.0
        dropout_rate = round(100.0 - availability_rate, 2)
        
        avg_offset = round(float(np.mean(np.abs(offsets))), 2) if offsets else 0.0
        offset_var = round(float(np.var(offsets)), 2) if offsets else 0.0
        avg_latency_ms = round((total_time_sec / processed_count) * 1000.0, 2) if processed_count > 0 else 0.0
        approx_fps = round(processed_count / total_time_sec, 2) if total_time_sec > 0 else 0.0

        return LaneEvalResult(
            status="EVALUATED - OPERATIONAL METRICS ONLY",
            section_label="Lane Detection Operational Evaluation",
            message=(
                "Lane detection is evaluated using operational computer-vision tracking metrics. "
                "Accuracy requires manual pixel-level polyline/segmentation ground-truth masks."
            ),
            operational_stats={
                "algorithm": "Canny Edge Detection + Probabilistic Hough Transform",
                "total_frames_evaluated": processed_count,
                "lane_detection_availability_rate_pct": availability_rate,
                "lane_tracking_dropout_rate_pct": dropout_rate,
                "mean_absolute_center_offset_px": avg_offset,
                "center_offset_variance": offset_var,
                "avg_processing_latency_ms": avg_latency_ms,
                "approx_throughput_fps": approx_fps,
            },
        )
