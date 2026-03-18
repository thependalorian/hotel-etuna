"""
Base Agent: Abstract base class for all Pydantic AI agents in Smartpay.

Location: backend_python/smartpay_ai/agents/base_agent.py
Purpose: Eliminate 600+ lines of duplicate boilerplate across agent implementations.

This module provides:
- Common agent initialization patterns
- Standardized error handling
- Consistent logging and metrics
- Unified context management
- Prompt template loading utilities
- Dependency injection patterns

DESIGN PRINCIPLES:
- DRY: Single source of truth for agent patterns
- Open/Closed: Open for extension, closed for modification
- Dependency Injection: All agents use consistent DI pattern
- Error Resilience: Standardized error handling with fallbacks
- Observability: Built-in logging and metrics
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Generic, Optional, Type, TypeVar, Callable
from datetime import datetime

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from smartpay_ai.providers import get_llm_model


# Type variables for generic agent implementation
TDeps = TypeVar('TDeps')  # Dependencies type
TOutput = TypeVar('TOutput', bound=BaseModel)  # Output response type


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Base Dependencies
# ---------------------------------------------------------------------------

@dataclass
class BaseAgentDeps:
    """
    Base dependencies class that all agent dependencies should inherit from.
    
    This ensures consistency across all agents and provides common fields
    that every agent needs.
    """
    user_id: str
    db_pool: Optional[Any] = None
    ml_service: Optional[Any] = None
    compliance_validator: Optional[Any] = None
    
    # Metadata for tracking and debugging
    request_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Base Agent Response
# ---------------------------------------------------------------------------

class BaseAgentResponse(BaseModel):
    """
    Base response model that all agent responses should inherit from.
    
    Ensures all responses have a summary field and optional metadata.
    """
    summary: str
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"  # Allow subclasses to add additional fields


# ---------------------------------------------------------------------------
# Agent Metrics
# ---------------------------------------------------------------------------

@dataclass
class AgentMetrics:
    """Track agent performance and usage metrics."""
    agent_name: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    success: bool = False
    error: Optional[str] = None
    tools_called: list = field(default_factory=list)
    
    def duration_ms(self) -> float:
        """Calculate execution duration in milliseconds."""
        if self.end_time is None:
            return 0.0
        delta = self.end_time - self.start_time
        return delta.total_seconds() * 1000
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary for logging."""
        return {
            "agent_name": self.agent_name,
            "user_id": self.user_id,
            "duration_ms": self.duration_ms(),
            "success": self.success,
            "error": self.error,
            "tools_called": self.tools_called,
            "timestamp": self.start_time.isoformat(),
        }


# ---------------------------------------------------------------------------
# Base Agent Class
# ---------------------------------------------------------------------------

class BaseAgent(ABC, Generic[TDeps, TOutput]):
    """
    Abstract base class for all Pydantic AI agents.
    
    This class provides common functionality that every agent needs:
    - Agent initialization with consistent patterns
    - Prompt template management
    - Error handling with fallbacks
    - Logging and metrics
    - Context building utilities
    
    Usage:
        class MyAgent(BaseAgent[MyDeps, MyResponse]):
            def __init__(self):
                super().__init__(
                    agent_name="my_agent",
                    deps_type=MyDeps,
                    output_type=MyResponse,
                    system_prompt=MY_SYSTEM_PROMPT
                )
            
            def _register_tools(self, agent: Agent):
                agent.tool(self._my_tool)
            
            async def _my_tool(self, ctx: RunContext[MyDeps]) -> str:
                return "Tool result"
            
            def get_default_response(self, error_message: str) -> MyResponse:
                return MyResponse(summary=error_message)
    """
    
    def __init__(
        self,
        agent_name: str,
        deps_type: Type[TDeps],
        output_type: Type[TOutput],
        system_prompt: str,
        model_override: Optional[str] = None,
    ):
        """
        Initialize the base agent.
        
        Args:
            agent_name: Unique name for this agent (e.g., "security_guardian")
            deps_type: Type of dependencies dataclass
            output_type: Type of output response model
            system_prompt: System prompt for the agent
            model_override: Optional LLM model override
        """
        self.agent_name = agent_name
        self.deps_type = deps_type
        self.output_type = output_type
        self.system_prompt = system_prompt
        self.logger = logging.getLogger(f"{__name__}.{agent_name}")
        
        # Initialize Pydantic AI agent
        model = get_llm_model() if model_override is None else model_override
        self._agent = Agent(
            model,
            deps_type=deps_type,
            output_type=output_type,
            system_prompt=system_prompt,
        )
        
        # Register tools specific to this agent
        self._register_tools(self._agent)
        
        self.logger.info(f"Initialized {agent_name} agent")
    
    @abstractmethod
    def _register_tools(self, agent: Agent) -> None:
        """
        Register tools for this agent.
        
        Subclasses must implement this method to register their specific tools.
        
        Example:
            def _register_tools(self, agent: Agent):
                agent.tool(self._assess_risk)
                agent.tool(self._check_reputation)
        
        Args:
            agent: The Pydantic AI agent to register tools on
        """
        pass
    
    @abstractmethod
    def get_default_response(self, error_message: str) -> TOutput:
        """
        Get a default/fallback response for error cases.
        
        Subclasses must implement this to provide a safe fallback response
        that matches their output type.
        
        Args:
            error_message: Error message to include in the response
        
        Returns:
            A valid response object of type TOutput
        """
        pass
    
    def build_context_query(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        Build a comprehensive query string with context.
        
        This is a common pattern across all agents - combining the user query
        with additional context information.
        
        Args:
            query: Base user query
            context: Optional context dictionary
            **kwargs: Additional key-value pairs to add to context
        
        Returns:
            Enhanced query string with context
        """
        full_query = query
        
        # Add kwargs to context
        if kwargs:
            if context is None:
                context = {}
            context.update(kwargs)
        
        # Append context if provided
        if context:
            context_parts = []
            for key, value in context.items():
                if value is not None:
                    context_parts.append(f"{key}: {value}")
            
            if context_parts:
                full_query += f"\n\nContext:\n" + "\n".join(context_parts)
        
        return full_query
    
    def _start_metrics(self, user_id: str) -> AgentMetrics:
        """Start tracking metrics for an agent run."""
        return AgentMetrics(
            agent_name=self.agent_name,
            user_id=user_id,
            start_time=datetime.utcnow(),
        )
    
    def _end_metrics(
        self,
        metrics: AgentMetrics,
        success: bool,
        error: Optional[str] = None,
    ) -> None:
        """
        End metrics tracking and log results.
        
        Args:
            metrics: The metrics object to finalize
            success: Whether the agent run succeeded
            error: Optional error message
        """
        metrics.end_time = datetime.utcnow()
        metrics.success = success
        metrics.error = error
        
        # Log metrics
        if success:
            self.logger.info(
                f"{self.agent_name} completed successfully",
                extra={"metrics": metrics.to_dict()}
            )
        else:
            self.logger.error(
                f"{self.agent_name} failed: {error}",
                extra={"metrics": metrics.to_dict()}
            )
    
    async def run(
        self,
        query: str,
        deps: TDeps,
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> TOutput:
        """
        Run the agent with standardized error handling and metrics.
        
        This method provides:
        - Metrics tracking
        - Error handling with fallback responses
        - Consistent logging
        - String response handling (fallback when LLM doesn't use structured output)
        
        Args:
            query: User query
            deps: Dependencies for the agent
            context: Optional additional context
            **kwargs: Additional context fields
        
        Returns:
            Agent response of type TOutput
        """
        # Start metrics tracking
        user_id = getattr(deps, 'user_id', 'unknown')
        metrics = self._start_metrics(user_id)
        
        try:
            # Build full query with context
            full_query = self.build_context_query(query, context, **kwargs)
            
            self.logger.debug(f"Running {self.agent_name} for user {user_id}")
            
            # Run the agent
            result = await self._agent.run(full_query, deps=deps)
            
            # Handle None output
            if result.output is None:
                self.logger.warning(f"{self.agent_name} returned None output")
                response = self.get_default_response(
                    "I couldn't process your request. Please try again."
                )
                self._end_metrics(metrics, success=False, error="None output")
                return response
            
            # Handle string output (fallback case when LLM doesn't use structured output)
            if isinstance(result.output, str):
                self.logger.warning(f"{self.agent_name} returned string instead of structured output")
                response = self.get_default_response(result.output)
                self._end_metrics(metrics, success=True)
                return response
            
            # Success case
            self._end_metrics(metrics, success=True)
            return result.output
        
        except Exception as e:
            self.logger.exception(f"{self.agent_name} run failed: {e}")
            error_msg = f"An error occurred: {str(e)}. Please try again."
            self._end_metrics(metrics, success=False, error=str(e))
            return self.get_default_response(error_msg)
    
    async def run_with_validation(
        self,
        query: str,
        deps: TDeps,
        context: Optional[Dict[str, Any]] = None,
        validators: Optional[list[Callable[[TOutput], bool]]] = None,
        **kwargs
    ) -> TOutput:
        """
        Run the agent with output validation.
        
        This is useful when you need to ensure the agent output meets
        certain criteria before returning it.
        
        Args:
            query: User query
            deps: Dependencies for the agent
            context: Optional additional context
            validators: List of validation functions that return True if valid
            **kwargs: Additional context fields
        
        Returns:
            Validated agent response of type TOutput
        """
        response = await self.run(query, deps, context, **kwargs)
        
        # Run validators if provided
        if validators:
            for validator in validators:
                try:
                    if not validator(response):
                        self.logger.warning(f"Response failed validation: {validator.__name__}")
                        return self.get_default_response(
                            "The response didn't meet quality criteria. Please try again."
                        )
                except Exception as e:
                    self.logger.error(f"Validator {validator.__name__} failed: {e}")
        
        return response
    
    @property
    def agent(self) -> Agent:
        """Get the underlying Pydantic AI agent."""
        return self._agent


# ---------------------------------------------------------------------------
# Utility Decorators
# ---------------------------------------------------------------------------

def log_tool_call(func: Callable) -> Callable:
    """
    Decorator to log tool calls with execution time.
    
    Usage:
        @log_tool_call
        async def _my_tool(self, ctx: RunContext[MyDeps]) -> str:
            return "result"
    """
    async def wrapper(*args, **kwargs):
        func_name = func.__name__
        start = datetime.utcnow()
        
        logger.debug(f"Tool call started: {func_name}")
        
        try:
            result = await func(*args, **kwargs)
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            logger.debug(f"Tool call completed: {func_name} ({duration:.2f}ms)")
            return result
        except Exception as e:
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            logger.error(f"Tool call failed: {func_name} ({duration:.2f}ms): {e}")
            raise
    
    return wrapper


def retry_on_error(max_retries: int = 3, delay_seconds: float = 1.0):
    """
    Decorator to retry tool calls on failure.
    
    Args:
        max_retries: Maximum number of retry attempts
        delay_seconds: Delay between retries in seconds
    
    Usage:
        @retry_on_error(max_retries=3)
        async def _my_tool(self, ctx: RunContext[MyDeps]) -> str:
            return "result"
    """
    import asyncio
    
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Tool {func.__name__} failed (attempt {attempt + 1}/{max_retries}): {e}"
                        )
                        await asyncio.sleep(delay_seconds)
                    else:
                        logger.error(f"Tool {func.__name__} failed after {max_retries} attempts")
            
            raise last_error
        
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Context Building Utilities
# ---------------------------------------------------------------------------

class ContextBuilder:
    """
    Utility class for building rich context objects.
    
    This helps agents add structured context to their queries in a consistent way.
    """
    
    def __init__(self):
        self._context: Dict[str, Any] = {}
    
    def add(self, key: str, value: Any) -> 'ContextBuilder':
        """Add a key-value pair to the context."""
        if value is not None:
            self._context[key] = value
        return self
    
    def add_all(self, data: Dict[str, Any]) -> 'ContextBuilder':
        """Add multiple key-value pairs to the context."""
        for key, value in data.items():
            self.add(key, value)
        return self
    
    def add_if(self, condition: bool, key: str, value: Any) -> 'ContextBuilder':
        """Add a key-value pair only if condition is True."""
        if condition:
            self.add(key, value)
        return self
    
    def build(self) -> Dict[str, Any]:
        """Build and return the context dictionary."""
        return self._context.copy()


# ---------------------------------------------------------------------------
# Compliance Integration Helpers
# ---------------------------------------------------------------------------

class ComplianceHelperMixin:
    """
    Mixin class for agents that need compliance integration.
    
    Provides common patterns for compliance validation and logging.
    """
    
    async def initialize_compliance(
        self,
        compliance_validator: Optional[Any] = None,
    ) -> Any:
        """
        Initialize compliance validator with database fallback.
        
        This is a common pattern in security_guardian and transaction_analyst.
        
        Args:
            compliance_validator: Existing validator or None to create new
        
        Returns:
            Initialized ComplianceValidator instance
        """
        if compliance_validator is not None:
            return compliance_validator
        
        try:
            from smartpay_ai.services.compliance_validator import ComplianceValidator as EnhancedValidator
            validator = EnhancedValidator()
            
            # Initialize database pool for fallback mode
            try:
                await validator.initialize_db_pool()
                self.logger.info(f"Database fallback initialized for {self.agent_name}")
            except Exception as e:
                self.logger.warning(f"Failed to initialize database fallback: {e}")
            
            return validator
        except Exception as e:
            self.logger.error(f"Failed to initialize compliance validator: {e}")
            # Return a mock validator or None - let the caller handle it
            return None
    
    async def log_compliance_violation(
        self,
        compliance_validator: Any,
        violation_type: str,
        psd_reference: str,
        severity: str,
        description: str,
        user_id: str,
        **kwargs
    ) -> bool:
        """
        Log a compliance violation with standardized error handling.
        
        Args:
            compliance_validator: ComplianceValidator instance
            violation_type: Type of violation
            psd_reference: PSD or regulation reference
            severity: Severity level (critical, serious, moderate, low)
            description: Human-readable description
            user_id: User ID
            **kwargs: Additional fields (transaction_id, remediation_action, etc.)
        
        Returns:
            True if logged successfully, False otherwise
        """
        if compliance_validator is None:
            self.logger.warning("Cannot log violation: no compliance validator")
            return False
        
        try:
            await compliance_validator.log_compliance_violation(
                violation_type=violation_type,
                psd_reference=psd_reference,
                severity=severity,
                description=description,
                user_id=user_id,
                **kwargs
            )
            return True
        except Exception as e:
            self.logger.error(f"Failed to log compliance violation: {e}")
            return False
