"""
Admin endpoints for Smartpay AI Copilot management.

Location: backend_python/smartpay_ai/api/admin_endpoint.py
Purpose: Administrative operations - knowledge base ingestion, stats, model reload.
         Requires admin authentication via middleware.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from smartpay_ai.db_utils import get_db_pool

router = APIRouter(prefix="/api/admin", tags=["admin"])
_log = logging.getLogger(__name__)


# ─── Request/Response Models ───

class Article(BaseModel):
    """Knowledge base article for ingestion."""
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Article content (markdown)")
    category: str = Field(..., description="Category (e.g. 'payments', 'loans')")
    tags: List[str] = Field(default_factory=list, description="Tags for search")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class BulkIngestRequest(BaseModel):
    """Request to ingest multiple articles into knowledge base."""
    articles: List[Article] = Field(..., description="Articles to ingest")
    overwrite: bool = Field(default=False, description="Overwrite existing articles")


class BulkIngestResponse(BaseModel):
    """Response from bulk ingestion."""
    success: bool
    ingested_count: int
    skipped_count: int
    errors: List[str] = Field(default_factory=list)


class UsageStats(BaseModel):
    """System usage statistics."""
    total_conversations: int
    total_messages: int
    active_users_today: int
    active_users_week: int
    avg_response_time_ms: float
    top_intents: List[Dict[str, Any]]
    error_rate: float


class ModelReloadResponse(BaseModel):
    """Response from model reload operation."""
    success: bool
    message: str
    reloaded_models: List[str] = Field(default_factory=list)


# ─── Dependency: Admin Role Check ───

async def require_admin(request: Request) -> str:
    """
    Verify admin role from request.
    
    In production, this should validate JWT token and check admin role.
    For now, we check for a simple admin header.
    """
    # Get user from auth middleware (injected by auth.py)
    user = getattr(request.state, "user", None)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    # Check admin role
    is_admin = user.get("role") == "admin" or user.get("is_admin", False)
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    return user.get("user_id", "unknown")


# ─── Admin Endpoints ───

@router.post("/knowledge-base/ingest", response_model=BulkIngestResponse)
async def bulk_ingest_articles(
    req: BulkIngestRequest,
    admin_id: str = Depends(require_admin)
) -> BulkIngestResponse:
    """
    Bulk ingest articles into the knowledge base.
    
    Ingests articles into LanceDB for RAG retrieval.
    Requires admin authentication.
    """
    try:
        from smartpay_ai.knowledge_base.retrieve import add_articles_to_knowledge_base
        
        ingested_count = 0
        skipped_count = 0
        errors = []
        
        # Convert articles to dict format
        articles_data = [article.model_dump() for article in req.articles]
        
        # Ingest articles
        try:
            result = await add_articles_to_knowledge_base(
                articles_data,
                overwrite=req.overwrite
            )
            ingested_count = result.get("ingested", 0)
            skipped_count = result.get("skipped", 0)
            errors = result.get("errors", [])
        except Exception as e:
            _log.error("Knowledge base ingestion failed: %s", e, exc_info=True)
            errors.append(str(e))
        
        _log.info(
            "Admin %s ingested %d articles, skipped %d",
            admin_id, ingested_count, skipped_count
        )
        
        return BulkIngestResponse(
            success=len(errors) == 0,
            ingested_count=ingested_count,
            skipped_count=skipped_count,
            errors=errors
        )
    
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="Knowledge base module not available"
        )
    except Exception as e:
        _log.error("Bulk ingest failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=UsageStats)
async def get_usage_stats(
    admin_id: str = Depends(require_admin)
) -> UsageStats:
    """
    Get system usage statistics.
    
    Returns conversation metrics, active users, performance stats.
    Requires admin authentication.
    """
    try:
        pool = await get_db_pool()
        
        # Get conversation counts
        total_conversations = await pool.fetchval(
            "SELECT COUNT(DISTINCT thread_id) FROM checkpoints"
        ) or 0
        
        # Get message counts (approximate from checkpoints)
        total_messages = await pool.fetchval(
            "SELECT COUNT(*) FROM checkpoints"
        ) or 0
        
        # Active users today (from checkpoint metadata)
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        active_users_today = await pool.fetchval(
            """
            SELECT COUNT(DISTINCT metadata->>'user_id')
            FROM checkpoints
            WHERE checkpoint->>'ts' >= $1
            """,
            today.timestamp()
        ) or 0
        
        # Active users this week
        week_ago = datetime.now() - timedelta(days=7)
        active_users_week = await pool.fetchval(
            """
            SELECT COUNT(DISTINCT metadata->>'user_id')
            FROM checkpoints
            WHERE checkpoint->>'ts' >= $1
            """,
            week_ago.timestamp()
        ) or 0
        
        # Mock data for other stats (would come from metrics collection in production)
        avg_response_time_ms = 450.0
        top_intents = [
            {"intent": "check_balance", "count": 156},
            {"intent": "transfer_money", "count": 89},
            {"intent": "loan_inquiry", "count": 67},
        ]
        error_rate = 0.02
        
        _log.info("Admin %s requested usage stats", admin_id)
        
        return UsageStats(
            total_conversations=total_conversations,
            total_messages=total_messages,
            active_users_today=active_users_today,
            active_users_week=active_users_week,
            avg_response_time_ms=avg_response_time_ms,
            top_intents=top_intents,
            error_rate=error_rate
        )
    
    except Exception as e:
        _log.error("Failed to get usage stats: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/reload", response_model=ModelReloadResponse)
async def reload_ml_models(
    admin_id: str = Depends(require_admin)
) -> ModelReloadResponse:
    """
    Reload ML models from disk.
    
    Useful after training new models or updating model files.
    Requires admin authentication.
    """
    try:
        ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
        
        if not ml_enabled:
            raise HTTPException(
                status_code=503,
                detail="ML service is disabled"
            )
        
        # Try to reload models
        try:
            from smartpay_ai.ml import reload_models
            
            reloaded = reload_models()
            
            _log.info("Admin %s reloaded ML models: %s", admin_id, reloaded)
            
            return ModelReloadResponse(
                success=True,
                message=f"Successfully reloaded {len(reloaded)} model(s)",
                reloaded_models=reloaded
            )
        
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="ML module not available"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        _log.error("Failed to reload models: %s", e, exc_info=True)
        return ModelReloadResponse(
            success=False,
            message=f"Failed to reload models: {str(e)}",
            reloaded_models=[]
        )


@router.get("/system-info")
async def get_system_info(
    admin_id: str = Depends(require_admin)
) -> Dict[str, Any]:
    """
    Get detailed system information.
    
    Returns environment variables, system versions, configuration.
    Requires admin authentication.
    """
    import sys
    from pathlib import Path
    
    _log.info("Admin %s requested system info", admin_id)
    
    return {
        "python_version": sys.version,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database_configured": bool(os.getenv("DATABASE_URL")),
        "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
        "llm_model": os.getenv("LLM_MODEL", "gpt-4o"),
        "ml_enabled": os.getenv("ML_ENABLED", "false").lower() == "true",
        "node_api_url": os.getenv("SMARTPAY_API_BASE_URL"),
        "lancedb_path": os.getenv("LANCEDB_PATH"),
        "duckdb_path": os.getenv("DUCKDB_PATH"),
        "port": int(os.getenv("PORT", "8000")),
        "working_directory": str(Path.cwd()),
    }
