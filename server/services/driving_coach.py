"""
AI Driving Coach Module
───────────────────────
Rule-based recommendation engine that analyzes driver historical performance
and produces actionable, transparent safety feedback and insights.
"""

from typing import Dict, Any, List

class DrivingCoach:

    @staticmethod
    def generate_recommendations(driver_data: Dict[str, Any], twin_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generates transparent, rule-based coaching insights based on driver performance."""
        insights = []

        overall_score = twin_data.get("historical_safety_score", 85.0)
        attention = twin_data.get("attention_score", 85.0)
        fatigue = twin_data.get("fatigue_score", 85.0)
        lane = twin_data.get("lane_score", 85.0)
        risk_ctrl = twin_data.get("risk_control_score", 85.0)
        consistency = twin_data.get("consistency_score", 85.0)

        # 1. Performance Trend Insight
        if overall_score >= 88:
            insights.append({
                "type": "positive",
                "category": "Overall Performance",
                "title": "Outstanding Safety Consistency",
                "message": f"Your overall safety score ({overall_score}/100) ranks among the top tier. Your defensive driving behavior is exemplary."
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
        if fatigue < 80:
            insights.append({
                "type": "warning",
                "category": "Fatigue Management",
                "title": "Schedule Regular Rest Breaks",
                "message": "Repeated eye closure and drowsiness indicators were detected. We recommend taking a 15-minute break every 2 hours of driving."
            })
        else:
            insights.append({
                "type": "positive",
                "category": "Fatigue Management",
                "title": "Alert & Rested Driver Profile",
                "message": "Fatigue indicators remain minimal across your monitored journeys. Excellent energy management!"
            })

        # 3. Distraction / Attention Insight
        if attention < 80:
            insights.append({
                "type": "warning",
                "category": "Attention & Vigilance",
                "title": "Reduce In-Cabin Distractions",
                "message": "Head pose angles and eye gaze offset indicated periodic distraction. Maintain forward gaze focus on the roadway."
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
        if risk_ctrl < 80:
            insights.append({
                "type": "warning",
                "category": "Speed & Risk Control",
                "title": "Maintain Safe Following Distance",
                "message": "Sudden deceleration or close proximity to forward obstacles was flagged. Increase buffer distance in dense traffic."
            })
        else:
            insights.append({
                "type": "positive",
                "category": "Speed & Risk Control",
                "title": "Controlled Hazard Management",
                "message": "Speed and obstacle hazard scores remain well within safe thresholds across monitored segments."
            })

        return insights
