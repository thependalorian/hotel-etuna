"""
FastAPI endpoints for the agentic RAG system.
"""

import os
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from dotenv import load_dotenv
from .rate_limit import rate_limit, get_client_identifier

# Rate limit configuration
RATE_LIMIT_MAX_REQUESTS = 30

from .agent import rag_agent, AgentDependencies
from .db_utils import (
    initialize_database,
    close_database,
    create_session,
    get_session,
    add_message,
    get_session_messages,
    test_connection
)
from .graph_utils import initialize_graph, close_graph, test_graph_connection
from .models import (
    ChatRequest,
    ChatResponse,
    SearchRequest,
    SearchResponse,
    StreamDelta,
    ErrorResponse,
    HealthStatus,
    ToolCall
)
from .tools import (
    vector_search_tool,
    graph_search_tool,
    hybrid_search_tool,
    list_documents_tool,
    VectorSearchInput,
    GraphSearchInput,
    HybridSearchInput,
    DocumentListInput
)
# Import moved inside functions to avoid circular import

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Application configuration
APP_ENV = os.getenv("APP_ENV", "development")
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", 8000))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Set debug level for our module during development
if APP_ENV == "development":
    logger.setLevel(logging.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app."""
    # Startup
    logger.info("Starting up agentic RAG API...")
    
    try:
        # Initialize database connections
        await initialize_database()
        logger.info("Database initialized")
        
        # Initialize graph database
        await initialize_graph()
        logger.info("Graph database initialized")
        
        # Test connections
        db_ok = await test_connection()
        graph_ok = await test_graph_connection()
        
        if not db_ok:
            logger.error("Database connection failed")
        if not graph_ok:
            logger.error("Graph database connection failed")
        
        logger.info("Agentic RAG API startup complete")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down agentic RAG API...")
    
    try:
        await close_database()
        await close_graph()
        logger.info("Connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# Create FastAPI app
app = FastAPI(
    title="Agentic RAG with Knowledge Graph",
    description="AI agent combining vector search and knowledge graph for tech company analysis",
    version="0.1.0",
    lifespan=lifespan
)

# Add middleware with flexible CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Helper functions for agent execution
async def get_or_create_session(request: ChatRequest) -> str:
    """Get existing session or create new one."""
    if request.session_id:
        session = await get_session(request.session_id)
        if session:
            return request.session_id
    
    # Create new session
    return await create_session(
        user_id=request.user_id,
        metadata=request.metadata
    )


async def get_conversation_context(
    session_id: str,
    max_messages: int = 10
) -> List[Dict[str, str]]:
    """
    Get recent conversation context.
    
    Args:
        session_id: Session ID
        max_messages: Maximum number of messages to retrieve
    
    Returns:
        List of messages
    """
    messages = await get_session_messages(session_id, limit=max_messages)
    
    return [
        {
            "role": msg["role"],
            "content": msg["content"]
        }
        for msg in messages
    ]


def extract_tool_calls(result) -> List[ToolCall]:
    """
    Extract tool calls from Pydantic AI result.
    
    Args:
        result: Pydantic AI result object
    
    Returns:
        List of ToolCall objects
    """
    tools_used = []
    
    try:
        # Get all messages from the result
        messages = result.all_messages()
        
        for message in messages:
            if hasattr(message, 'parts'):
                for part in message.parts:
                    # Check if this is a tool call part
                    if part.__class__.__name__ == 'ToolCallPart':
                        try:
                            # Debug logging to understand structure
                            logger.debug(f"ToolCallPart attributes: {dir(part)}")
                            logger.debug(f"ToolCallPart content: tool_name={getattr(part, 'tool_name', None)}")
                            
                            # Extract tool information safely
                            tool_name = str(part.tool_name) if hasattr(part, 'tool_name') else 'unknown'
                            
                            # Get args - the args field is a JSON string in Pydantic AI
                            tool_args = {}
                            if hasattr(part, 'args') and part.args is not None:
                                if isinstance(part.args, str):
                                    # Args is a JSON string, parse it
                                    try:
                                        import json
                                        tool_args = json.loads(part.args)
                                        logger.debug(f"Parsed args from JSON string: {tool_args}")
                                    except json.JSONDecodeError as e:
                                        logger.debug(f"Failed to parse args JSON: {e}")
                                        tool_args = {}
                                elif isinstance(part.args, dict):
                                    tool_args = part.args
                                    logger.debug(f"Args already a dict: {tool_args}")
                            
                            # Alternative: use args_as_dict method if available
                            if hasattr(part, 'args_as_dict'):
                                try:
                                    tool_args = part.args_as_dict()
                                    logger.debug(f"Got args from args_as_dict(): {tool_args}")
                                except:
                                    pass
                            
                            # Get tool call ID
                            tool_call_id = None
                            if hasattr(part, 'tool_call_id'):
                                tool_call_id = str(part.tool_call_id) if part.tool_call_id else None
                            
                            # Create ToolCall with explicit field mapping
                            tool_call_data = {
                                "tool_name": tool_name,
                                "args": tool_args,
                                "tool_call_id": tool_call_id
                            }
                            logger.debug(f"Creating ToolCall with data: {tool_call_data}")
                            tools_used.append(ToolCall(**tool_call_data))
                        except Exception as e:
                            logger.debug(f"Failed to parse tool call part: {e}")
                            continue
    except Exception as e:
        logger.warning(f"Failed to extract tool calls: {e}")
    
    return tools_used


async def save_conversation_turn(
    session_id: str,
    user_message: str,
    assistant_message: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Save a conversation turn to the database.
    
    Args:
        session_id: Session ID
        user_message: User's message
        assistant_message: Assistant's response
        metadata: Optional metadata
    """
    # Save user message
    await add_message(
        session_id=session_id,
        role="user",
        content=user_message,
        metadata=metadata or {}
    )
    
    # Save assistant message
    await add_message(
        session_id=session_id,
        role="assistant",
        content=assistant_message,
        metadata=metadata or {}
    )


async def execute_agent(
    message: str,
    session_id: str,
    user_id: Optional[str] = None,
    save_conversation: bool = True,
    voice_mode: bool = False,
    metadata: Optional[Dict[str, Any]] = None
) -> tuple[str, List[ToolCall]]:
    """
    Execute the agent with a message.
    
    Args:
        message: User message
        session_id: Session ID
        user_id: Optional user ID
        save_conversation: Whether to save the conversation
        voice_mode: Whether voice mode is enabled
        metadata: Optional metadata including persona information
    
    Returns:
        Tuple of (agent response, tools used)
    """
    try:
        # Create dependencies
        deps = AgentDependencies(
            session_id=session_id,
            user_id=user_id,
            voice_mode=voice_mode
        )
        
        # Get session to check for persona metadata
        session = await get_session(session_id)
        session_metadata = session.get("metadata", {}) if session else {}
        
        # Merge request metadata with session metadata
        combined_metadata = {**(metadata or {}), **session_metadata}
        
        # Get selected persona from metadata
        selected_customer_persona = combined_metadata.get("selected_customer_persona") or combined_metadata.get("selectedCustomerPersona")
        selected_advisor_persona = combined_metadata.get("selected_advisor_persona") or combined_metadata.get("selectedAdvisorPersona")
        
        # Build CRM context automatically if persona is selected
        crm_context = ""
        if selected_customer_persona:
            try:
                from .db_utils import get_customer_by_number, get_customer_policies_db, get_customer_claims_db
                customer = await get_customer_by_number(selected_customer_persona)
                if customer:
                    policies = await get_customer_policies_db(customer["id"])
                    claims = await get_customer_claims_db(customer["id"])
                    
                    crm_context = f"Customer Context: {customer['first_name']} {customer['last_name']} ({customer['customer_number']}), {customer.get('segment', 'Unknown')} segment, {len(policies)} active policies, {len(claims)} claims. "
                    
                    if policies:
                        policy_list = ", ".join([f"{p['product_type']} ({p['policy_number']})" for p in policies[:5]])
                        crm_context += f"Active policies: {policy_list}. "
            except Exception as e:
                logger.warning(f"Failed to load customer context: {e}")
        
        elif selected_advisor_persona:
            try:
                from .db_utils import get_advisor_by_number, get_advisor_clients
                advisor = await get_advisor_by_number(selected_advisor_persona)
                if advisor:
                    clients = await get_advisor_clients(advisor["id"])
                    
                    crm_context = f"Advisor Context: {advisor['first_name']} {advisor['last_name']} ({advisor['advisor_number']}), {advisor.get('specialization', 'Unknown')} specialist, {len(clients)} active clients. "
            except Exception as e:
                logger.warning(f"Failed to load advisor context: {e}")
        
        # Get conversation context
        context = await get_conversation_context(session_id)
        
        # Build prompt with context
        full_prompt = message
        if context:
            context_str = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in context[-6:]  # Last 6 messages (3 turns)
            ])
            full_prompt = f"Previous conversation:\n{context_str}\n\nCurrent question: {message}"
        
        # Add CRM context to system prompt if available
        if crm_context:
            # Update system prompt with CRM context
            original_system_prompt = get_system_prompt(deps)
            enhanced_prompt = original_system_prompt + "\n\n" + crm_context
            # Note: Pydantic AI doesn't allow changing system prompt per run
            # So we'll include it in the message instead
            full_prompt = f"{crm_context}\n\n{full_prompt}"
        
        # Run the agent
        result = await rag_agent.run(full_prompt, deps=deps)
        
        response = result.data
        tools_used = extract_tool_calls(result)
        
        # Save conversation if requested
        if save_conversation:
            await save_conversation_turn(
                session_id=session_id,
                user_message=message,
                assistant_message=response,
                metadata={
                    "user_id": user_id,
                    "tool_calls": len(tools_used),
                    "persona_context": "loaded" if crm_context else "none"
                }
            )
        
        return response, tools_used
        
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        error_response = f"I encountered an error while processing your request: {str(e)}"
        
        if save_conversation:
            await save_conversation_turn(
                session_id=session_id,
                user_message=message,
                assistant_message=error_response,
                metadata={"error": str(e)}
            )
        
        return error_response, []


# Voice Endpoints
@app.get("/voice/stream")
async def voice_stream(
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Voice streaming endpoint for web-based voice interface."""
    try:
        from .voice_handler import create_voice_stream
        stream = create_voice_stream(session_id=session_id, user_id=user_id)
        return StreamingResponse(
            stream.astream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    except Exception as e:
        logger.error(f"Voice stream failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/voice/phone")
async def voice_phone(
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Voice phone endpoint for phone-based voice interface."""
    try:
        from .voice_handler import create_voice_stream
        stream = create_voice_stream(session_id=session_id, user_id=user_id)
        # Launch FastRTC phone interface
        stream.fastphone()
        return {"status": "Phone interface launched", "session_id": session_id}
    except Exception as e:
        logger.error(f"Voice phone failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# API Endpoints
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connections
        db_status = await test_connection()
        graph_status = await test_graph_connection()
        
        # Determine overall status
        if db_status and graph_status:
            status = "healthy"
        elif db_status or graph_status:
            status = "degraded"
        else:
            status = "unhealthy"
        
        return HealthStatus(
            status=status,
            database=db_status,
            graph_database=graph_status,
            llm_connection=True,  # Assume OK if we can respond
            version="0.1.0",
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, http_request: Request):
    """Non-streaming chat endpoint."""
    try:
        # Rate limiting
        client_id = get_client_identifier(http_request)
        allowed, remaining, reset_at = rate_limit(client_id)
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "X-RateLimit-Limit": str(RATE_LIMIT_MAX_REQUESTS),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_at),
                    "Retry-After": str(max(1, reset_at - int(time.time())))
                }
            )
        
        # Get or create session with metadata
        session_id = await get_or_create_session(request)
        
        # Update session metadata if persona information is provided
        if request.metadata:
            session = await get_session(session_id)
            if session:
                # Merge metadata
                existing_metadata = session.get("metadata", {})
                updated_metadata = {**existing_metadata, **request.metadata}
                
                # Update session metadata (would need update_session function)
                # For now, metadata is passed to execute_agent
        
        # Execute agent with metadata
        response, tools_used = await execute_agent(
            message=request.message,
            session_id=session_id,
            user_id=request.user_id,
            metadata=request.metadata
        )
        
        return ChatResponse(
            message=response,
            session_id=session_id,
            tools_used=tools_used,
            metadata={"search_type": str(request.search_type)}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, http_request: Request):
    """Streaming chat endpoint using Server-Sent Events."""
    try:
        # Rate limiting
        client_id = get_client_identifier(http_request)
        allowed, remaining, reset_at = rate_limit(client_id)
        
        if not allowed:
            async def error_stream():
                error_data = {
                    "type": "error",
                    "message": "Rate limit exceeded. Please try again later.",
                    "reset_at": reset_at
                }
                yield f"data: {json.dumps(error_data)}\n\n"
            
            return StreamingResponse(
                error_stream(),
                media_type="text/event-stream",
                status_code=429,
                headers={
                    "X-RateLimit-Limit": str(RATE_LIMIT_MAX_REQUESTS),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_at),
                    "Retry-After": str(max(1, reset_at - int(time.time())))
                }
            )
        
        # Get or create session
        session_id = await get_or_create_session(request)
        
        async def generate_stream():
            """Generate streaming response using agent.iter() pattern."""
            try:
                yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
                
                # Create dependencies
                deps = AgentDependencies(
                    session_id=session_id,
                    user_id=request.user_id
                )
                
                # Get session metadata for persona context
                session = await get_session(session_id)
                session_metadata = session.get("metadata", {}) if session else {}
                combined_metadata = {**(request.metadata or {}), **session_metadata}
                
                # Get selected persona from metadata
                selected_customer_persona = combined_metadata.get("selected_customer_persona") or combined_metadata.get("selectedCustomerPersona")
                selected_advisor_persona = combined_metadata.get("selected_advisor_persona") or combined_metadata.get("selectedAdvisorPersona")
                
                # Build CRM context automatically
                crm_context = ""
                if selected_customer_persona:
                    try:
                        from .db_utils import get_customer_by_number, get_customer_policies_db, get_customer_claims_db
                        customer = await get_customer_by_number(selected_customer_persona)
                        if customer:
                            policies = await get_customer_policies_db(customer["id"])
                            claims = await get_customer_claims_db(customer["id"])
                            crm_context = f"Customer Context: {customer['first_name']} {customer['last_name']} ({customer['customer_number']}), {customer.get('segment', 'Unknown')} segment, {len(policies)} active policies, {len(claims)} claims. "
                    except Exception as e:
                        logger.warning(f"Failed to load customer context: {e}")
                elif selected_advisor_persona:
                    try:
                        from .db_utils import get_advisor_by_number, get_advisor_clients
                        advisor = await get_advisor_by_number(selected_advisor_persona)
                        if advisor:
                            clients = await get_advisor_clients(advisor["id"])
                            crm_context = f"Advisor Context: {advisor['first_name']} {advisor['last_name']} ({advisor['advisor_number']}), {advisor.get('specialization', 'Unknown')} specialist, {len(clients)} active clients. "
                    except Exception as e:
                        logger.warning(f"Failed to load advisor context: {e}")
                
                # Get conversation context
                context = await get_conversation_context(session_id)
                
                # Build input with context
                full_prompt = request.message
                if context:
                    context_str = "\n".join([
                        f"{msg['role']}: {msg['content']}"
                        for msg in context[-6:]
                    ])
                    full_prompt = f"Previous conversation:\n{context_str}\n\nCurrent question: {request.message}"
                
                # Add CRM context if available
                if crm_context:
                    full_prompt = f"{crm_context}\n\n{full_prompt}"
                
                # Save user message immediately
                await add_message(
                    session_id=session_id,
                    role="user",
                    content=request.message,
                    metadata={"user_id": request.user_id}
                )
                
                full_response = ""
                
                # Stream using agent.iter() pattern
                async with rag_agent.iter(full_prompt, deps=deps) as run:
                    async for node in run:
                        if rag_agent.is_model_request_node(node):
                            # Stream tokens from the model
                            async with node.stream(run.ctx) as request_stream:
                                async for event in request_stream:
                                    from pydantic_ai.messages import PartStartEvent, PartDeltaEvent, TextPartDelta
                                    
                                    if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                        delta_content = event.part.content
                                        yield f"data: {json.dumps({'type': 'text', 'content': delta_content})}\n\n"
                                        full_response += delta_content
                                        
                                    elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                        delta_content = event.delta.content_delta
                                        yield f"data: {json.dumps({'type': 'text', 'content': delta_content})}\n\n"
                                        full_response += delta_content
                
                # Extract tools used from the final result
                result = run.result
                tools_used = extract_tool_calls(result)
                
                # Send tools used information
                if tools_used:
                    tools_data = [
                        {
                            "tool_name": tool.tool_name,
                            "args": tool.args,
                            "tool_call_id": tool.tool_call_id
                        }
                        for tool in tools_used
                    ]
                    yield f"data: {json.dumps({'type': 'tools', 'tools': tools_data})}\n\n"
                
                # Save assistant response
                await add_message(
                    session_id=session_id,
                    role="assistant",
                    content=full_response,
                    metadata={
                        "streamed": True,
                        "tool_calls": len(tools_used)
                    }
                )
                
                yield f"data: {json.dumps({'type': 'end'})}\n\n"
                
            except Exception as e:
                logger.error(f"Stream error: {e}")
                error_chunk = {
                    "type": "error",
                    "content": f"Stream error: {str(e)}"
                }
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/vector")
async def search_vector(request: SearchRequest):
    """Vector search endpoint."""
    try:
        input_data = VectorSearchInput(
            query=request.query,
            limit=request.limit
        )
        
        start_time = datetime.now()
        results = await vector_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            results=results,
            total_results=len(results),
            search_type="vector",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/graph")
async def search_graph(request: SearchRequest):
    """Knowledge graph search endpoint."""
    try:
        input_data = GraphSearchInput(
            query=request.query
        )
        
        start_time = datetime.now()
        results = await graph_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            graph_results=results,
            total_results=len(results),
            search_type="graph",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/hybrid")
async def search_hybrid(request: SearchRequest):
    """Hybrid search endpoint."""
    try:
        input_data = HybridSearchInput(
            query=request.query,
            limit=request.limit
        )
        
        start_time = datetime.now()
        results = await hybrid_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            results=results,
            total_results=len(results),
            search_type="hybrid",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Hybrid search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
async def list_documents_endpoint(
    limit: int = 20,
    offset: int = 0
):
    """List documents endpoint."""
    try:
        input_data = DocumentListInput(limit=limit, offset=offset)
        documents = await list_documents_tool(input_data)
        
        return {
            "documents": documents,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Document listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get session information."""
    try:
        session = await get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    
    return ErrorResponse(
        error=str(exc),
        error_type=type(exc).__name__,
        request_id=str(uuid.uuid4())
    )


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "agent.api:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=APP_ENV == "development",
        log_level=LOG_LEVEL.lower()
    )