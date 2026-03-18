"""
LLM provider factory for Smartpay AI agents.

Location: backend_python/smartpay_ai/providers.py
Purpose: Resolve LLM model from env (OpenAI, Anthropic, DeepSeek, Gemini). Used by Copilot and specialist agents.
"""

import os
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


def get_llm_model(model_name: Optional[str] = None, **kwargs: Any) -> Any:
    """Return a Pydantic AI–compatible model instance from env configuration."""
    provider = (os.getenv("LLM_PROVIDER") or "openai").lower()
    api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    model = model_name or os.getenv("LLM_MODEL", "gpt-4o")

    if provider == "openai":
        from pydantic_ai.models.openai import OpenAIModel
        from pydantic_ai.providers.openai import OpenAIProvider
        return OpenAIModel(model, provider=OpenAIProvider(api_key=api_key), **kwargs)
    
    if provider == "anthropic":
        from pydantic_ai.models.anthropic import AnthropicModel
        from pydantic_ai.providers.anthropic import AnthropicProvider
        return AnthropicModel(
            model or "claude-sonnet-4-20250514",
            provider=AnthropicProvider(api_key=api_key),
            **kwargs,
        )
    
    if provider == "gemini":
        from pydantic_ai.models.gemini import GeminiModel
        from pydantic_ai.providers.gemini import GeminiProvider
        return GeminiModel(
            model or "gemini-2.0-flash-exp",
            provider=GeminiProvider(api_key=api_key),
            **kwargs,
        )
    
    if provider == "deepseek":
        from pydantic_ai.models.openai import OpenAIModel
        from pydantic_ai.providers.openai import OpenAIProvider
        base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
        model = model_name or os.getenv("LLM_MODEL", "deepseek-chat")
        return OpenAIModel(model, provider=OpenAIProvider(base_url=base_url, api_key=api_key), **kwargs)
    
    raise ValueError(f"Unsupported LLM provider: {provider}")
