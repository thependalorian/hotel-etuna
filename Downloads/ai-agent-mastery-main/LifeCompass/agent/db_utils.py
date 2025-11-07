"""
Database utilities for PostgreSQL connection and operations.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from uuid import UUID
import logging

import asyncpg
from asyncpg.pool import Pool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class DatabasePool:
    """Manages PostgreSQL connection pool."""
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database pool.
        
        Args:
            database_url: PostgreSQL connection URL
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        self.pool: Optional[Pool] = None
    
    async def initialize(self):
        """Create connection pool."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20,
                max_inactive_connection_lifetime=300,
                command_timeout=60
            )
            logger.info("Database connection pool initialized")
    
    async def close(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def acquire(self):
        """Acquire a connection from the pool."""
        if not self.pool:
            await self.initialize()
        
        async with self.pool.acquire() as connection:
            yield connection


# Global database pool instance
db_pool = DatabasePool()


async def initialize_database():
    """Initialize database connection pool."""
    await db_pool.initialize()


async def close_database():
    """Close database connection pool."""
    await db_pool.close()


# Session Management Functions
async def create_session(
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    timeout_minutes: int = 60
) -> str:
    """
    Create a new session.
    
    Args:
        user_id: Optional user identifier
        metadata: Optional session metadata
        timeout_minutes: Session timeout in minutes
    
    Returns:
        Session ID
    """
    async with db_pool.acquire() as conn:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=timeout_minutes)
        
        result = await conn.fetchrow(
            """
            INSERT INTO sessions (user_id, metadata, expires_at)
            VALUES ($1, $2, $3)
            RETURNING id::text
            """,
            user_id,
            json.dumps(metadata or {}),
            expires_at
        )
        
        return result["id"]


async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get session by ID.
    
    Args:
        session_id: Session UUID
    
    Returns:
        Session data or None if not found/expired
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT 
                id::text,
                user_id,
                metadata,
                created_at,
                updated_at,
                expires_at
            FROM sessions
            WHERE id = $1::uuid
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            """,
            session_id
        )
        
        if result:
            return {
                "id": result["id"],
                "user_id": result["user_id"],
                "metadata": json.loads(result["metadata"]),
                "created_at": result["created_at"].isoformat(),
                "updated_at": result["updated_at"].isoformat(),
                "expires_at": result["expires_at"].isoformat() if result["expires_at"] else None
            }
        
        return None


async def update_session(session_id: str, metadata: Dict[str, Any]) -> bool:
    """
    Update session metadata.
    
    Args:
        session_id: Session UUID
        metadata: New metadata to merge
    
    Returns:
        True if updated, False if not found
    """
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE sessions
            SET metadata = metadata || $2::jsonb
            WHERE id = $1::uuid
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            """,
            session_id,
            json.dumps(metadata)
        )
        
        return result.split()[-1] != "0"


# Message Management Functions
async def add_message(
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Add a message to a session.
    
    Args:
        session_id: Session UUID
        role: Message role (user/assistant/system)
        content: Message content
        metadata: Optional message metadata
    
    Returns:
        Message ID
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            INSERT INTO messages (session_id, role, content, metadata)
            VALUES ($1::uuid, $2, $3, $4)
            RETURNING id::text
            """,
            session_id,
            role,
            content,
            json.dumps(metadata or {})
        )
        
        return result["id"]


async def get_session_messages(
    session_id: str,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Get messages for a session.
    
    Args:
        session_id: Session UUID
        limit: Maximum number of messages to return
    
    Returns:
        List of messages ordered by creation time
    """
    async with db_pool.acquire() as conn:
        query = """
            SELECT 
                id::text,
                role,
                content,
                metadata,
                created_at
            FROM messages
            WHERE session_id = $1::uuid
            ORDER BY created_at
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        results = await conn.fetch(query, session_id)
        
        return [
            {
                "id": row["id"],
                "role": row["role"],
                "content": row["content"],
                "metadata": json.loads(row["metadata"]),
                "created_at": row["created_at"].isoformat()
            }
            for row in results
        ]


# Document Management Functions
async def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    """
    Get document by ID.
    
    Args:
        document_id: Document UUID
    
    Returns:
        Document data or None if not found
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT 
                id::text,
                title,
                source,
                content,
                metadata,
                created_at,
                updated_at
            FROM documents
            WHERE id = $1::uuid
            """,
            document_id
        )
        
        if result:
            return {
                "id": result["id"],
                "title": result["title"],
                "source": result["source"],
                "content": result["content"],
                "metadata": json.loads(result["metadata"]),
                "created_at": result["created_at"].isoformat(),
                "updated_at": result["updated_at"].isoformat()
            }
        
        return None


async def list_documents(
    limit: int = 100,
    offset: int = 0,
    metadata_filter: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    List documents with optional filtering.
    
    Args:
        limit: Maximum number of documents to return
        offset: Number of documents to skip
        metadata_filter: Optional metadata filter
    
    Returns:
        List of documents
    """
    async with db_pool.acquire() as conn:
        query = """
            SELECT 
                d.id::text,
                d.title,
                d.source,
                d.metadata,
                d.created_at,
                d.updated_at,
                COUNT(c.id) AS chunk_count
            FROM documents d
            LEFT JOIN chunks c ON d.id = c.document_id
        """
        
        params = []
        conditions = []
        
        if metadata_filter:
            conditions.append(f"d.metadata @> ${len(params) + 1}::jsonb")
            params.append(json.dumps(metadata_filter))
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += """
            GROUP BY d.id, d.title, d.source, d.metadata, d.created_at, d.updated_at
            ORDER BY d.created_at DESC
            LIMIT $%d OFFSET $%d
        """ % (len(params) + 1, len(params) + 2)
        
        params.extend([limit, offset])
        
        results = await conn.fetch(query, *params)
        
        return [
            {
                "id": row["id"],
                "title": row["title"],
                "source": row["source"],
                "metadata": json.loads(row["metadata"]),
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat(),
                "chunk_count": row["chunk_count"]
            }
            for row in results
        ]


# Vector Search Functions
async def vector_search(
    embedding: List[float],
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Perform vector similarity search.
    
    Args:
        embedding: Query embedding vector
        limit: Maximum number of results
    
    Returns:
        List of matching chunks ordered by similarity (best first)
    """
    async with db_pool.acquire() as conn:
        # Convert embedding to PostgreSQL vector string format
        # PostgreSQL vector format: '[1.0,2.0,3.0]' (no spaces after commas)
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        results = await conn.fetch(
            "SELECT * FROM match_chunks($1::vector, $2)",
            embedding_str,
            limit
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "content": row["content"],
                "similarity": row["similarity"],
                "metadata": json.loads(row["metadata"]),
                "document_title": row["document_title"],
                "document_source": row["document_source"]
            }
            for row in results
        ]


async def hybrid_search(
    embedding: List[float],
    query_text: str,
    limit: int = 10,
    text_weight: float = 0.3
) -> List[Dict[str, Any]]:
    """
    Perform hybrid search (vector + keyword).
    
    Args:
        embedding: Query embedding vector
        query_text: Query text for keyword search
        limit: Maximum number of results
        text_weight: Weight for text similarity (0-1)
    
    Returns:
        List of matching chunks ordered by combined score (best first)
    """
    async with db_pool.acquire() as conn:
        # Convert embedding to PostgreSQL vector string format
        # PostgreSQL vector format: '[1.0,2.0,3.0]' (no spaces after commas)
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        results = await conn.fetch(
            "SELECT * FROM hybrid_search($1::vector, $2, $3, $4)",
            embedding_str,
            query_text,
            limit,
            text_weight
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "content": row["content"],
                "combined_score": row["combined_score"],
                "vector_similarity": row["vector_similarity"],
                "text_similarity": row["text_similarity"],
                "metadata": json.loads(row["metadata"]),
                "document_title": row["document_title"],
                "document_source": row["document_source"]
            }
            for row in results
        ]


# Chunk Management Functions
async def get_document_chunks(document_id: str) -> List[Dict[str, Any]]:
    """
    Get all chunks for a document.
    
    Args:
        document_id: Document UUID
    
    Returns:
        List of chunks ordered by chunk index
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(
            "SELECT * FROM get_document_chunks($1::uuid)",
            document_id
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "content": row["content"],
                "chunk_index": row["chunk_index"],
                "metadata": json.loads(row["metadata"])
            }
            for row in results
        ]


# Utility Functions
async def execute_query(query: str, *params) -> List[Dict[str, Any]]:
    """
    Execute a custom query.
    
    Args:
        query: SQL query
        *params: Query parameters
    
    Returns:
        Query results
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(query, *params)
        return [dict(row) for row in results]


async def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        True if connection successful
    """
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


# ============================================================================
# CRM Database Functions
# ============================================================================

async def get_customer_by_number(customer_number: str) -> Optional[Dict[str, Any]]:
    """Get customer by customer number."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                id::text,
                customer_number,
                first_name,
                last_name,
                email,
                phone_primary,
                phone_secondary,
                date_of_birth,
                address_street,
                address_city,
                address_region,
                occupation,
                monthly_income,
                marital_status,
                dependents_count,
                segment,
                digital_adoption_level,
                preferred_language,
                preferred_contact_method,
                engagement_score,
                lifetime_value,
                churn_risk
            FROM customers
            WHERE customer_number = $1
            """,
            customer_number
        )
        if row:
            return dict(row)
        return None


async def get_customer_policies_db(customer_id: str) -> List[Dict[str, Any]]:
    """Get all policies for a customer."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                id::text,
                policy_number,
                customer_id::text,
                product_type,
                product_subtype,
                status,
                coverage_amount,
                premium_amount,
                premium_frequency,
                start_date,
                end_date,
                created_at
            FROM policies
            WHERE customer_id = $1::uuid
            ORDER BY created_at DESC
            """,
            customer_id
        )
        return [dict(row) for row in rows]


async def get_customer_claims_db(customer_id: str) -> List[Dict[str, Any]]:
    """Get all claims for a customer."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                id::text,
                claim_number,
                policy_id::text,
                customer_id::text,
                claim_type,
                status,
                claim_amount,
                reported_date,
                settled_date,
                description
            FROM claims
            WHERE customer_id = $1::uuid
            ORDER BY reported_date DESC
            """,
            customer_id
        )
        return [dict(row) for row in rows]


async def get_customer_interactions_db(customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get recent interactions for a customer."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                id::text,
                interaction_number,
                customer_id::text,
                advisor_id::text,
                interaction_type,
                channel,
                direction,
                subject,
                content,
                sentiment,
                intent,
                outcome,
                created_at
            FROM interactions
            WHERE customer_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT $2
            """,
            customer_id,
            limit
        )
        return [dict(row) for row in rows]


async def get_advisor_by_number(advisor_number: str) -> Optional[Dict[str, Any]]:
    """Get advisor by advisor number."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                id::text,
                advisor_number,
                first_name,
                last_name,
                email,
                phone,
                specialization,
                experience_years,
                region,
                branch,
                active_clients,
                monthly_target,
                monthly_sales,
                conversion_rate,
                satisfaction_score,
                performance_rating,
                avatar_url
            FROM advisors
            WHERE advisor_number = $1
            """,
            advisor_number
        )
        if row:
            return dict(row)
        return None


async def get_advisor_clients(advisor_id: str) -> List[Dict[str, Any]]:
    """Get all clients for an advisor."""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT
                c.id::text,
                c.customer_number,
                c.first_name,
                c.last_name,
                c.email,
                c.phone_primary,
                c.segment,
                c.engagement_score
            FROM customers c
            INNER JOIN policies p ON c.id = p.customer_id
            WHERE p.advisor_id = $1::uuid
            ORDER BY c.engagement_score DESC
            """,
            advisor_id
        )
        return [dict(row) for row in rows]


async def get_advisor_tasks_db(
    advisor_id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get tasks for an advisor."""
    async with db_pool.acquire() as conn:
        query = """
            SELECT
                id::text,
                task_number,
                advisor_id::text,
                customer_id::text,
                task_type,
                title,
                description,
                priority,
                status,
                due_date,
                completed_date,
                created_at
            FROM tasks
            WHERE advisor_id = $1::uuid
        """
        params = [advisor_id]
        
        if status:
            query += " AND status = $2"
            params.append(status)
        if priority:
            query += f" AND priority = ${len(params) + 1}"
            params.append(priority)
        
        query += " ORDER BY due_date ASC NULLS LAST, priority DESC"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]


async def get_document_files(
    category: Optional[str] = None,
    document_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get PDF documents from document_files table."""
    async with db_pool.acquire() as conn:
        query = """
            SELECT
                id::text,
                document_number,
                title,
                filename,
                file_path,
                original_url,
                file_size_bytes,
                content_type,
                category,
                subcategory,
                document_type,
                description,
                tags,
                download_count,
                view_count,
                is_active,
                created_at,
                updated_at
            FROM document_files
            WHERE is_active = true
        """
        params = []
        
        if category:
            query += " AND category = $1"
            params.append(category)
        if document_type:
            query += f" AND document_type = ${len(params) + 1}"
            params.append(document_type)
        
        query += " ORDER BY category, document_type, title"
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]


async def search_document_files(
    query: str,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Search PDF documents by title or description."""
    async with db_pool.acquire() as conn:
        sql_query = """
            SELECT
                id::text,
                document_number,
                title,
                filename,
                file_path,
                original_url,
                file_size_bytes,
                content_type,
                category,
                subcategory,
                document_type,
                description,
                tags,
                download_count,
                view_count,
                is_active,
                created_at,
                updated_at
            FROM document_files
            WHERE is_active = true
                AND (
                    title ILIKE $1
                    OR description ILIKE $1
                    OR category ILIKE $1
                )
        """
        params = [f"%{query}%"]
        
        if category:
            sql_query += " AND category = $2"
            params.append(category)
        
        sql_query += " ORDER BY category, document_type, title"
        
        rows = await conn.fetch(sql_query, *params)
        return [dict(row) for row in rows]


# Product to Document Number mapping (aligned with frontend)
PRODUCT_DOCUMENT_MAP: Dict[str, Optional[str]] = {
    "OMP Severe Illness Cover": "DOC-004",
    "OMP Funeral Insurance": "DOC-001",  # Extended Family Funeral Cover
    "OMP Disability Income Cover": "DOC-005",
    "Unit Trusts": "DOC-024",  # Unit Trust Individual Buying Form
    "Retirement Solutions": None,  # Search: Investment brochures (Growth Fund, Money Fund)
    "Education Savings Plans": None,  # Search: Investment products
    "Business Insurance": "DOC-013",  # OMP Business Expense Cover
    "Health Insurance": None,  # Search: Injury/Illness forms, general insurance guides
    "Short-term Insurance": "DOC-041",  # Travelsure Brochure (travel insurance)
}

# Product to search keywords mapping (for products without direct document mappings)
PRODUCT_SEARCH_KEYWORDS: Dict[str, List[str]] = {
    "Retirement Solutions": ["retirement", "pension", "annuity", "growth fund", "money fund", "investment"],
    "Education Savings Plans": ["education", "savings", "investment", "unit trust", "growth fund"],
    "Health Insurance": ["health", "medical", "illness", "injury", "disability", "income cover"],
    "Short-term Insurance": ["short-term", "travel", "motor", "property", "vehicle", "accident", "theft"],
}


async def search_documents_by_product(
    product_name: str,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search for documents related to a specific product.
    
    Uses direct document mapping first, then falls back to keyword search
    if no direct mapping exists.
    
    Args:
        product_name: Name of the product (e.g., "Retirement Solutions")
        category: Optional category filter
    
    Returns:
        List of matching documents
    """
    # First, try direct document mapping
    doc_number = PRODUCT_DOCUMENT_MAP.get(product_name)
    if doc_number:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    id::text,
                    document_number,
                    title,
                    filename,
                    file_path,
                    original_url,
                    file_size_bytes,
                    content_type,
                    category,
                    subcategory,
                    document_type,
                    description,
                    tags,
                    download_count,
                    view_count,
                    is_active,
                    created_at,
                    updated_at
                FROM document_files
                WHERE document_number = $1 AND is_active = true
                """,
                doc_number
            )
            if row:
                return [dict(row)]
    
    # If no direct mapping, use keyword search
    keywords = PRODUCT_SEARCH_KEYWORDS.get(product_name, [product_name.lower()])
    
    # Build search query using keywords
    async with db_pool.acquire() as conn:
        # Create a search pattern that matches any keyword
        search_patterns = [f"%{keyword}%" for keyword in keywords]
        
        # Build SQL with OR conditions for each keyword
        conditions = " OR ".join([
            f"(title ILIKE ${i+1} OR description ILIKE ${i+1} OR category ILIKE ${i+1})"
            for i in range(len(search_patterns))
        ])
        
        sql_query = f"""
            SELECT
                id::text,
                document_number,
                title,
                filename,
                file_path,
                original_url,
                file_size_bytes,
                content_type,
                category,
                subcategory,
                document_type,
                description,
                tags,
                download_count,
                view_count,
                is_active,
                created_at,
                updated_at
            FROM document_files
            WHERE is_active = true
                AND ({conditions})
        """
        
        params = search_patterns
        
        if category:
            sql_query += f" AND category = ${len(params) + 1}"
            params.append(category)
        
        sql_query += " ORDER BY category, document_type, title LIMIT 10"
        
        rows = await conn.fetch(sql_query, *params)
        return [dict(row) for row in rows]