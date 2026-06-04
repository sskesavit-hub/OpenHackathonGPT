"""
Async CRUD operations for all database tables.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiosqlite

from database.db import get_db


# ─── Helpers ────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_dict(row: aiosqlite.Row) -> Dict[str, Any]:
    return dict(row)


# ─── Chat Sessions ──────────────────────────────────────────────────────────

async def create_session(model: str = "", title: str = "New Chat") -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    async with get_db() as db:
        await db.execute(
            "INSERT INTO chat_sessions (id, title, model, created_at, updated_at) VALUES (?,?,?,?,?)",
            (session_id, title, model, _now(), _now()),
        )
        await db.commit()
    return {"id": session_id, "title": title, "model": model}


async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
        ) as cur:
            row = await cur.fetchone()
            return _row_to_dict(row) if row else None


async def list_sessions(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ) as cur:
            rows = await cur.fetchall()
            return [_row_to_dict(r) for r in rows]


async def update_session_title(session_id: str, title: str) -> None:
    async with get_db() as db:
        await db.execute(
            "UPDATE chat_sessions SET title=?, updated_at=? WHERE id=?",
            (title, _now(), session_id),
        )
        await db.commit()


async def delete_session(session_id: str) -> bool:
    async with get_db() as db:
        cur = await db.execute(
            "DELETE FROM chat_sessions WHERE id=?", (session_id,)
        )
        await db.commit()
        return cur.rowcount > 0


# ─── Chat Messages ──────────────────────────────────────────────────────────

async def add_message(
    session_id: str,
    role: str,
    content: str,
    agent_meta: Optional[Dict] = None,
) -> Dict[str, Any]:
    meta_json = json.dumps(agent_meta) if agent_meta else None
    async with get_db() as db:
        cur = await db.execute(
            "INSERT INTO chat_messages (session_id, role, content, agent_meta, created_at) VALUES (?,?,?,?,?)",
            (session_id, role, content, meta_json, _now()),
        )
        await db.execute(
            "UPDATE chat_sessions SET updated_at=? WHERE id=?",
            (_now(), session_id),
        )
        await db.commit()
        return {"id": cur.lastrowid, "session_id": session_id, "role": role, "content": content}


async def get_messages(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM chat_messages WHERE session_id=? ORDER BY created_at ASC LIMIT ?",
            (session_id, limit),
        ) as cur:
            rows = await cur.fetchall()
            return [_row_to_dict(r) for r in rows]


# ─── App Settings ───────────────────────────────────────────────────────────

async def get_setting(key: str, default: Any = None) -> Any:
    async with get_db() as db:
        async with db.execute(
            "SELECT value FROM app_settings WHERE key=?", (key,)
        ) as cur:
            row = await cur.fetchone()
            if row is None:
                return default
            try:
                return json.loads(row["value"])
            except (json.JSONDecodeError, TypeError):
                return row["value"]


async def set_setting(key: str, value: Any) -> None:
    val_str = json.dumps(value) if not isinstance(value, str) else value
    async with get_db() as db:
        await db.execute(
            """INSERT INTO app_settings (key, value, updated_at) VALUES (?,?,?)
               ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at""",
            (key, val_str, _now()),
        )
        await db.commit()


async def get_all_settings() -> Dict[str, Any]:
    async with get_db() as db:
        async with db.execute("SELECT key, value FROM app_settings") as cur:
            rows = await cur.fetchall()
            result = {}
            for row in rows:
                try:
                    result[row["key"]] = json.loads(row["value"])
                except (json.JSONDecodeError, TypeError):
                    result[row["key"]] = row["value"]
            return result


# ─── Agent Logs ─────────────────────────────────────────────────────────────

async def log_agent_run(
    run_id: str,
    agent_name: str,
    session_id: Optional[str] = None,
    input_data: Optional[str] = None,
    output_data: Optional[str] = None,
    status: str = "pending",
    duration_ms: int = 0,
    error: Optional[str] = None,
) -> int:
    async with get_db() as db:
        cur = await db.execute(
            """INSERT INTO agent_logs
               (run_id, session_id, agent_name, input_data, output_data, status, duration_ms, error, created_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (run_id, session_id, agent_name, input_data, output_data, status, duration_ms, error, _now()),
        )
        await db.commit()
        return cur.lastrowid


async def get_agent_logs(run_id: str) -> List[Dict[str, Any]]:
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM agent_logs WHERE run_id=? ORDER BY created_at ASC",
            (run_id,),
        ) as cur:
            rows = await cur.fetchall()
            return [_row_to_dict(r) for r in rows]
