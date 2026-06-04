"""
Search result cache using SQLite.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from database.db import get_db
from configs.settings import settings

logger = logging.getLogger(__name__)


def _make_key(query: str, provider: str) -> str:
    raw = f"{provider}:{query.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()


async def get_cached(query: str, provider: str) -> Optional[Dict[str, List]]:
    """Return cached results if not expired, else None."""
    key = _make_key(query, provider)
    now = datetime.now(timezone.utc).isoformat()
    try:
        async with get_db() as db:
            async with db.execute(
                "SELECT results, expires_at FROM search_cache WHERE query_hash=?", (key,)
            ) as cur:
                row = await cur.fetchone()
                if row and row["expires_at"] > now:
                    return json.loads(row["results"])
    except Exception as exc:
        logger.warning("Cache read error: %s", exc)
    return None


async def set_cache(query: str, provider: str, results: Dict[str, List]) -> None:
    """Store results in cache with TTL."""
    key = _make_key(query, provider)
    expires = (
        datetime.now(timezone.utc) + timedelta(seconds=settings.search_cache_ttl)
    ).isoformat()
    try:
        async with get_db() as db:
            await db.execute(
                """INSERT INTO search_cache (query_hash, query, provider, results, expires_at)
                   VALUES (?,?,?,?,?)
                   ON CONFLICT(query_hash) DO UPDATE SET
                   results=excluded.results, expires_at=excluded.expires_at""",
                (key, query, provider, json.dumps(results), expires),
            )
            await db.commit()
    except Exception as exc:
        logger.warning("Cache write error: %s", exc)


async def purge_expired() -> int:
    """Remove expired cache entries. Returns count deleted."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        async with get_db() as db:
            cur = await db.execute(
                "DELETE FROM search_cache WHERE expires_at < ?", (now,)
            )
            await db.commit()
            return cur.rowcount
    except Exception as exc:
        logger.warning("Cache purge error: %s", exc)
        return 0
