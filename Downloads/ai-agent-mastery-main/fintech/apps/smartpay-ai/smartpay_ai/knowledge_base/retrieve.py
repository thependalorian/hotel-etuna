"""
Knowledge base retrieval: Vector semantic search with LanceDB + user isolation.

Location: backend_python/smartpay_ai/knowledge_base/retrieve.py
Purpose: Semantic search over knowledge base using OpenAI embeddings and LanceDB vector similarity.
         Filters by scope (global) or (user + user_id) for privacy isolation.
"""

import json
import logging
from typing import Any, List, Optional

from smartpay_ai.db_utils import (
    get_lancedb,
    get_or_create_knowledge_table,
    generate_embedding,
)

logger = logging.getLogger(__name__)


def _normalize_metadata(raw: Any) -> dict:
    """Return a dict from JSON string or dict."""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


def _create_snippet(content: str, max_length: int = 300) -> str:
    """Create a snippet from content with ellipsis."""
    if not content:
        return ""
    if len(content) <= max_length:
        return content
    return content[:max_length].rsplit(" ", 1)[0] + "…"


async def retrieve(
    query: str,
    user_id: Optional[str] = None,
    limit: int = 5,
    score_threshold: float = 0.7,
) -> List[dict]:
    """
    Search the knowledge base using vector similarity with user isolation.
    
    Returns documents where:
    - scope='global' (available to all users), OR
    - scope='user' AND user_id matches (private documents)
    
    Uses:
    - BAAI/bge-m3 open-source embeddings for query embedding (1024 dimensions)
    - LanceDB cosine similarity search
    - User isolation filtering
    
    Args:
        query: Natural language search query
        user_id: Optional user ID for scoped search
        limit: Maximum number of results to return
        score_threshold: Minimum similarity score (0-1, default 0.7)
        
    Returns:
        List of dicts with: id, title, snippet, score, metadata
    """
    if not query or not query.strip():
        return []
    
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
    except Exception as e:
        logger.exception("Failed to connect to LanceDB: %s", e)
        return []
    
    try:
        query_embedding = await generate_embedding(query.strip())
        
        if not query_embedding:
            logger.warning("Failed to generate query embedding")
            return []
        
        # Search for more results than needed to account for filtering
        search_results = (
            table.search(query_embedding, vector_column_name="embedding")
            .limit(limit * 5)  # Get 5x results to account for filtering
            .to_pandas()
        )
        
        if search_results.empty:
            return []
        
        filtered_results = []
        for _, row in search_results.iterrows():
            scope = row.get("scope", "global")
            row_user_id = row.get("user_id", "")
            score = float(row.get("_distance", 0))
            
            similarity_score = 1.0 - score
            
            if similarity_score < score_threshold:
                continue
            
            if scope == "global":
                pass
            elif scope == "user" and user_id and row_user_id == user_id:
                pass
            else:
                continue
            
            filtered_results.append({
                "id": str(row["id"]),
                "title": row["title"],
                "snippet": _create_snippet(row["content"], max_length=300),
                "score": round(similarity_score, 4),
                "metadata": _normalize_metadata(row.get("metadata")),
            })
            
            if len(filtered_results) >= limit:
                break
        
        filtered_results.sort(key=lambda x: x["score"], reverse=True)
        
        logger.info(
            f"Vector search: query='{query[:50]}...', results={len(filtered_results)}, "
            f"user_id={user_id or 'None'}"
        )
        
        return filtered_results
        
    except Exception as e:
        logger.exception("Vector search failed: %s", e)
        return []


async def retrieve_by_id(
    document_id: str,
    user_id: Optional[str] = None,
) -> Optional[dict]:
    """
    Retrieve a specific document by ID with user isolation.
    
    Args:
        document_id: Document ID to retrieve
        user_id: Optional user ID for permission check
        
    Returns:
        Document dict or None if not found or no permission
    """
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
        
        df = table.head(1000000)  # Get all rows, not just first 10
        doc_row = df[df["id"] == document_id]
        
        if doc_row.empty:
            return None
        
        row = doc_row.iloc[0]
        scope = row.get("scope", "global")
        row_user_id = row.get("user_id", "")
        
        if scope == "user" and user_id != row_user_id:
            logger.warning(f"Permission denied: user {user_id} cannot access document {document_id}")
            return None
        
        return {
            "id": str(row["id"]),
            "title": row["title"],
            "content": row["content"],
            "metadata": _normalize_metadata(row.get("metadata")),
            "scope": scope,
            "user_id": row_user_id,
        }
        
    except Exception as e:
        logger.exception("Failed to retrieve document by ID: %s", e)
        return None


async def list_documents(
    user_id: Optional[str] = None,
    scope: Optional[str] = None,
    limit: int = 50,
) -> List[dict]:
    """
    List documents with optional filtering.
    
    Args:
        user_id: Filter by user_id (for scope='user' documents)
        scope: Filter by scope ('global' or 'user')
        limit: Maximum number of documents to return
        
    Returns:
        List of document summaries
    """
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
        
        df = table.head(1000000)  # Get all rows, not just first 10
        
        if scope:
            df = df[df["scope"] == scope]
        
        if user_id and scope == "user":
            df = df[df["user_id"] == user_id]
        
        df = df.head(limit)
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "id": str(row["id"]),
                "title": row["title"],
                "snippet": _create_snippet(row["content"], max_length=150),
                "scope": row.get("scope", "global"),
                "metadata": _normalize_metadata(row.get("metadata")),
            })
        
        return results
        
    except Exception as e:
        logger.exception("Failed to list documents: %s", e)
        return []


async def add_articles_to_knowledge_base(
    articles: List[dict],
    overwrite: bool = False
) -> dict:
    """
    Bulk ingest articles into knowledge base.
    
    Args:
        articles: List of article dicts with title, content, category, tags, metadata
        overwrite: Whether to overwrite existing articles with same title
        
    Returns:
        Dict with ingested_count, skipped_count, errors
    """
    ingested = 0
    skipped = 0
    errors = []
    
    try:
        import uuid
        from smartpay_ai.db_utils import get_lancedb, get_or_create_knowledge_table
        
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
        
        # Get existing titles if not overwriting
        existing_titles = set()
        if not overwrite:
            try:
                df = table.head(1000000)  # Get all rows, not just first 10
                existing_titles = set(df["title"].tolist())
            except Exception as e:
                logger.warning("Could not load existing titles: %s", e)
        
        # Process articles
        records_to_add = []
        for article in articles:
            try:
                title = article.get("title", "").strip()
                content = article.get("content", "").strip()
                
                if not title or not content:
                    errors.append(f"Article missing title or content: {title}")
                    skipped += 1
                    continue
                
                # Skip if exists and not overwriting
                if title in existing_titles and not overwrite:
                    skipped += 1
                    continue
                
                # Generate embedding
                embedding = await generate_embedding(f"{title}\n{content}")
                
                if not embedding:
                    errors.append(f"Failed to generate embedding for: {title}")
                    skipped += 1
                    continue
                
                # Create record
                record = {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "content": content,
                    "embedding": embedding,
                    "scope": "global",  # Admin-ingested articles are global
                    "user_id": "",
                    "metadata": json.dumps({
                        "category": article.get("category", ""),
                        "tags": article.get("tags", []),
                        **(article.get("metadata", {}))
                    })
                }
                
                records_to_add.append(record)
                ingested += 1
                
            except Exception as e:
                logger.error("Failed to process article '%s': %s", article.get("title"), e)
                errors.append(f"Article '{article.get('title')}': {str(e)}")
                skipped += 1
        
        # Add records to LanceDB
        if records_to_add:
            try:
                table.add(records_to_add)
                logger.info("Added %d articles to knowledge base", len(records_to_add))
            except Exception as e:
                logger.error("Failed to add records to LanceDB: %s", e)
                errors.append(f"Database error: {str(e)}")
                ingested = 0
        
        return {
            "ingested": ingested,
            "skipped": skipped,
            "errors": errors
        }
        
    except Exception as e:
        logger.exception("Bulk ingest failed: %s", e)
        return {
            "ingested": 0,
            "skipped": len(articles),
            "errors": [str(e)]
        }
