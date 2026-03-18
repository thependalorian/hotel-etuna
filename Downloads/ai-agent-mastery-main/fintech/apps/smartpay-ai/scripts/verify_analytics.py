#!/usr/bin/env python3
"""
Verify DuckDB Analytics System

Location: backend_python/scripts/verify_analytics.py
Purpose: Comprehensive verification of DuckDB analytics installation
Usage: python3 scripts/verify_analytics.py
"""

import sys
from pathlib import Path
import pandas as pd
from datetime import datetime, timedelta
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.analytics import DuckDBManager


def test_database_exists():
    """Test 1: Database file exists"""
    db_path = Path("data/analytics.duckdb")
    if db_path.exists():
        size_mb = db_path.stat().st_size / (1024 * 1024)
        print(f"✓ Test 1: Database exists ({size_mb:.2f} MB)")
        return True
    else:
        print("✗ Test 1: Database file not found")
        return False


def test_manager_initialization():
    """Test 2: Manager initializes correctly"""
    try:
        manager = DuckDBManager()
        manager.close()
        print("✓ Test 2: Manager initialization successful")
        return True
    except Exception as e:
        print(f"✗ Test 2: Manager initialization failed - {e}")
        return False


def test_schema_complete():
    """Test 3: All required tables exist"""
    try:
        manager = DuckDBManager()
        info = manager.get_database_info()
        
        required_tables = [
            "transactions",
            "fraud_events",
            "user_risk_profiles",
            "groups",
            "group_members",
            "etl_metadata",
            "daily_transaction_summary"
        ]
        
        existing_tables = [t["name"] for t in info["tables"]]
        
        missing = [t for t in required_tables if t not in existing_tables]
        
        if not missing:
            print(f"✓ Test 3: All {len(required_tables)} required tables exist")
            manager.close()
            return True
        else:
            print(f"✗ Test 3: Missing tables: {missing}")
            manager.close()
            return False
            
    except Exception as e:
        print(f"✗ Test 3: Schema check failed - {e}")
        return False


def test_data_loading():
    """Test 4: Can load and query data"""
    try:
        manager = DuckDBManager()
        
        # Create small dataset
        data = []
        base_time = datetime.now() - timedelta(days=1)
        for i in range(10):
            data.append({
                'id': f'test-txn-{i}',
                'user_id': f'test-user-{i % 3}',
                'amount': 100.0 + i * 10,
                'category': ['groceries', 'transport'][i % 2],
                'merchant': f'test-merchant-{i % 2}',
                'merchant_location': 'Windhoek',
                'timestamp': base_time + timedelta(hours=i),
                'wallet_id': 'test-wallet',
                'status': 'completed',
                'device_id': 'test-device',
                'ip_address': '127.0.0.1',
                'currency': 'NAD'
            })
        
        df = pd.DataFrame(data)
        manager.spending.load_transactions_from_dataframe(df)
        
        # Query data
        result = manager.conn.execute("SELECT COUNT(*) FROM transactions").fetchone()
        
        if result[0] >= 10:
            print(f"✓ Test 4: Data loading successful ({result[0]} rows)")
            manager.close()
            return True
        else:
            print(f"✗ Test 4: Data loading incomplete ({result[0]} rows)")
            manager.close()
            return False
            
    except Exception as e:
        print(f"✗ Test 4: Data loading failed - {e}")
        return False


def test_analytics_queries():
    """Test 5: Analytics queries execute correctly"""
    try:
        manager = DuckDBManager()
        
        # Load sample data
        data = []
        base_time = datetime.now() - timedelta(days=7)
        for i in range(20):
            data.append({
                'id': f'test-{i}',
                'user_id': 'test-user-001',
                'amount': 100.0 + i * 5,
                'category': 'groceries',
                'merchant': 'test-merchant',
                'merchant_location': 'Windhoek',
                'timestamp': base_time + timedelta(hours=i * 2),
                'wallet_id': 'test-wallet',
                'status': 'completed',
                'device_id': 'test-device',
                'ip_address': '127.0.0.1',
                'currency': 'NAD'
            })
        
        df = pd.DataFrame(data)
        manager.spending.load_transactions_from_dataframe(df)
        
        # Test transaction analytics
        txn_analytics = manager.get_transaction_analytics()
        assert txn_analytics["metrics"]["transaction_count"] > 0
        
        # Test user analytics
        user_analytics = manager.spending.aggregate_user_spending("test-user-001", days=30)
        assert user_analytics["transaction_count"] > 0
        
        # Test trend analytics
        trends = manager.get_trend_analytics(metric="volume", interval="day", days=7)
        assert len(trends["data_points"]) > 0
        
        print("✓ Test 5: Analytics queries execute correctly")
        manager.close()
        return True
        
    except Exception as e:
        print(f"✗ Test 5: Analytics queries failed - {e}")
        return False


def test_fraud_analytics():
    """Test 6: Fraud analytics working"""
    try:
        manager = DuckDBManager()
        
        # Test velocity tracking
        velocity = manager.fraud.transaction_velocity_tracking("test-user-001", window_hours=24)
        assert "risk_score" in velocity
        
        print("✓ Test 6: Fraud analytics working")
        manager.close()
        return True
        
    except Exception as e:
        print(f"✗ Test 6: Fraud analytics failed - {e}")
        return False


def test_query_library():
    """Test 7: Query library accessible"""
    try:
        from smartpay_ai.analytics.queries import (
            TRANSACTION_QUERIES,
            USER_QUERIES,
            FRAUD_QUERIES,
            REPORTING_QUERIES
        )
        
        total_queries = (
            len(TRANSACTION_QUERIES) +
            len(USER_QUERIES) +
            len(FRAUD_QUERIES) +
            len(REPORTING_QUERIES)
        )
        
        print(f"✓ Test 7: Query library loaded ({total_queries} queries)")
        return True
        
    except Exception as e:
        print(f"✗ Test 7: Query library failed - {e}")
        return False


def main():
    """Run all verification tests"""
    print("=" * 60)
    print("DuckDB Analytics System - Verification")
    print("=" * 60)
    print()
    
    tests = [
        test_database_exists,
        test_manager_initialization,
        test_schema_complete,
        test_data_loading,
        test_analytics_queries,
        test_fraud_analytics,
        test_query_library,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test failed with exception: {e}")
            results.append(False)
        print()
    
    # Summary
    print("=" * 60)
    print("Verification Summary")
    print("=" * 60)
    print()
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {passed * 100 / total:.1f}%")
    print()
    
    if passed == total:
        print("✅ All verification tests passed!")
        print()
        print("System is ready for use. Next steps:")
        print("1. Run ETL sync: python3 scripts/etl_sync_cron.py --sync-type full")
        print("2. Start API server: uvicorn smartpay_ai.api.main:app --reload")
        print("3. Test API: curl http://localhost:8000/api/analytics/system/info")
        return 0
    else:
        print("❌ Some verification tests failed.")
        print()
        print("Please review the errors above and:")
        print("1. Check that all files were created correctly")
        print("2. Verify dependencies are installed (duckdb, pandas, asyncpg)")
        print("3. Re-run: python3 scripts/initialize_analytics.py")
        return 1


if __name__ == "__main__":
    sys.exit(main())
