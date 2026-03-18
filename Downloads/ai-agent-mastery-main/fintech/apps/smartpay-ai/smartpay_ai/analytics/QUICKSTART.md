# DuckDB Analytics - Quick Start

Get started with DuckDB analytics in 5 minutes.

## 1. Initialize Database

```bash
cd smartpay/backend_python
python3 scripts/initialize_analytics.py
```

**Output:**
```
✓ Database initialized: data/analytics.duckdb
✓ 14 tables created
✓ System ready
```

## 2. Load Sample Data

```python
from smartpay_ai.analytics import DuckDBManager
import pandas as pd
from datetime import datetime, timedelta

manager = DuckDBManager()

# Create sample transactions
data = []
base_time = datetime.now() - timedelta(days=7)
for i in range(100):
    data.append({
        'id': f'txn-{i:04d}',
        'user_id': f'user-{i % 10:03d}',
        'amount': 50 + (i * 13.7) % 500,
        'category': ['groceries', 'transport', 'bills', 'entertainment'][i % 4],
        'merchant': f'merchant-{i % 20}',
        'merchant_location': 'Windhoek',
        'timestamp': base_time + timedelta(hours=i * 1.5),
        'wallet_id': f'wallet-{i % 5}',
        'status': 'completed',
        'device_id': f'device-{i % 3}',
        'ip_address': f'192.168.1.{i % 255}',
        'currency': 'NAD'
    })

df = pd.DataFrame(data)
manager.spending.load_transactions_from_dataframe(df)
print(f"✓ Loaded {len(df)} transactions")

manager.close()
```

## 3. Run Analytics

```python
from smartpay_ai.analytics import DuckDBManager

manager = DuckDBManager()

# Transaction analytics
analytics = manager.get_transaction_analytics()
print(f"Transactions: {analytics['metrics']['transaction_count']}")
print(f"Volume: NAD {analytics['metrics']['total_volume']:,.2f}")

# User analytics
user_analytics = manager.spending.aggregate_user_spending("user-001", days=7)
print(f"User spent: NAD {user_analytics['total_spending']:,.2f}")

# Top merchants
merchants = manager.get_merchant_analytics(merchant=None, days=7)
print(f"Top merchant: {merchants['top_merchants'][0]['merchant']}")

manager.close()
```

## 4. Verify Installation

```bash
python3 scripts/verify_analytics.py
```

**Expected Output:**
```
✓ Test 1: Database exists
✓ Test 2: Manager initialization successful
✓ Test 3: All 7 required tables exist
✓ Test 4: Data loading successful
✓ Test 5: Analytics queries execute correctly
✓ Test 6: Fraud analytics working
✓ Test 7: Query library loaded

✅ All verification tests passed!
```

## 5. Set Up Production Sync

```bash
# Set PostgreSQL connection
export POSTGRES_CONN_STRING="postgresql://user:password@host:5432/smartpay"

# Run initial full sync
python3 scripts/etl_sync_cron.py --sync-type full

# Set up hourly incremental sync
crontab -e
# Add: 0 * * * * cd /path/to/backend_python && python3 scripts/etl_sync_cron.py --sync-type incremental
```

## What You Get

- **14 Tables:** Complete analytics schema
- **28 Queries:** Pre-built analytics queries
- **17 API Endpoints:** REST API for all analytics
- **27 Tests:** Comprehensive test coverage
- **500+ Lines Docs:** Complete guide and examples

## Next Steps

- Read full guide: `cat ../../DUCKDB_ANALYTICS_GUIDE.md`
- Explore queries: `cat smartpay_ai/analytics/queries/`
- Run tests: `pytest tests/test_duckdb_analytics.py -v`
- Start API: `uvicorn smartpay_ai.api.main:app --reload`

## Common Commands

```bash
# Check system status
python3 -c "from smartpay_ai.analytics import DuckDBManager; m = DuckDBManager(); print(m.get_database_info()); m.close()"

# Materialize summaries
python3 -c "from smartpay_ai.analytics import DuckDBManager; m = DuckDBManager(); m.materialize_daily_summaries(); m.close()"

# Run specific test
pytest tests/test_duckdb_analytics.py::test_transaction_analytics -v

# View database with SQL
duckdb data/analytics.duckdb -c "SELECT COUNT(*) FROM transactions"
```

That's it! Your DuckDB analytics system is ready.
