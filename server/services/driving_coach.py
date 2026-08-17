"""
AI Driving Coach Module
───────────────────────
Rule-based recommendation engine that analyzes driver historical performance
and produces actionable, transparent safety feedback and insights.
"""

from typing import Dict, Any, List

class DrivingCoach:

    @staticmethod
    def generate_recommendations(driver_data: Dict[str, Any], twin_data: Dict[str, Any], telemetry_summary: Dict[str, Any] = None) -> List[Dict[str, str]]:
        """Generates transparent, rule-based coaching insights based on actual stored telemetry performance."""
        insights = []
        summary = telemetry_summary or {}

        total_journeys = summary.get("total_journeys", twin_data.get("total_journeys", 0))
        overall_score = summary.get("avg_safety_score", twin_data.get("historical_safety_score", 85.0))
        attention = twin_data.get("attention_score", 85.0)
        fatigue = twin_data.get("fatigue_score", 85.0)
        lane = twin_data.get("lane_score", 85.0)
        risk_ctrl = twin_data.get("risk_control_score", 85.0)

        fatigue_events = summary.get("fatigue_events", 0)
        distraction_events = summary.get("distraction_events", 0)
        overspeed_events = summary.get("overspeed_events", 0)

        # Insufficient Data Check
        if total_journeys == 0:
            insights.append({
                "type": "info",
                "category": "Data Baseline",
                "title": "Insufficient Monitored Telemetry Data",
                "message": "Fewer than 1 monitored journey sessions recorded for this driver. Complete additional live or video monitoring sessions to build full AI coaching baseline."
            })

        # 1. Performance Trend Insight
        if overall_score >= 88:
            insights.append({
                "type": "positive",
                "category": "Overall Performance",
                "title": "Outstanding Safety Consistency",
                "message": f"Your safety score average ({overall_score}/100) ranks among the top fleet tier. Your defensive driving behavior is exemplary."
            })
        elif overall_score >= 75:
            insights.append({
                "type": "info",
                "category": "Overall Performance",
                "title": "Solid Driver Baseline",
                "message": f"Your safety score ({overall_score}/100) shows good control. Addressing targeted risk factors can elevate you to Expert status."
            })
        else:
            insights.append({
                "type": "warning",
                "category": "Overall Performance",
                "title": "Safety Attention Required",
                "message": f"Your current score ({overall_score}/100) indicates elevated risk. Focus on break management and maintaining road vigilance."
            })

        # 2. Fatigue Insight
        if fatigue_events > 2 or fatigue < 80:
            insights.append({
                "type": "warning",
                "category": "Fatigue Management",
                "title": "Schedule Regular Rest Breaks",
                "message": f"Detected {fatigue_events} drowsiness/fatigue triggers across monitored period. We recommend taking a 15-minute break every 2 hours of continuous driving."
            })
        else:
            insights.append({
                "type": "positive",
                "category": "Fatigue Management",
                "title": "Alert & Rested Driver Profile",
                "message": "Fatigue indicators remain minimal across your monitored journeys. Excellent energy management!"
            })

        # 3. Distraction / Attention Insight
        if distraction_events > 3 or attention < 80:
            insights.append({
                "type": "warning",
                "category": "Attention & Vigilance",
                "title": "Reduce In-Cabin Distractions",
                "message": f"Flagged {distraction_events} in-cabin distraction instances. Avoid phone usage and maintain forward gaze focus on the roadway."
            })
        else:
            insights.append({
                "type": "positive",
                "category": "Attention & Vigilance",
                "title": "High Road Focus",
                "message": "Your forward attention score is high. You consistently keep eyes on the road during key driving maneuvers."
            })

        # 4. Lane Discipline Insight
        if lane >= 85:
            insights.append({
                "type": "positive",
                "category": "Lane Discipline",
                "title": "Key Strength: Lane Centering",
                "message": "Lane discipline is currently one of your strongest skills. Smooth steering and steady lane positioning observed."
            })
        else:
            insights.append({
                "type": "info",
                "category": "Lane Discipline",
                "title": "Improve Highway Lane Centering",
                "message": "Minor lane boundary drifts were detected. Ensure steady steering adjustments, especially during curve navigation."
            })

        # 5. Speed & Risk Control
        if overspeed_events > 1 or risk_ctrl < 80:
            insights.append({
                "type": "warning",
                "category": "Speed & Risk Control",
                "title": "Maintain Safe Speed Limits",
                "message": f"Detected {overspeed_events} speed threshold exceedances. Observe speed signs and maintain safe buffer distances."
            })
        else:
            insights.append({
                "type": "positive",
                "category": "Speed & Risk Control",
                "title": "Controlled Hazard Management",
                "message": "Speed and obstacle hazard scores remain well within safe thresholds across monitored segments."
            })

        return insights

    @staticmethod
    def generate_action_plan(driver_data: Dict[str, Any], twin_data: Dict[str, Any], telemetry_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generates structured Coaching Action Plan targets and recommendations."""
        summary = telemetry_summary or {}
        fatigue_events = summary.get("fatigue_events", 0)
        distraction_events = summary.get("distraction_events", 0)
        overspeed_events = summary.get("overspeed_events", 0)
        overall_score = summary.get("avg_safety_score", twin_data.get("historical_safety_score", 85.0))

        goals = []
        actions = []
        modules = []

        if fatigue_events > 0:
            goals.append("Maintain 0 fatigue alerts over next 5 journeys")
            actions.append("Take mandatory rest pause after every 120 minutes of drive time")
            modules.append("Circadian Rhythm & Long-Haul Fatigue Prevention")
        else:
            goals.append("Sustain 100% Fatigue Control rating")
            actions.append("Pre-trip rest self-check prior to launching trip")

        if distraction_events > 0:
            goals.append("Eliminate in-cabin phone use during active vehicle motion")
            actions.append("Secure smartphone in dashboard mount before starting engine")
            modules.append("Defensive Driving & Distraction Elimination")
        else:
            goals.append("Maintain 90%+ Attention Focus Score")
            actions.append("Scan mirrors every 5-8 seconds")

        if overspeed_events > 0:
            goals.append("Zero overspeed alerts on commercial transit routes")
            actions.append("Set cruise speed control at or 5 km/h below posted limit")
            modules.append("Speed Regulation & Braking Distance Management")
        else:
            goals.append("Preserve Smooth Velocity Control Index")

        if not modules:
            modules.append("Advanced Defensive Driving Masterclass")

        status = "Target Action Plan Active" if overall_score < 90 else "Performance Maintenance Plan"

        return {
            "driver_id": driver_data.get("driver_id"),
            "driver_name": driver_data.get("full_name"),
            "plan_status": status,
            "target_score_goal": min(100, int(overall_score + 5)) if overall_score < 95 else 100,
            "target_goals": goals,
            "action_items": actions,
            "recommended_modules": modules
        }

