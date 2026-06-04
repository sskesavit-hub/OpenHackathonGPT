"""
SQL table definitions for OpenHackathonGPT.
"""

CREATE_TABLES_SQL = [
    # Chat Sessions
    """
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id          TEXT PRIMARY KEY,
        title       TEXT NOT NULL DEFAULT 'New Chat',
        model       TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,

    # Chat Messages
    """
    CREATE TABLE IF NOT EXISTS chat_messages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role        TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content     TEXT NOT NULL,
        agent_meta  TEXT DEFAULT NULL,   -- JSON: which agent produced this
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,

    # App Settings (key-value store)
    """
    CREATE TABLE IF NOT EXISTS app_settings (
        key         TEXT PRIMARY KEY,
        value       TEXT NOT NULL,
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,

    # Agent Execution Logs
    """
    CREATE TABLE IF NOT EXISTS agent_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id      TEXT NOT NULL,
        session_id  TEXT,
        agent_name  TEXT NOT NULL,
        input_data  TEXT,
        output_data TEXT,
        status      TEXT NOT NULL DEFAULT 'pending',
        duration_ms INTEGER DEFAULT 0,
        error       TEXT DEFAULT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
    """,

    # Search Results Cache
    """
    CREATE TABLE IF NOT EXISTS search_cache (
        query_hash  TEXT PRIMARY KEY,
        query       TEXT NOT NULL,
        provider    TEXT NOT NULL,
        results     TEXT NOT NULL,   -- JSON
        expires_at  TEXT NOT NULL
    )
    """,

    # Indexes
    "CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_logs_run ON agent_logs(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON agent_logs(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at)",
]
