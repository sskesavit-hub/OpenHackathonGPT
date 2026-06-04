"""
Auth dependencies — authentication is disabled.
verify_api_key is kept as a no-op so existing Depends() calls don't break.
"""

async def verify_api_key():
    """Auth is disabled — always allow through."""
    return True
