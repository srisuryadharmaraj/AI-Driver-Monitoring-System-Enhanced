"""
FastAPI Router for Model & Research Evaluation.
Exposes real benchmark execution and persistent results.
"""

from __future__ import annotations

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from evaluation.benchmark_runner import BenchmarkRunner
from evaluation.dataset_loader import DatasetLoader

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])


def _get_results_file() -> Path:
    results_path = Path("results/evaluation_report.json")
    if not results_path.exists():
        alt = Path(__file__).resolve().parent.parent.parent / "results" / "evaluation_report.json"
        if alt.exists():
            return alt
    return results_path


@router.get("/results")
def get_evaluation_results():
    """Retrieve persistent evaluation report from results/evaluation_report.json."""
    filepath = _get_results_file()
    if not filepath.exists():
        # Run benchmark on-the-fly if not generated yet
        runner = BenchmarkRunner()
        return runner.run_all()
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read evaluation report: {str(e)}")


@router.post("/run")
def run_evaluation_benchmark():
    """Trigger a complete evaluation benchmark run."""
    try:
        runner = BenchmarkRunner()
        report = runner.run_all()
        return {
            "status": "success",
            "message": "Evaluation benchmark completed successfully.",
            "report": report,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation benchmark failed: {str(e)}")


@router.get("/validate-dataset")
def validate_dataset():
    """Returns dataset integrity, filename breakdown, and sample validation."""
    try:
        loader = DatasetLoader()
        report = loader.load_and_validate()
        return {
            "total_files": report.total_files,
            "valid_samples": report.valid_samples,
            "corrupt_samples": report.corrupt_samples,
            "category_counts": report.category_counts,
            "class_distribution": {
                "Alert (Class 0)": report.class_distribution.get(0, 0),
                "Drowsy (Class 1)": report.class_distribution.get(1, 0),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset validation failed: {str(e)}")
