"""
Unit tests for BaseAgent abstract base class.

Location: backend_python/smartpay_ai/agents/base_agent_test.py
Purpose: Comprehensive test coverage for the agent boilerplate refactoring.

Test Coverage:
- Agent initialization
- Context building
- Error handling and fallbacks
- Metrics tracking
- Tool decorators
- Compliance helpers
"""

import pytest
import asyncio
from dataclasses import dataclass
from typing import Any, Optional
from datetime import datetime, timedelta

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import (
    BaseAgent,
    BaseAgentDeps,
    BaseAgentResponse,
    AgentMetrics,
    ContextBuilder,
    ComplianceHelperMixin,
    log_tool_call,
    retry_on_error,
)


# ---------------------------------------------------------------------------
# Test Fixtures
# ---------------------------------------------------------------------------

@dataclass
class TestAgentDeps(BaseAgentDeps):
    """Test dependencies."""
    test_value: str = "test"


class TestAgentResponse(BaseAgentResponse):
    """Test response model."""
    test_field: str = "default"
    score: float = 0.0


class TestAgent(BaseAgent[TestAgentDeps, TestAgentResponse]):
    """Concrete test agent implementation."""
    
    def __init__(self):
        super().__init__(
            agent_name="test_agent",
            deps_type=TestAgentDeps,
            output_type=TestAgentResponse,
            system_prompt="You are a test agent.",
        )
        self.tool_call_count = 0
    
    def _register_tools(self, agent: Agent) -> None:
        """Register test tools."""
        agent.tool(self._test_tool)
        agent.tool(self._failing_tool)
    
    async def _test_tool(self, ctx: RunContext[TestAgentDeps]) -> str:
        """A simple test tool."""
        self.tool_call_count += 1
        return f"Tool called with user_id: {ctx.deps.user_id}"
    
    async def _failing_tool(self, ctx: RunContext[TestAgentDeps]) -> str:
        """A tool that always fails."""
        raise ValueError("This tool always fails")
    
    def get_default_response(self, error_message: str) -> TestAgentResponse:
        """Return a default test response."""
        return TestAgentResponse(
            summary=error_message,
            test_field="default",
            score=0.0,
        )


class TestAgentWithCompliance(BaseAgent[TestAgentDeps, TestAgentResponse], ComplianceHelperMixin):
    """Test agent with compliance mixin."""
    
    def __init__(self):
        super().__init__(
            agent_name="test_compliance_agent",
            deps_type=TestAgentDeps,
            output_type=TestAgentResponse,
            system_prompt="You are a test compliance agent.",
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """No tools needed for this test."""
        pass
    
    def get_default_response(self, error_message: str) -> TestAgentResponse:
        """Return a default test response."""
        return TestAgentResponse(
            summary=error_message,
            test_field="default",
            score=0.0,
        )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def test_agent():
    """Create a test agent instance."""
    return TestAgent()


@pytest.fixture
def test_deps():
    """Create test dependencies."""
    return TestAgentDeps(
        user_id="test_user_123",
        test_value="test_data",
    )


@pytest.fixture
def test_agent_with_compliance():
    """Create a test agent with compliance mixin."""
    return TestAgentWithCompliance()


# ---------------------------------------------------------------------------
# Test: Agent Initialization
# ---------------------------------------------------------------------------

def test_agent_initialization(test_agent):
    """Test that agent initializes correctly."""
    assert test_agent.agent_name == "test_agent"
    assert test_agent.deps_type == TestAgentDeps
    assert test_agent.output_type == TestAgentResponse
    assert test_agent.system_prompt == "You are a test agent."
    assert test_agent._agent is not None
    assert isinstance(test_agent._agent, Agent)


def test_agent_has_logger(test_agent):
    """Test that agent has a properly configured logger."""
    assert test_agent.logger is not None
    assert "test_agent" in test_agent.logger.name


def test_agent_property(test_agent):
    """Test the agent property accessor."""
    agent = test_agent.agent
    assert agent is not None
    assert isinstance(agent, Agent)


# ---------------------------------------------------------------------------
# Test: Context Building
# ---------------------------------------------------------------------------

def test_build_context_query_basic(test_agent):
    """Test basic context query building."""
    query = "What is my balance?"
    result = test_agent.build_context_query(query)
    assert result == query


def test_build_context_query_with_context(test_agent):
    """Test context query building with context dict."""
    query = "What is my balance?"
    context = {
        "account_id": "acc_123",
        "currency": "NAD",
    }
    result = test_agent.build_context_query(query, context)
    
    assert "What is my balance?" in result
    assert "account_id: acc_123" in result
    assert "currency: NAD" in result


def test_build_context_query_with_kwargs(test_agent):
    """Test context query building with kwargs."""
    query = "What is my balance?"
    result = test_agent.build_context_query(
        query,
        transaction_id="txn_456",
        amount=100.50,
    )
    
    assert "What is my balance?" in result
    assert "transaction_id: txn_456" in result
    assert "amount: 100.5" in result


def test_build_context_query_ignores_none_values(test_agent):
    """Test that None values are ignored in context."""
    query = "Test query"
    result = test_agent.build_context_query(
        query,
        valid_field="value",
        none_field=None,
    )
    
    assert "valid_field: value" in result
    assert "none_field" not in result


# ---------------------------------------------------------------------------
# Test: Metrics Tracking
# ---------------------------------------------------------------------------

def test_metrics_initialization(test_agent):
    """Test metrics initialization."""
    metrics = test_agent._start_metrics("user_123")
    
    assert metrics.agent_name == "test_agent"
    assert metrics.user_id == "user_123"
    assert metrics.start_time is not None
    assert metrics.end_time is None
    assert metrics.success is False
    assert metrics.error is None


def test_metrics_duration_calculation(test_agent):
    """Test metrics duration calculation."""
    metrics = test_agent._start_metrics("user_123")
    
    # Simulate some processing time
    metrics.end_time = metrics.start_time + timedelta(milliseconds=150)
    
    duration = metrics.duration_ms()
    assert duration == pytest.approx(150.0, rel=1e-3)


def test_metrics_to_dict(test_agent):
    """Test metrics conversion to dictionary."""
    metrics = test_agent._start_metrics("user_123")
    metrics.end_time = metrics.start_time + timedelta(milliseconds=100)
    metrics.success = True
    metrics.tools_called = ["tool1", "tool2"]
    
    result = metrics.to_dict()
    
    assert result["agent_name"] == "test_agent"
    assert result["user_id"] == "user_123"
    assert result["duration_ms"] == pytest.approx(100.0, rel=1e-3)
    assert result["success"] is True
    assert result["error"] is None
    assert result["tools_called"] == ["tool1", "tool2"]


def test_end_metrics_success(test_agent):
    """Test ending metrics for successful run."""
    metrics = test_agent._start_metrics("user_123")
    test_agent._end_metrics(metrics, success=True)
    
    assert metrics.end_time is not None
    assert metrics.success is True
    assert metrics.error is None


def test_end_metrics_failure(test_agent):
    """Test ending metrics for failed run."""
    metrics = test_agent._start_metrics("user_123")
    error_msg = "Something went wrong"
    test_agent._end_metrics(metrics, success=False, error=error_msg)
    
    assert metrics.end_time is not None
    assert metrics.success is False
    assert metrics.error == error_msg


# ---------------------------------------------------------------------------
# Test: Error Handling
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_default_response(test_agent):
    """Test default response generation."""
    error_msg = "Test error message"
    response = test_agent.get_default_response(error_msg)
    
    assert isinstance(response, TestAgentResponse)
    assert response.summary == error_msg
    assert response.test_field == "default"
    assert response.score == 0.0


# Note: Testing the actual agent.run() method would require mocking the LLM,
# which is complex. Instead, we'll test the error handling path.

@pytest.mark.asyncio
async def test_run_handles_exception(test_agent, test_deps):
    """Test that run method handles exceptions gracefully."""
    # This will likely fail since we don't have a real LLM, but it should
    # return a default response instead of raising an exception
    
    # Patch the agent run to raise an exception
    original_run = test_agent._agent.run
    
    async def mock_failing_run(*args, **kwargs):
        raise RuntimeError("Simulated LLM failure")
    
    test_agent._agent.run = mock_failing_run
    
    result = await test_agent.run("Test query", test_deps)
    
    assert isinstance(result, TestAgentResponse)
    assert "error occurred" in result.summary.lower()
    
    # Restore original
    test_agent._agent.run = original_run


# ---------------------------------------------------------------------------
# Test: ContextBuilder Utility
# ---------------------------------------------------------------------------

def test_context_builder_add():
    """Test ContextBuilder add method."""
    builder = ContextBuilder()
    result = builder.add("key1", "value1").add("key2", "value2").build()
    
    assert result == {"key1": "value1", "key2": "value2"}


def test_context_builder_add_all():
    """Test ContextBuilder add_all method."""
    builder = ContextBuilder()
    data = {"key1": "value1", "key2": "value2"}
    result = builder.add_all(data).build()
    
    assert result == data


def test_context_builder_add_if():
    """Test ContextBuilder add_if method."""
    builder = ContextBuilder()
    result = (
        builder
        .add_if(True, "included", "yes")
        .add_if(False, "excluded", "no")
        .build()
    )
    
    assert result == {"included": "yes"}
    assert "excluded" not in result


def test_context_builder_ignores_none():
    """Test that ContextBuilder ignores None values."""
    builder = ContextBuilder()
    result = (
        builder
        .add("valid", "value")
        .add("none", None)
        .build()
    )
    
    assert result == {"valid": "value"}
    assert "none" not in result


def test_context_builder_chaining():
    """Test that ContextBuilder supports method chaining."""
    builder = ContextBuilder()
    result = (
        builder
        .add("a", 1)
        .add("b", 2)
        .add_if(True, "c", 3)
        .add_all({"d": 4, "e": 5})
        .build()
    )
    
    assert result == {"a": 1, "b": 2, "c": 3, "d": 4, "e": 5}


# ---------------------------------------------------------------------------
# Test: Decorators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_log_tool_call_decorator():
    """Test the log_tool_call decorator."""
    call_count = 0
    
    @log_tool_call
    async def test_function():
        nonlocal call_count
        call_count += 1
        return "success"
    
    result = await test_function()
    
    assert result == "success"
    assert call_count == 1


@pytest.mark.asyncio
async def test_log_tool_call_decorator_handles_errors():
    """Test that log_tool_call decorator handles errors."""
    @log_tool_call
    async def failing_function():
        raise ValueError("Test error")
    
    with pytest.raises(ValueError, match="Test error"):
        await failing_function()


@pytest.mark.asyncio
async def test_retry_on_error_decorator_success():
    """Test retry decorator with successful call."""
    call_count = 0
    
    @retry_on_error(max_retries=3, delay_seconds=0.01)
    async def test_function():
        nonlocal call_count
        call_count += 1
        return "success"
    
    result = await test_function()
    
    assert result == "success"
    assert call_count == 1  # Should succeed on first try


@pytest.mark.asyncio
async def test_retry_on_error_decorator_retries():
    """Test retry decorator with eventual success."""
    call_count = 0
    
    @retry_on_error(max_retries=3, delay_seconds=0.01)
    async def test_function():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ValueError("Temporary error")
        return "success"
    
    result = await test_function()
    
    assert result == "success"
    assert call_count == 3  # Should succeed on third try


@pytest.mark.asyncio
async def test_retry_on_error_decorator_exhausts_retries():
    """Test retry decorator when all retries fail."""
    call_count = 0
    
    @retry_on_error(max_retries=3, delay_seconds=0.01)
    async def test_function():
        nonlocal call_count
        call_count += 1
        raise ValueError("Persistent error")
    
    with pytest.raises(ValueError, match="Persistent error"):
        await test_function()
    
    assert call_count == 3  # Should try 3 times


# ---------------------------------------------------------------------------
# Test: ComplianceHelperMixin
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compliance_mixin_initialization(test_agent_with_compliance):
    """Test compliance mixin initialization."""
    # This test verifies the mixin is available
    assert hasattr(test_agent_with_compliance, 'initialize_compliance')
    assert hasattr(test_agent_with_compliance, 'log_compliance_violation')


@pytest.mark.asyncio
async def test_log_compliance_violation_without_validator(test_agent_with_compliance):
    """Test logging violation without validator."""
    result = await test_agent_with_compliance.log_compliance_violation(
        compliance_validator=None,
        violation_type="test_violation",
        psd_reference="PSD-TEST",
        severity="low",
        description="Test violation",
        user_id="test_user",
    )
    
    # Should return False when no validator is provided
    assert result is False


# ---------------------------------------------------------------------------
# Test: BaseAgentDeps
# ---------------------------------------------------------------------------

def test_base_agent_deps_initialization():
    """Test BaseAgentDeps initialization."""
    deps = BaseAgentDeps(
        user_id="user_123",
        db_pool="mock_pool",
        ml_service="mock_ml",
    )
    
    assert deps.user_id == "user_123"
    assert deps.db_pool == "mock_pool"
    assert deps.ml_service == "mock_ml"
    assert deps.request_id is None
    assert isinstance(deps.timestamp, datetime)


def test_base_agent_deps_with_metadata():
    """Test BaseAgentDeps with metadata."""
    request_id = "req_abc123"
    timestamp = datetime.utcnow()
    
    deps = BaseAgentDeps(
        user_id="user_456",
        request_id=request_id,
        timestamp=timestamp,
    )
    
    assert deps.user_id == "user_456"
    assert deps.request_id == request_id
    assert deps.timestamp == timestamp


# ---------------------------------------------------------------------------
# Test: BaseAgentResponse
# ---------------------------------------------------------------------------

def test_base_agent_response():
    """Test BaseAgentResponse model."""
    response = BaseAgentResponse(
        summary="Test summary",
        metadata={"key": "value"},
    )
    
    assert response.summary == "Test summary"
    assert response.metadata == {"key": "value"}


def test_base_agent_response_allows_extra():
    """Test that BaseAgentResponse allows extra fields."""
    class CustomResponse(BaseAgentResponse):
        custom_field: str = "default"
    
    response = CustomResponse(
        summary="Test",
        custom_field="custom_value",
    )
    
    assert response.summary == "Test"
    assert response.custom_field == "custom_value"


# ---------------------------------------------------------------------------
# Test: Integration Tests
# ---------------------------------------------------------------------------

def test_agent_inheritance_structure(test_agent):
    """Test that test agent properly inherits from BaseAgent."""
    assert isinstance(test_agent, BaseAgent)
    assert hasattr(test_agent, 'run')
    assert hasattr(test_agent, 'build_context_query')
    assert hasattr(test_agent, 'get_default_response')


def test_agent_with_compliance_mixin(test_agent_with_compliance):
    """Test agent with compliance mixin has all methods."""
    # BaseAgent methods
    assert hasattr(test_agent_with_compliance, 'run')
    assert hasattr(test_agent_with_compliance, 'build_context_query')
    
    # ComplianceHelperMixin methods
    assert hasattr(test_agent_with_compliance, 'initialize_compliance')
    assert hasattr(test_agent_with_compliance, 'log_compliance_violation')


# ---------------------------------------------------------------------------
# Test: Edge Cases
# ---------------------------------------------------------------------------

def test_context_builder_empty():
    """Test ContextBuilder with no data."""
    builder = ContextBuilder()
    result = builder.build()
    
    assert result == {}


def test_context_builder_build_returns_copy():
    """Test that build() returns a copy, not the original."""
    builder = ContextBuilder()
    builder.add("key", "value")
    
    result1 = builder.build()
    result2 = builder.build()
    
    # Modify result1
    result1["new_key"] = "new_value"
    
    # result2 should not be affected
    assert "new_key" not in result2
    assert result2 == {"key": "value"}


def test_metrics_duration_without_end_time():
    """Test metrics duration when end_time is not set."""
    metrics = AgentMetrics(
        agent_name="test",
        user_id="user_123",
        start_time=datetime.utcnow(),
    )
    
    duration = metrics.duration_ms()
    assert duration == 0.0


# ---------------------------------------------------------------------------
# Run Tests
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
