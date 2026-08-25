"""
Fatigue Detection Model Evaluator.
Executes legitimate evaluation of FatigueDetector on dataset frames.
Evaluates both Frame-Level Eye Closure (EAR < 0.25) and Sequential Fatigue Alarm (Consecutive Frames >= 15).
"""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List

import cv2
from vision.fatigue import FatigueDetector
from evaluation.dataset_loader import DatasetLoader, DatasetValidationReport


@dataclass
class MetricSet:
    tp: int
    tn: int
    fp: int
    fn: int
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    balanced_accuracy: float
    confusion_matrix: List[List[int]]


@dataclass
class FatigueEvalResult:
    status: str
    dataset_name: str
    total_samples: int
    class_distribution: Dict[str, int]
    category_counts: Dict[str, int]
    frame_level_eye_closure: MetricSet
    sequential_fatigue_alarm: MetricSet
    avg_inference_ms: float
    approx_fps: float
    ear_threshold_used: float
    consec_frames_thresh_used: int
    per_category_detection_rate: Dict[str, float]


class FatigueEvaluator:
    def __init__(self, predictor_path: str | Path = "models/shape_predictor_68_face_landmarks.dat") -> None:
        self.predictor_path = Path(predictor_path)
        if not self.predictor_path.exists():
            alt = Path(__file__).resolve().parent.parent / "models" / "shape_predictor_68_face_landmarks.dat"
            if alt.exists():
                self.predictor_path = alt

    def evaluate(self, dataset_dir: str | Path = "../videos/Data sets/images") -> FatigueEvalResult:
        loader = DatasetLoader(dataset_dir)
        report: DatasetValidationReport = loader.load_and_validate()

        detector = FatigueDetector(predictor_path=self.predictor_path)

        # 1. Instantaneous Eye Closure Metrics (EAR < 0.25)
        tp_inst, tn_inst, fp_inst, fn_inst = 0, 0, 0, 0
        # 2. Sequential Alarm Metrics (Consecutive >= 15)
        tp_seq, tn_seq, fp_seq, fn_seq = 0, 0, 0, 0

        total_time_sec = 0.0
        processed_count = 0

        cat_closed_detected: Dict[str, int] = {}
        cat_total: Dict[str, int] = {}

        current_category = None

        for frame_item in report.frames:
            if not frame_item.is_valid:
                continue

            # Reset state counter when switching to a new sequence group
            if frame_item.category != current_category:
                detector.reset()
                current_category = frame_item.category

            frame_bgr = cv2.imread(str(frame_item.filepath))
            if frame_bgr is None:
                continue

            t0 = time.perf_counter()
            result = detector.process(frame_bgr)
            t1 = time.perf_counter()

            total_time_sec += (t1 - t0)
            processed_count += 1

            y_true = frame_item.ground_truth_fatigue
            
            # Prediction 1: Per-frame Eye Closure (EAR < threshold)
            y_pred_inst = 1 if (result.ear > 0 and result.ear < detector.ear_threshold) else 0
            # Prediction 2: Sequential Fatigue Alarm Flag
            y_pred_seq = result.fatigue

            # Category tracking
            cat_total[frame_item.category] = cat_total.get(frame_item.category, 0) + 1
            if y_pred_inst == 1:
                cat_closed_detected[frame_item.category] = cat_closed_detected.get(frame_item.category, 0) + 1

            # Instantaneous metrics
            if y_true == 1 and y_pred_inst == 1: tp_inst += 1
            elif y_true == 0 and y_pred_inst == 0: tn_inst += 1
            elif y_true == 0 and y_pred_inst == 1: fp_inst += 1
            elif y_true == 1 and y_pred_inst == 0: fn_inst += 1

            # Sequential metrics
            if y_true == 1 and y_pred_seq == 1: tp_seq += 1
            elif y_true == 0 and y_pred_seq == 0: tn_seq += 1
            elif y_true == 0 and y_pred_seq == 1: fp_seq += 1
            elif y_true == 1 and y_pred_seq == 0: fn_seq += 1

        def _calc_metrics(tp: int, tn: int, fp: int, fn: int) -> MetricSet:
            total = tp + tn + fp + fn
            acc = round((tp + tn) / total, 4) if total > 0 else 0.0
            prec = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
            rec = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
            spec = round(tn / (tn + fp), 4) if (tn + fp) > 0 else 0.0
            f1 = round(2 * prec * rec / (prec + rec), 4) if (prec + rec) > 0 else 0.0
            bal_acc = round((rec + spec) / 2.0, 4)
            return MetricSet(
                tp=tp, tn=tn, fp=fp, fn=fn,
                accuracy=acc, precision=prec, recall=rec, specificity=spec,
                f1_score=f1, balanced_accuracy=bal_acc,
                confusion_matrix=[[tn, fp], [fn, tp]],
            )

        inst_metrics = _calc_metrics(tp_inst, tn_inst, fp_inst, fn_inst)
        seq_metrics = _calc_metrics(tp_seq, tn_seq, fp_seq, fn_seq)

        avg_inference_ms = round((total_time_sec / processed_count) * 1000.0, 2) if processed_count > 0 else 0.0
        approx_fps = round(processed_count / total_time_sec, 2) if total_time_sec > 0 else 0.0

        per_cat_det = {
            cat: round(cat_closed_detected.get(cat, 0) / count, 4)
            for cat, count in cat_total.items()
        }

        return FatigueEvalResult(
            status="EVALUATED",
            dataset_name="AI Driver Monitoring Test Frames Dataset (168 samples)",
            total_samples=processed_count,
            class_distribution={
                "Alert (Class 0)": report.class_distribution.get(0, 0),
                "Drowsy (Class 1)": report.class_distribution.get(1, 0),
            },
            category_counts=report.category_counts,
            frame_level_eye_closure=inst_metrics,
            sequential_fatigue_alarm=seq_metrics,
            avg_inference_ms=avg_inference_ms,
            approx_fps=approx_fps,
            ear_threshold_used=detector.ear_threshold,
            consec_frames_thresh_used=detector.consec_thresh,
            per_category_detection_rate=per_cat_det,
        )
