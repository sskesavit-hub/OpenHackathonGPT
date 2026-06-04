"""
Settings API endpoints.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict

from database.crud import get_all_settings, set_setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any]


@router.get("", summary="Get all app settings")
async def get_settings():
    settings = await get_all_settings()
    return {"settings": settings}


@router.put("", summary="Update app settings")
async def update_settings(req: SettingsUpdateRequest):
    for key, value in req.settings.items():
        await set_setting(key, value)
    return {"message": "Settings updated", "updated_keys": list(req.settings.keys())}


@router.get("/{key}", summary="Get a single setting")
async def get_single_setting(key: str, default: str = ""):
    from database.crud import get_setting
    value = await get_setting(key, default=default or None)
    return {"key": key, "value": value}


@router.put("/{key}", summary="Set a single setting")
async def set_single_setting(key: str, value: Any):
    await set_setting(key, value)
    return {"key": key, "value": value, "message": "Setting updated"}
