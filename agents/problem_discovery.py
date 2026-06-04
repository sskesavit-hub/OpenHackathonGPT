"""
Problem Discovery Agent — generates detailed problem statements.
"""
from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

PROBLEM_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a Problem Discovery Agent for a hackathon assistant.
Given a topic and supervisor analysis, your job is to:
1. Define a clear, impactful problem statement
2. Identify the target users/beneficiaries
3. Quantify the pain points with data estimates
4. Evaluate the social/economic impact
5. Frame it as a hackathon challenge

Output structured markdown with these sections:
## Problem Statement
## Target Users
## Pain Points
## Current Limitations
## Impact Potential
## Hackathon Framing

Be specific, compelling, and data-driven."""),
    ("human", """Topic: {topic}
Domain: {domain}
Problem Type: {problem_type}
Requirements: {requirements}

Generate a comprehensive problem discovery analysis."""),
])


async def problem_discovery_agent(state: AgentState) -> AgentState:
    """Problem Discovery agent node."""
    topic = state.get("topic", "")
    supervisor = state.get("supervisor_output", {})
    logger.info("[ProblemDiscovery] Analyzing: %s", topic[:80])

    try:
        llm = await get_llm(temperature=0.7)
        chain = PROBLEM_PROMPT | llm

        response = await chain.ainvoke({
            "topic": topic,
            "domain": supervisor.get("domain", "technology"),
            "problem_type": supervisor.get("problem_type", "technical"),
            "requirements": ", ".join(supervisor.get("key_requirements", [])),
        })

        state["problem_statement"] = response.content
        state["current_agent"] = "research"
        state["messages"].append({
            "role": "system",
            "agent": "problem_discovery",
            "content": "Problem statement generated successfully.",
        })
        logger.info("[ProblemDiscovery] Complete.")

    except Exception as exc:
        logger.error("[ProblemDiscovery] Error: %s", exc)
        state["errors"].append(f"ProblemDiscovery error: {str(exc)}")
        state["problem_statement"] = f"Problem analysis for: {topic}"

    return state
