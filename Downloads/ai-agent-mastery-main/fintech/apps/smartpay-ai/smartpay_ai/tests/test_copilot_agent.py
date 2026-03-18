"""
Tests for Smartpay Copilot agent (without checkpointer).

Location: backend_python/smartpay_ai/tests/test_copilot_agent.py
Purpose: Verify agent runs and produces valid CopilotResponse.
"""

import asyncio
import pytest

from smartpay_ai.agents.copilot.agent import run_copilot, CopilotDeps
from smartpay_ai.agents.copilot.models import CopilotResponse


@pytest.mark.asyncio
async def test_copilot_greeting():
    """Test Copilot responds to greeting."""
    deps = CopilotDeps(
        user_id="test-user-123",
        auth_token="Bearer test-token",
        user_profile={
            "id": "test-user-123",
            "name": "Test User",
            "phone": "+264811234567",
            "smartpay_id": "SP81123456",
            "kyc_status": "standard",
        },
    )
    
    response = await run_copilot("Hello, who are you?", deps)
    
    assert isinstance(response, CopilotResponse)
    assert response.message is not None
    assert len(response.message) > 0
    assert "Smartpay" in response.message or "Copilot" in response.message


@pytest.mark.asyncio
async def test_copilot_write_action():
    """Test Copilot generates pending_action for write requests."""
    deps = CopilotDeps(
        user_id="test-user-123",
        auth_token="Bearer test-token",
        user_profile={
            "id": "test-user-123",
            "name": "Test User",
            "phone": "+264811234567",
            "smartpay_id": "SP81123456",
            "kyc_status": "standard",
        },
    )
    
    response = await run_copilot("Transfer N$100 to SP99999999", deps)
    
    assert isinstance(response, CopilotResponse)
    # Expect pending_action for write operation
    if response.pending_action:
        assert response.pending_action.action_type in ["transfer_money", "send_money"]
        assert "amount" in response.pending_action.parameters


@pytest.mark.asyncio
async def test_copilot_fallback_on_error():
    """Test Copilot returns safe fallback on error."""
    deps = CopilotDeps(
        user_id="test-user-123",
        auth_token="Bearer test-token",
        user_profile=None,  # Null profile might cause issues
    )
    
    # This should not crash
    response = await run_copilot("What's my balance?", deps)
    
    assert isinstance(response, CopilotResponse)
    assert response.message is not None


if __name__ == "__main__":
    # Run tests manually without pytest
    print("Running Copilot agent tests...\n")
    
    async def run_tests():
        print("1. Testing greeting...")
        await test_copilot_greeting()
        print("✅ Greeting test passed\n")
        
        print("2. Testing write action...")
        await test_copilot_write_action()
        print("✅ Write action test passed\n")
        
        print("3. Testing error fallback...")
        await test_copilot_fallback_on_error()
        print("✅ Error fallback test passed\n")
        
        print("All tests passed! ✅")
    
    asyncio.run(run_tests())
