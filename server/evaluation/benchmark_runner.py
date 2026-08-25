"""
Benchmark Runner for AI Driver Monitoring System Evaluation.
Executes evaluation suites and persists results to results/evaluation_report.json.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from evaluation.dataset_loader import DatasetLoader
from evaluation.fatigue_eval import FatigueEvaluator
from evaluation.distraction_eval import DistractionEvaluator
from evaluation.obstacle_eval import ObstacleEvaluator
from evaluation.lane_eval import LaneEvaluator


class BenchmarkRunner:
    def __init__(self, results_path: str | Path = "../results/evaluation_report.json") -> None:
        self.results_path = Path(results_path)
        # Handle path resolution relative to workspace root
        if not self.results_path.parent.exists():
            root_results = Path(__file__).resolve().parent.parent.parent / "results"
            root_results.mkdir(parents=True, exist_ok=True)
            self.results_path = root_results / "evaluation_report.json"
        else:
            self.results_path.parent.mkdir(parents=True, exist_ok=True)

    def run_all(self, dataset_dir: str | Path = "../videos/Data sets/images") -> Dict[str, Any]:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Dataset Validation
        loader = DatasetLoader(dataset_dir)
        dataset_report = loader.load_and_validate()

        # 2. Fatigue Evaluation (REAL DATASET EVALUATION)
        fatigue_evaluator = FatigueEvaluator()
        fatigue_results = fatigue_evaluator.evaluate(dataset_dir)

        # 3. Distraction Evaluation (GT REQUIRED)
        distraction_evaluator = DistractionEvaluator()
        distraction_results = distraction_evaluator.evaluate()

        # 4. Obstacle Evaluation (YOLO OPERATIONAL STATS)
        obstacle_evaluator = ObstacleEvaluator()
        obstacle_results = obstacle_evaluator.evaluate(dataset_dir)

        # 5. Lane Detection Evaluation (OPERATIONAL EVALUATION)
        lane_evaluator = LaneEvaluator()
        lane_results = lane_evaluator.evaluate(dataset_dir)

        report = {
            "evaluation_metadata": {
                "evaluation_date": timestamp,
                "dataset_name": "AI Driver Monitoring Test Frames Dataset",
                "total_dataset_files": dataset_report.total_files,
                "valid_samples": dataset_report.valid_samples,
                "corrupt_samples": dataset_report.corrupt_samples,
                "category_counts": dataset_report.category_counts,
                "badge": "REAL DATASET EVALUATION",
                "synthetic_values_used": False,
            },
            "fatigue_evaluation": asdict(fatigue_results),
            "distraction_evaluation": asdict(distraction_results),
            "obstacle_evaluation": asdict(obstacle_results),
            "lane_evaluation": asdict(lane_results),
        }

        # Write to results/evaluation_report.json
        with open(self.results_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report


if __name__ == "__main__":
    runner = BenchmarkRunner()
    res = runner.run_all()
    print("Benchmark execution completed successfully!")
    print(f"Report saved to: {runner.results_path}")
    print("Fatigue Frame-Level Accuracy:", res["fatigue_evaluation"]["frame_level_eye_closure"]["accuracy"])
    print("Fatigue Frame-Level F1-Score:", res["fatigue_evaluation"]["frame_level_eye_closure"]["f1_score"])
    print("Fatigue Confusion Matrix:", res["fatigue_evaluation"]["frame_level_eye_closure"]["confusion_matrix"])
