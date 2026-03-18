"""
ETL Pipeline for PostgreSQL to DuckDB

Location: backend_python/smartpay_ai/analytics/etl_pipeline.py
Purpose: Extract data from PostgreSQL, transform, and load into DuckDB for analytics
Usage: Scheduled sync to keep DuckDB analytics database up-to-date
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import asyncpg
import pandas as pd

from .duckdb_manager import DuckDBManager

logger = logging.getLogger(__name__)


class ETLPipeline:
    """ETL pipeline for syncing PostgreSQL data to DuckDB"""

    def __init__(
        self,
        pg_conn_string: str,
        duckdb_manager: Optional[DuckDBManager] = None
    ):
        """
        Initialize ETL pipeline
        
        Args:
            pg_conn_string: PostgreSQL connection string
            duckdb_manager: Optional DuckDB manager instance
        """
        self.pg_conn_string = pg_conn_string
        self.duckdb_manager = duckdb_manager or DuckDBManager()
        self.conn = self.duckdb_manager.conn

    async def extract_transactions(
        self,
        since: Optional[datetime] = None,
        batch_size: int = 10000
    ) -> pd.DataFrame:
        """
        Extract transaction data from PostgreSQL
        
        Args:
            since: Extract transactions since this timestamp (incremental sync)
            batch_size: Number of rows per batch
            
        Returns:
            DataFrame with transaction data
        """
        pg_conn = await asyncpg.connect(self.pg_conn_string)
        
        try:
            if since:
                logger.info(f"Extracting transactions since {since}")
                query = """
                    SELECT 
                        id,
                        user_id,
                        amount,
                        category,
                        merchant,
                        merchant_location,
                        created_at as timestamp,
                        wallet_id,
                        status,
                        device_id,
                        ip_address,
                        currency
                    FROM transactions
                    WHERE created_at >= $1
                    ORDER BY created_at
                """
                rows = await pg_conn.fetch(query, since)
            else:
                logger.info("Extracting all transactions (full sync)")
                query = """
                    SELECT 
                        id,
                        user_id,
                        amount,
                        category,
                        merchant,
                        merchant_location,
                        created_at as timestamp,
                        wallet_id,
                        status,
                        device_id,
                        ip_address,
                        currency
                    FROM transactions
                    ORDER BY created_at
                """
                rows = await pg_conn.fetch(query)
            
            if rows:
                df = pd.DataFrame([dict(row) for row in rows])
                logger.info(f"Extracted {len(df)} transactions")
                return df
            else:
                logger.warning("No transactions found")
                return pd.DataFrame()
                
        finally:
            await pg_conn.close()

    async def extract_users(self) -> pd.DataFrame:
        """Extract user data from PostgreSQL"""
        pg_conn = await asyncpg.connect(self.pg_conn_string)
        
        try:
            query = """
                SELECT 
                    id as user_id,
                    created_at,
                    kyc_tier,
                    status,
                    phone
                FROM users
                WHERE status = 'active'
            """
            rows = await pg_conn.fetch(query)
            
            if rows:
                df = pd.DataFrame([dict(row) for row in rows])
                logger.info(f"Extracted {len(df)} users")
                return df
            else:
                return pd.DataFrame()
                
        finally:
            await pg_conn.close()

    async def extract_fraud_events(
        self,
        since: Optional[datetime] = None
    ) -> pd.DataFrame:
        """Extract fraud events from PostgreSQL"""
        pg_conn = await asyncpg.connect(self.pg_conn_string)
        
        try:
            if since:
                query = """
                    SELECT 
                        transaction_id,
                        is_fraud,
                        risk_score,
                        flagged_reason,
                        created_at as timestamp,
                        reviewed,
                        reviewed_by,
                        reviewed_at
                    FROM fraud_events
                    WHERE created_at >= $1
                    ORDER BY created_at
                """
                rows = await pg_conn.fetch(query, since)
            else:
                query = """
                    SELECT 
                        transaction_id,
                        is_fraud,
                        risk_score,
                        flagged_reason,
                        created_at as timestamp,
                        reviewed,
                        reviewed_by,
                        reviewed_at
                    FROM fraud_events
                    ORDER BY created_at
                """
                rows = await pg_conn.fetch(query)
            
            if rows:
                df = pd.DataFrame([dict(row) for row in rows])
                logger.info(f"Extracted {len(df)} fraud events")
                return df
            else:
                return pd.DataFrame()
                
        finally:
            await pg_conn.close()

    async def extract_groups(self) -> pd.DataFrame:
        """Extract groups from PostgreSQL"""
        pg_conn = await asyncpg.connect(self.pg_conn_string)
        
        try:
            query = """
                SELECT 
                    id,
                    name,
                    created_by,
                    created_at,
                    status
                FROM groups
            """
            rows = await pg_conn.fetch(query)
            
            if rows:
                df = pd.DataFrame([dict(row) for row in rows])
                logger.info(f"Extracted {len(df)} groups")
                return df
            else:
                return pd.DataFrame()
                
        finally:
            await pg_conn.close()

    async def extract_group_members(self) -> pd.DataFrame:
        """Extract group members from PostgreSQL"""
        pg_conn = await asyncpg.connect(self.pg_conn_string)
        
        try:
            query = """
                SELECT 
                    group_id,
                    user_id,
                    joined_at,
                    role,
                    status
                FROM group_members
            """
            rows = await pg_conn.fetch(query)
            
            if rows:
                df = pd.DataFrame([dict(row) for row in rows])
                logger.info(f"Extracted {len(df)} group members")
                return df
            else:
                return pd.DataFrame()
                
        finally:
            await pg_conn.close()

    def load_transactions(self, df: pd.DataFrame) -> int:
        """
        Load transactions into DuckDB
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            Number of rows loaded
        """
        if df.empty:
            return 0
        
        # Register DataFrame with DuckDB
        self.conn.register('transactions_temp', df)
        
        # Insert or replace transactions
        self.conn.execute("""
            INSERT OR REPLACE INTO transactions 
            SELECT * FROM transactions_temp
        """)
        
        rows_loaded = len(df)
        logger.info(f"Loaded {rows_loaded} transactions into DuckDB")
        
        return rows_loaded

    def load_fraud_events(self, df: pd.DataFrame) -> int:
        """
        Load fraud events into DuckDB
        
        Args:
            df: Fraud events DataFrame
            
        Returns:
            Number of rows loaded
        """
        if df.empty:
            return 0
        
        self.conn.register('fraud_events_temp', df)
        
        self.conn.execute("""
            INSERT OR REPLACE INTO fraud_events
            SELECT * FROM fraud_events_temp
        """)
        
        rows_loaded = len(df)
        logger.info(f"Loaded {rows_loaded} fraud events into DuckDB")
        
        return rows_loaded

    def load_groups(self, df: pd.DataFrame) -> int:
        """Load groups into DuckDB"""
        if df.empty:
            return 0
        
        self.conn.register('groups_temp', df)
        
        self.conn.execute("""
            INSERT OR REPLACE INTO groups
            SELECT * FROM groups_temp
        """)
        
        return len(df)

    def load_group_members(self, df: pd.DataFrame) -> int:
        """Load group members into DuckDB"""
        if df.empty:
            return 0
        
        self.conn.register('group_members_temp', df)
        
        self.conn.execute("""
            INSERT OR REPLACE INTO group_members
            SELECT * FROM group_members_temp
        """)
        
        return len(df)

    def update_etl_metadata(
        self,
        table_name: str,
        rows_synced: int,
        status: str = "success",
        error_message: Optional[str] = None
    ):
        """
        Update ETL metadata table
        
        Args:
            table_name: Name of synced table
            rows_synced: Number of rows synced
            status: Sync status ('success' or 'error')
            error_message: Optional error message
        """
        self.conn.execute("""
            INSERT OR REPLACE INTO etl_metadata 
            (table_name, last_sync_timestamp, rows_synced, sync_status, error_message)
            VALUES (?, ?, ?, ?, ?)
        """, [table_name, datetime.now(), rows_synced, status, error_message])

    async def sync_transactions(
        self,
        incremental: bool = True,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """
        Sync transactions from PostgreSQL to DuckDB
        
        Args:
            incremental: If True, only sync recent transactions
            days_back: Days to look back for incremental sync
            
        Returns:
            Sync results
        """
        start_time = datetime.now()
        
        try:
            # Determine sync start point
            since = None
            if incremental:
                # Get last sync timestamp from metadata
                last_sync = self.conn.execute("""
                    SELECT last_sync_timestamp 
                    FROM etl_metadata 
                    WHERE table_name = 'transactions'
                """).fetchone()
                
                if last_sync and last_sync[0]:
                    since = last_sync[0]
                else:
                    since = datetime.now() - timedelta(days=days_back)
            
            # Extract from PostgreSQL
            df = await self.extract_transactions(since=since)
            
            # Load into DuckDB
            rows_loaded = self.load_transactions(df)
            
            # Update metadata
            self.update_etl_metadata('transactions', rows_loaded, 'success')
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "table": "transactions",
                "status": "success",
                "rows_synced": rows_loaded,
                "incremental": incremental,
                "since": since.isoformat() if since else None,
                "duration_seconds": round(duration, 2)
            }
            
        except Exception as e:
            logger.error(f"Transaction sync failed: {e}")
            self.update_etl_metadata('transactions', 0, 'error', str(e))
            
            return {
                "table": "transactions",
                "status": "error",
                "error": str(e),
                "duration_seconds": (datetime.now() - start_time).total_seconds()
            }

    async def sync_fraud_events(
        self,
        incremental: bool = True,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """Sync fraud events from PostgreSQL to DuckDB"""
        start_time = datetime.now()
        
        try:
            since = None
            if incremental:
                last_sync = self.conn.execute("""
                    SELECT last_sync_timestamp 
                    FROM etl_metadata 
                    WHERE table_name = 'fraud_events'
                """).fetchone()
                
                if last_sync and last_sync[0]:
                    since = last_sync[0]
                else:
                    since = datetime.now() - timedelta(days=days_back)
            
            df = await self.extract_fraud_events(since=since)
            rows_loaded = self.load_fraud_events(df)
            
            self.update_etl_metadata('fraud_events', rows_loaded, 'success')
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "table": "fraud_events",
                "status": "success",
                "rows_synced": rows_loaded,
                "duration_seconds": round(duration, 2)
            }
            
        except Exception as e:
            logger.error(f"Fraud events sync failed: {e}")
            self.update_etl_metadata('fraud_events', 0, 'error', str(e))
            
            return {
                "table": "fraud_events",
                "status": "error",
                "error": str(e)
            }

    async def sync_groups(self) -> Dict[str, Any]:
        """Sync groups and group members from PostgreSQL to DuckDB"""
        start_time = datetime.now()
        
        try:
            # Sync groups
            groups_df = await self.extract_groups()
            groups_loaded = self.load_groups(groups_df)
            
            # Sync group members
            members_df = await self.extract_group_members()
            members_loaded = self.load_group_members(members_df)
            
            self.update_etl_metadata('groups', groups_loaded, 'success')
            self.update_etl_metadata('group_members', members_loaded, 'success')
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                "status": "success",
                "groups_synced": groups_loaded,
                "members_synced": members_loaded,
                "duration_seconds": round(duration, 2)
            }
            
        except Exception as e:
            logger.error(f"Groups sync failed: {e}")
            self.update_etl_metadata('groups', 0, 'error', str(e))
            
            return {
                "status": "error",
                "error": str(e)
            }

    async def full_sync(self) -> Dict[str, Any]:
        """
        Perform full sync of all tables
        
        Returns:
            Sync results for all tables
        """
        logger.info("Starting full ETL sync")
        start_time = datetime.now()
        
        results = {
            "sync_type": "full",
            "started_at": start_time.isoformat(),
            "tables": []
        }
        
        # Sync transactions
        txn_result = await self.sync_transactions(incremental=False)
        results["tables"].append(txn_result)
        
        # Sync fraud events
        fraud_result = await self.sync_fraud_events(incremental=False)
        results["tables"].append(fraud_result)
        
        # Sync groups
        groups_result = await self.sync_groups()
        results["tables"].append(groups_result)
        
        # Materialize summaries
        self.duckdb_manager.materialize_daily_summaries()
        
        # Update user risk profiles
        logger.info("Updating user risk profiles")
        self.duckdb_manager.fraud.update_user_risk_profile("all")
        
        # Optimize database
        self.duckdb_manager.vacuum_and_optimize()
        
        duration = (datetime.now() - start_time).total_seconds()
        results["completed_at"] = datetime.now().isoformat()
        results["duration_seconds"] = round(duration, 2)
        
        # Count successes
        success_count = sum(1 for t in results["tables"] if t.get("status") == "success")
        results["success_count"] = success_count
        results["total_tables"] = len(results["tables"])
        
        logger.info(f"Full sync completed in {duration:.2f}s - {success_count}/{len(results['tables'])} tables succeeded")
        
        return results

    async def incremental_sync(self, days_back: int = 1) -> Dict[str, Any]:
        """
        Perform incremental sync (recent data only)
        
        Args:
            days_back: Days to look back for changes
            
        Returns:
            Sync results
        """
        logger.info(f"Starting incremental ETL sync (last {days_back} days)")
        start_time = datetime.now()
        
        results = {
            "sync_type": "incremental",
            "days_back": days_back,
            "started_at": start_time.isoformat(),
            "tables": []
        }
        
        # Sync recent transactions
        txn_result = await self.sync_transactions(incremental=True, days_back=days_back)
        results["tables"].append(txn_result)
        
        # Sync recent fraud events
        fraud_result = await self.sync_fraud_events(incremental=True, days_back=days_back)
        results["tables"].append(fraud_result)
        
        # Groups (always full sync - smaller table)
        groups_result = await self.sync_groups()
        results["tables"].append(groups_result)
        
        # Materialize daily summaries
        self.duckdb_manager.materialize_daily_summaries()
        
        duration = (datetime.now() - start_time).total_seconds()
        results["completed_at"] = datetime.now().isoformat()
        results["duration_seconds"] = round(duration, 2)
        
        success_count = sum(1 for t in results["tables"] if t.get("status") == "success")
        results["success_count"] = success_count
        results["total_tables"] = len(results["tables"])
        
        logger.info(f"Incremental sync completed in {duration:.2f}s")
        
        return results


async def run_etl_sync(
    pg_conn_string: str,
    sync_type: str = "incremental",
    days_back: int = 1
) -> Dict[str, Any]:
    """
    Run ETL sync (standalone function for cron jobs)
    
    Args:
        pg_conn_string: PostgreSQL connection string
        sync_type: 'full' or 'incremental'
        days_back: Days to look back for incremental sync
        
    Returns:
        Sync results
    """
    pipeline = ETLPipeline(pg_conn_string)
    
    try:
        if sync_type == "full":
            results = await pipeline.full_sync()
        else:
            results = await pipeline.incremental_sync(days_back=days_back)
        
        return results
        
    finally:
        pipeline.duckdb_manager.close()
