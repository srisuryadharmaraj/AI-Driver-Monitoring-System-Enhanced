"""
FastAPI Router · Driver Comparison & Recruitment Suitability Analysis
────────────────────────────────────────────────────────────────────────
Decision-support endpoints for driver comparison and recruitment suitability evaluation.
Ensures zero bias by scoring candidates strictly on verified driving telemetry and skill metrics.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from database.db import query_db
from services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/api/recruitment", tags=["Recruitment & Comparison"])

@router.get("/compare")
def compare_drivers(ids: str = Query(..., description="Comma separated driver IDs e.g. DRV-1001,DRV-1002")):
    """Compare 2 to 4 drivers side-by-side on verified performance telemetry."""
    driver_ids = [i.strip() for i in ids.split(",") if i.strip()]
    if len(driver_ids) < 2 or len(driver_ids) > 4:
        raise HTTPException(status_code=400, detail="Please select between 2 and 4 drivers to compare")

    comparison_list = []
    for did in driver_ids:
        driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (did,), one=True)
        if driver:
            twin = DigitalTwinService.get_or_create_twin(did)
            item = dict(driver)
            item["digital_twin"] = twin
            comparison_list.append(item)

    return comparison_list

@router.get("/suitability/{driver_id}")
def evaluate_suitability(driver_id: str):
    """
    Evaluates candidate driver suitability for organizational placement.
    Provides decision-support telemetry (Decision-support only; final hiring decision remains with organization).
    """
    driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    twin = DigitalTwinService.get_or_create_twin(driver_id)
    score = twin["historical_safety_score"]
    experience = driver["years_of_experience"]
    total_journeys = twin["total_journeys"]

    if score >= 90 and experience >= 3:
        suitability = "Highly Recommended"
        recommendation_level = "Tier 1 — High Skill Executive Driver"
    elif score >= 80:
        suitability = "Recommended"
        recommendation_level = "Tier 2 — Standard Commercial Route Driver"
    elif score >= 70:
        suitability = "Conditional / Mentorship Required"
        recommendation_level = "Tier 3 — Trainee / Supervised Route"
    else:
        suitability = "Further Training Recommended"
        recommendation_level = "Tier 4 — Requires Safety Coaching Before Deployment"

    return {
        "driver_id": driver_id,
        "full_name": driver["full_name"],
        "licence_type": driver["licence_type"],
        "experience_years": experience,
        "total_journeys_analysed": total_journeys,
        "safety_score": score,
        "attention_score": twin["attention_score"],
        "fatigue_score": twin["fatigue_score"],
        "lane_discipline_score": twin["lane_score"],
        "consistency_score": twin["consistency_score"],
        "overall_skill_score": twin["overall_skill_score"],
        "skill_level": twin["skill_level"],
        "suitability_indicator": suitability,
        "recommendation_level": recommendation_level,
        "disclaimer": "This report provides AI decision-support insights derived strictly from verified driving telemetry. Final hiring decisions rest entirely with the organizational management."
    }
