"""
PPT Agent — generates pitch deck content structure.
"""
from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

PPT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a PPT Agent — a master pitch deck creator for hackathons.
Create a compelling 10-slide pitch deck structure. Each slide should have:
- Slide title
- Key message (1 sentence)
- Bullet points (3-5 items)
- Suggested visual/chart description
- Speaker notes

The 10 slides should be:
1. Title Slide
2. Problem Statement
3. Market Opportunity
4. Our Solution
5. How It Works (Demo)
6. Technical Architecture
7. Business Model
8. Competitive Advantage
9. Team & Roadmap
10. Call to Action

Format as structured markdown with clear slide separators.
Make it WINNING material — compelling, concise, data-driven."""),
    ("human", """Topic: {topic}
Problem: {problem}
Innovation: {innovation}
Architecture: {architecture}

Create a 10-slide hackathon pitch deck."""),
])


async def ppt_agent(state: AgentState) -> AgentState:
    """PPT agent node — generates pitch deck content."""
    topic = state.get("topic", "")
    problem = state.get("problem_statement", "")
    innovation = state.get("innovation_analysis", {})
    architecture = state.get("architecture_design", {})

    logger.info("[PPT] Creating pitch deck for: %s", topic[:80])

    try:
        llm = await get_llm(temperature=0.7)
        chain = PPT_PROMPT | llm

        response = await chain.ainvoke({
            "topic": topic,
            "problem": problem[:600] if problem else topic,
            "innovation": innovation.get("content", "")[:800],
            "architecture": architecture.get("content", "")[:600],
        })

        state["ppt_content"] = {
            "content": response.content,
            "topic": topic,
            "slide_count": 10,
        }
        state["current_agent"] = "judge_prep"
        state["messages"].append({
            "role": "system",
            "agent": "ppt",
            "content": "10-slide pitch deck content generated.",
        })
        logger.info("[PPT] Complete.")

    except Exception as exc:
        logger.error("[PPT] Error: %s", exc)
        state["errors"].append(f"PPT error: {str(exc)}")
        state["ppt_content"] = {"content": "Pitch deck unavailable.", "topic": topic}

    return state
