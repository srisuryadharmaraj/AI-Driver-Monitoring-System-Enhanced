"""
FastAPI Router · Driver Management & Driver Intelligence Cards
───────────────────────────────────────────────────────────────
Endpoints for CRUD operations on drivers and driver intelligence scores.
"""

import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, File, UploadFile
from pydantic import BaseModel

from database.db import query_db, execute_db
from services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

UPLOAD_PHOTO_DIR = Path(__file__).resolve().parent.parent / "uploads" / "driver_photos"
UPLOAD_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

class DriverCreate(BaseModel):
    full_name: str
    age: int
    phone: str
    email: str
    licence_number: str
    licence_type: Optional[str] = "Commercial"
    licence_expiry: Optional[str] = "2030-01-01"
    years_of_experience: Optional[int] = 1
    profile_photo: Optional[str] = ""
    current_status: Optional[str] = "Active"

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    licence_type: Optional[str] = None
    licence_expiry: Optional[str] = None
    years_of_experience: Optional[int] = None
    current_status: Optional[str] = None
    profile_photo: Optional[str] = None

@router.get("")
def list_drivers():
    """Get all drivers with their current skill level and aggregated safety scores."""
    drivers = query_db("SELECT * FROM drivers ORDER BY full_name ASC")
    res = []
    for d in drivers:
        twin = DigitalTwinService.get_or_create_twin(d["driver_id"])
        item = dict(d)
        item["digital_twin"] = twin
        res.append(item)
    return res

@router.get("/{driver_id}")
def get_driver(driver_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get single driver intelligence profile with optional date range telemetry filtering."""
    driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    twin = DigitalTwinService.get_or_create_twin(driver_id)
    
    # Query journeys with optional date filtering
    query_str = "SELECT * FROM journeys WHERE driver_id = ?"
    params = [driver_id]
    if start_date:
        query_str += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query_str += " AND date <= ?"
        params.append(end_date)
    query_str += " ORDER BY date DESC, start_time DESC"
    
    journeys = query_db(query_str, tuple(params))
    
    # Aggregated metrics for selected date range
    total_j = len(journeys)
    fatigue_count = sum(j.get("fatigue_events", 0) for j in journeys)
    distraction_count = sum(j.get("distraction_events", 0) for j in journeys)
    overspeed_count = sum(j.get("overspeed_events", 0) for j in journeys)
    safe_j_count = sum(1 for j in journeys if j.get("journey_safety_score", 100) >= 85)
    
    avg_score = round(sum(j.get("journey_safety_score", 100) for j in journeys) / total_j, 1) if total_j > 0 else twin.get("historical_safety_score", 88.0)
    safe_pct = round((safe_j_count / total_j) * 100, 1) if total_j > 0 else 100.0
    
    # Calculate Risk Level and Performance Rating
    if avg_score >= 90:
        risk_level = "Low Risk"
        performance = "Outstanding"
    elif avg_score >= 80:
        risk_level = "Moderate Risk"
        performance = "Good Standard"
    elif avg_score >= 70:
        risk_level = "Elevated Risk"
        performance = "Needs Attention"
    else:
        risk_level = "High Risk"
        performance = "Critical Action Required"

    res = dict(driver)
    res["digital_twin"] = twin
    res["journeys"] = journeys
    res["telemetry_summary"] = {
        "total_journeys": total_j,
        "fatigue_events": fatigue_count,
        "distraction_events": distraction_count,
        "overspeed_events": overspeed_count,
        "safe_driving_pct": safe_pct,
        "avg_safety_score": avg_score,
        "risk_level": risk_level,
        "overall_performance": performance,
        "date_range": {
            "start_date": start_date,
            "end_date": end_date
        }
    }
    return res

@router.post("")
def create_driver(driver: DriverCreate):
    """Add a new driver profile."""
    driver_id = f"DRV-{uuid.uuid4().hex[:6].upper()}"
    photo = driver.profile_photo or f"https://api.dicebear.com/7.x/bottts/svg?seed={driver_id}"
    
    success = execute_db("""
        INSERT INTO drivers (
            driver_id, full_name, profile_photo, age, phone, email,
            licence_number, licence_type, licence_expiry, years_of_experience,
            joining_date, current_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?)
    """, (
        driver_id, driver.full_name, photo, driver.age, driver.phone, driver.email,
        driver.licence_number, driver.licence_type, driver.licence_expiry, driver.years_of_experience,
        driver.current_status
    ))
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create driver (licence number may be duplicate)")
    
    DigitalTwinService.get_or_create_twin(driver_id)
    return {"driver_id": driver_id, "message": "Driver created successfully"}

@router.put("/{driver_id}")
def update_driver(driver_id: str, data: DriverUpdate):
    """Update driver details."""
    existing = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    fields = []
    vals = []
    for k, v in data.dict(exclude_unset=True).items():
        if v is not None:
            fields.append(f"{k} = ?")
            vals.append(v)
            
    if not fields:
        return {"message": "No changes made"}
    
    vals.append(driver_id)
    query = f"UPDATE drivers SET {', '.join(fields)} WHERE driver_id = ?"
    execute_db(query, tuple(vals))
    return {"message": "Driver updated successfully"}

@router.post("/{driver_id}/photo")
async def upload_driver_photo(driver_id: str, file: UploadFile = File(...)):
    """Upload a local profile photo for a driver."""
    existing = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Driver not found")

    ext = Path(file.filename or "photo.jpg").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".svg"]:
        ext = ".jpg"
        
    filename = f"{driver_id}_{uuid.uuid4().hex[:6]}{ext}"
    dest_path = UPLOAD_PHOTO_DIR / filename
    content = await file.read()
    dest_path.write_bytes(content)
    
    photo_url = f"/uploads/driver_photos/{filename}"
    execute_db("UPDATE drivers SET profile_photo = ? WHERE driver_id = ?", (photo_url, driver_id))
    
    return {
        "driver_id": driver_id,
        "profile_photo": photo_url,
        "message": "Driver photo updated successfully"
    }

