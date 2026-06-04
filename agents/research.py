"""
Research Agent — searches web, GitHub, and ArXiv for existing solutions.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate
from services.llm_service import get_llm

from graph.state import AgentState
from services.search_service import search_all, format_search_for_llm
from services.cache_service import get_cached, set_cache
from configs.settings import settings

logger = logging.getLogger(__name__)

RESEARCH_SYNTHESIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a Research Agent for a hackathon assistant.
You have access to web search results, GitHub repositories, and research papers.
Your job is to:
1. Summarize existing solutions in the space
2. Identify market leaders and open-source projects
3. Find relevant academic research
4. Detect gaps and limitations in current solutions
5. Estimate market size and opportunity

Output structured markdown with:
## Existing Solutions
## Open Source Projects (GitHub)
## Academic Research
## Market Analysis
## Key Players
## Identified Gaps

Be factual and cite sources."""),
    ("human", """Topic: {topic}
Problem Statement Summary: {problem_summary}

Search Results:
{search_context}

Synthesize the research findings."""),
])


async def research_agent(state: AgentState) -> AgentState:
    """Research agent node — searches and synthesizes findings."""
    topic = state.get("topic", "")
    problem = state.get("problem_statement", "")
    supervisor = state.get("supervisor_output", {})

    logger.info("[Research] Searching for: %s", topic[:80])

    try:
        # Build search query
        search_query = f"{topic} {supervisor.get('domain', '')} hackathon solution"
        provider = settings.search_provider

        # Check cache first
        cached = await get_cached(search_query, provider)
        if cached:
            raw_results = cached
            logger.info("[Research] Using cached results.")
        else:
            # Run asynchronous unified search
            raw_results = await search_all(search_query, max_web=5, max_github=5, max_arxiv=3)
            await set_cache(search_query, provider, raw_results)

        state["search_results"] = raw_results

        # Synthesize with LLM
        llm = await get_llm(temperature=0.5)
        chain = RESEARCH_SYNTHESIS_PROMPT | llm

        search_context = format_search_for_llm(raw_results)
        problem_summary = problem[:500] if problem else topic

        response = await chain.ainvoke({
            "topic": topic,
            "problem_summary": problem_summary,
            "search_context": search_context,
        })

        state["research_results"] = {
            "synthesis": response.content,
            "raw": raw_results,
        }
        state["current_agent"] = "innovation"
        state["messages"].append({
            "role": "system",
            "agent": "research",
            "content": f"Research complete. Found {len(raw_results.get('web', []))} web, "
                       f"{len(raw_results.get('github', []))} GitHub, "
                       f"{len(raw_results.get('arxiv', []))} paper results.",
        })
        logger.info("[Research] Complete.")

    except Exception as exc:
        logger.error("[Research] Error: %s", exc)
        state["errors"].append(f"Research error: {str(exc)}")
        state["research_results"] = {"synthesis": "Research unavailable.", "raw": {}}

    return state
