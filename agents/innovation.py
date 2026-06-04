"""
Innovation Agent — gap analysis and unique solution generation.
"""
from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

INNOVATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an Innovation Agent for a hackathon assistant.
Your specialization is finding unique, creative, and winning hackathon ideas.
Given the problem statement and research, you must:
1. Identify gaps in existing solutions
2. Propose 3-5 unique solution concepts
3. Calculate an innovation score (0-100) for each
4. Recommend the best solution with justification
5. Describe the unique value proposition

Innovation Score Criteria:
- Novelty (30 pts): How different from existing solutions
- Feasibility (25 pts): Can be built in a hackathon
- Impact (25 pts): Real-world benefit
- Technical Depth (20 pts): Demonstrates strong technical skills

Output structured markdown with:
## Gap Analysis
## Solution Concepts (with innovation scores)
## Recommended Solution
## Unique Value Proposition
## Competitive Advantage
## Why This Wins Hackathons"""),
    ("human", """Topic: {topic}
Problem Statement:
{problem}

Research Findings:
{research}

Generate innovative solution recommendations."""),
])


async def innovation_agent(state: AgentState) -> AgentState:
    """Innovation agent node — generates unique solution ideas."""
    topic = state.get("topic", "")
    problem = state.get("problem_statement", "")
    research = state.get("research_results", {})

    logger.info("[Innovation] Generating innovations for: %s", topic[:80])

    try:
        llm = await get_llm(temperature=0.9)
        chain = INNOVATION_PROMPT | llm

        research_text = research.get("synthesis", "No research available.")

        response = await chain.ainvoke({
            "topic": topic,
            "problem": problem[:1000] if problem else topic,
            "research": research_text[:2000],
        })

        state["innovation_analysis"] = {
            "content": response.content,
            "topic": topic,
        }
        state["current_agent"] = "architecture"
        state["messages"].append({
            "role": "system",
            "agent": "innovation",
            "content": "Innovation analysis complete with solution recommendations.",
        })
        logger.info("[Innovation] Complete.")

    except Exception as exc:
        logger.error("[Innovation] Error: %s", exc)
        state["errors"].append(f"Innovation error: {str(exc)}")
        state["innovation_analysis"] = {"content": "Innovation analysis unavailable.", "topic": topic}

    return state
