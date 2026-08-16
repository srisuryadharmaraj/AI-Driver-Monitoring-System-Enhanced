"""
FastAPI Router · Driver Management & Driver Intelligence Cards
───────────────────────────────────────────────────────────────
Endpoints for CRUD operations on drivers and driver intelligence scores.
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.db import query_db, execute_db
from services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

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
def get_driver(driver_id: str):
    """Get single driver intelligence card profile."""
    driver = query_db("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,), one=True)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    twin = DigitalTwinService.get_or_create_twin(driver_id)
    journeys = query_db("SELECT * FROM journeys WHERE driver_id = ? ORDER BY date DESC", (driver_id,))
    
    res = dict(driver)
    res["digital_twin"] = twin
    res["journeys"] = journeys
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
