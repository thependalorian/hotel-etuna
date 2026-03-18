"""
Smartpay AI Copilot – FastAPI application entrypoint.

Location: backend_python/smartpay_ai/main.py
Purpose: Lifespan (DB pool + compile graph with checkpointer), mount copilot router, health.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Disable Pydantic logfire plugin to avoid ReadableLogRecord import error with current opentelemetry
os.environ.setdefault("PYDANTIC_DISABLE_PLUGINS", "logfire-plugin")

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from backend_python/ so LLM_* and DATABASE_URL are set before agent imports
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")

from smartpay_ai.api.copilot_endpoint import router as copilot_router
from smartpay_ai.api.streaming_endpoint import router as streaming_router
from smartpay_ai.api.health_endpoint import router as health_router
from smartpay_ai.api.admin_endpoint import router as admin_router
from smartpay_ai.api.ml_endpoint import router as ml_router
from smartpay_ai.middleware.auth import AuthMiddleware
from smartpay_ai.middleware.rate_limit import RateLimitMiddleware
from smartpay_ai.middleware.security import (
    Check2FAMiddleware,
    FraudDetectionMiddleware,
    PaymentRateLimitMiddleware,
    SecurityHeadersMiddleware
)
from smartpay_ai.db_utils import get_db_pool, close_all_connections
from smartpay_ai.graph.workflow import get_compiled_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: Initialize all services. Shutdown: cleanup resources."""
    logger.info("Smartpay AI Copilot starting up...")
    
    # Initialize database pool
    await get_db_pool()
    logger.info("✓ Database pool created")
    
    # Initialize ML service if enabled
    ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
    if ml_enabled:
        try:
            from smartpay_ai.ml import get_ml_service, ML_AVAILABLE
            if ML_AVAILABLE:
                ml_service = get_ml_service()
                ml_service.initialize()
                logger.info("✓ ML service initialized")
            else:
                logger.warning("⚠ ML service disabled (dependencies not installed)")
        except Exception as e:
            logger.warning("⚠ ML service initialization failed: %s", e)
    
    # Initialize knowledge base (LanceDB) if available
    try:
        from pathlib import Path
        lancedb_path = os.getenv("LANCEDB_PATH", "./data/lancedb")
        if Path(lancedb_path).exists():
            logger.info("✓ LanceDB found at %s", lancedb_path)
        else:
            logger.warning("⚠ LanceDB not initialized (run knowledge base ingestion)")
    except Exception as e:
        logger.debug("LanceDB check failed: %s", e)
    
    # Initialize compiled graph with checkpointer
    postgres_uri = os.getenv("DATABASE_URL") or os.getenv("SMARTPAY_CHECKPOINT_DATABASE_URL")
    try:
        if postgres_uri:
            async with get_compiled_graph(postgres_uri) as graph:
                app.state.graph = graph
                logger.info("✓ Copilot graph ready with Postgres checkpointer")
                logger.info("━" * 60)
                logger.info("🚀 Smartpay AI Copilot is ready!")
                logger.info("━" * 60)
                yield
        else:
            logger.warning("⚠ DATABASE_URL not set; Copilot graph not available")
            app.state.graph = None
            yield
    finally:
        logger.info("Shutting down Smartpay AI Copilot...")
        await close_all_connections()
        logger.info("✓ All database connections closed (PostgreSQL, LanceDB, DuckDB)")


app = FastAPI(
    title="Smartpay AI Copilot",
    description="AI-powered financial assistant for Namibia's digital payment platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for React Native mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo dev server
        "exp://localhost:8081",  # Expo app
        "*",  # Allow all in dev (TODO: restrict in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware stack (order matters: bottom middleware runs first)
# Order: Security Headers -> Auth -> 2FA -> Fraud Detection -> Payment Rate Limit -> General Rate Limit

# 1. General rate limiting (runs last, most general)
app.add_middleware(
    RateLimitMiddleware,
    redis_url=os.getenv("REDIS_URL")  # Optional Redis for production
)

# 2. Payment-specific rate limiting (stricter limits for financial operations)
app.add_middleware(
    PaymentRateLimitMiddleware
)

# 3. Fraud detection (check for fraud before processing payments)
app.add_middleware(
    FraudDetectionMiddleware,
    node_api_base_url=os.getenv("SMARTPAY_API_BASE_URL", "http://localhost:4000")
)

# 4. 2FA verification (PSD-12 Section 12.2 - required for payments)
app.add_middleware(
    Check2FAMiddleware,
    node_api_base_url=os.getenv("SMARTPAY_API_BASE_URL", "http://localhost:4000")
)

# 5. Authentication (JWT validation, runs early)
app.add_middleware(
    AuthMiddleware,
    exclude_patterns=["/docs", "/openapi.json", "/redoc"]  # Public API docs
)

# 6. Security headers (runs first, applies to all responses)
app.add_middleware(
    SecurityHeadersMiddleware
)

# Mount routers
app.include_router(copilot_router)
app.include_router(streaming_router)
app.include_router(health_router)
app.include_router(admin_router)
app.include_router(ml_router)


@app.get("/health")
async def health():
    """Health check for load balancer and mobile app."""
    ml_available = False
    try:
        from smartpay_ai.ml import ML_AVAILABLE
        ml_available = ML_AVAILABLE
    except Exception:
        pass
    
    graph_available = getattr(app.state, "graph", None) is not None
    
    return {
        "status": "ok",
        "ml_available": ml_available,
        "graph_available": graph_available,
        "service": "smartpay-copilot",
    }


@app.get("/")
async def root():
    """Root endpoint with comprehensive API documentation."""
    return {
        "service": "Smartpay AI Copilot",
        "version": "0.1.0",
        "description": "AI-powered financial assistant for Namibia's digital payment platform",
        "status": "operational",
        "endpoints": {
            "copilot": {
                "chat": "POST /api/smartpay-copilot/chat",
                "chat_stream": "POST /api/smartpay-copilot/chat/stream (SSE)",
            },
            "health": {
                "basic": "GET /health",
                "detailed": "GET /api/health/detailed",
            },
            "ml": {
                "predict": "POST /api/ml/predict",
                "models": "GET /api/ml/models",
                "health": "GET /api/ml/health",
                "train": "POST /api/ml/train",
            },
            "admin": {
                "ingest": "POST /api/admin/knowledge-base/ingest",
                "stats": "GET /api/admin/stats",
                "reload_models": "POST /api/admin/models/reload",
                "system_info": "GET /api/admin/system-info",
            },
        },
        "documentation": {
            "interactive": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
        "rate_limits": {
            "chat": "100 requests per 15 minutes per user",
            "chat_stream": "50 requests per 15 minutes per user",
            "ml_predict": "200 requests per hour per user",
            "admin": "20 requests per hour per user",
            "payments": "10 requests per hour per user",
            "auth": "5 requests per 15 minutes per user",
            "global": "1000 requests per hour",
        },
        "security": {
            "2fa_enforcement": "PSD-12 Section 12.2 - Required for all payments",
            "fraud_detection": "PSD-12 Section 11.6 - Real-time fraud monitoring",
            "audit_logging": "Complete audit trail for all security events",
            "encryption": "AES-256-GCM with PCI-DSS tokenization",
        }
    }
