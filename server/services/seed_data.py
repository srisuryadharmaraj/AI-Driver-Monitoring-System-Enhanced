"""
Seed Data Script
────────────────
Populates the database with realistic sample drivers and historic journeys
for demonstration purposes.
"""

from database.db import query_db, execute_db, init_db
from services.digital_twin import DigitalTwinService

DEMO_DRIVERS = [
    {
        "driver_id": "DRV-1001",
        "full_name": "Rajesh Kumar",
        "profile_photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
        "age": 34,
        "phone": "+91 98765 43210",
        "email": "rajesh.kumar@fleetai.in",
        "licence_number": "DL-1420110012345",
        "licence_type": "Heavy Commercial (HMV)",
        "licence_expiry": "2029-05-15",
        "years_of_experience": 9,
        "joining_date": "2022-01-10",
        "current_status": "Active",
        "availability": "Available"
    },
    {
        "driver_id": "DRV-1002",
        "full_name": "Ananya Sharma",
        "profile_photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
        "age": 29,
        "phone": "+91 98123 45678",
        "email": "ananya.sharma@fleetai.in",
        "licence_number": "DL-0420180098765",
        "licence_type": "Light Commercial (LMV)",
        "licence_expiry": "2031-08-20",
        "years_of_experience": 6,
        "joining_date": "2023-03-15",
        "current_status": "Active",
        "availability": "Busy"
    },
    {
        "driver_id": "DRV-1003",
        "full_name": "Vikram Singh",
        "profile_photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
        "age": 42,
        "phone": "+91 97654 32109",
        "email": "vikram.singh@fleetai.in",
        "licence_number": "DL-0720050043210",
        "licence_type": "Heavy Passenger (PSV)",
        "licence_expiry": "2027-11-30",
        "years_of_experience": 14,
        "joining_date": "2020-08-01",
        "current_status": "Active",
        "availability": "On Leave"
    },
    {
        "driver_id": "DRV-1004",
        "full_name": "Priya Verma",
        "profile_photo": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
        "age": 31,
        "phone": "+91 99887 76655",
        "email": "priya.verma@fleetai.in",
        "licence_number": "DL-1220160055443",
        "licence_type": "Commercial Express",
        "licence_expiry": "2030-02-14",
        "years_of_experience": 7,
        "joining_date": "2021-11-20",
        "current_status": "Active",
        "availability": "Available"
    }
]

DEMO_JOURNEYS = [
    {
        "journey_id": "JRN-8001",
        "driver_id": "DRV-1001",
        "date": "2026-08-15",
        "start_time": "08:30",
        "end_time": "09:45",
        "duration_min": 75,
        "monitoring_mode": "Video",
        "fatigue_events": 0,
        "distraction_events": 1,
        "lane_events": 0,
        "obstacle_warnings": 1,
        "overspeed_events": 0,
        "safety_warnings": 2,
        "average_risk": 0.12,
        "maximum_risk": 0.38,
        "journey_safety_score": 92.5
    },
    {
        "journey_id": "JRN-8002",
        "driver_id": "DRV-1001",
        "date": "2026-08-14",
        "start_time": "14:00",
        "end_time": "15:20",
        "duration_min": 80,
        "monitoring_mode": "Live",
        "fatigue_events": 1,
        "distraction_events": 2,
        "lane_events": 1,
        "obstacle_warnings": 0,
        "overspeed_events": 1,
        "safety_warnings": 4,
        "average_risk": 0.28,
        "maximum_risk": 0.65,
        "journey_safety_score": 81.0
    },
    {
        "journey_id": "JRN-8003",
        "driver_id": "DRV-1002",
        "date": "2026-08-16",
        "start_time": "10:15",
        "end_time": "11:30",
        "duration_min": 75,
        "monitoring_mode": "Video",
        "fatigue_events": 0,
        "distraction_events": 0,
        "lane_events": 0,
        "obstacle_warnings": 0,
        "overspeed_events": 0,
        "safety_warnings": 0,
        "average_risk": 0.08,
        "maximum_risk": 0.22,
        "journey_safety_score": 98.0
    },
    {
        "journey_id": "JRN-8004",
        "driver_id": "DRV-1003",
        "date": "2026-08-15",
        "start_time": "16:00",
        "end_time": "18:00",
        "duration_min": 120,
        "monitoring_mode": "Live",
        "fatigue_events": 3,
        "distraction_events": 2,
        "lane_events": 2,
        "obstacle_warnings": 2,
        "overspeed_events": 1,
        "safety_warnings": 8,
        "average_risk": 0.42,
        "maximum_risk": 0.78,
        "journey_safety_score": 68.5
    },
    {
        "journey_id": "JRN-8005",
        "driver_id": "DRV-1004",
        "date": "2026-08-16",
        "start_time": "09:00",
        "end_time": "10:10",
        "duration_min": 70,
        "monitoring_mode": "Video",
        "fatigue_events": 0,
        "distraction_events": 1,
        "lane_events": 1,
        "obstacle_warnings": 0,
        "overspeed_events": 0,
        "safety_warnings": 2,
        "average_risk": 0.15,
        "maximum_risk": 0.32,
        "journey_safety_score": 91.0
    }
]

def seed_database():
    """Seeds driver and journey data if empty."""
    init_db()
    existing_drivers = query_db("SELECT COUNT(*) as count FROM drivers", one=True)
    if existing_drivers and existing_drivers["count"] > 0:
        return

    for d in DEMO_DRIVERS:
        execute_db("""
            INSERT INTO drivers (
                driver_id, full_name, profile_photo, age, phone, email,
                licence_number, licence_type, licence_expiry, years_of_experience,
                joining_date, current_status, availability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            d["driver_id"], d["full_name"], d["profile_photo"], d["age"], d["phone"], d["email"],
            d["licence_number"], d["licence_type"], d["licence_expiry"], d["years_of_experience"],
            d["joining_date"], d["current_status"], d.get("availability", "Available")
        ))

    for j in DEMO_JOURNEYS:
        execute_db("""
            INSERT INTO journeys (
                journey_id, driver_id, date, start_time, end_time, duration_min,
                monitoring_mode, fatigue_events, distraction_events, lane_events,
                obstacle_warnings, overspeed_events, safety_warnings, average_risk,
                maximum_risk, journey_safety_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            j["journey_id"], j["driver_id"], j["date"], j["start_time"], j["end_time"], j["duration_min"],
            j["monitoring_mode"], j["fatigue_events"], j["distraction_events"], j["lane_events"],
            j["obstacle_warnings"], j["overspeed_events"], j["safety_warnings"], j["average_risk"],
            j["maximum_risk"], j["journey_safety_score"]
        ))

    # Initialize Digital Twins for seeded drivers
    for d in DEMO_DRIVERS:
        DigitalTwinService.get_or_create_twin(d["driver_id"])

    print("[Seed Data] Database populated with demo drivers and journeys.")
