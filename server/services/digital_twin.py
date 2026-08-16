"""
Driver Digital Twin Manager
───────────────────────────
Service that updates and returns a driver's evolving Digital Twin profile.
"""

import json
from typing import Dict, Any, List
from database.db import query_db, execute_db
from services.safety_score import SafetyScoreEngine

class DigitalTwinService:

    @staticmethod
    def get_or_create_twin(driver_id: str) -> Dict[str, Any]:
        """Fetch existing twin or aggregate from journeys."""
        twin = query_db("SELECT * FROM driver_digital_twins WHERE driver_id = ?", (driver_id,), one=True)
        journeys = query_db("SELECT * FROM journeys WHERE driver_id = ? ORDER BY date DESC", (driver_id,))

        aggregated = SafetyScoreEngine.aggregate_driver_digital_twin(journeys)

        # Parse JSON fields if existing twin
        recurring = aggregated["recurring_patterns"]
        strengths = aggregated["strengths"]
        improvements = aggregated["improvement_areas"]

        # Update DB record
        execute_db("""
            INSERT INTO driver_digital_twins (
                driver_id, historical_safety_score, attention_score, fatigue_score,
                lane_score, consistency_score, risk_control_score, overall_skill_score,
                skill_level, total_journeys, safe_journeys, total_risk_events,
                recurring_patterns, strengths, improvement_areas, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(driver_id) DO UPDATE SET
                historical_safety_score=excluded.historical_safety_score,
                attention_score=excluded.attention_score,
                fatigue_score=excluded.fatigue_score,
                lane_score=excluded.lane_score,
                consistency_score=excluded.consistency_score,
                risk_control_score=excluded.risk_control_score,
                overall_skill_score=excluded.overall_skill_score,
                skill_level=excluded.skill_level,
                total_journeys=excluded.total_journeys,
                safe_journeys=excluded.safe_journeys,
                total_risk_events=excluded.total_risk_events,
                recurring_patterns=excluded.recurring_patterns,
                strengths=excluded.strengths,
                improvement_areas=excluded.improvement_areas,
                last_updated=datetime('now')
        """, (
            driver_id,
            aggregated["historical_safety_score"],
            aggregated["attention_score"],
            aggregated["fatigue_score"],
            aggregated["lane_score"],
            aggregated["consistency_score"],
            aggregated["risk_control_score"],
            aggregated["overall_skill_score"],
            aggregated["skill_level"],
            aggregated["total_journeys"],
            aggregated["safe_journeys"],
            aggregated["total_risk_events"],
            json.dumps(recurring),
            json.dumps(strengths),
            json.dumps(improvements)
        ))

        return aggregated
