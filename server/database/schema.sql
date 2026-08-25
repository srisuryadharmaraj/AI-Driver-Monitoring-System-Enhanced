-- SQLite Schema for AI Driver Intelligence Platform

CREATE TABLE IF NOT EXISTS drivers (
    driver_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    profile_photo TEXT,
    age INTEGER,
    phone TEXT,
    email TEXT,
    licence_number TEXT UNIQUE NOT NULL,
    licence_type TEXT DEFAULT 'Commercial',
    licence_expiry TEXT,
    years_of_experience INTEGER DEFAULT 1,
    joining_date TEXT,
    current_status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS journeys (
    journey_id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration_min INTEGER DEFAULT 0,
    monitoring_mode TEXT DEFAULT 'Video', -- 'Live' or 'Video'
    fatigue_events INTEGER DEFAULT 0,
    distraction_events INTEGER DEFAULT 0,
    lane_events INTEGER DEFAULT 0,
    obstacle_warnings INTEGER DEFAULT 0,
    overspeed_events INTEGER DEFAULT 0,
    safety_warnings INTEGER DEFAULT 0,
    average_risk REAL DEFAULT 0.0,
    maximum_risk REAL DEFAULT 0.0,
    journey_safety_score REAL DEFAULT 100.0,
    FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS safety_events (
    event_id TEXT PRIMARY KEY,
    journey_id TEXT,
    timestamp_sec REAL,
    event_type TEXT, -- 'Fatigue', 'Distraction', 'Lane Deviation', 'Obstacle Hazard', 'Overspeed'
    severity TEXT,   -- 'Low', 'Medium', 'High', 'Critical'
    description TEXT,
    risk_score REAL,
    resolution_status TEXT DEFAULT 'Open',
    supervisor_notes TEXT DEFAULT '',
    reviewed_at TEXT,
    FOREIGN KEY(journey_id) REFERENCES journeys(journey_id)
);

CREATE TABLE IF NOT EXISTS driver_digital_twins (
    driver_id TEXT PRIMARY KEY,
    historical_safety_score REAL DEFAULT 85.0,
    attention_score REAL DEFAULT 85.0,
    fatigue_score REAL DEFAULT 85.0,
    lane_score REAL DEFAULT 85.0,
    consistency_score REAL DEFAULT 85.0,
    risk_control_score REAL DEFAULT 85.0,
    overall_skill_score REAL DEFAULT 85.0,
    skill_level TEXT DEFAULT 'Competent',
    total_journeys INTEGER DEFAULT 0,
    safe_journeys INTEGER DEFAULT 0,
    total_risk_events INTEGER DEFAULT 0,
    recurring_patterns TEXT DEFAULT '[]',
    strengths TEXT DEFAULT '[]',
    improvement_areas TEXT DEFAULT '[]',
    last_updated TEXT,
    FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
);
