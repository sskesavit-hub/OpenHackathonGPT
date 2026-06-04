"""
Judge Preparation Agent — predicts and answers judge questions.
"""
from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

JUDGE_PREP_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a Judge Preparation Agent for hackathon teams.
You predict the toughest questions judges will ask and prepare killer answers.

Generate 15 challenging questions across these categories:
- Technical Questions (5): Implementation, scalability, security, performance
- Business Questions (4): Revenue model, market size, go-to-market, competition
- Implementation Questions (3): MVP scope, timeline, team, resources
- Impact Questions (3): Real-world effect, sustainability, ethics

For each question provide:
- The question
- Why judges ask this
- Model answer (2-3 sentences)
- Supporting data/metrics to mention

Format as structured markdown with clear Q&A sections.
Make the answers confident, specific, and impressive."""),
    ("human", """Project: {topic}
Problem: {problem}
Solution Summary: {solution}
Architecture: {architecture}

Prepare comprehensive judge Q&A."""),
])


async def judge_prep_agent(state: AgentState) -> AgentState:
    """Judge Preparation agent node."""
    topic = state.get("topic", "")
    problem = state.get("problem_statement", "")
    innovation = state.get("innovation_analysis", {})
    architecture = state.get("architecture_design", {})

    logger.info("[JudgePrep] Preparing Q&A for: %s", topic[:80])

    try:
        llm = await get_llm(temperature=0.6)
        chain = JUDGE_PREP_PROMPT | llm

        # Extract recommended solution from innovation
        solution_text = innovation.get("content", "")[:800]

        response = await chain.ainvoke({
            "topic": topic,
            "problem": problem[:500] if problem else topic,
            "solution": solution_text,
            "architecture": architecture.get("content", "")[:500],
        })

        state["judge_qa"] = {
            "content": response.content,
            "topic": topic,
            "question_count": 15,
        }
        state["current_agent"] = "complete"
        state["messages"].append({
            "role": "system",
            "agent": "judge_prep",
            "content": "Judge preparation Q&A generated with 15 questions.",
        })

        # Build final response
        state["final_response"] = _build_final_response(state)
        state["completed"] = True
        logger.info("[JudgePrep] Complete. Pipeline finished.")

    except Exception as exc:
        logger.error("[JudgePrep] Error: %s", exc)
        state["errors"].append(f"JudgePrep error: {str(exc)}")
        state["judge_qa"] = {"content": "Judge prep unavailable.", "topic": topic}
        state["completed"] = True

    return state


def _build_final_response(state: AgentState) -> str:
    """Assemble the complete response from all agent outputs."""
    parts = [
        f"# OpenHackathonGPT Analysis: {state.get('topic', 'Your Project')}",
        "",
        "---",
        "",
        "## Problem Discovery",
        state.get("problem_statement", ""),
        "",
        "---",
        "",
        "## Research Findings",
        state.get("research_results", {}).get("synthesis", ""),
        "",
        "---",
        "",
        "## Innovation Analysis",
        state.get("innovation_analysis", {}).get("content", ""),
        "",
        "---",
        "",
        "## System Architecture",
        state.get("architecture_design", {}).get("content", ""),
        "",
        "---",
        "",
        "## Pitch Deck",
        state.get("ppt_content", {}).get("content", ""),
        "",
        "---",
        "",
        "## Judge Preparation",
        state.get("judge_qa", {}).get("content", ""),
    ]
    return "\n".join(parts)
