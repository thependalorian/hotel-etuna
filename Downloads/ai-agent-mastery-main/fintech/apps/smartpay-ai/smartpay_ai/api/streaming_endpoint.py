"""
SSE streaming version of the Smartpay AI Copilot chat endpoint.

Location: backend_python/smartpay_ai/api/streaming_endpoint.py
Purpose: POST /chat/stream with real-time LangGraph updates via Server-Sent Events (SSE).
         Compatible with AG-UI protocol for streaming AI responses.
"""

import json
import logging
from typing import Any, Dict, AsyncIterator

from fastapi import APIRouter, Depends, Request, HTTPException
from sse_starlette import EventSourceResponse
from langgraph.types import Command

from smartpay_ai.agents.copilot.agent import CopilotDeps
from smartpay_ai.agents.copilot.models import ChatRequest
from smartpay_ai.api.copilot_endpoint import get_deps

router = APIRouter(prefix="/api/smartpay-copilot", tags=["copilot-streaming"])
_log = logging.getLogger(__name__)


def _format_message_for_stream(message: Any) -> Dict[str, Any]:
    """Convert LangGraph message to stream-friendly dict."""
    if isinstance(message, dict):
        return message
    
    role = getattr(message, "type", None) or type(message).__name__
    if "human" in role.lower() or "user" in role.lower():
        role = "user"
    elif "ai" in role.lower() or "assistant" in role.lower():
        role = "assistant"
    else:
        role = "assistant"
    
    content = getattr(message, "content", str(message))
    if isinstance(content, list):
        content = " ".join(
            getattr(part, "text", str(part)) for part in content if hasattr(part, "text")
        ) or str(content)
    
    return {"role": role, "content": content}


async def _stream_generator(
    graph: Any,
    req: ChatRequest,
    config: Dict[str, Any],
    deps: CopilotDeps,
) -> AsyncIterator[Dict[str, Any]]:
    """
    Generate SSE events from LangGraph stream.
    
    Event types:
    - node_start: Node execution begins
    - node_end: Node execution completes
    - message: New message added to state
    - tool_call: Tool is being executed
    - interrupt: Human approval required
    - complete: Stream finished
    - error: Error occurred
    """
    try:
        # Determine if we're resuming or starting new conversation
        if req.resume is not None:
            input_data = Command(resume=req.resume)
        else:
            if not req.message:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "message required when resume is not set"})
                }
                return
            input_data = {"messages": [{"role": "user", "content": req.message}]}
        
        # Stream graph execution
        async for chunk in graph.astream(input_data, config=config, context=deps):
            _log.debug("Stream chunk: %s", chunk)
            
            # Handle different chunk types
            if isinstance(chunk, dict):
                # Node execution update
                if "node" in chunk:
                    node_name = chunk["node"]
                    yield {
                        "event": "node_start",
                        "data": json.dumps({"node": node_name, "thread_id": req.thread_id})
                    }
                
                # State update with messages
                if "messages" in chunk:
                    for msg in chunk["messages"]:
                        formatted = _format_message_for_stream(msg)
                        yield {
                            "event": "message",
                            "data": json.dumps({
                                "message": formatted,
                                "thread_id": req.thread_id
                            })
                        }
                
                # Pending action (tool call)
                if "pending_action" in chunk:
                    yield {
                        "event": "tool_call",
                        "data": json.dumps({
                            "action": chunk["pending_action"],
                            "thread_id": req.thread_id
                        })
                    }
                
                # Interrupt for human approval
                if "__interrupt__" in chunk:
                    yield {
                        "event": "interrupt",
                        "data": json.dumps({
                            "approval_payload": chunk["__interrupt__"],
                            "thread_id": req.thread_id
                        })
                    }
                    return
                
                # Error occurred
                if "error_message" in chunk:
                    yield {
                        "event": "error",
                        "data": json.dumps({
                            "error": chunk["error_message"],
                            "thread_id": req.thread_id
                        })
                    }
                    return
        
        # Stream completed successfully
        yield {
            "event": "complete",
            "data": json.dumps({"thread_id": req.thread_id})
        }
    
    except Exception as e:
        _log.error("Stream error: %s", e, exc_info=True)
        yield {
            "event": "error",
            "data": json.dumps({
                "error": str(e),
                "thread_id": req.thread_id
            })
        }


@router.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    request: Request,
    deps: CopilotDeps = Depends(get_deps)
) -> EventSourceResponse:
    """
    Stream chat responses via Server-Sent Events (SSE).
    
    Compatible with AG-UI protocol for real-time AI copilot streaming.
    Client should handle events: message, tool_call, interrupt, complete, error.
    
    Example client (JavaScript):
    ```javascript
    const eventSource = new EventSource('/api/smartpay-copilot/chat/stream');
    eventSource.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        console.log('Message:', data.message);
    });
    eventSource.addEventListener('complete', () => {
        eventSource.close();
    });
    ```
    """
    graph = getattr(request.app.state, "graph", None)
    if graph is None:
        raise HTTPException(
            status_code=503,
            detail="Copilot graph not ready. Ensure lifespan started with DATABASE_URL."
        )
    
    config: Dict[str, Any] = {"configurable": {"thread_id": req.thread_id}}
    
    async def event_generator():
        """Wrap stream generator for EventSourceResponse."""
        async for event in _stream_generator(graph, req, config, deps):
            yield event
    
    return EventSourceResponse(event_generator())
