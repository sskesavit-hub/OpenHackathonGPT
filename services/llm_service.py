"""
LLM service factory — creates LangChain model instances based on user settings.
"""
import logging
from typing import Optional, Any

from database.crud import get_setting
from configs.settings import settings
from services.ollama_service import get_active_model

logger = logging.getLogger(__name__)

async def get_llm(temperature: float = 0.7, format: Optional[str] = None, **kwargs) -> Any:
    """
    Factory to return the correct LangChain chat model based on user settings.
    """
    provider = await get_setting("llm_provider", default=settings.llm_provider)
    api_key = await get_setting("llm_api_key", default=settings.llm_api_key)
    
    # For Ollama, the model comes from ollama_service.get_active_model()
    # For others, we assume the user has set "active_model" setting or default.
    model_name = await get_setting("active_model", default=get_active_model())

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            model_kwargs={"response_format": {"type": "json_object"}} if format == "json" else {},
            **kwargs
        )
    elif provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            **kwargs
        )
    elif provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            model_kwargs={"response_format": {"type": "json_object"}} if format == "json" else {},
            **kwargs
        )
    elif provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            **kwargs
        )
    else:
        # Default to Ollama
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=model_name,
            temperature=temperature,
            format=format,
            base_url=settings.ollama_base_url,
            **kwargs
        )
