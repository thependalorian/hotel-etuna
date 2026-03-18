# Smartpay Analytics Module

High-performance DuckDB-powered analytics for transactional intelligence, fraud detection, and business insights.

## Quick Start

```python
from smartpay_ai.analytics import DuckDBManager

# Initialize manager
manager = DuckDBManager()

# Get transaction analytics
analytics = manager.get_transaction_analytics()
print(f"Transactions: {analytics['metrics']['transaction_count']}")

# Get user analytics
user_analytics = manager.get_user_analytics("user-123", days=30)

# Close when done
manager.close()
```

## Components

### DuckDB Manager
Central interface for all analytics operations.

```python
from smartpay_ai.analytics import DuckDBManager

manager = DuckDBManager()
info = manager.get_database_info()
manager.close()
```

### Spending Analytics
User spending patterns, budgets, category analysis.

```python
from smartpay_ai.analytics import SpendingAnalytics

spending = SpendingAnalytics(db_path="data/analytics.duckdb")
summary = spending.aggregate_user_spending("user-123", days=30)
spending.close()
```

### Fraud Analytics
Transaction velocity, anomaly detection, risk patterns.

```python
from smartpay_ai.analytics import FraudAnalytics

fraud = FraudAnalytics(db_path="data/analytics.duckdb")
velocity = fraud.transaction_velocity_tracking("user-123", window_hours=1)
fraud.close()
```

### Group Analytics
Group activity, split bills, member contributions.

```python
from smartpay_ai.analytics import GroupAnalytics

groups = GroupAnalytics(db_path="data/analytics.duckdb")
metrics = groups.group_activity_metrics("group-456", days=30)
groups.close()
```

### ETL Pipeline
Sync data from PostgreSQL to DuckDB.

```python
import asyncio
from smartpay_ai.analytics import run_etl_sync

async def sync():
    results = await run_etl_sync(
        pg_conn_string="postgresql://...",
        sync_type="incremental",
        days_back=1
    )
    print(f"Synced {results['success_count']}/{results['total_tables']} tables")

asyncio.run(sync())
```

## Query Library

Pre-optimized queries for common patterns:

```python
from smartpay_ai.analytics.queries import (
    TRANSACTION_QUERIES,
    USER_QUERIES,
    FRAUD_QUERIES,
    REPORTING_QUERIES
)

# Use with DuckDB manager
manager = DuckDBManager()
df = manager.execute_query(
    TRANSACTION_QUERIES["daily_summary"],
    [start_date, end_date]
)
```

## API Endpoints

FastAPI endpoints available at `/api/analytics`:

- **Transactions:** `/api/analytics/transactions`
- **Users:** `/api/analytics/users/{user_id}`
- **Fraud:** `/api/analytics/fraud`
- **Reports:** `/api/analytics/reports/dashboard`
- **System:** `/api/analytics/system/info`

See `DUCKDB_ANALYTICS_GUIDE.md` for full API documentation.

## Scheduled Sync

```bash
# Initialize
python3 scripts/initialize_analytics.py

# Manual sync
python3 scripts/etl_sync_cron.py --sync-type incremental

# Set up cron (edit crontab -e)
0 * * * * cd /path/to/backend_python && python3 scripts/etl_sync_cron.py --sync-type incremental
```

## Testing

```bash
# Run all analytics tests
pytest tests/test_duckdb_analytics.py -v

# Run specific test category
pytest tests/test_duckdb_analytics.py -k "transaction" -v

# With coverage
pytest tests/test_duckdb_analytics.py --cov=smartpay_ai.analytics
```

## Documentation

- **Complete Guide:** `/fintech/DUCKDB_ANALYTICS_GUIDE.md`
- **Implementation Summary:** `/fintech/DUCKDB_IMPLEMENTATION_SUMMARY.md`
- **Integration Tests:** `/fintech/INTEGRATION_TEST_AUDIT.md`

## Performance

- **Query Latency:** 15-120ms for most queries
- **ETL Throughput:** ~17,000 rows/second
- **Database Size:** ~1MB per 1,000 transactions
- **Materialized Views:** <2s refresh time

## Support

For issues and questions, see the main documentation or contact the analytics team.
