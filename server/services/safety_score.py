"""
AI Driver Safety & Skill Scoring Engine
────────────────────────────────────────
Deterministic, explainable calculation of Driver Safety Score and sub-skills
based on monitored journey metrics and events.
"""

from typing import Dict, Any, List

class SafetyScoreEngine:

    @staticmethod
    def calculate_journey_score(
        fatigue_events: int,
        distraction_events: int,
        lane_events: int,
        obstacle_warnings: int,
        overspeed_events: int,
        average_risk: float,
        maximum_risk: float,
        duration_min: int = 15
    ) -> Dict[str, Any]:
        """
        Computes an explainable 0-100 journey safety score and breakdown.
        """
        # Baseline score: 100
        base_score = 100.0

        # Penalties per event type
        fatigue_penalty = min(35.0, fatigue_events * 12.0)
        distraction_penalty = min(30.0, distraction_events * 8.0)
        lane_penalty = min(20.0, lane_events * 5.0)
        obstacle_penalty = min(25.0, obstacle_warnings * 10.0)
        overspeed_penalty = min(20.0, overspeed_events * 7.0)

        # Risk modifier penalty
        risk_penalty = min(25.0, (average_risk * 30.0) + (maximum_risk * 15.0))

        total_penalty = (
            fatigue_penalty
            + distraction_penalty
            + lane_penalty
            + obstacle_penalty
            + overspeed_penalty
            + risk_penalty
        )

        final_score = max(10.0, round(base_score - total_penalty, 1))

        # Skill sub-scores (0-100)
        attention_score = max(0.0, round(100.0 - (distraction_events * 15.0 + (average_risk * 20.0)), 1))
        fatigue_score = max(0.0, round(100.0 - (fatigue_events * 25.0), 1))
        lane_score = max(0.0, round(100.0 - (lane_events * 12.0), 1))
        risk_control_score = max(0.0, round(100.0 - (obstacle_warnings * 15.0 + overspeed_events * 10.0 + maximum_risk * 25.0), 1))
        consistency_score = max(0.0, round(100.0 - (total_penalty * 0.5), 1))

        # Skill Level Designation
        if final_score >= 90:
            rating = "Excellent"
            level = "Expert"
        elif final_score >= 80:
            rating = "Good"
            level = "Advanced"
        elif final_score >= 70:
            rating = "Moderate"
            level = "Competent"
        elif final_score >= 60:
            rating = "Needs Improvement"
            level = "Developing"
        else:
            rating = "High Risk"
            level = "Beginner"

        # Factors breakdown for UI explainability
        factors = [
            {"name": "Attention Management", "score": min(25, round(attention_score * 0.25, 1)), "max": 25},
            {"name": "Lane Discipline", "score": min(25, round(lane_score * 0.25, 1)), "max": 25},
            {"name": "Fatigue Control", "score": min(25, round(fatigue_score * 0.25, 1)), "max": 25},
            {"name": "Risk & Speed Control", "score": min(25, round(risk_control_score * 0.25, 1)), "max": 25},
        ]

        return {
            "score": final_score,
            "rating": rating,
            "skill_level": level,
            "attention_score": attention_score,
            "fatigue_score": fatigue_score,
            "lane_score": lane_score,
            "risk_control_score": risk_control_score,
            "consistency_score": consistency_score,
            "factors": factors,
            "penalties": {
                "fatigue": round(fatigue_penalty, 1),
                "distraction": round(distraction_penalty, 1),
                "lane": round(lane_penalty, 1),
                "obstacle": round(obstacle_penalty, 1),
                "overspeed": round(overspeed_penalty, 1),
                "risk": round(risk_penalty, 1)
            }
        }

    @staticmethod
    def aggregate_driver_digital_twin(journeys: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregates multiple journeys to produce a Driver Digital Twin profile."""
        if not journeys:
            return {
                "historical_safety_score": 88.0,
                "attention_score": 90.0,
                "fatigue_score": 85.0,
                "lane_score": 88.0,
                "consistency_score": 87.0,
                "risk_control_score": 89.0,
                "overall_skill_score": 88.0,
                "skill_level": "Advanced",
                "total_journeys": 0,
                "safe_journeys": 0,
                "total_risk_events": 0,
                "recurring_patterns": ["Insufficient journey data logged yet."],
                "strengths": ["Baseline Profile Active"],
                "improvement_areas": ["Record monitored journeys to build twin data."],
            }

        total = len(journeys)
        scores = [j.get("journey_safety_score", 85.0) for j in journeys]
        avg_score = round(sum(scores) / total, 1)

        fatigue_ev = sum(j.get("fatigue_events", 0) for j in journeys)
        distraction_ev = sum(j.get("distraction_events", 0) for j in journeys)
        lane_ev = sum(j.get("lane_events", 0) for j in journeys)
        obstacle_ev = sum(j.get("obstacle_warnings", 0) for j in journeys)
        overspeed_ev = sum(j.get("overspeed_events", 0) for j in journeys)

        total_risk_events = fatigue_ev + distraction_ev + lane_ev + obstacle_ev + overspeed_ev
        safe_journeys = sum(1 for s in scores if s >= 80)

        # Skill metrics
        attention = max(30.0, round(100.0 - (distraction_ev / total) * 15.0, 1))
        fatigue = max(30.0, round(100.0 - (fatigue_ev / total) * 20.0, 1))
        lane = max(30.0, round(100.0 - (lane_ev / total) * 12.0, 1))
        risk_ctrl = max(30.0, round(100.0 - ((obstacle_ev + overspeed_ev) / total) * 15.0, 1))
        consistency = max(40.0, round(100.0 - (abs(max(scores) - min(scores)) * 1.2), 1))

        overall_skill = round((avg_score * 0.35 + attention * 0.2 + fatigue * 0.15 + lane * 0.15 + risk_ctrl * 0.15), 1)

        if overall_skill >= 90:
            level = "Expert"
        elif overall_skill >= 80:
            level = "Advanced"
        elif overall_skill >= 70:
            level = "Competent"
        elif overall_skill >= 60:
            level = "Developing"
        else:
            level = "Beginner"

        strengths = []
        if lane >= 85: strengths.append("Strong Lane Discipline & Road Positioning")
        if attention >= 85: strengths.append("High Driver Vigilance & Focus")
        if fatigue >= 85: strengths.append("Effective Fatigue Management")
        if risk_ctrl >= 85: strengths.append("Controlled Speed & Safe Following Distance")
        if not strengths: strengths.append("Maintains Baseline Safety Standards")

        improvements = []
        if fatigue_ev > 0: improvements.append("Fatigue/drowsiness indicators detected during longer drives")
        if distraction_ev > 0: improvements.append("Occasional head/eye distraction episodes recorded")
        if lane_ev > 0: improvements.append("Minor lane offset drift detected")
        if overspeed_ev > 0: improvements.append("Speed limit exceeds observed")
        if not improvements: improvements.append("Continue maintaining consistent safe driving habits")

        recurring = []
        if fatigue_ev >= 2: recurring.append("Higher fatigue tendency toward late journey hours")
        if distraction_ev >= 2: recurring.append("Distraction spikes during urban road conditions")
        if not recurring: recurring.append("No critical recurring danger patterns detected")

        return {
            "historical_safety_score": avg_score,
            "attention_score": attention,
            "fatigue_score": fatigue,
            "lane_score": lane,
            "consistency_score": consistency,
            "risk_control_score": risk_ctrl,
            "overall_skill_score": overall_skill,
            "skill_level": level,
            "total_journeys": total,
            "safe_journeys": safe_journeys,
            "total_risk_events": total_risk_events,
            "recurring_patterns": recurring,
            "strengths": strengths,
            "improvement_areas": improvements,
        }
