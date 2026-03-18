"""
Database utilities for Smartpay AI: PostgreSQL (main data + checkpointer), LanceDB (vectors), DuckDB (analytics).

Location: backend_python/smartpay_ai/db_utils.py
Purpose: 
- PostgreSQL: User data via asyncpg pool + LangGraph checkpointer for conversation state
- LanceDB: Vector embeddings for semantic knowledge base search
- DuckDB: Fast analytics for transaction aggregations and ML training data
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional, List, Dict, Any
from pathlib import Path

import asyncpg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

try:
    import lancedb
    import pyarrow as pa
    LANCEDB_AVAILABLE = True
except ImportError:
    LANCEDB_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("LanceDB not available. Install with: pip install lancedb pyarrow")

try:
    import duckdb
    DUCKDB_AVAILABLE = True
except ImportError:
    DUCKDB_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("DuckDB not available. Install with: pip install duckdb")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SentenceTransformer = None  # Type placeholder
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("sentence-transformers not available. Install with: pip install sentence-transformers")

logger = logging.getLogger(__name__)

# Global connection pools
_pg_pool: asyncpg.Pool | None = None
_lance_db: Optional[Any] = None
_duck_conn: Optional[Any] = None
_embedding_model: Optional[Any] = None  # Use Any instead of SentenceTransformer for compatibility


# ═══════════════════════════════════════════════════════════════
# PostgreSQL (Main Data + Checkpointer)
# ═══════════════════════════════════════════════════════════════

async def get_db_pool() -> asyncpg.Pool:
    """Create or return the shared asyncpg pool for PostgreSQL. Requires DATABASE_URL."""
    global _pg_pool
    if _pg_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL not set")
        _pg_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=10)
        logger.info("PostgreSQL connection pool created")
    return _pg_pool


async def close_db_pool() -> None:
    """Close the PostgreSQL pool (e.g. on app shutdown)."""
    global _pg_pool
    if _pg_pool is not None:
        await _pg_pool.close()
        _pg_pool = None
        logger.info("PostgreSQL connection pool closed")


@asynccontextmanager
async def get_checkpointer() -> AsyncIterator[AsyncPostgresSaver]:
    """Yield an AsyncPostgresSaver for LangGraph state persistence."""
    conn_string = os.getenv("DATABASE_URL")
    if not conn_string:
        raise RuntimeError("DATABASE_URL not set")
    async with AsyncPostgresSaver.from_conn_string(conn_string) as checkpointer:
        await checkpointer.setup()
        yield checkpointer


# ═══════════════════════════════════════════════════════════════
# LanceDB (Vector Embeddings)
# ═══════════════════════════════════════════════════════════════

def get_lancedb() -> Any:
    """Get or create LanceDB connection. Returns db instance."""
    if not LANCEDB_AVAILABLE:
        raise RuntimeError("LanceDB not installed. Run: pip install lancedb pyarrow")
    
    global _lance_db
    if _lance_db is None:
        lance_path = os.getenv("LANCEDB_PATH", "./data/lancedb")
        Path(lance_path).parent.mkdir(parents=True, exist_ok=True)
        _lance_db = lancedb.connect(lance_path)
        logger.info(f"LanceDB connected at {lance_path}")
    return _lance_db


async def get_or_create_knowledge_table(db: Any = None) -> Any:
    """Get or create the knowledge base table in LanceDB."""
    if db is None:
        db = get_lancedb()
    
    table_name = "knowledge_base"
    
    # Always try to open existing table first
    try:
        return db.open_table(table_name)
    except Exception:
        pass
    
    # Only create if table doesn't exist
    schema = pa.schema([
        pa.field("id", pa.string()),
        pa.field("title", pa.string()),
        pa.field("content", pa.string()),
        pa.field("embedding", pa.list_(pa.float32(), 1024)),
        pa.field("metadata", pa.string()),
        pa.field("user_id", pa.string()),
        pa.field("scope", pa.string()),
        pa.field("created_at", pa.timestamp('ms')),
    ])
    
    # Use 'create' mode to avoid overwriting existing data
    table = db.create_table(table_name, schema=schema, mode="create")
    logger.info(f"Created LanceDB table: {table_name}")
    return table


def close_lancedb() -> None:
    """Close LanceDB connection."""
    global _lance_db
    if _lance_db is not None:
        _lance_db = None
        logger.info("LanceDB connection closed")


# ═══════════════════════════════════════════════════════════════
# DuckDB (Analytics)
# ═══════════════════════════════════════════════════════════════

def get_duckdb() -> Any:
    """Get or create DuckDB connection for analytics."""
    if not DUCKDB_AVAILABLE:
        raise RuntimeError("DuckDB not installed. Run: pip install duckdb")
    
    global _duck_conn
    if _duck_conn is None:
        duck_path = os.getenv("DUCKDB_PATH", "./data/analytics.duckdb")
        Path(duck_path).parent.mkdir(parents=True, exist_ok=True)
        _duck_conn = duckdb.connect(duck_path)
        _init_duckdb_schema(_duck_conn)
        logger.info(f"DuckDB connected at {duck_path}")
    return _duck_conn


def _init_duckdb_schema(conn: Any) -> None:
    """Initialize DuckDB schema for analytics tables."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transaction_analytics (
            transaction_id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            amount DECIMAL(18, 2),
            transaction_type VARCHAR,
            category VARCHAR,
            timestamp TIMESTAMP,
            merchant VARCHAR,
            metadata JSON
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ml_training_data (
            id INTEGER PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            feature_type VARCHAR,
            features JSON,
            label VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS spending_patterns (
            user_id VARCHAR,
            period VARCHAR,
            category VARCHAR,
            total_amount DECIMAL(18, 2),
            transaction_count INTEGER,
            avg_amount DECIMAL(18, 2),
            PRIMARY KEY (user_id, period, category)
        )
    """)
    
    logger.info("DuckDB schema initialized")


def close_duckdb() -> None:
    """Close DuckDB connection."""
    global _duck_conn
    if _duck_conn is not None:
        _duck_conn.close()
        _duck_conn = None
        logger.info("DuckDB connection closed")


# ═══════════════════════════════════════════════════════════════
# BGE-M3 Open-Source Embeddings
# ═══════════════════════════════════════════════════════════════

def get_embedding_client() -> SentenceTransformer:
    """Get or initialize the bge-m3 embedding model."""
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        raise RuntimeError("sentence-transformers not installed. Run: pip install sentence-transformers")
    
    global _embedding_model
    if _embedding_model is None:
        model_name = os.getenv("BGE_M3_MODEL_NAME", "BAAI/bge-m3")
        _embedding_model = SentenceTransformer(model_name)
        logger.info(f"Loaded embedding model: {model_name} (1024 dimensions)")
    return _embedding_model


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts using bge-m3.
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors (1024 dimensions each)
    """
    if not texts:
        return []
    
    model = get_embedding_client()
    embeddings = model.encode(texts, convert_to_tensor=False, show_progress_bar=False)
    return embeddings.tolist()


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for a single text using bge-m3.
    
    Args:
        text: Text string to embed
        
    Returns:
        Embedding vector (1024 dimensions)
    """
    embeddings = await generate_embeddings([text])
    return embeddings[0] if embeddings else []


# ═══════════════════════════════════════════════════════════════
# Shutdown
# ═══════════════════════════════════════════════════════════════

async def close_all_connections() -> None:
    """Close all database connections (PostgreSQL, LanceDB, DuckDB)."""
    await close_db_pool()
    close_lancedb()
    close_duckdb()
    logger.info("All database connections closed")
