"""
FastAPI Router · Performance Analytics, Driving Coach & Leaderboard
────────────────────────────────────────────────────────────────────
Endpoints for platform command center KPI cards, fleet analytics, leaderboard ranking, and AI coach recommendations.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from database.db import query_db
from services.digital_twin import DigitalTwinService
from services.driving_coach import DrivingCoach

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Coach"])

@router.get("/command-center")
def get_command_center_summary():
    """Summary metrics and KPI statistics for Command Center overview page."""
    driver_count = query_db("SELECT COUNT(*) as count FROM drivers", one=True)["count"]
    active_count = query_db("SELECT COUNT(*) as count FROM drivers WHERE current_status = 'Active'", one=True)["count"]
    journey_count = query_db("SELECT COUNT(*) as count FROM journeys", one=True)["count"]
    
    avg_score_row = query_db("SELECT AVG(journey_safety_score) as avg_score FROM journeys", one=True)
    avg_safety_score = round(avg_score_row["avg_score"], 1) if avg_score_row and avg_score_row["avg_score"] else 88.0
    
    events_row = query_db("""
        SELECT SUM(fatigue_events + distraction_events + obstacle_warnings + overspeed_events) as total_events
        FROM journeys
    """, one=True)
    total_events = events_row["total_events"] if events_row and events_row["total_events"] else 0

    top_driver = query_db("""
        SELECT d.full_name, dt.historical_safety_score, dt.overall_skill_score
        FROM drivers d
        JOIN driver_digital_twins dt ON d.driver_id = dt.driver_id
        ORDER BY dt.historical_safety_score DESC
        LIMIT 1
    """, one=True)

    recent_journeys = query_db("""
        SELECT j.*, d.full_name as driver_name
        FROM journeys j
        JOIN drivers d ON j.driver_id = d.driver_id
        ORDER BY j.date DESC
        LIMIT 5
    """)

    return {
        "total_drivers": driver_count,
        "active_drivers": active_count,
        "journeys_analysed": journey_count,
        "average_safety_score": avg_safety_score,
        "total_risk_events": total_events,
        "top_performing_driver": top_driver["full_name"] if top_driver else "N/A",
        "recent_journeys": recent_journeys
    }

@router.get("/coach/{driver_id}")
def get_coach_recommendations(driver_id: str):
    """Generate personalized rule-based AI Coach recommendations for a driver."""
    driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    twin = DigitalTwinService.get_or_create_twin(driver_id)
    insights = DrivingCoach.generate_recommendations(driver, twin)
    
    return {
        "driver_id": driver_id,
        "driver_name": driver["full_name"],
        "overall_score": twin["historical_safety_score"],
        "skill_level": twin["skill_level"],
        "strengths": twin["strengths"],
        "improvement_areas": twin["improvement_areas"],
        "insights": insights
    }

@router.get("/leaderboard")
def get_leaderboard(category: str = Query("safety", enum=["safety", "attention", "lane", "consistency"])):
    """Professional Fleet Leaderboard sorted by score category."""
    sort_column = {
        "safety": "dt.historical_safety_score",
        "attention": "dt.attention_score",
        "lane": "dt.lane_score",
        "consistency": "dt.consistency_score"
    }.get(category, "dt.historical_safety_score")

    leaderboard = query_db(f"""
        SELECT d.driver_id, d.full_name, d.profile_photo, d.years_of_experience,
               dt.historical_safety_score, dt.attention_score, dt.fatigue_score,
               dt.lane_score, dt.consistency_score, dt.overall_skill_score, dt.skill_level,
               dt.total_journeys
        FROM drivers d
        JOIN driver_digital_twins dt ON d.driver_id = dt.driver_id
        ORDER BY {sort_column} DESC
    """)
    return leaderboard
