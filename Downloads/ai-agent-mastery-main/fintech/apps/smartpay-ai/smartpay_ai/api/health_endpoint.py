"""
Health check endpoints for Smartpay AI Copilot.

Location: backend_python/smartpay_ai/api/health_endpoint.py
Purpose: Basic and detailed health checks for all system components.
         Used by load balancers, monitoring, and mobile app status.
"""

import os
import time
import logging
from typing import Dict, Any, Optional

import httpx
from fastapi import APIRouter, Request

from smartpay_ai.db_utils import get_db_pool

router = APIRouter(prefix="/api/health", tags=["health"])
_log = logging.getLogger(__name__)


async def _check_database() -> Dict[str, Any]:
    """Check PostgreSQL database connectivity and latency."""
    try:
        start = time.time()
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "ok",
            "latency_ms": latency_ms,
            "component": "postgresql"
        }
    except Exception as e:
        _log.error("Database health check failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
            "component": "postgresql"
        }


async def _check_lancedb() -> Dict[str, Any]:
    """Check LanceDB (vector database) availability."""
    try:
        from pathlib import Path
        lancedb_path = os.getenv("LANCEDB_PATH", "./data/lancedb")
        exists = Path(lancedb_path).exists()
        
        if not exists:
            return {
                "status": "warning",
                "message": "LanceDB path does not exist (not initialized yet)",
                "component": "lancedb",
                "path": lancedb_path
            }
        
        # Try to access LanceDB
        import lancedb
        start = time.time()
        db = lancedb.connect(lancedb_path)
        tables = db.table_names()
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "ok",
            "latency_ms": latency_ms,
            "tables": len(tables),
            "component": "lancedb",
            "path": lancedb_path
        }
    except ImportError:
        return {
            "status": "unavailable",
            "message": "LanceDB not installed",
            "component": "lancedb"
        }
    except Exception as e:
        _log.error("LanceDB health check failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
            "component": "lancedb"
        }


async def _check_duckdb() -> Dict[str, Any]:
    """Check DuckDB (analytics database) availability."""
    try:
        from pathlib import Path
        duckdb_path = os.getenv("DUCKDB_PATH", "./data/analytics.duckdb")
        exists = Path(duckdb_path).exists()
        
        if not exists:
            return {
                "status": "warning",
                "message": "DuckDB file does not exist (not initialized yet)",
                "component": "duckdb",
                "path": duckdb_path
            }
        
        # Try to connect to DuckDB
        import duckdb
        start = time.time()
        conn = duckdb.connect(duckdb_path, read_only=True)
        conn.execute("SELECT 1").fetchone()
        conn.close()
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "ok",
            "latency_ms": latency_ms,
            "component": "duckdb",
            "path": duckdb_path
        }
    except ImportError:
        return {
            "status": "unavailable",
            "message": "DuckDB not installed",
            "component": "duckdb"
        }
    except Exception as e:
        _log.error("DuckDB health check failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
            "component": "duckdb"
        }


async def _check_ml_service() -> Dict[str, Any]:
    """Check ML service availability."""
    try:
        ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
        
        if not ml_enabled:
            return {
                "status": "disabled",
                "message": "ML service disabled in config",
                "component": "ml_service"
            }
        
        # Try to import ML module
        from smartpay_ai.ml import ML_AVAILABLE
        
        if not ML_AVAILABLE:
            return {
                "status": "unavailable",
                "message": "ML dependencies not installed",
                "component": "ml_service"
            }
        
        return {
            "status": "ok",
            "component": "ml_service",
            "available": True
        }
    except ImportError:
        return {
            "status": "unavailable",
            "message": "ML module not found",
            "component": "ml_service"
        }
    except Exception as e:
        _log.error("ML service health check failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
            "component": "ml_service"
        }


async def _check_node_api() -> Dict[str, Any]:
    """Check Node.js backend API connectivity."""
    try:
        base_url = os.getenv("SMARTPAY_API_BASE_URL")
        
        if not base_url:
            return {
                "status": "warning",
                "message": "SMARTPAY_API_BASE_URL not configured",
                "component": "node_api"
            }
        
        # Ping the Node API health endpoint
        start = time.time()
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{base_url}/health")
            response.raise_for_status()
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "ok",
            "latency_ms": latency_ms,
            "component": "node_api",
            "url": base_url
        }
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error": "Connection timeout",
            "component": "node_api"
        }
    except Exception as e:
        _log.error("Node API health check failed: %s", e)
        return {
            "status": "error",
            "error": str(e),
            "component": "node_api"
        }


@router.get("/detailed")
async def detailed_health(request: Request) -> Dict[str, Any]:
    """
    Detailed health check for all system components.
    
    Checks:
    - PostgreSQL database connectivity and latency
    - LanceDB vector database availability
    - DuckDB analytics database availability
    - ML service status
    - Node.js backend API connectivity
    - LangGraph copilot graph readiness
    
    Returns overall status:
    - ok: All components healthy
    - degraded: Some components unhealthy but core features work
    - error: Critical components failed
    """
    # Check all components in parallel
    checks = {
        "database": await _check_database(),
        "lancedb": await _check_lancedb(),
        "duckdb": await _check_duckdb(),
        "ml_service": await _check_ml_service(),
        "node_api": await _check_node_api(),
    }
    
    # Check LangGraph availability
    graph_available = getattr(request.app.state, "graph", None) is not None
    checks["copilot_graph"] = {
        "status": "ok" if graph_available else "error",
        "available": graph_available,
        "component": "copilot_graph"
    }
    
    # Determine overall status
    critical_components = ["database", "copilot_graph"]
    has_critical_error = any(
        checks[comp]["status"] == "error" for comp in critical_components
    )
    has_any_error = any(
        check["status"] == "error" for check in checks.values()
    )
    
    if has_critical_error:
        overall_status = "error"
    elif has_any_error:
        overall_status = "degraded"
    else:
        overall_status = "ok"
    
    return {
        "status": overall_status,
        "timestamp": time.time(),
        "service": "smartpay-copilot",
        "version": "0.1.0",
        "checks": checks
    }
