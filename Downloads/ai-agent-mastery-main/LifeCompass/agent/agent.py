"""
Main Pydantic AI agent for agentic RAG with knowledge graph.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from pydantic_ai import Agent, RunContext
from dotenv import load_dotenv

from .prompts import SYSTEM_PROMPT
from .providers import get_llm_model
from .tools import (
    vector_search_tool,
    graph_search_tool,
    hybrid_search_tool,
    get_document_tool,
    list_documents_tool,
    get_entity_relationships_tool,
    get_entity_timeline_tool,
    # CRM Tools
    get_customer_profile_tool,
    get_customer_policies_tool,
    get_customer_claims_tool,
    get_customer_interactions_tool,
    get_advisor_profile_tool,
    get_advisor_tasks_tool,
    list_available_documents_tool,
    search_documents_tool,
    calculator_tool,
    # Input Models
    VectorSearchInput,
    GraphSearchInput,
    HybridSearchInput,
    DocumentInput,
    DocumentListInput,
    EntityRelationshipInput,
    EntityTimelineInput,
    CustomerProfileInput,
    CustomerPoliciesInput,
    CustomerClaimsInput,
    CustomerInteractionsInput,
    AdvisorProfileInput,
    AdvisorTasksInput,
    ListDocumentsInput,
    SearchDocumentsInput,
    CalculatorInput
)

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class AgentDependencies:
    """Dependencies for the agent."""
    session_id: str
    user_id: Optional[str] = None
    search_preferences: Dict[str, Any] = None
    voice_mode: bool = False

    def __post_init__(self):
        if self.search_preferences is None:
            self.search_preferences = {
                "use_vector": True,
                "use_graph": True,
                "default_limit": 10
            }


def get_system_prompt(deps: AgentDependencies) -> str:
    """Get the appropriate system prompt based on agent mode."""
    from .prompts import SYSTEM_PROMPT, VOICE_MODE_INSTRUCTIONS

    base_prompt = SYSTEM_PROMPT

    if deps.voice_mode:
        base_prompt += "\n\n" + VOICE_MODE_INSTRUCTIONS

    return base_prompt


# Initialize the agent with flexible model configuration
rag_agent = Agent(
    get_llm_model(),
    deps_type=AgentDependencies,
    system_prompt=SYSTEM_PROMPT
)


# Register tools with proper docstrings (no description parameter)
@rag_agent.tool
async def vector_search(
    ctx: RunContext[AgentDependencies],
    query: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Search for relevant information using semantic similarity.
    
    This tool performs vector similarity search across document chunks
    to find semantically related content. Returns the most relevant results
    regardless of similarity score.
    
    Args:
        query: Search query to find similar content
        limit: Maximum number of results to return (1-50)
    
    Returns:
        List of matching chunks ordered by similarity (best first)
    """
    input_data = VectorSearchInput(
        query=query,
        limit=limit
    )
    
    results = await vector_search_tool(input_data)
    
    # Convert results to dict for agent
    return [
        {
            "content": r.content,
            "score": r.score,
            "document_title": r.document_title,
            "document_source": r.document_source,
            "chunk_id": r.chunk_id
        }
        for r in results
    ]


@rag_agent.tool
async def graph_search(
    ctx: RunContext[AgentDependencies],
    query: str
) -> List[Dict[str, Any]]:
    """
    Search the knowledge graph for facts and relationships.
    
    This tool queries the knowledge graph to find specific facts, relationships 
    between entities, and temporal information. Best for finding specific facts,
    relationships between companies/people/technologies, and time-based information.
    
    Args:
        query: Search query to find facts and relationships
    
    Returns:
        List of facts with associated episodes and temporal data
    """
    input_data = GraphSearchInput(query=query)
    
    results = await graph_search_tool(input_data)
    
    # Convert results to dict for agent
    return [
        {
            "fact": r.fact,
            "uuid": r.uuid,
            "valid_at": r.valid_at,
            "invalid_at": r.invalid_at,
            "source_node_uuid": r.source_node_uuid
        }
        for r in results
    ]


@rag_agent.tool
async def hybrid_search(
    ctx: RunContext[AgentDependencies],
    query: str,
    limit: int = 10,
    text_weight: float = 0.3
) -> List[Dict[str, Any]]:
    """
    Perform both vector and keyword search for comprehensive results.
    
    This tool combines semantic similarity search with keyword matching
    for the best coverage. It ranks results using both vector similarity
    and text matching scores. Best for combining semantic and exact matching.
    
    Args:
        query: Search query for hybrid search
        limit: Maximum number of results to return (1-50)
        text_weight: Weight for text similarity vs vector similarity (0.0-1.0)
    
    Returns:
        List of chunks ranked by combined relevance score
    """
    input_data = HybridSearchInput(
        query=query,
        limit=limit,
        text_weight=text_weight
    )
    
    results = await hybrid_search_tool(input_data)
    
    # Convert results to dict for agent
    return [
        {
            "content": r.content,
            "score": r.score,
            "document_title": r.document_title,
            "document_source": r.document_source,
            "chunk_id": r.chunk_id
        }
        for r in results
    ]


@rag_agent.tool
async def get_document(
    ctx: RunContext[AgentDependencies],
    document_id: str
) -> Optional[Dict[str, Any]]:
    """
    Retrieve the complete content of a specific document.
    
    This tool fetches the full document content along with all its chunks
    and metadata. Best for getting comprehensive information from a specific
    source when you need the complete context.
    
    Args:
        document_id: UUID of the document to retrieve
    
    Returns:
        Complete document data with content and metadata, or None if not found
    """
    input_data = DocumentInput(document_id=document_id)
    
    document = await get_document_tool(input_data)
    
    if document:
        # Format for agent consumption
        return {
            "id": document["id"],
            "title": document["title"],
            "source": document["source"],
            "content": document["content"],
            "chunk_count": len(document.get("chunks", [])),
            "created_at": document["created_at"]
        }
    
    return None


@rag_agent.tool
async def list_documents(
    ctx: RunContext[AgentDependencies],
    limit: int = 20,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    List available documents with their metadata.
    
    This tool provides an overview of all documents in the knowledge base,
    including titles, sources, and chunk counts. Best for understanding
    what information sources are available.
    
    Args:
        limit: Maximum number of documents to return (1-100)
        offset: Number of documents to skip for pagination
    
    Returns:
        List of documents with metadata and chunk counts
    """
    input_data = DocumentListInput(limit=limit, offset=offset)
    
    documents = await list_documents_tool(input_data)
    
    # Convert to dict for agent
    return [
        {
            "id": d.id,
            "title": d.title,
            "source": d.source,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at.isoformat()
        }
        for d in documents
    ]


@rag_agent.tool
async def get_entity_relationships(
    ctx: RunContext[AgentDependencies],
    entity_name: str,
    depth: int = 2
) -> Dict[str, Any]:
    """
    Get all relationships for a specific entity in the knowledge graph.
    
    This tool explores the knowledge graph to find how a specific entity
    (company, person, technology) relates to other entities. Best for
    understanding how companies or technologies relate to each other.
    
    Args:
        entity_name: Name of the entity to explore (e.g., "Google", "OpenAI")
        depth: Maximum traversal depth for relationships (1-5)
    
    Returns:
        Entity relationships and connected entities with relationship types
    """
    input_data = EntityRelationshipInput(
        entity_name=entity_name,
        depth=depth
    )
    
    return await get_entity_relationships_tool(input_data)


@rag_agent.tool
async def get_entity_timeline(
    ctx: RunContext[AgentDependencies],
    entity_name: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get the timeline of facts for a specific entity.
    
    This tool retrieves chronological information about an entity,
    showing how information has evolved over time. Best for understanding
    how information about an entity has developed or changed.
    
    Args:
        entity_name: Name of the entity (e.g., "Microsoft", "AI")
        start_date: Start date in ISO format (YYYY-MM-DD), optional
        end_date: End date in ISO format (YYYY-MM-DD), optional
    
    Returns:
        Chronological list of facts about the entity with timestamps
    """
    input_data = EntityTimelineInput(
        entity_name=entity_name,
        start_date=start_date,
        end_date=end_date
    )
    
    return await get_entity_timeline_tool(input_data)


# ============================================================================
# CRM Tools Registration
# ============================================================================

@rag_agent.tool
async def get_customer_profile(
    ctx: RunContext[AgentDependencies],
    customer_number: str
) -> Dict[str, Any]:
    """
    Retrieve customer profile information from CRM database.
    
    Use this when the user is asking about:
    - Their own profile or account
    - Customer-specific information
    - Policy or claim details for a specific customer
    - Personal financial situation
    
    Args:
        customer_number: Customer number (e.g., "CUST-001")
    
    Returns:
        Customer profile with policies, claims, and engagement metrics
    """
    input_data = CustomerProfileInput(customer_number=customer_number)
    return await get_customer_profile_tool(input_data)


@rag_agent.tool
async def get_customer_policies(
    ctx: RunContext[AgentDependencies],
    customer_number: str
) -> List[Dict[str, Any]]:
    """
    Retrieve all policies for a customer.
    
    Use when customer asks about:
    - Their policies
    - Policy details
    - Coverage information
    - Premium information
    
    Args:
        customer_number: Customer number
    
    Returns:
        List of policies with details
    """
    input_data = CustomerPoliciesInput(customer_number=customer_number)
    return await get_customer_policies_tool(input_data)


@rag_agent.tool
async def get_customer_claims(
    ctx: RunContext[AgentDependencies],
    customer_number: str
) -> List[Dict[str, Any]]:
    """
    Retrieve claim history for a customer.
    
    Use when customer asks about:
    - Claim status
    - Previous claims
    - Claim procedures
    
    Args:
        customer_number: Customer number
    
    Returns:
        List of claims with status and details
    """
    input_data = CustomerClaimsInput(customer_number=customer_number)
    return await get_customer_claims_tool(input_data)


@rag_agent.tool
async def get_customer_interactions(
    ctx: RunContext[AgentDependencies],
    customer_number: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Retrieve recent interactions with a customer.
    
    Use when:
    - Building customer context
    - Understanding customer history
    - Advisor needs customer interaction timeline
    
    Args:
        customer_number: Customer number
        limit: Maximum number of interactions to return
    
    Returns:
        List of interactions with timestamps and channels
    """
    input_data = CustomerInteractionsInput(customer_number=customer_number, limit=limit)
    return await get_customer_interactions_tool(input_data)


@rag_agent.tool
async def get_advisor_profile(
    ctx: RunContext[AgentDependencies],
    advisor_number: str
) -> Dict[str, Any]:
    """
    Retrieve advisor profile and performance metrics.
    
    Use when:
    - Customer wants to know about their advisor
    - Advisor needs their own profile
    - Looking for advisor recommendations
    
    Args:
        advisor_number: Advisor number (e.g., "ADV-001")
    
    Returns:
        Advisor profile with specialization, clients, performance
    """
    input_data = AdvisorProfileInput(advisor_number=advisor_number)
    return await get_advisor_profile_tool(input_data)


@rag_agent.tool
async def get_advisor_tasks(
    ctx: RunContext[AgentDependencies],
    advisor_number: str,
    status: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve tasks for an advisor.
    
    Use when advisor asks about:
    - Their task list
    - Upcoming tasks
    - Task priorities
    - Task completion
    
    Args:
        advisor_number: Advisor number
        status: Filter by status (open, completed, cancelled)
        priority: Filter by priority (high, medium, low)
    
    Returns:
        List of tasks with details
    """
    input_data = AdvisorTasksInput(
        advisor_number=advisor_number,
        status=status,
        priority=priority
    )
    return await get_advisor_tasks_tool(input_data)


@rag_agent.tool
async def list_available_documents(
    ctx: RunContext[AgentDependencies],
    category: Optional[str] = None,
    document_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    List available PDF documents for download or viewing.
    
    Use when customer/advisor asks about:
    - Available forms
    - Product guides
    - Claim forms
    - Policy documents
    
    Args:
        category: Filter by category (Insurance, Investment, Claims, etc.)
        document_type: Filter by type (Product Guide, Form, Brochure)
    
    Returns:
        List of documents with titles, descriptions, and download links
    """
    input_data = ListDocumentsInput(category=category, document_type=document_type)
    return await list_available_documents_tool(input_data)


@rag_agent.tool
async def search_documents(
    ctx: RunContext[AgentDependencies],
    query: str,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search for documents by title or description.
    
    Use when user asks for specific documents like:
    - "funeral cover form"
    - "disability claim form"
    - "unit trust guide"
    
    Args:
        query: Search query
        category: Optional category filter
    
    Returns:
        Matching documents with view and download URLs
    """
    from .tools import SearchDocumentsInput, search_documents_tool
    input_data = SearchDocumentsInput(query=query, category=category)
    return await search_documents_tool(input_data)


@rag_agent.tool
async def search_product_documents(
    ctx: RunContext[AgentDependencies],
    product_name: str,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search for documents related to a specific Old Mutual product.
    
    Use when customer asks about product guides, forms, or documentation for:
    - "Retirement Solutions" - finds retirement, pension, annuity, investment documents
    - "Education Savings Plans" - finds education, savings, investment documents
    - "Health Insurance" - finds health, medical, illness, disability documents
    - "Short-term Insurance" - finds travel, motor, property, accident documents
    - "Business Insurance" - finds business expense cover documents
    - "OMP Severe Illness Cover" - finds severe illness cover guides
    - "OMP Funeral Insurance" - finds funeral cover guides
    - "OMP Disability Income Cover" - finds disability income cover guides
    - "Unit Trusts" - finds unit trust forms and guides
    
    This tool uses intelligent keyword matching to find relevant documents
    even when there's no direct product-to-document mapping.
    
    Args:
        product_name: Name of the product (e.g., "Retirement Solutions")
        category: Optional category filter (Insurance, Investment, Claims, etc.)
    
    Returns:
        List of matching documents with view and download URLs
    """
    from .tools import ProductDocumentSearchInput, search_documents_by_product_tool
    input_data = ProductDocumentSearchInput(product_name=product_name, category=category)
    return await search_documents_by_product_tool(input_data)


@rag_agent.tool
async def calculator(
    ctx: RunContext[AgentDependencies],
    expression: str,
    calculation_type: Optional[str] = "basic",
    variables: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Perform mathematical calculations.
    
    Use when user asks for:
    - Basic math calculations
    - Financial calculations (premiums, returns)
    - Coverage calculations
    - Investment calculations
    
    Args:
        expression: Math expression to evaluate (e.g., "100 * 12", "premium * months")
        calculation_type: Type of calculation (basic, financial, premium, return, coverage)
        variables: Optional variables to substitute in expression
    
    Returns:
        Calculation result with formula and type
    """
    input_data = CalculatorInput(
        expression=expression,
        calculation_type=calculation_type,
        variables=variables or {}
    )
    return await calculator_tool(input_data)