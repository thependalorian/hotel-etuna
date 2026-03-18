#!/usr/bin/env python3
"""
Initialize DuckDB Analytics System

Location: backend_python/scripts/initialize_analytics.py
Purpose: One-time setup script for DuckDB analytics
Usage: python3 scripts/initialize_analytics.py
"""

import os
import sys
from pathlib import Path
import logging

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.analytics.duckdb_manager import DuckDBManager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Initialize DuckDB analytics system"""
    print("=" * 60)
    print("DuckDB Analytics System - Initialization")
    print("=" * 60)
    print()
    
    # Step 1: Check data directory
    print("[1/5] Checking data directory...")
    data_dir = Path("data")
    if not data_dir.exists():
        data_dir.mkdir(parents=True)
        print(f"  ✓ Created data directory: {data_dir}")
    else:
        print(f"  ✓ Data directory exists: {data_dir}")
    print()
    
    # Step 2: Initialize DuckDB
    print("[2/5] Initializing DuckDB database...")
    try:
        manager = DuckDBManager()
        print(f"  ✓ Database initialized: {manager.db_path}")
        print()
        
        # Step 3: Get database info
        print("[3/5] Getting database information...")
        info = manager.get_database_info()
        print(f"  Database path: {info['database_path']}")
        print(f"  Database size: {info['database_size_mb']} MB")
        print(f"  Tables: {len(info['tables'])}")
        for table in info['tables']:
            print(f"    - {table['name']}")
        print()
        
        # Step 4: Test query
        print("[4/5] Testing query execution...")
        result = manager.conn.execute("SELECT 1 as test").fetchone()
        assert result[0] == 1
        print("  ✓ Query execution works")
        print()
        
        # Step 5: Create sample data (optional)
        print("[5/5] System ready!")
        print()
        print("=" * 60)
        print("Next Steps:")
        print("=" * 60)
        print()
        print("1. Load data from PostgreSQL:")
        print("   python3 scripts/etl_sync_cron.py --sync-type full")
        print()
        print("2. Set up scheduled sync (crontab -e):")
        print("   0 * * * * cd /path/to/backend_python && python3 scripts/etl_sync_cron.py --sync-type incremental")
        print()
        print("3. Start FastAPI server:")
        print("   uvicorn smartpay_ai.api.main:app --reload")
        print()
        print("4. Test analytics API:")
        print("   curl http://localhost:8000/api/analytics/system/info")
        print()
        print("5. Read documentation:")
        print("   cat ../DUCKDB_ANALYTICS_GUIDE.md")
        print()
        
        manager.close()
        
        print("✓ Initialization complete!")
        return 0
        
    except Exception as e:
        logger.error(f"Initialization failed: {e}", exc_info=True)
        print(f"\n✗ Error: {e}")
        print("\nPlease check the error message above and try again.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
