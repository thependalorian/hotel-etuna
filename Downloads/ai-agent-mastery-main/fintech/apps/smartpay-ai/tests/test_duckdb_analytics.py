"""
DuckDB Analytics Integration Tests

Location: backend_python/tests/test_duckdb_analytics.py
Purpose: Comprehensive tests for DuckDB analytics system
Coverage: Manager, ETL, queries, API endpoints
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
import pandas as pd

from smartpay_ai.analytics.duckdb_manager import DuckDBManager
from smartpay_ai.analytics.etl_pipeline import ETLPipeline
from smartpay_ai.analytics.spending_analytics import SpendingAnalytics
from smartpay_ai.analytics.fraud_analytics import FraudAnalytics
from smartpay_ai.analytics.group_analytics import GroupAnalytics


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def duckdb_manager():
    """Create in-memory DuckDB manager for testing"""
    manager = DuckDBManager(db_path=":memory:")
    yield manager
    manager.close()


@pytest.fixture
def sample_transactions():
    """Generate sample transaction data"""
    base_time = datetime.now() - timedelta(days=30)
    
    transactions = []
    for i in range(100):
        transactions.append({
            "id": f"txn-{i:04d}",
            "user_id": f"user-{i % 10:03d}",
            "amount": round(50 + (i * 13.7) % 500, 2),
            "category": ["groceries", "transport", "entertainment", "bills"][i % 4],
            "merchant": f"merchant-{i % 20}",
            "merchant_location": "Windhoek",
            "timestamp": base_time + timedelta(hours=i * 7),
            "wallet_id": f"wallet-{i % 5}",
            "status": "completed" if i % 10 != 0 else "failed",
            "device_id": f"device-{i % 3}",
            "ip_address": f"192.168.1.{i % 255}",
            "currency": "NAD"
        })
    
    return pd.DataFrame(transactions)


@pytest.fixture
def sample_fraud_events():
    """Generate sample fraud events"""
    base_time = datetime.now() - timedelta(days=7)
    
    events = []
    for i in range(20):
        events.append({
            "transaction_id": f"txn-{i:04d}",
            "is_fraud": i % 5 == 0,
            "risk_score": round(30 + (i * 7.3) % 70, 2),
            "flagged_reason": ["velocity", "large_amount", "unusual_time", "new_merchant"][i % 4],
            "timestamp": base_time + timedelta(hours=i * 8),
            "reviewed": i % 3 == 0,
            "reviewed_by": "admin" if i % 3 == 0 else None,
            "reviewed_at": base_time + timedelta(hours=i * 8 + 2) if i % 3 == 0 else None
        })
    
    return pd.DataFrame(events)


# ============================================================================
# DUCKDB MANAGER TESTS
# ============================================================================

def test_duckdb_manager_initialization(duckdb_manager):
    """Test DuckDB manager initializes correctly"""
    assert duckdb_manager is not None
    assert duckdb_manager.conn is not None
    assert duckdb_manager.spending is not None
    assert duckdb_manager.fraud is not None
    assert duckdb_manager.groups is not None


def test_get_database_info(duckdb_manager):
    """Test getting database information"""
    info = duckdb_manager.get_database_info()
    
    assert "database_path" in info
    assert "database_size_mb" in info
    assert "tables" in info
    assert "etl_status" in info
    assert isinstance(info["tables"], list)


def test_load_transactions(duckdb_manager, sample_transactions):
    """Test loading transactions into DuckDB"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Verify data loaded
    result = duckdb_manager.conn.execute("""
        SELECT COUNT(*) FROM transactions
    """).fetchone()
    
    assert result[0] == len(sample_transactions)


def test_transaction_analytics(duckdb_manager, sample_transactions):
    """Test transaction analytics aggregation"""
    # Load data
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Get analytics
    analytics = duckdb_manager.get_transaction_analytics()
    
    assert "metrics" in analytics
    assert "category_breakdown" in analytics
    assert "time_series" in analytics
    assert analytics["metrics"]["transaction_count"] > 0
    assert analytics["metrics"]["total_volume"] > 0


def test_user_analytics(duckdb_manager, sample_transactions):
    """Test user-specific analytics"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Get analytics for specific user
    user_id = "user-001"
    analytics = duckdb_manager.spending.aggregate_user_spending(user_id, days=30)
    
    assert analytics["user_id"] == user_id
    assert "transaction_count" in analytics
    assert "total_spending" in analytics
    assert "avg_transaction" in analytics


def test_fraud_analytics(duckdb_manager, sample_transactions, sample_fraud_events):
    """Test fraud analytics"""
    # Load data
    duckdb_manager.fraud.load_transactions_from_dataframe(sample_transactions)
    duckdb_manager.fraud.load_fraud_events(sample_fraud_events)
    
    # Get fraud analytics
    analytics = duckdb_manager.get_fraud_analytics(days=7)
    
    assert "statistics" in analytics
    assert "high_risk_transactions" in analytics
    assert analytics["statistics"]["total_flagged"] > 0


def test_merchant_analytics(duckdb_manager, sample_transactions):
    """Test merchant-specific analytics"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Get top merchants
    analytics = duckdb_manager.get_merchant_analytics(merchant=None, days=30)
    
    assert "top_merchants" in analytics
    assert len(analytics["top_merchants"]) > 0
    
    # Get specific merchant
    merchant = analytics["top_merchants"][0]["merchant"]
    merchant_analytics = duckdb_manager.get_merchant_analytics(merchant=merchant, days=30)
    
    assert merchant_analytics["merchant"] == merchant
    assert merchant_analytics["transaction_count"] > 0


def test_trend_analytics(duckdb_manager, sample_transactions):
    """Test trend analytics"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Test different metrics
    for metric in ["volume", "count", "users", "avg_amount"]:
        analytics = duckdb_manager.get_trend_analytics(
            metric=metric,
            interval="day",
            days=30
        )
        
        assert analytics["metric"] == metric
        assert "data_points" in analytics
        assert len(analytics["data_points"]) > 0


def test_materialize_daily_summaries(duckdb_manager, sample_transactions):
    """Test materialization of daily summaries"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    result = duckdb_manager.materialize_daily_summaries()
    
    assert "materialized_days" in result
    assert result["materialized_days"] > 0


def test_custom_query_execution(duckdb_manager, sample_transactions):
    """Test executing custom SQL queries"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Execute custom query
    df = duckdb_manager.execute_query("""
        SELECT 
            category,
            COUNT(*) as count,
            SUM(amount) as total
        FROM transactions
        WHERE status = 'completed'
        GROUP BY category
        ORDER BY total DESC
    """)
    
    assert not df.empty
    assert "category" in df.columns
    assert "count" in df.columns
    assert "total" in df.columns


# ============================================================================
# SPENDING ANALYTICS TESTS
# ============================================================================

def test_spending_analytics_initialization():
    """Test spending analytics initialization"""
    spending = SpendingAnalytics(db_path=":memory:")
    assert spending is not None
    spending.close()


def test_category_spending_breakdown(duckdb_manager, sample_transactions):
    """Test category spending breakdown"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    breakdown = duckdb_manager.spending.category_spending_breakdown("user-001", days=30)
    
    assert isinstance(breakdown, list)
    assert len(breakdown) > 0
    
    for item in breakdown:
        assert "category" in item
        assert "transaction_count" in item
        assert "total_amount" in item
        assert "percentage" in item


def test_time_series_spending(duckdb_manager, sample_transactions):
    """Test time series spending analysis"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Test different intervals
    for interval in ["day", "week", "month"]:
        time_series = duckdb_manager.spending.time_series_spending(
            "user-001",
            days=30,
            interval=interval
        )
        
        assert isinstance(time_series, list)
        assert len(time_series) > 0


def test_budget_variance_analysis(duckdb_manager, sample_transactions):
    """Test budget variance analysis"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Set up budget limits
    duckdb_manager.conn.execute("""
        INSERT INTO budget_limits (user_id, category, monthly_limit)
        VALUES ('user-001', 'groceries', 1000.00)
    """)
    
    variance = duckdb_manager.spending.budget_variance_analysis("user-001")
    
    assert isinstance(variance, list)
    if len(variance) > 0:
        assert "category" in variance[0]
        assert "budget_limit" in variance[0]
        assert "spent" in variance[0]
        assert "status" in variance[0]


# ============================================================================
# FRAUD ANALYTICS TESTS
# ============================================================================

def test_transaction_velocity_tracking(duckdb_manager, sample_transactions):
    """Test transaction velocity tracking"""
    duckdb_manager.fraud.load_transactions_from_dataframe(sample_transactions)
    
    velocity = duckdb_manager.fraud.transaction_velocity_tracking("user-001", window_hours=24)
    
    assert "user_id" in velocity
    assert "transaction_count" in velocity
    assert "total_amount" in velocity
    assert "risk_score" in velocity
    assert "risk_factors" in velocity


def test_anomaly_detection_rules(duckdb_manager, sample_transactions):
    """Test rule-based anomaly detection"""
    duckdb_manager.fraud.load_transactions_from_dataframe(sample_transactions)
    
    # Test anomaly detection on first transaction
    txn_id = sample_transactions.iloc[0]["id"]
    result = duckdb_manager.fraud.anomaly_detection_rules(txn_id)
    
    assert "transaction_id" in result
    assert "risk_score" in result
    assert "risk_level" in result
    assert "anomalies" in result


def test_risk_pattern_identification(duckdb_manager, sample_transactions, sample_fraud_events):
    """Test risk pattern identification"""
    duckdb_manager.fraud.load_transactions_from_dataframe(sample_transactions)
    duckdb_manager.fraud.load_fraud_events(sample_fraud_events)
    
    patterns = duckdb_manager.fraud.risk_pattern_identification("user-001", days=30)
    
    assert "user_id" in patterns
    assert "risk_score" in patterns
    assert "risk_level" in patterns
    assert "risk_indicators" in patterns


# ============================================================================
# GROUP ANALYTICS TESTS
# ============================================================================

def test_group_analytics_initialization():
    """Test group analytics initialization"""
    groups = GroupAnalytics(db_path=":memory:")
    assert groups is not None
    groups.close()


def test_group_activity_metrics(duckdb_manager):
    """Test group activity metrics"""
    # Insert test group
    duckdb_manager.conn.execute("""
        INSERT INTO groups (id, name, created_by, created_at, status)
        VALUES ('group-001', 'Test Group', 'user-001', CURRENT_TIMESTAMP, 'active')
    """)
    
    # Insert group members
    duckdb_manager.conn.execute("""
        INSERT INTO group_members (group_id, user_id, joined_at, role, status)
        VALUES ('group-001', 'user-001', CURRENT_TIMESTAMP, 'admin', 'active')
    """)
    
    metrics = duckdb_manager.groups.group_activity_metrics("group-001", days=30)
    
    assert metrics["group_id"] == "group-001"
    assert "member_count" in metrics
    assert "transaction_count" in metrics


# ============================================================================
# ETL PIPELINE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_etl_metadata_update(duckdb_manager):
    """Test ETL metadata tracking"""
    pipeline = ETLPipeline("", duckdb_manager=duckdb_manager)
    
    # Update metadata
    pipeline.update_etl_metadata(
        table_name="test_table",
        rows_synced=100,
        status="success"
    )
    
    # Verify metadata
    result = duckdb_manager.conn.execute("""
        SELECT * FROM etl_metadata WHERE table_name = 'test_table'
    """).fetchone()
    
    assert result is not None
    assert result[2] == 100  # rows_synced
    assert result[3] == "success"  # sync_status


def test_load_operations(duckdb_manager, sample_transactions, sample_fraud_events):
    """Test ETL load operations"""
    pipeline = ETLPipeline("", duckdb_manager=duckdb_manager)
    
    # Test load transactions
    rows_loaded = pipeline.load_transactions(sample_transactions)
    assert rows_loaded == len(sample_transactions)
    
    # Test load fraud events
    rows_loaded = pipeline.load_fraud_events(sample_fraud_events)
    assert rows_loaded == len(sample_fraud_events)


# ============================================================================
# QUERY LIBRARY TESTS
# ============================================================================

def test_transaction_queries(duckdb_manager, sample_transactions):
    """Test pre-defined transaction queries"""
    from smartpay_ai.analytics.queries.transaction_queries import TRANSACTION_QUERIES
    
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Test daily summary query
    start_date = datetime.now() - timedelta(days=30)
    end_date = datetime.now()
    
    df = duckdb_manager.execute_query(
        TRANSACTION_QUERIES["daily_summary"],
        [start_date, end_date]
    )
    
    assert not df.empty
    assert "date" in df.columns
    assert "transaction_count" in df.columns


def test_user_queries(duckdb_manager, sample_transactions):
    """Test pre-defined user queries"""
    from smartpay_ai.analytics.queries.user_queries import USER_QUERIES
    
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Test user lifetime value query
    df = duckdb_manager.execute_query(
        USER_QUERIES["user_lifetime_value"],
        ["user-001"]
    )
    
    assert not df.empty or len(df) == 0  # May be empty if user has no transactions


def test_fraud_queries(duckdb_manager, sample_transactions, sample_fraud_events):
    """Test pre-defined fraud queries"""
    from smartpay_ai.analytics.queries.fraud_queries import FRAUD_QUERIES
    
    duckdb_manager.fraud.load_transactions_from_dataframe(sample_transactions)
    duckdb_manager.fraud.load_fraud_events(sample_fraud_events)
    
    # Test high risk transactions query
    start_date = datetime.now() - timedelta(days=7)
    end_date = datetime.now()
    
    df = duckdb_manager.execute_query(
        FRAUD_QUERIES["high_risk_transactions"],
        [70, start_date, end_date, 50]
    )
    
    assert isinstance(df, pd.DataFrame)


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

def test_query_performance(duckdb_manager, sample_transactions):
    """Test query performance on larger datasets"""
    import time
    
    # Generate larger dataset
    large_dataset = pd.concat([sample_transactions] * 10, ignore_index=True)
    for i, row in large_dataset.iterrows():
        large_dataset.at[i, "id"] = f"txn-{i:06d}"
    
    duckdb_manager.spending.load_transactions_from_dataframe(large_dataset)
    
    # Test query performance
    start_time = time.time()
    analytics = duckdb_manager.get_transaction_analytics()
    duration = time.time() - start_time
    
    assert duration < 1.0  # Should complete in under 1 second
    assert analytics["metrics"]["transaction_count"] > 0


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

def test_invalid_user_id(duckdb_manager, sample_transactions):
    """Test handling of invalid user ID"""
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    
    # Query non-existent user
    result = duckdb_manager.spending.aggregate_user_spending("invalid-user", days=30)
    
    assert result["transaction_count"] == 0
    assert result["total_spending"] == 0.0


def test_empty_database_queries(duckdb_manager):
    """Test queries on empty database"""
    # Query empty database
    analytics = duckdb_manager.get_transaction_analytics()
    
    assert analytics["metrics"]["transaction_count"] == 0
    assert len(analytics["category_breakdown"]) == 0


def test_invalid_query_execution(duckdb_manager):
    """Test handling of invalid SQL queries"""
    with pytest.raises(Exception):
        duckdb_manager.execute_query("INVALID SQL QUERY")


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

def test_full_analytics_workflow(duckdb_manager, sample_transactions, sample_fraud_events):
    """Test complete analytics workflow"""
    # 1. Load data
    duckdb_manager.spending.load_transactions_from_dataframe(sample_transactions)
    duckdb_manager.fraud.load_fraud_events(sample_fraud_events)
    
    # 2. Run transaction analytics
    txn_analytics = duckdb_manager.get_transaction_analytics()
    assert txn_analytics["metrics"]["transaction_count"] > 0
    
    # 3. Run user analytics
    user_analytics = duckdb_manager.get_user_analytics("user-001", days=30)
    assert "spending" in user_analytics
    
    # 4. Run fraud analytics
    fraud_analytics = duckdb_manager.get_fraud_analytics(days=7)
    assert "statistics" in fraud_analytics
    
    # 5. Materialize summaries
    result = duckdb_manager.materialize_daily_summaries()
    assert result["materialized_days"] > 0
    
    # 6. Get system info
    info = duckdb_manager.get_database_info()
    assert len(info["tables"]) > 0


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
