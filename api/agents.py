"""
Agent execution API endpoints.
"""
from __future__ import annotations

import uuid
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from graph.workflow import run_pipeline
from database.crud import get_agent_logs, log_agent_run

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agents", tags=["agents"])

# In-memory run status store
_run_status: dict[str, dict] = {}


class AgentRunRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None


@router.post("/run", summary="Run the full 7-agent pipeline")
async def run_agents(req: AgentRunRequest):
    """Execute the complete multi-agent pipeline for a given topic."""
    run_id = str(uuid.uuid4())
    _run_status[run_id] = {"status": "running", "progress": 0}

    try:
        final_state = await run_pipeline(
            topic=req.topic,
            session_id=req.session_id,
            run_id=run_id,
        )
        _run_status[run_id] = {"status": "complete", "progress": 100}

        return {
            "run_id": run_id,
            "status": "complete",
            "topic": req.topic,
            "result": {
                "problem_statement": final_state.get("problem_statement", ""),
                "innovation_analysis": final_state.get("innovation_analysis", {}).get("content", ""),
                "architecture_design": final_state.get("architecture_design", {}).get("content", ""),
                "ppt_content": final_state.get("ppt_content", {}).get("content", ""),
                "judge_qa": final_state.get("judge_qa", {}).get("content", ""),
                "final_response": final_state.get("final_response", ""),
                "errors": final_state.get("errors", []),
            },
        }

    except Exception as exc:
        logger.error("Agent pipeline error: %s", exc)
        _run_status[run_id] = {"status": "error", "error": str(exc)}
        return {"run_id": run_id, "status": "error", "error": str(exc)}


@router.get("/status/{run_id}", summary="Check pipeline run status")
async def get_run_status(run_id: str):
    status = _run_status.get(run_id, {"status": "not_found"})
    logs = await get_agent_logs(run_id)
    return {"run_id": run_id, **status, "agent_logs": logs}


@router.get("/list", summary="List agent pipeline capabilities")
async def list_agents():
    return {
        "agents": [
            {"id": "supervisor", "name": "Supervisor Agent", "description": "Orchestrates the workflow, understands user intent"},
            {"id": "problem_discovery", "name": "Problem Discovery Agent", "description": "Generates problem statements and pain point analysis"},
            {"id": "research", "name": "Research Agent", "description": "Searches web, GitHub, ArXiv for existing solutions"},
            {"id": "innovation", "name": "Innovation Agent", "description": "Gap analysis, unique solutions, innovation scoring"},
            {"id": "architecture", "name": "Architecture Agent", "description": "System design, tech stack, API and DB schema"},
            {"id": "ppt", "name": "PPT Agent", "description": "10-slide hackathon pitch deck content"},
            {"id": "judge_prep", "name": "Judge Preparation Agent", "description": "Predicts and answers 15 judge questions"},
        ],
        "workflow": "supervisor → problem_discovery → research → innovation → architecture → ppt → judge_prep",
    }
