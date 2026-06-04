"""
Supervisor Agent — orchestrates the entire pipeline.
Analyzes user intent and sets up the workflow.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState

logger = logging.getLogger(__name__)

SUPERVISOR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the Supervisor Agent for OpenHackathonGPT, an AI hackathon assistant.
Your job is to:
1. Understand the user's hackathon topic or idea
2. Extract the core problem domain
3. Identify what type of help is needed (idea generation, architecture, pitch, Q&A prep)
4. Set up context for other specialized agents

Analyze the user's request and output a structured plan in this JSON format:
{{
  "topic": "extracted main topic",
  "domain": "technology domain (e.g., healthcare, fintech, edtech)",
  "problem_type": "what kind of problem (social, technical, environmental)",
  "urgency": "hackathon timeframe context",
  "key_requirements": ["requirement1", "requirement2"],
  "workflow_intent": "full_pipeline | quick_idea | architecture_only | pitch_only | qa_only"
}}

Be concise and precise. Output only valid JSON."""),
    ("human", "User request: {topic}"),
])


async def supervisor_agent(state: AgentState) -> AgentState:
    """Supervisor agent node — analyzes input and prepares context."""
    topic = state.get("topic", "")
    logger.info("[Supervisor] Processing topic: %s", topic[:100])

    try:
        llm = await get_llm(temperature=0.3, format="json")
        chain = SUPERVISOR_PROMPT | llm

        response = await chain.ainvoke({"topic": topic})
        content = response.content

        import json
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            parsed = {
                "topic": topic,
                "domain": "technology",
                "problem_type": "technical",
                "urgency": "hackathon",
                "key_requirements": [],
                "workflow_intent": "full_pipeline",
            }

        state["supervisor_output"] = parsed
        state["current_agent"] = "problem_discovery"
        state["messages"].append({
            "role": "system",
            "agent": "supervisor",
            "content": f"Supervisor analyzed: domain={parsed.get('domain')}, intent={parsed.get('workflow_intent')}",
        })
        logger.info("[Supervisor] Complete. Domain: %s", parsed.get("domain"))

    except Exception as exc:
        logger.error("[Supervisor] Error: %s", exc)
        state["errors"].append(f"Supervisor error: {str(exc)}")
        state["supervisor_output"] = {"topic": topic, "domain": "general"}

    return state
