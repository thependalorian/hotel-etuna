"""
Analytics API Endpoints

Location: backend_python/smartpay_ai/api/analytics_endpoint.py
Purpose: FastAPI endpoints for DuckDB analytics queries
Usage: RESTful API for transaction, user, fraud, and business intelligence analytics
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field

from smartpay_ai.analytics.duckdb_manager import DuckDBManager
from smartpay_ai.analytics.etl_pipeline import ETLPipeline

logger = logging.getLogger(__name__)

# Create router
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Initialize DuckDB manager (singleton pattern)
_duckdb_manager: Optional[DuckDBManager] = None


def get_duckdb_manager() -> DuckDBManager:
    """Get or create DuckDB manager instance"""
    global _duckdb_manager
    if _duckdb_manager is None:
        _duckdb_manager = DuckDBManager()
    return _duckdb_manager


# Request/Response Models
class DateRangeParams(BaseModel):
    """Common date range parameters"""
    start_date: Optional[datetime] = Field(None, description="Start date for analysis")
    end_date: Optional[datetime] = Field(None, description="End date for analysis")


class TransactionAnalyticsResponse(BaseModel):
    """Transaction analytics response"""
    period: Dict[str, str]
    filters: Dict[str, Any]
    metrics: Dict[str, Any]
    category_breakdown: List[Dict[str, Any]]
    time_series: List[Dict[str, Any]]


class UserAnalyticsResponse(BaseModel):
    """User analytics response"""
    user_id: str
    period_days: int
    spending: Dict[str, Any]
    fraud_risk: Dict[str, Any]
    generated_at: str


class FraudAnalyticsResponse(BaseModel):
    """Fraud analytics response"""
    period_days: int
    user_id_filter: Optional[str]
    statistics: Dict[str, Any]
    high_risk_transactions: List[Dict[str, Any]]


class ETLSyncResponse(BaseModel):
    """ETL sync response"""
    sync_type: str
    started_at: str
    completed_at: str
    duration_seconds: float
    success_count: int
    total_tables: int
    tables: List[Dict[str, Any]]


# ============================================================================
# TRANSACTION ANALYTICS ENDPOINTS
# ============================================================================

@analytics_router.get("/transactions", response_model=TransactionAnalyticsResponse)
async def get_transaction_analytics(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get comprehensive transaction analytics
    
    **Query Parameters:**
    - user_id: Filter transactions by user
    - category: Filter transactions by category
    - start_date: Start date for analysis (default: 30 days ago)
    - end_date: End date for analysis (default: now)
    
    **Returns:**
    - Aggregated transaction metrics
    - Category breakdown
    - Time series data
    """
    try:
        result = manager.get_transaction_analytics(
            user_id=user_id,
            category=category,
            start_date=start_date,
            end_date=end_date
        )
        return result
    except Exception as e:
        logger.error(f"Transaction analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/transactions/merchant/{merchant}")
async def get_merchant_analytics(
    merchant: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get analytics for a specific merchant
    
    **Path Parameters:**
    - merchant: Merchant name
    
    **Query Parameters:**
    - days: Analysis period in days
    """
    try:
        result = manager.get_merchant_analytics(merchant=merchant, days=days)
        return result
    except Exception as e:
        logger.error(f"Merchant analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/transactions/merchants")
async def get_top_merchants(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get top merchants by transaction volume
    
    **Query Parameters:**
    - days: Analysis period in days
    
    **Returns:**
    - List of top 20 merchants with transaction metrics
    """
    try:
        result = manager.get_merchant_analytics(merchant=None, days=days)
        return result
    except Exception as e:
        logger.error(f"Top merchants error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/transactions/trends")
async def get_transaction_trends(
    metric: str = Query("volume", regex="^(volume|count|users|avg_amount)$", description="Metric to track"),
    interval: str = Query("day", regex="^(hour|day|week|month)$", description="Time interval"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get transaction trends over time
    
    **Query Parameters:**
    - metric: Metric to track (volume, count, users, avg_amount)
    - interval: Aggregation interval (hour, day, week, month)
    - days: Analysis period in days
    
    **Returns:**
    - Time series data for the specified metric
    """
    try:
        result = manager.get_trend_analytics(
            metric=metric,
            interval=interval,
            days=days
        )
        return result
    except Exception as e:
        logger.error(f"Transaction trends error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# USER ANALYTICS ENDPOINTS
# ============================================================================

@analytics_router.get("/users/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get comprehensive analytics for a specific user
    
    **Path Parameters:**
    - user_id: User identifier
    
    **Query Parameters:**
    - days: Analysis period in days
    
    **Returns:**
    - User spending patterns
    - Fraud risk assessment
    - Category preferences
    """
    try:
        result = manager.get_user_analytics(user_id=user_id, days=days)
        return result
    except Exception as e:
        logger.error(f"User analytics error for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/users/{user_id}/spending")
async def get_user_spending(
    user_id: str,
    days: int = Query(30, ge=1, le=365),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get detailed spending analytics for a user
    
    **Path Parameters:**
    - user_id: User identifier
    
    **Returns:**
    - Overall spending metrics
    - Category breakdown
    - Time series
    - Budget variance
    """
    try:
        result = manager.spending.export_insights_for_agent(user_id)
        return result
    except Exception as e:
        logger.error(f"User spending error for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FRAUD ANALYTICS ENDPOINTS
# ============================================================================

@analytics_router.get("/fraud", response_model=FraudAnalyticsResponse)
async def get_fraud_analytics(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get fraud detection analytics
    
    **Query Parameters:**
    - user_id: Optional user filter
    - days: Analysis period in days
    
    **Returns:**
    - Fraud statistics
    - High-risk transactions
    - Risk patterns
    """
    try:
        result = manager.get_fraud_analytics(user_id=user_id, days=days)
        return result
    except Exception as e:
        logger.error(f"Fraud analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/fraud/user/{user_id}/risk")
async def get_user_fraud_risk(
    user_id: str,
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get fraud risk assessment for a specific user
    
    **Path Parameters:**
    - user_id: User identifier
    
    **Returns:**
    - Risk score and level
    - Velocity metrics
    - Risk patterns
    """
    try:
        result = manager.fraud.export_insights_for_agent(user_id)
        return result
    except Exception as e:
        logger.error(f"User fraud risk error for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/fraud/transaction/{transaction_id}/analyze")
async def analyze_transaction_fraud(
    transaction_id: str,
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Analyze a specific transaction for fraud indicators
    
    **Path Parameters:**
    - transaction_id: Transaction identifier
    
    **Returns:**
    - Risk score
    - Detected anomalies
    - Risk factors
    """
    try:
        result = manager.fraud.anomaly_detection_rules(transaction_id)
        return result
    except Exception as e:
        logger.error(f"Transaction fraud analysis error for {transaction_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BUSINESS REPORTING ENDPOINTS
# ============================================================================

@analytics_router.get("/reports/dashboard")
async def get_executive_dashboard(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get executive dashboard metrics
    
    **Query Parameters:**
    - days: Analysis period in days
    
    **Returns:**
    - Daily metrics
    - Growth rates
    - Key performance indicators
    """
    try:
        from smartpay_ai.analytics.queries.reporting_queries import REPORTING_QUERIES
        
        start_date = datetime.now() - timedelta(days=days)
        end_date = datetime.now()
        
        df = manager.execute_query(
            REPORTING_QUERIES["executive_dashboard"],
            [start_date, end_date]
        )
        
        return {
            "period_days": days,
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Executive dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/reports/monthly")
async def get_monthly_report(
    months: int = Query(6, ge=1, le=24, description="Number of months to include"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get monthly summary report
    
    **Query Parameters:**
    - months: Number of months to include
    
    **Returns:**
    - Monthly aggregated metrics
    - Revenue and transaction trends
    """
    try:
        from smartpay_ai.analytics.queries.reporting_queries import REPORTING_QUERIES
        
        start_date = datetime.now() - timedelta(days=months * 30)
        end_date = datetime.now()
        
        df = manager.execute_query(
            REPORTING_QUERIES["monthly_summary"],
            [start_date, end_date]
        )
        
        return {
            "months_included": months,
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Monthly report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/reports/categories")
async def get_category_performance(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get category performance report
    
    **Query Parameters:**
    - days: Analysis period in days
    
    **Returns:**
    - Revenue by category
    - Transaction volumes
    - User engagement per category
    """
    try:
        from smartpay_ai.analytics.queries.reporting_queries import REPORTING_QUERIES
        
        start_date = datetime.now() - timedelta(days=days)
        end_date = datetime.now()
        
        df = manager.execute_query(
            REPORTING_QUERIES["category_performance"],
            [start_date, end_date, start_date, end_date]
        )
        
        return {
            "period_days": days,
            "categories": df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Category performance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ETL AND SYSTEM ENDPOINTS
# ============================================================================

@analytics_router.get("/system/info")
async def get_system_info(
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Get DuckDB system information
    
    **Returns:**
    - Database size
    - Table statistics
    - ETL sync status
    """
    try:
        result = manager.get_database_info()
        return result
    except Exception as e:
        logger.error(f"System info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/etl/sync", response_model=ETLSyncResponse)
async def trigger_etl_sync(
    sync_type: str = Query("incremental", regex="^(full|incremental)$", description="Sync type"),
    days_back: int = Query(1, ge=1, le=30, description="Days to look back (incremental only)"),
    pg_conn_string: str = Query(..., description="PostgreSQL connection string")
):
    """
    Trigger ETL sync from PostgreSQL to DuckDB
    
    **Query Parameters:**
    - sync_type: Type of sync ('full' or 'incremental')
    - days_back: Days to look back for incremental sync
    - pg_conn_string: PostgreSQL connection string
    
    **Returns:**
    - Sync results for all tables
    - Success/failure status
    - Duration
    
    **Note:** This endpoint should be protected with authentication in production
    """
    try:
        from smartpay_ai.analytics.etl_pipeline import run_etl_sync
        import asyncio
        
        result = await run_etl_sync(
            pg_conn_string=pg_conn_string,
            sync_type=sync_type,
            days_back=days_back
        )
        
        return result
    except Exception as e:
        logger.error(f"ETL sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/system/materialize")
async def materialize_summaries(
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Materialize daily summaries for fast dashboard queries
    
    **Returns:**
    - Number of days materialized
    """
    try:
        result = manager.materialize_daily_summaries()
        return {
            "status": "success",
            "message": f"Materialized {result['materialized_days']} daily summaries"
        }
    except Exception as e:
        logger.error(f"Materialize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/system/optimize")
async def optimize_database(
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Optimize DuckDB database (VACUUM and CHECKPOINT)
    
    **Returns:**
    - Success confirmation
    """
    try:
        manager.vacuum_and_optimize()
        return {
            "status": "success",
            "message": "Database optimized successfully"
        }
    except Exception as e:
        logger.error(f"Optimize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CUSTOM QUERY ENDPOINT
# ============================================================================

@analytics_router.post("/query/execute")
async def execute_custom_query(
    query: str = Query(..., description="SQL query to execute"),
    params: Optional[List[Any]] = Query(None, description="Query parameters"),
    manager: DuckDBManager = Depends(get_duckdb_manager)
):
    """
    Execute a custom SQL query against DuckDB
    
    **Query Parameters:**
    - query: SQL query string
    - params: Optional query parameters
    
    **Returns:**
    - Query results as JSON
    
    **Note:** This endpoint should be heavily restricted in production
    **Security:** Only allow read-only queries (SELECT)
    """
    try:
        # Security check: only allow SELECT queries
        if not query.strip().upper().startswith("SELECT"):
            raise HTTPException(
                status_code=400,
                detail="Only SELECT queries are allowed"
            )
        
        df = manager.execute_query(query, params)
        
        return {
            "row_count": len(df),
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Custom query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
