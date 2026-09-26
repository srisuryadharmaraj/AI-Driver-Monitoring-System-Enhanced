"""
Database Manager for Driver Safety & Skill Intelligence Platform
──────────────────────────────────────────────────────────────────
Lightweight SQLite manager that runs migrations and returns dictionary rows.
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path(__file__).resolve().parent / "driver_intelligence.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables if they do not exist and runs backward-compatible migrations."""
    conn = get_connection()
    try:
        if SCHEMA_PATH.exists():
            schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
            conn.executescript(schema_sql)
            conn.commit()

        # Backward-compatible migration check for drivers table columns
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(drivers)")
        driver_cols = {row[1] for row in cur.fetchall()}
        if "availability" not in driver_cols:
            cur.execute("ALTER TABLE drivers ADD COLUMN availability TEXT DEFAULT 'Available'")
            cur.execute("UPDATE drivers SET availability = 'Available' WHERE availability IS NULL OR availability = ''")
        conn.commit()

        # Backward-compatible migration check for safety_events table columns
        cur.execute("PRAGMA table_info(safety_events)")
        rows = cur.fetchall()
        cols = {row[1] for row in rows}
        if "resolution_status" not in cols:
            cur.execute("ALTER TABLE safety_events ADD COLUMN resolution_status TEXT DEFAULT 'Open'")
        if "supervisor_notes" not in cols:
            cur.execute("ALTER TABLE safety_events ADD COLUMN supervisor_notes TEXT DEFAULT ''")
        if "reviewed_at" not in cols:
            cur.execute("ALTER TABLE safety_events ADD COLUMN reviewed_at TEXT DEFAULT ''")
        conn.commit()

        # Ensure journey_id is NULL-safe (notnull == 0)
        for r in rows:
            if r[1] == "journey_id" and r[3] == 1:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS safety_events_new (
                        event_id TEXT PRIMARY KEY,
                        journey_id TEXT,
                        timestamp_sec REAL,
                        event_type TEXT,
                        severity TEXT,
                        description TEXT,
                        risk_score REAL,
                        resolution_status TEXT DEFAULT 'Open',
                        supervisor_notes TEXT DEFAULT '',
                        reviewed_at TEXT,
                        FOREIGN KEY(journey_id) REFERENCES journeys(journey_id)
                    );
                """)
                cur.execute("INSERT INTO safety_events_new SELECT * FROM safety_events;")
                cur.execute("DROP TABLE safety_events;")
                cur.execute("ALTER TABLE safety_events_new RENAME TO safety_events;")
                conn.commit()
                break
    except Exception as e:
        print(f"[DB Init Error] {e}")
    finally:
        conn.close()

def query_db(query: str, args: tuple = (), one: bool = False) -> Any:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        rv = cur.fetchall()
        conn.commit()
        if one:
            return dict(rv[0]) if rv else None
        return [dict(r) for r in rv]
    except Exception as e:
        print(f"[DB Query Error] {query} -> {e}")
        return None if one else []
    finally:
        conn.close()

def execute_db(query: str, args: tuple = ()) -> bool:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB Execute Error] {query} -> {e}")
        return False
    finally:
        conn.close()
