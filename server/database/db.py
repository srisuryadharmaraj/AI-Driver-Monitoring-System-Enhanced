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
    """Initializes tables if they do not exist."""
    conn = get_connection()
    try:
        if SCHEMA_PATH.exists():
            schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
            conn.executescript(schema_sql)
            conn.commit()
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
