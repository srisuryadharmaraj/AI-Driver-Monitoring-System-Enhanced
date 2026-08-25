"""
FastAPI Router · Incident Response & Safety Risk Audit Engine
─────────────────────────────────────────────────────────────
Endpoints for searching, auditing, filtering, updating resolution status,
and exporting safety incident records.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.db import query_db, execute_db

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


class IncidentStatusUpdate(BaseModel):
    status: str  # 'Open', 'Under Review', 'Resolved'
    supervisor_notes: Optional[str] = ""


@router.get("")
def get_incidents(
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    driver_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Query safety incidents with multi-criteria filtering.
    Joins safety_events with journeys and drivers tables.
    """
    sql = """
        SELECT 
            se.event_id,
            se.journey_id,
            se.timestamp_sec,
            se.event_type,
            se.severity,
            se.description,
            se.risk_score,
            COALESCE(se.resolution_status, 'Open') as resolution_status,
            COALESCE(se.supervisor_notes, '') as supervisor_notes,
            se.reviewed_at,
            j.driver_id,
            j.date as journey_date,
            j.monitoring_mode,
            d.full_name as driver_name,
            d.licence_number
        FROM safety_events se
        LEFT JOIN journeys j ON se.journey_id = j.journey_id
        LEFT JOIN drivers d ON j.driver_id = d.driver_id
        WHERE 1=1
    """
    params = []

    if severity:
        sql += " AND se.severity = ?"
        params.append(severity)
    if event_type:
        sql += " AND se.event_type = ?"
        params.append(event_type)
    if driver_id:
        sql += " AND j.driver_id = ?"
        params.append(driver_id)
    if status:
        sql += " AND COALESCE(se.resolution_status, 'Open') = ?"
        params.append(status)
    if start_date:
        sql += " AND j.date >= ?"
        params.append(start_date)
    if end_date:
        sql += " AND j.date <= ?"
        params.append(end_date)

    sql += " ORDER BY j.date DESC, se.timestamp_sec DESC"

    records = query_db(sql, tuple(params))
    return records or []


@router.get("/summary")
def get_incidents_summary():
    """
    Returns KPI metrics for the Incident Response Dashboard.
    """
    total = query_db("SELECT COUNT(*) as cnt FROM safety_events", one=True)
    total_cnt = total["cnt"] if total else 0

    critical = query_db("SELECT COUNT(*) as cnt FROM safety_events WHERE severity = 'Critical'", one=True)
    critical_cnt = critical["cnt"] if critical else 0

    open_res = query_db("SELECT COUNT(*) as cnt FROM safety_events WHERE COALESCE(resolution_status, 'Open') = 'Open'", one=True)
    open_cnt = open_res["cnt"] if open_res else 0

    review_res = query_db("SELECT COUNT(*) as cnt FROM safety_events WHERE resolution_status = 'Under Review'", one=True)
    review_cnt = review_res["cnt"] if review_res else 0

    resolved_res = query_db("SELECT COUNT(*) as cnt FROM safety_events WHERE resolution_status = 'Resolved'", one=True)
    resolved_cnt = resolved_res["cnt"] if resolved_res else 0

    res_rate = round((resolved_cnt / total_cnt) * 100.0, 1) if total_cnt > 0 else 0.0

    return {
        "total_incidents": total_cnt,
        "critical_incidents": critical_cnt,
        "open_incidents": open_cnt,
        "under_review_incidents": review_cnt,
        "resolved_incidents": resolved_cnt,
        "resolution_rate_pct": res_rate,
    }


@router.patch("/{event_id}/status")
def update_incident_status(event_id: str, body: IncidentStatusUpdate):
    """
    Updates the resolution status and supervisor notes for a safety event.
    Workflow: Open -> Under Review -> Resolved
    """
    valid_statuses = {"Open", "Under Review", "Resolved"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    existing = query_db("SELECT * FROM safety_events WHERE event_id = ?", (event_id,), one=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Safety event not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    ok = execute_db(
        """
        UPDATE safety_events
        SET resolution_status = ?,
            supervisor_notes = ?,
            reviewed_at = ?
        WHERE event_id = ?
        """,
        (body.status, body.supervisor_notes or "", now_str, event_id),
    )

    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update incident status")

    updated = query_db("SELECT * FROM safety_events WHERE event_id = ?", (event_id,), one=True)
    return {
        "status": "success",
        "message": f"Incident status updated to '{body.status}'",
        "incident": updated,
    }
