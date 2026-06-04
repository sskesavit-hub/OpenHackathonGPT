"""
Database connection management using aiosqlite.
"""
from __future__ import annotations

import aiosqlite
from contextlib import asynccontextmanager
from pathlib import Path

from configs.settings import settings

_DB_PATH: Path = settings.db_path


@asynccontextmanager
async def get_db():
    """Async context manager that yields a configured aiosqlite connection."""
    async with aiosqlite.connect(str(_DB_PATH)) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        yield conn


async def init_db() -> None:
    """Create all tables if they don't exist."""
    from database.models import CREATE_TABLES_SQL
    async with aiosqlite.connect(str(_DB_PATH)) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        for sql in CREATE_TABLES_SQL:
            await db.execute(sql)
        await db.commit()
