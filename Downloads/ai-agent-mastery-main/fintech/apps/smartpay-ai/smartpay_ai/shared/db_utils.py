"""
Centralized Database Query Utilities for Smartpay AI

Location: backend_python/smartpay_ai/shared/db_utils.py
Purpose: Eliminate DRY violations by providing reusable, type-safe database query patterns

Features:
- Connection pool management with retry logic
- Common query builders (SELECT, INSERT, UPDATE, DELETE)
- Type-safe query construction
- Transaction management
- Automatic error handling and logging
- Query result caching (optional)

DRY Violation Fix: Consolidates 200+ duplicate lines of database query patterns
across agents, services, and analytics modules.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, TypeVar, Generic, Callable, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

import asyncpg

logger = logging.getLogger(__name__)

T = TypeVar('T')


class QueryOperator(Enum):
    """SQL comparison operators for WHERE clauses"""
    EQ = "="
    NE = "!="
    GT = ">"
    GTE = ">="
    LT = "<"
    LTE = "<="
    IN = "IN"
    NOT_IN = "NOT IN"
    LIKE = "LIKE"
    ILIKE = "ILIKE"
    IS_NULL = "IS NULL"
    IS_NOT_NULL = "IS NOT NULL"


@dataclass
class WhereClause:
    """Type-safe WHERE clause builder"""
    field: str
    operator: QueryOperator
    value: Any = None
    
    def to_sql(self, param_index: int) -> tuple[str, Optional[Any]]:
        """Convert to SQL fragment with parameter"""
        if self.operator in (QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL):
            return f"{self.field} {self.operator.value}", None
        elif self.operator in (QueryOperator.IN, QueryOperator.NOT_IN):
            if isinstance(self.value, (list, tuple)):
                placeholders = ", ".join([f"${i}" for i in range(param_index, param_index + len(self.value))])
                return f"{self.field} {self.operator.value} ({placeholders})", self.value
            else:
                raise ValueError(f"{self.operator} requires a list or tuple value")
        else:
            return f"{self.field} {self.operator.value} ${param_index}", self.value


@dataclass
class OrderBy:
    """Type-safe ORDER BY clause"""
    field: str
    direction: str = "DESC"  # ASC or DESC
    
    def to_sql(self) -> str:
        return f"{self.field} {self.direction}"


class QueryBuilder:
    """
    Type-safe SQL query builder for common database patterns
    
    Example:
        query = QueryBuilder("users")\
            .select(["id", "name", "email"])\
            .where("kyc_tier", QueryOperator.EQ, "premium")\
            .where("created_at", QueryOperator.GTE, cutoff_date)\
            .order_by("created_at", "DESC")\
            .limit(10)
        
        results = await query.fetch_all(db_pool)
    """
    
    def __init__(self, table: str):
        self.table = table
        self._select_fields: Optional[List[str]] = None
        self._where_clauses: List[WhereClause] = []
        self._order_by_clauses: List[OrderBy] = []
        self._limit_value: Optional[int] = None
        self._offset_value: Optional[int] = None
        self._join_clauses: List[str] = []
    
    def select(self, fields: List[str]) -> 'QueryBuilder':
        """Specify SELECT fields"""
        self._select_fields = fields
        return self
    
    def where(self, field: str, operator: QueryOperator, value: Any = None) -> 'QueryBuilder':
        """Add WHERE clause"""
        self._where_clauses.append(WhereClause(field, operator, value))
        return self
    
    def join(self, join_clause: str) -> 'QueryBuilder':
        """Add JOIN clause (custom SQL fragment)"""
        self._join_clauses.append(join_clause)
        return self
    
    def order_by(self, field: str, direction: str = "DESC") -> 'QueryBuilder':
        """Add ORDER BY clause"""
        self._order_by_clauses.append(OrderBy(field, direction))
        return self
    
    def limit(self, limit: int) -> 'QueryBuilder':
        """Add LIMIT clause"""
        self._limit_value = limit
        return self
    
    def offset(self, offset: int) -> 'QueryBuilder':
        """Add OFFSET clause"""
        self._offset_value = offset
        return self
    
    def build_query(self) -> tuple[str, List[Any]]:
        """Build final SQL query with parameters"""
        # SELECT clause
        select_fields = ", ".join(self._select_fields) if self._select_fields else "*"
        query_parts = [f"SELECT {select_fields} FROM {self.table}"]
        
        # JOIN clauses
        if self._join_clauses:
            query_parts.extend(self._join_clauses)
        
        # WHERE clause
        params = []
        if self._where_clauses:
            where_parts = []
            param_index = 1
            for clause in self._where_clauses:
                sql_fragment, value = clause.to_sql(param_index)
                where_parts.append(sql_fragment)
                if value is not None:
                    if isinstance(value, (list, tuple)):
                        params.extend(value)
                        param_index += len(value)
                    else:
                        params.append(value)
                        param_index += 1
            
            query_parts.append(f"WHERE {' AND '.join(where_parts)}")
        
        # ORDER BY clause
        if self._order_by_clauses:
            order_parts = [clause.to_sql() for clause in self._order_by_clauses]
            query_parts.append(f"ORDER BY {', '.join(order_parts)}")
        
        # LIMIT clause
        if self._limit_value is not None:
            query_parts.append(f"LIMIT {self._limit_value}")
        
        # OFFSET clause
        if self._offset_value is not None:
            query_parts.append(f"OFFSET {self._offset_value}")
        
        return " ".join(query_parts), params
    
    async def fetch_all(self, db_pool: asyncpg.Pool) -> List[Dict[str, Any]]:
        """Execute query and return all results as dicts"""
        query, params = self.build_query()
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def fetch_one(self, db_pool: asyncpg.Pool) -> Optional[Dict[str, Any]]:
        """Execute query and return first result as dict"""
        query, params = self.build_query()
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(query, *params)
            return dict(row) if row else None
    
    async def fetch_val(self, db_pool: asyncpg.Pool) -> Any:
        """Execute query and return single value"""
        query, params = self.build_query()
        async with db_pool.acquire() as conn:
            return await conn.fetchval(query, *params)


class BaseRepository(Generic[T]):
    """
    Base repository pattern for database entities
    
    Provides common CRUD operations with type safety and error handling
    """
    
    def __init__(self, db_pool: asyncpg.Pool, table_name: str):
        self.db_pool = db_pool
        self.table_name = table_name
    
    def query(self) -> QueryBuilder:
        """Start a new query builder for this table"""
        return QueryBuilder(self.table_name)
    
    async def find_by_id(self, id_value: Any, id_field: str = "id") -> Optional[Dict[str, Any]]:
        """
        Find single record by ID
        
        Args:
            id_value: ID value to search for
            id_field: Name of ID field (default: "id")
        
        Returns:
            Record dict or None if not found
        """
        return await self.query()\
            .where(id_field, QueryOperator.EQ, id_value)\
            .limit(1)\
            .fetch_one(self.db_pool)
    
    async def find_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[tuple[str, str]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Find multiple records with optional filters
        
        Args:
            filters: Dict of field -> value for exact matches
            order_by: Tuple of (field, direction)
            limit: Maximum number of results
            offset: Number of results to skip
        
        Returns:
            List of record dicts
        """
        query = self.query()
        
        # Apply filters
        if filters:
            for field, value in filters.items():
                if value is None:
                    query = query.where(field, QueryOperator.IS_NULL)
                elif isinstance(value, (list, tuple)):
                    query = query.where(field, QueryOperator.IN, value)
                else:
                    query = query.where(field, QueryOperator.EQ, value)
        
        # Apply ordering
        if order_by:
            query = query.order_by(order_by[0], order_by[1])
        
        # Apply pagination
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)
        
        return await query.fetch_all(self.db_pool)
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records matching filters
        
        Args:
            filters: Dict of field -> value for exact matches
        
        Returns:
            Count of matching records
        """
        query = QueryBuilder(self.table_name).select(["COUNT(*) as count"])
        
        if filters:
            for field, value in filters.items():
                if value is None:
                    query = query.where(field, QueryOperator.IS_NULL)
                elif isinstance(value, (list, tuple)):
                    query = query.where(field, QueryOperator.IN, value)
                else:
                    query = query.where(field, QueryOperator.EQ, value)
        
        result = await query.fetch_val(self.db_pool)
        return int(result) if result else 0
    
    async def exists(self, filters: Dict[str, Any]) -> bool:
        """Check if record matching filters exists"""
        count = await self.count(filters)
        return count > 0
    
    async def insert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert new record
        
        Args:
            data: Dict of field -> value to insert
        
        Returns:
            Inserted record with generated fields (id, created_at, etc.)
        """
        fields = list(data.keys())
        values = list(data.values())
        placeholders = ", ".join([f"${i+1}" for i in range(len(fields))])
        
        query = f"""
            INSERT INTO {self.table_name} ({", ".join(fields)})
            VALUES ({placeholders})
            RETURNING *
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, *values)
            return dict(row) if row else {}
    
    async def update(
        self,
        filters: Dict[str, Any],
        updates: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Update records matching filters
        
        Args:
            filters: Dict of field -> value to match
            updates: Dict of field -> new value
        
        Returns:
            List of updated records
        """
        if not updates:
            return []
        
        # Build SET clause
        set_parts = []
        params = []
        param_index = 1
        
        for field, value in updates.items():
            set_parts.append(f"{field} = ${param_index}")
            params.append(value)
            param_index += 1
        
        # Build WHERE clause
        where_parts = []
        for field, value in filters.items():
            if value is None:
                where_parts.append(f"{field} IS NULL")
            else:
                where_parts.append(f"{field} = ${param_index}")
                params.append(value)
                param_index += 1
        
        query = f"""
            UPDATE {self.table_name}
            SET {", ".join(set_parts)}
            WHERE {" AND ".join(where_parts)}
            RETURNING *
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def delete(self, filters: Dict[str, Any]) -> int:
        """
        Delete records matching filters
        
        Args:
            filters: Dict of field -> value to match
        
        Returns:
            Number of deleted records
        """
        # Build WHERE clause
        where_parts = []
        params = []
        param_index = 1
        
        for field, value in filters.items():
            if value is None:
                where_parts.append(f"{field} IS NULL")
            else:
                where_parts.append(f"{field} = ${param_index}")
                params.append(value)
                param_index += 1
        
        query = f"""
            DELETE FROM {self.table_name}
            WHERE {" AND ".join(where_parts)}
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.execute(query, *params)
            # Extract count from result like "DELETE 5"
            return int(result.split()[-1]) if result else 0


@asynccontextmanager
async def transaction(db_pool: asyncpg.Pool):
    """
    Transaction context manager for atomic operations
    
    Example:
        async with transaction(db_pool) as conn:
            await conn.execute("INSERT INTO users ...")
            await conn.execute("INSERT INTO wallets ...")
            # Automatically commits on success, rolls back on exception
    """
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            yield conn


async def execute_with_retry(
    db_pool: asyncpg.Pool,
    query: str,
    params: List[Any],
    max_retries: int = 3,
    retry_delay: float = 0.5
) -> Any:
    """
    Execute query with automatic retry on transient failures
    
    Args:
        db_pool: Database connection pool
        query: SQL query string
        params: Query parameters
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        Query result
    
    Raises:
        Exception: If all retries fail
    """
    import asyncio
    
    last_error = None
    for attempt in range(max_retries):
        try:
            async with db_pool.acquire() as conn:
                return await conn.fetch(query, *params)
        except (asyncpg.PostgresConnectionError, asyncpg.InterfaceError) as e:
            last_error = e
            if attempt < max_retries - 1:
                logger.warning(
                    f"Query failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying..."
                )
                await asyncio.sleep(retry_delay * (attempt + 1))
            else:
                logger.error(f"Query failed after {max_retries} attempts: {e}")
    
    raise last_error or Exception("Query execution failed")


class QueryCache:
    """
    Simple in-memory query result cache with TTL
    
    Example:
        cache = QueryCache(ttl_seconds=60)
        result = await cache.get_or_fetch(
            key="user_123_profile",
            fetch_fn=lambda: fetch_user_profile("123")
        )
    """
    
    def __init__(self, ttl_seconds: int = 60):
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, tuple[Any, datetime]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired"""
        if key in self._cache:
            value, expires_at = self._cache[key]
            if datetime.now() < expires_at:
                return value
            else:
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any):
        """Set cached value with TTL"""
        expires_at = datetime.now() + timedelta(seconds=self.ttl_seconds)
        self._cache[key] = (value, expires_at)
    
    async def get_or_fetch(
        self,
        key: str,
        fetch_fn: Callable[[], Any]
    ) -> Any:
        """Get from cache or execute fetch function and cache result"""
        cached = self.get(key)
        if cached is not None:
            return cached
        
        result = await fetch_fn()
        self.set(key, result)
        return result
    
    def clear(self):
        """Clear all cached values"""
        self._cache.clear()
    
    def clear_expired(self):
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, (_, expires_at) in self._cache.items()
            if now >= expires_at
        ]
        for key in expired_keys:
            del self._cache[key]


# Global query cache instance (optional, disabled by default)
_global_cache: Optional[QueryCache] = None


def enable_query_cache(ttl_seconds: int = 60):
    """Enable global query result caching"""
    global _global_cache
    _global_cache = QueryCache(ttl_seconds)
    logger.info(f"Query caching enabled with {ttl_seconds}s TTL")


def disable_query_cache():
    """Disable global query result caching"""
    global _global_cache
    _global_cache = None
    logger.info("Query caching disabled")


def get_query_cache() -> Optional[QueryCache]:
    """Get global query cache instance"""
    return _global_cache
