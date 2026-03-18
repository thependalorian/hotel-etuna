"""
Knowledge base ingestion: Batch ingest documents into LanceDB with OpenAI embeddings.

Location: backend_python/smartpay_ai/knowledge_base/ingest.py
Purpose: Ingest knowledge articles (FAQs, regulations, financial literacy) into LanceDB vector store.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import pandas as pd

from smartpay_ai.db_utils import (
    get_lancedb,
    get_or_create_knowledge_table,
    generate_embeddings,
)

logger = logging.getLogger(__name__)


def _generate_doc_id(title: str, content: str) -> str:
    """Generate deterministic document ID for deduplication."""
    content_hash = hashlib.sha256(f"{title}:{content}".encode()).hexdigest()
    return f"kb_{content_hash[:16]}"


async def ingest_documents(
    documents: List[Dict[str, Any]],
    scope: str = "global",
    user_id: Optional[str] = None,
    batch_size: int = 50,
) -> Dict[str, Any]:
    """
    Ingest knowledge base documents into LanceDB with embeddings.
    
    Args:
        documents: List of dicts with keys: title, content, metadata (optional)
        scope: "global" (available to all users) or "user" (private to user_id)
        user_id: Required if scope="user"
        batch_size: Number of documents to embed in one batch (using bge-m3)
        
    Returns:
        Dict with ingestion stats: total, added, skipped, errors
        
    Example document:
        {
            "title": "How to verify my identity (KYC)?",
            "content": "To verify your identity, you need to...",
            "metadata": {"category": "kyc", "language": "en"}
        }
    """
    if not documents:
        return {"total": 0, "added": 0, "skipped": 0, "errors": 0}
    
    if scope == "user" and not user_id:
        raise ValueError("user_id required when scope='user'")
    
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
    except Exception as e:
        logger.exception("Failed to connect to LanceDB: %s", e)
        return {"total": len(documents), "added": 0, "skipped": 0, "errors": len(documents)}
    
    stats = {"total": len(documents), "added": 0, "skipped": 0, "errors": 0}
    
    try:
        existing_ids = set()
        try:
            # Re-open table to get latest state
            table = db.open_table("knowledge_base")
            # Use head() to get all rows, not just first 10
            existing_docs = table.head(1000000)  # Large limit to get all rows
            if not existing_docs.empty:
                existing_ids = set(existing_docs["id"].tolist())
        except Exception:
            pass
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            batch_texts = []
            batch_docs = []
            
            for doc in batch:
                if not doc.get("title") or not doc.get("content"):
                    logger.warning("Skipping document missing title or content: %s", doc)
                    stats["skipped"] += 1
                    continue
                
                doc_id = _generate_doc_id(doc["title"], doc["content"])
                
                if doc_id in existing_ids:
                    logger.debug("Skipping duplicate document: %s", doc["title"])
                    stats["skipped"] += 1
                    continue
                
                batch_texts.append(f"{doc['title']}\n\n{doc['content']}")
                batch_docs.append({
                    "id": doc_id,
                    "title": doc["title"],
                    "content": doc["content"],
                    "metadata": json.dumps(doc.get("metadata", {})),
                    "user_id": user_id or "",
                    "scope": scope,
                })
            
            if not batch_texts:
                continue
            
            try:
                embeddings = await generate_embeddings(batch_texts)
                
                for idx, embedding in enumerate(embeddings):
                    batch_docs[idx]["embedding"] = embedding
                    # Use pandas Timestamp with millisecond precision
                    batch_docs[idx]["created_at"] = pd.Timestamp.now(tz='UTC').floor('ms')
                
                # Add this batch immediately to LanceDB
                try:
                    # Re-open table to ensure fresh connection
                    table = db.open_table("knowledge_base")
                    table.add(batch_docs)
                    stats["added"] += len(batch_docs)
                    logger.info(f"Processed batch: {len(batch_docs)} documents embedded and added to LanceDB")
                    
                    # Verify addition
                    table = db.open_table("knowledge_base")
                    current_count = table.count_rows()
                    logger.info(f"Table now contains {current_count} documents total")
                except Exception as add_error:
                    logger.exception("Failed to add batch to LanceDB: %s", add_error)
                    stats["errors"] += len(batch_docs)
                    stats["added"] -= len(batch_docs)
                
            except Exception as e:
                logger.exception("Failed to generate embeddings for batch: %s", e)
                stats["errors"] += len(batch_texts)
        
    except Exception as e:
        logger.exception("Ingestion failed: %s", e)
        stats["errors"] = stats["total"] - stats["skipped"]
    
    return stats


async def delete_documents(
    document_ids: List[str],
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Delete documents from LanceDB knowledge base.
    
    Args:
        document_ids: List of document IDs to delete
        user_id: Optional user_id for permission check (only delete user's own docs)
        
    Returns:
        Dict with deletion stats: total, deleted, errors
    """
    if not document_ids:
        return {"total": 0, "deleted": 0, "errors": 0}
    
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
    except Exception as e:
        logger.exception("Failed to connect to LanceDB: %s", e)
        return {"total": len(document_ids), "deleted": 0, "errors": len(document_ids)}
    
    stats = {"total": len(document_ids), "deleted": 0, "errors": 0}
    
    try:
        for doc_id in document_ids:
            try:
                condition = f"id = '{doc_id}'"
                if user_id:
                    condition += f" AND user_id = '{user_id}'"
                
                table.delete(condition)
                stats["deleted"] += 1
                logger.debug(f"Deleted document: {doc_id}")
                
            except Exception as e:
                logger.exception("Failed to delete document %s: %s", doc_id, e)
                stats["errors"] += 1
        
        logger.info(f"Deleted {stats['deleted']}/{stats['total']} documents")
        
    except Exception as e:
        logger.exception("Deletion failed: %s", e)
        stats["errors"] = stats["total"]
    
    return stats


async def update_document(
    document_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update an existing document in LanceDB.
    Note: LanceDB doesn't support in-place updates, so we delete and re-add.
    
    Args:
        document_id: Document ID to update
        title: New title (optional)
        content: New content (optional)
        metadata: New metadata (optional)
        user_id: User ID for permission check
        
    Returns:
        Dict with success status and updated document ID
    """
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
        
        df = table.head(1000000)  # Get all rows
        doc_row = df[df["id"] == document_id]
        
        if doc_row.empty:
            return {"success": False, "error": "Document not found"}
        
        if user_id and doc_row.iloc[0]["user_id"] != user_id:
            return {"success": False, "error": "Permission denied"}
        
        doc = doc_row.iloc[0].to_dict()
        
        if title:
            doc["title"] = title
        if content:
            doc["content"] = content
        if metadata:
            doc["metadata"] = json.dumps(metadata)
        
        text_for_embedding = f"{doc['title']}\n\n{doc['content']}"
        new_embedding = await generate_embeddings([text_for_embedding])
        doc["embedding"] = new_embedding[0]
        # Use pandas Timestamp with millisecond precision
        doc["created_at"] = pd.Timestamp.now(tz='UTC').floor('ms')
        
        await delete_documents([document_id], user_id=user_id)
        
        table.add([doc])
        
        logger.info(f"Updated document: {document_id}")
        return {"success": True, "document_id": document_id}
        
    except Exception as e:
        logger.exception("Failed to update document: %s", e)
        return {"success": False, "error": str(e)}


async def search_documents(
    query: str,
    user_id: Optional[str] = None,
    limit: int = 5,
    score_threshold: float = 0.7,
) -> List[Dict[str, Any]]:
    """
    Search documents using vector similarity (wrapper for retrieve.py).
    This function is kept here for convenience but delegates to retrieve.py.
    """
    from smartpay_ai.knowledge_base.retrieve import retrieve
    return await retrieve(query, user_id=user_id, limit=limit, score_threshold=score_threshold)
