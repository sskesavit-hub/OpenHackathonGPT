"""
Architecture Agent — system design and tech stack recommendations.
"""
from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

ARCHITECTURE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an Architecture Agent for a hackathon assistant.
You design complete technical architectures for hackathon projects.
Given the innovative solution, create a comprehensive technical blueprint:

1. System Architecture Overview
2. Recommended Tech Stack (with justification)
3. Core Modules/Components
4. API Design (key endpoints)
5. Database Schema (key tables/collections)
6. Data Flow Diagram (text-based)
7. Deployment Architecture
8. Implementation Roadmap for hackathon timeframe

Format output in markdown with code blocks for schemas and configs.
Use Mermaid diagram syntax for architecture diagrams where possible.
Focus on what can realistically be built in 24-48 hours."""),
    ("human", """Topic: {topic}
Recommended Solution:
{innovation}

Design a complete technical architecture."""),
])


async def architecture_agent(state: AgentState) -> AgentState:
    """Architecture agent node — designs system architecture."""
    topic = state.get("topic", "")
    innovation = state.get("innovation_analysis", {})

    logger.info("[Architecture] Designing system for: %s", topic[:80])

    try:
        llm = await get_llm(temperature=0.4)
        chain = ARCHITECTURE_PROMPT | llm

        innovation_text = innovation.get("content", "No innovation analysis available.")

        response = await chain.ainvoke({
            "topic": topic,
            "innovation": innovation_text[:2000],
        })

        state["architecture_design"] = {
            "content": response.content,
            "topic": topic,
        }
        state["current_agent"] = "ppt"
        state["messages"].append({
            "role": "system",
            "agent": "architecture",
            "content": "System architecture design complete.",
        })
        logger.info("[Architecture] Complete.")

    except Exception as exc:
        logger.error("[Architecture] Error: %s", exc)
        state["errors"].append(f"Architecture error: {str(exc)}")
        state["architecture_design"] = {"content": "Architecture unavailable.", "topic": topic}

    return state
