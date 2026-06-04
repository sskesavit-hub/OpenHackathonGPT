"""
LangGraph workflow — wires all agents into a sequential pipeline.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, AsyncGenerator, Dict

from langgraph.graph import END, StateGraph

from graph.state import AgentState
from agents.supervisor import supervisor_agent
from agents.problem_discovery import problem_discovery_agent
from agents.research import research_agent
from agents.innovation import innovation_agent
from agents.architecture import architecture_agent
from agents.ppt import ppt_agent
from agents.judge_prep import judge_prep_agent

logger = logging.getLogger(__name__)

# Agent display names for progress events
AGENT_DISPLAY = {
    "supervisor": "Supervisor",
    "problem_discovery": "Problem Discovery",
    "research": "Research",
    "innovation": "Innovation",
    "architecture": "Architecture",
    "ppt": "Pitch Deck",
    "judge_prep": "Judge Preparation",
}


def create_workflow() -> Any:
    """Build and compile the LangGraph StateGraph."""
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("supervisor", supervisor_agent)
    graph.add_node("problem_discovery", problem_discovery_agent)
    graph.add_node("research", research_agent)
    graph.add_node("innovation", innovation_agent)
    graph.add_node("architecture", architecture_agent)
    graph.add_node("ppt", ppt_agent)
    graph.add_node("judge_prep", judge_prep_agent)

    # Sequential edges
    graph.set_entry_point("supervisor")
    graph.add_edge("supervisor", "problem_discovery")
    graph.add_edge("problem_discovery", "research")
    graph.add_edge("research", "innovation")
    graph.add_edge("innovation", "architecture")
    graph.add_edge("architecture", "ppt")
    graph.add_edge("ppt", "judge_prep")
    graph.add_edge("judge_prep", END)

    return graph.compile()


# Singleton compiled workflow
_workflow = None


def get_workflow():
    global _workflow
    if _workflow is None:
        _workflow = create_workflow()
    return _workflow


async def run_pipeline(
    topic: str,
    session_id: str | None = None,
    run_id: str | None = None,
) -> AgentState:
    """Run the full 7-agent pipeline and return the final state."""
    if not run_id:
        run_id = str(uuid.uuid4())

    initial_state: AgentState = {
        "topic": topic,
        "session_id": session_id,
        "run_id": run_id,
        "messages": [],
        "errors": [],
        "completed": False,
        "current_agent": "supervisor",
    }

    workflow = get_workflow()
    final_state = await workflow.ainvoke(initial_state)
    return final_state


async def stream_pipeline(
    topic: str,
    session_id: str | None = None,
    run_id: str | None = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream pipeline progress events as state updates.
    Yields dicts with 'agent', 'status', and optional 'content'.
    """
    if not run_id:
        run_id = str(uuid.uuid4())

    initial_state: AgentState = {
        "topic": topic,
        "session_id": session_id,
        "run_id": run_id,
        "messages": [],
        "errors": [],
        "completed": False,
        "current_agent": "supervisor",
    }

    workflow = get_workflow()
    last_state = initial_state

    async for chunk in workflow.astream(initial_state):
        for node_name, state_update in chunk.items():
            last_state = state_update
            display_name = AGENT_DISPLAY.get(node_name, node_name)
            yield {
                "type": "agent_complete",
                "agent": node_name,
                "agent_display": display_name,
                "current_agent": state_update.get("current_agent", ""),
                "errors": state_update.get("errors", []),
            }

    # We need to extract the final response from the last updated state
    # LangGraph stream_mode="updates" yields partial state updates.
    # The 'judge_prep' node outputs 'final_response'.
    final_content = last_state.get("final_response", "Pipeline completed.")
    yield {"type": "complete", "agent": "complete", "content": final_content}
