"""
FastAPI Router · Journey Management & Analysis
──────────────────────────────────────────────
Endpoints for viewing previous journeys, filtering journey detail, and logging completed sessions.
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.db import query_db, execute_db
from services.safety_score import SafetyScoreEngine
from services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/api/journeys", tags=["Journeys"])

class JourneyRecordCreate(BaseModel):
    driver_id: str
    monitoring_mode: str = "Video"
    duration_min: int = 15
    fatigue_events: int = 0
    distraction_events: int = 0
    lane_events: int = 0
    obstacle_warnings: int = 0
    overspeed_events: int = 0
    safety_warnings: int = 0
    average_risk: float = 0.0
    maximum_risk: float = 0.0

@router.get("")
def list_journeys(driver_id: Optional[str] = None):
    """List journey history, optionally filtered by driver."""
    if driver_id:
        journeys = query_db("""
            SELECT j.*, d.full_name as driver_name, d.profile_photo
            FROM journeys j
            JOIN drivers d ON j.driver_id = d.driver_id
            WHERE j.driver_id = ?
            ORDER BY j.date DESC, j.start_time DESC
        """, (driver_id,))
    else:
        journeys = query_db("""
            SELECT j.*, d.full_name as driver_name, d.profile_photo
            FROM journeys j
            JOIN drivers d ON j.driver_id = d.driver_id
            ORDER BY j.date DESC, j.start_time DESC
        """)
    return journeys

@router.get("/{journey_id}")
def get_journey(journey_id: str):
    """Get single journey detail with score breakdown and event timeline."""
    journey = query_db("""
        SELECT j.*, d.full_name as driver_name, d.profile_photo, d.licence_number
        FROM journeys j
        JOIN drivers d ON j.driver_id = d.driver_id
        WHERE j.journey_id = ?
    """, (journey_id,), one=True)
    
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
        
    events = query_db("SELECT * FROM safety_events WHERE journey_id = ? ORDER BY timestamp_sec ASC", (journey_id,))
    
    # Calculate detailed score breakdown
    score_breakdown = SafetyScoreEngine.calculate_journey_score(
        fatigue_events=journey["fatigue_events"],
        distraction_events=journey["distraction_events"],
        lane_events=journey["lane_events"],
        obstacle_warnings=journey["obstacle_warnings"],
        overspeed_events=journey["overspeed_events"],
        average_risk=journey["average_risk"],
        maximum_risk=journey["maximum_risk"],
        duration_min=journey["duration_min"]
    )
    
    res = dict(journey)
    res["events"] = events
    res["score_breakdown"] = score_breakdown
    return res

@router.post("")
def record_journey(payload: JourneyRecordCreate):
    """Records a new completed journey session and updates the Driver Digital Twin."""
    journey_id = f"JRN-{uuid.uuid4().hex[:6].upper()}"
    
    # Check driver existence
    driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (payload.driver_id,), one=True)
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver ID '{payload.driver_id}' not found")

    score_calc = SafetyScoreEngine.calculate_journey_score(
        fatigue_events=payload.fatigue_events,
        distraction_events=payload.distraction_events,
        lane_events=payload.lane_events,
        obstacle_warnings=payload.obstacle_warnings,
        overspeed_events=payload.overspeed_events,
        average_risk=payload.average_risk,
        maximum_risk=payload.maximum_risk,
        duration_min=payload.duration_min
    )
    
    journey_score = score_calc["score"]
    
    execute_db("""
        INSERT INTO journeys (
            journey_id, driver_id, date, start_time, end_time, duration_min,
            monitoring_mode, fatigue_events, distraction_events, lane_events,
            obstacle_warnings, overspeed_events, safety_warnings, average_risk,
            maximum_risk, journey_safety_score
        ) VALUES (?, ?, date('now'), time('now'), time('now', '+15 minutes'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        journey_id, payload.driver_id, payload.duration_min, payload.monitoring_mode,
        payload.fatigue_events, payload.distraction_events, payload.lane_events,
        payload.obstacle_warnings, payload.overspeed_events, payload.safety_warnings,
        payload.average_risk, payload.maximum_risk, journey_score
    ))
    
    # Update driver digital twin
    DigitalTwinService.get_or_create_twin(payload.driver_id)
    
    return {
        "journey_id": journey_id,
        "driver_id": payload.driver_id,
        "journey_safety_score": journey_score,
        "message": "Journey recorded successfully"
    }
