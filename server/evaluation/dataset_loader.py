"""
Dataset Loader for AI Driver Monitoring Model Evaluation.
Categorizes dataset frames into explicit ground-truth states.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import cv2


@dataclass
class DatasetFrame:
    filename: str
    filepath: Path
    category: str
    ground_truth_fatigue: int  # 0 = Normal/Alert, 1 = Drowsy/Sleep
    is_valid: bool = True
    error_message: Optional[str] = None


@dataclass
class DatasetValidationReport:
    total_files: int
    valid_samples: int
    corrupt_samples: int
    category_counts: dict
    class_distribution: dict
    frames: List[DatasetFrame]


class DatasetLoader:
    def __init__(self, dataset_dir: str | Path = "../videos/Data sets/images") -> None:
        self.dataset_dir = Path(dataset_dir)
        if not self.dataset_dir.exists():
            # Try relative to server directory if absolute/relative resolution differs
            alt_path = Path(__file__).resolve().parent.parent.parent / "videos" / "Data sets" / "images"
            if alt_path.exists():
                self.dataset_dir = alt_path

    def load_and_validate(self) -> DatasetValidationReport:
        if not self.dataset_dir.exists():
            raise FileNotFoundError(f"Dataset directory not found: {self.dataset_dir}")

        import re

        def natural_sort_key(s: str):
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

        files = sorted(
            [f for f in os.listdir(self.dataset_dir) if f.lower().endswith((".jpg", ".png", ".jpeg"))],
            key=natural_sort_key,
        )
        frames: List[DatasetFrame] = []
        category_counts: dict = {}
        class_distribution: dict = {0: 0, 1: 0}
        corrupt_count = 0

        for f in files:
            filepath = self.dataset_dir / f
            img = cv2.imread(str(filepath))
            
            if img is None:
                corrupt_count += 1
                frames.append(
                    DatasetFrame(
                        filename=f,
                        filepath=filepath,
                        category="unknown",
                        ground_truth_fatigue=-1,
                        is_valid=False,
                        error_message="Image unreadable or corrupt",
                    )
                )
                continue

            # Ground-truth mapping based on dataset filename prefixes:
            # driver_no_sleep_* -> Alert (0)
            # driver_full_sleep* & driver_microsleep2* -> Drowsy/Sleep (1)
            prefix = f.rsplit("_f", 1)[0] if "_f" in f else f.rsplit(".", 1)[0]
            category_counts[prefix] = category_counts.get(prefix, 0) + 1

            if prefix == "driver_no_sleep":
                gt_fatigue = 0
            else:
                gt_fatigue = 1

            class_distribution[gt_fatigue] = class_distribution.get(gt_fatigue, 0) + 1

            frames.append(
                DatasetFrame(
                    filename=f,
                    filepath=filepath,
                    category=prefix,
                    ground_truth_fatigue=gt_fatigue,
                    is_valid=True,
                )
            )

        return DatasetValidationReport(
            total_files=len(files),
            valid_samples=len(files) - corrupt_count,
            corrupt_samples=corrupt_count,
            category_counts=category_counts,
            class_distribution=class_distribution,
            frames=frames,
        )
