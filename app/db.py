import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).resolve().parent.parent / "yar_ai.sqlite3"

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = connect()
    conn.executescript('''
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        memory TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    ''')
    conn.commit()
    conn.close()

def add_message(session_id, role, content):
    conn = connect()
    conn.execute(
        "INSERT INTO conversations(session_id, role, content, created_at) VALUES(?,?,?,?)",
        (session_id, role, content, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

def get_messages(session_id, limit=30):
    conn = connect()
    rows = conn.execute(
        "SELECT role, content FROM conversations WHERE session_id=? ORDER BY id DESC LIMIT ?",
        (session_id, limit)
    ).fetchall()
    conn.close()
    return list(reversed([dict(r) for r in rows]))

def add_memory(session_id, memory):
    conn = connect()
    conn.execute(
        "INSERT INTO memories(session_id, memory, created_at) VALUES(?,?,?)",
        (session_id, memory, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

def get_memories(session_id, limit=20):
    conn = connect()
    rows = conn.execute(
        "SELECT memory FROM memories WHERE session_id=? ORDER BY id DESC LIMIT ?",
        (session_id, limit)
    ).fetchall()
    conn.close()
    return [r["memory"] for r in rows]
