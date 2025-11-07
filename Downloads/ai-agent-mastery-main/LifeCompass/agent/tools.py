"""
Tools for the Pydantic AI agent.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

from pydantic import BaseModel, Field
from dotenv import load_dotenv

from .db_utils import (
    vector_search,
    hybrid_search,
    get_document,
    list_documents,
    get_document_chunks,
    # CRM functions
    get_customer_by_number,
    get_customer_policies_db,
    get_customer_claims_db,
    get_customer_interactions_db,
    get_advisor_by_number,
    get_advisor_clients,
    get_advisor_tasks_db,
    get_document_files,
    search_document_files,
    search_documents_by_product
)
from .graph_utils import (
    search_knowledge_graph,
    get_entity_relationships,
    graph_client
)
from .models import ChunkResult, GraphSearchResult, DocumentMetadata
from .providers import get_embedding_client, get_embedding_model

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize embedding client with flexible provider
embedding_client = get_embedding_client()
EMBEDDING_MODEL = get_embedding_model()


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for text using configured provider (OpenAI, Ollama, etc.).

    Args:
        text: Text to embed

    Returns:
        Embedding vector
    """
    try:
        response = await embedding_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise


# Tool Input Models
class VectorSearchInput(BaseModel):
    """Input for vector search tool."""
    query: str = Field(..., description="Search query")
    limit: int = Field(default=10, description="Maximum number of results")


class GraphSearchInput(BaseModel):
    """Input for graph search tool."""
    query: str = Field(..., description="Search query")


class HybridSearchInput(BaseModel):
    """Input for hybrid search tool."""
    query: str = Field(..., description="Search query")
    limit: int = Field(default=10, description="Maximum number of results")
    text_weight: float = Field(default=0.3, description="Weight for text similarity (0-1)")


class DocumentInput(BaseModel):
    """Input for document retrieval."""
    document_id: str = Field(..., description="Document ID to retrieve")


class DocumentListInput(BaseModel):
    """Input for listing documents."""
    limit: int = Field(default=20, description="Maximum number of documents")
    offset: int = Field(default=0, description="Number of documents to skip")


class EntityRelationshipInput(BaseModel):
    """Input for entity relationship query."""
    entity_name: str = Field(..., description="Name of the entity")
    depth: int = Field(default=2, description="Maximum traversal depth")


class EntityTimelineInput(BaseModel):
    """Input for entity timeline query."""
    entity_name: str = Field(..., description="Name of the entity")
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")


# Tool Implementation Functions
async def vector_search_tool(input_data: VectorSearchInput) -> List[ChunkResult]:
    """
    Perform vector similarity search.
    
    Args:
        input_data: Search parameters
    
    Returns:
        List of matching chunks
    """
    try:
        # Generate embedding for the query
        embedding = await generate_embedding(input_data.query)
        
        # Perform vector search
        results = await vector_search(
            embedding=embedding,
            limit=input_data.limit
        )

        # Convert to ChunkResult models
        return [
            ChunkResult(
                chunk_id=str(r["chunk_id"]),
                document_id=str(r["document_id"]),
                content=r["content"],
                score=r["similarity"],
                metadata=r["metadata"],
                document_title=r["document_title"],
                document_source=r["document_source"]
            )
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []


async def graph_search_tool(input_data: GraphSearchInput) -> List[GraphSearchResult]:
    """
    Search the knowledge graph.
    
    Args:
        input_data: Search parameters
    
    Returns:
        List of graph search results
    """
    try:
        results = await search_knowledge_graph(
            query=input_data.query
        )
        
        # Convert to GraphSearchResult models
        return [
            GraphSearchResult(
                fact=r["fact"],
                uuid=r["uuid"],
                valid_at=r.get("valid_at"),
                invalid_at=r.get("invalid_at"),
                source_node_uuid=r.get("source_node_uuid")
            )
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        return []


async def hybrid_search_tool(input_data: HybridSearchInput) -> List[ChunkResult]:
    """
    Perform hybrid search (vector + keyword).
    
    Args:
        input_data: Search parameters
    
    Returns:
        List of matching chunks
    """
    try:
        # Generate embedding for the query
        embedding = await generate_embedding(input_data.query)
        
        # Perform hybrid search
        results = await hybrid_search(
            embedding=embedding,
            query_text=input_data.query,
            limit=input_data.limit,
            text_weight=input_data.text_weight
        )
        
        # Convert to ChunkResult models
        return [
            ChunkResult(
                chunk_id=str(r["chunk_id"]),
                document_id=str(r["document_id"]),
                content=r["content"],
                score=r["combined_score"],
                metadata=r["metadata"],
                document_title=r["document_title"],
                document_source=r["document_source"]
            )
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Hybrid search failed: {e}")
        return []


async def get_document_tool(input_data: DocumentInput) -> Optional[Dict[str, Any]]:
    """
    Retrieve a complete document.
    
    Args:
        input_data: Document retrieval parameters
    
    Returns:
        Document data or None
    """
    try:
        document = await get_document(input_data.document_id)
        
        if document:
            # Also get all chunks for the document
            chunks = await get_document_chunks(input_data.document_id)
            document["chunks"] = chunks
        
        return document
        
    except Exception as e:
        logger.error(f"Document retrieval failed: {e}")
        return None


async def list_documents_tool(input_data: DocumentListInput) -> List[DocumentMetadata]:
    """
    List available documents.
    
    Args:
        input_data: Listing parameters
    
    Returns:
        List of document metadata
    """
    try:
        documents = await list_documents(
            limit=input_data.limit,
            offset=input_data.offset
        )
        
        # Convert to DocumentMetadata models
        return [
            DocumentMetadata(
                id=d["id"],
                title=d["title"],
                source=d["source"],
                metadata=d["metadata"],
                created_at=datetime.fromisoformat(d["created_at"]),
                updated_at=datetime.fromisoformat(d["updated_at"]),
                chunk_count=d.get("chunk_count")
            )
            for d in documents
        ]
        
    except Exception as e:
        logger.error(f"Document listing failed: {e}")
        return []


async def get_entity_relationships_tool(input_data: EntityRelationshipInput) -> Dict[str, Any]:
    """
    Get relationships for an entity.
    
    Args:
        input_data: Entity relationship parameters
    
    Returns:
        Entity relationships
    """
    try:
        return await get_entity_relationships(
            entity=input_data.entity_name,
            depth=input_data.depth
        )
        
    except Exception as e:
        logger.error(f"Entity relationship query failed: {e}")
        return {
            "central_entity": input_data.entity_name,
            "related_entities": [],
            "relationships": [],
            "depth": input_data.depth,
            "error": str(e)
        }


async def get_entity_timeline_tool(input_data: EntityTimelineInput) -> List[Dict[str, Any]]:
    """
    Get timeline of facts for an entity.
    
    Args:
        input_data: Timeline query parameters
    
    Returns:
        Timeline of facts
    """
    try:
        # Parse dates if provided
        start_date = None
        end_date = None
        
        if input_data.start_date:
            start_date = datetime.fromisoformat(input_data.start_date)
        if input_data.end_date:
            end_date = datetime.fromisoformat(input_data.end_date)
        
        # Get timeline from graph
        timeline = await graph_client.get_entity_timeline(
            entity_name=input_data.entity_name,
            start_date=start_date,
            end_date=end_date
        )
        
        return timeline
        
    except Exception as e:
        logger.error(f"Entity timeline query failed: {e}")
        return []


# Combined search function for agent use
async def perform_comprehensive_search(
    query: str,
    use_vector: bool = True,
    use_graph: bool = True,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Perform a comprehensive search using multiple methods.
    
    Args:
        query: Search query
        use_vector: Whether to use vector search
        use_graph: Whether to use graph search
        limit: Maximum results per search type (only applies to vector search)
    
    Returns:
        Combined search results
    """
    results = {
        "query": query,
        "vector_results": [],
        "graph_results": [],
        "total_results": 0
    }
    
    tasks = []
    
    if use_vector:
        tasks.append(vector_search_tool(VectorSearchInput(query=query, limit=limit)))
    
    if use_graph:
        tasks.append(graph_search_tool(GraphSearchInput(query=query)))
    
    if tasks:
        search_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        if use_vector and not isinstance(search_results[0], Exception):
            results["vector_results"] = search_results[0]
        
        if use_graph:
            graph_idx = 1 if use_vector else 0
            if not isinstance(search_results[graph_idx], Exception):
                results["graph_results"] = search_results[graph_idx]
    
    results["total_results"] = len(results["vector_results"]) + len(results["graph_results"])
    
    return results


# ============================================================================
# CRM Tool Input Models
# ============================================================================

class CustomerProfileInput(BaseModel):
    """Input for customer profile tool."""
    customer_number: str = Field(..., description="Customer number (e.g., CUST-001)")


class CustomerPoliciesInput(BaseModel):
    """Input for customer policies tool."""
    customer_number: str = Field(..., description="Customer number")


class CustomerClaimsInput(BaseModel):
    """Input for customer claims tool."""
    customer_number: str = Field(..., description="Customer number")


class CustomerInteractionsInput(BaseModel):
    """Input for customer interactions tool."""
    customer_number: str = Field(..., description="Customer number")
    limit: int = Field(default=10, description="Maximum number of interactions")


class AdvisorProfileInput(BaseModel):
    """Input for advisor profile tool."""
    advisor_number: str = Field(..., description="Advisor number (e.g., ADV-001)")


class AdvisorTasksInput(BaseModel):
    """Input for advisor tasks tool."""
    advisor_number: str = Field(..., description="Advisor number")
    status: Optional[str] = Field(None, description="Filter by status (open, completed, cancelled)")
    priority: Optional[str] = Field(None, description="Filter by priority (high, medium, low)")


class ListDocumentsInput(BaseModel):
    """Input for listing PDF documents."""
    category: Optional[str] = Field(None, description="Filter by category")
    document_type: Optional[str] = Field(None, description="Filter by document type")


class SearchDocumentsInput(BaseModel):
    """Input for searching PDF documents."""
    query: str = Field(..., description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")


class ProductDocumentSearchInput(BaseModel):
    """Input for searching documents by product name."""
    product_name: str = Field(..., description="Product name (e.g., 'Retirement Solutions', 'Health Insurance')")
    category: Optional[str] = Field(None, description="Filter by category")


class CalculatorInput(BaseModel):
    """Input for calculator tool."""
    expression: str = Field(..., description="Math expression to evaluate")
    calculation_type: Optional[str] = Field(
        default="basic",
        description="Type: basic, financial, premium, return, coverage"
    )
    variables: Optional[Dict[str, float]] = Field(
        default_factory=dict,
        description="Variables to substitute in expression"
    )


# ============================================================================
# CRM Tool Implementation Functions
# ============================================================================
# Note: CRM functions are imported at the top of the file


async def get_customer_profile_tool(input_data: CustomerProfileInput) -> Dict[str, Any]:
    """Get customer profile with policies, claims, and interactions."""
    try:
        customer = await get_customer_by_number(input_data.customer_number)
        if not customer:
            return {"error": f"Customer {input_data.customer_number} not found"}
        
        policies = await get_customer_policies_db(customer["id"])
        claims = await get_customer_claims_db(customer["id"])
        interactions = await get_customer_interactions_db(customer["id"], limit=5)
        
        return {
            "customer": customer,
            "policies": policies,
            "claims": claims,
            "interactions": interactions,
            "policy_count": len(policies),
            "claim_count": len(claims),
            "interaction_count": len(interactions)
        }
    except Exception as e:
        logger.error(f"Get customer profile failed: {e}")
        return {"error": "Failed to retrieve customer profile"}


async def get_customer_policies_tool(input_data: CustomerPoliciesInput) -> List[Dict[str, Any]]:
    """Get all policies for a customer."""
    try:
        customer = await get_customer_by_number(input_data.customer_number)
        if not customer:
            return []
        return await get_customer_policies_db(customer["id"])
    except Exception as e:
        logger.error(f"Get customer policies failed: {e}")
        return []


async def get_customer_claims_tool(input_data: CustomerClaimsInput) -> List[Dict[str, Any]]:
    """Get all claims for a customer."""
    try:
        customer = await get_customer_by_number(input_data.customer_number)
        if not customer:
            return []
        return await get_customer_claims_db(customer["id"])
    except Exception as e:
        logger.error(f"Get customer claims failed: {e}")
        return []


async def get_customer_interactions_tool(input_data: CustomerInteractionsInput) -> List[Dict[str, Any]]:
    """Get recent interactions for a customer."""
    try:
        customer = await get_customer_by_number(input_data.customer_number)
        if not customer:
            return []
        return await get_customer_interactions_db(customer["id"], limit=input_data.limit)
    except Exception as e:
        logger.error(f"Get customer interactions failed: {e}")
        return []


async def get_advisor_profile_tool(input_data: AdvisorProfileInput) -> Dict[str, Any]:
    """Get advisor profile with clients and tasks."""
    try:
        advisor = await get_advisor_by_number(input_data.advisor_number)
        if not advisor:
            return {"error": f"Advisor {input_data.advisor_number} not found"}
        
        clients = await get_advisor_clients(advisor["id"])
        tasks = await get_advisor_tasks_db(advisor["id"], status="open")
        
        return {
            "advisor": advisor,
            "client_count": len(clients),
            "open_task_count": len(tasks),
            "clients": clients[:10],  # Limit to first 10
            "recent_tasks": tasks[:5]  # Limit to first 5
        }
    except Exception as e:
        logger.error(f"Get advisor profile failed: {e}")
        return {"error": "Failed to retrieve advisor profile"}


async def get_advisor_tasks_tool(input_data: AdvisorTasksInput) -> List[Dict[str, Any]]:
    """Get tasks for an advisor."""
    try:
        advisor = await get_advisor_by_number(input_data.advisor_number)
        if not advisor:
            return []
        return await get_advisor_tasks_db(
            advisor["id"],
            status=input_data.status,
            priority=input_data.priority
        )
    except Exception as e:
        logger.error(f"Get advisor tasks failed: {e}")
        return []


async def list_available_documents_tool(input_data: ListDocumentsInput) -> List[Dict[str, Any]]:
    """List available PDF documents."""
    try:
        documents = await get_document_files(
            category=input_data.category,
            document_type=input_data.document_type
        )
        
        return [
            {
                "document_number": doc["document_number"],
                "title": doc["title"],
                "category": doc["category"],
                "document_type": doc["document_type"],
                "description": doc.get("description", ""),
                "view_count": doc.get("view_count", 0),
                "download_count": doc.get("download_count", 0),
                "download_url": f"/api/documents/{doc['document_number']}/download",
                "view_url": f"/api/documents/{doc['document_number']}/view"
            }
            for doc in documents
        ]
    except Exception as e:
        logger.error(f"List documents failed: {e}")
        return []


async def search_documents_tool(input_data: SearchDocumentsInput) -> List[Dict[str, Any]]:
    """Search PDF documents by title or description."""
    try:
        documents = await search_document_files(
            query=input_data.query,
            category=input_data.category
        )
        
        return [
            {
                "document_number": doc["document_number"],
                "title": doc["title"],
                "category": doc["category"],
                "document_type": doc["document_type"],
                "description": doc.get("description", ""),
                "download_url": f"/api/documents/{doc['document_number']}/download",
                "view_url": f"/api/documents/{doc['document_number']}/view"
            }
            for doc in documents
        ]
    except Exception as e:
        logger.error(f"Search documents failed: {e}")
        return []


async def search_documents_by_product_tool(input_data: ProductDocumentSearchInput) -> List[Dict[str, Any]]:
    """
    Search for documents related to a specific product.
    
    Uses intelligent keyword matching to find relevant documents even when
    there's no direct product-to-document mapping.
    
    Supported products:
    - OMP Severe Illness Cover
    - OMP Funeral Insurance
    - OMP Disability Income Cover
    - Unit Trusts
    - Retirement Solutions
    - Education Savings Plans
    - Business Insurance
    - Health Insurance
    - Short-term Insurance
    """
    try:
        documents = await search_documents_by_product(
            product_name=input_data.product_name,
            category=input_data.category
        )
        
        return [
            {
                "document_number": doc["document_number"],
                "title": doc["title"],
                "category": doc["category"],
                "document_type": doc["document_type"],
                "description": doc.get("description", ""),
                "download_url": f"/api/documents/{doc['document_number']}/download",
                "view_url": f"/api/documents/{doc['document_number']}/view"
            }
            for doc in documents
        ]
    except Exception as e:
        logger.error(f"Product document search failed: {e}")
        return []


# ============================================================================
# Calculator Tool
# ============================================================================

import re
import math


async def calculator_tool(input_data: CalculatorInput) -> Dict[str, Any]:
    """Perform mathematical calculations."""
    try:
        expression = input_data.expression
        calculation_type = input_data.calculation_type or "basic"
        variables = input_data.variables or {}
        
        # Replace variables in expression
        processed_expression = expression
        for key, value in variables.items():
            processed_expression = re.sub(rf"\b{key}\b", str(value), processed_expression)
        
        # Sanitize expression (allow only safe math characters)
        sanitized = re.sub(r"[^0-9+\-*/().\s]", "", processed_expression)
        
        if not re.match(r"^[0-9+\-*/().\s]+$", sanitized):
            return {"error": "Invalid expression", "message": "Expression contains invalid characters"}
        
        # Evaluate based on calculation type
        if calculation_type in ["financial", "premium"]:
            result = evaluate_financial_expression(sanitized, variables)
        elif calculation_type == "return":
            result = calculate_return(sanitized, variables)
        elif calculation_type == "coverage":
            result = calculate_coverage(sanitized, variables)
        else:
            result = evaluate_basic_math(sanitized)
        
        return {
            "result": result,
            "formula": processed_expression,
            "expression": sanitized,
            "calculation_type": calculation_type,
            "variables": variables
        }
    except Exception as e:
        logger.error(f"Calculator tool failed: {e}")
        return {
            "error": "Failed to calculate",
            "message": str(e)
        }


def evaluate_basic_math(expression: str) -> float:
    """Safely evaluate basic math expression."""
    try:
        # Validate expression
        if not re.match(r"^[0-9+\-*/().\s]+$", expression):
            raise ValueError("Invalid expression")
        
        # Use eval with safe globals (only math functions)
        safe_dict = {
            "__builtins__": {},
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "pow": pow,
            "math": math
        }
        
        result = eval(expression, safe_dict)
        
        if not isinstance(result, (int, float)) or not math.isfinite(result):
            raise ValueError("Invalid calculation result")
        
        return float(result)
    except Exception as e:
        raise ValueError(f"Calculation error: {str(e)}")


def evaluate_financial_expression(expression: str, variables: Dict[str, float]) -> float:
    """Evaluate financial calculations."""
    # For now, fall back to basic math
    return evaluate_basic_math(expression)


def calculate_return(expression: str, variables: Dict[str, float]) -> float:
    """Calculate investment return."""
    if "currentValue" in variables and "initialValue" in variables:
        return ((variables["currentValue"] - variables["initialValue"]) / variables["initialValue"]) * 100
    return evaluate_basic_math(expression)


def calculate_coverage(expression: str, variables: Dict[str, float]) -> float:
    """Calculate coverage amount."""
    if "monthlyIncome" in variables and "coverageMultiplier" in variables:
        return variables["monthlyIncome"] * variables["coverageMultiplier"]
    return evaluate_basic_math(expression)