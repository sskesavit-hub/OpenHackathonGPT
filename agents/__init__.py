"""
Agents package for OpenHackathonGPT.
"""
from agents.supervisor import supervisor_agent
from agents.problem_discovery import problem_discovery_agent
from agents.research import research_agent
from agents.innovation import innovation_agent
from agents.architecture import architecture_agent
from agents.ppt import ppt_agent
from agents.judge_prep import judge_prep_agent

__all__ = [
    "supervisor_agent",
    "problem_discovery_agent",
    "research_agent",
    "innovation_agent",
    "architecture_agent",
    "ppt_agent",
    "judge_prep_agent",
]
