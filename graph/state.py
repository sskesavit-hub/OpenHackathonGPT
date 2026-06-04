"""
LangGraph State definition shared by all agents.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict


class AgentState(TypedDict, total=False):
    # Input
    topic: str
    session_id: Optional[str]
    run_id: str

    # Agent outputs
    supervisor_output: Dict[str, Any]
    problem_statement: str
    research_results: Dict[str, Any]
    innovation_analysis: Dict[str, Any]
    architecture_design: Dict[str, Any]
    ppt_content: Dict[str, Any]
    judge_qa: Dict[str, Any]

    # Pipeline state
    current_agent: str
    messages: List[Dict[str, str]]
    errors: List[str]
    search_results: Dict[str, Any]

    # Final
    final_response: str
    completed: bool
