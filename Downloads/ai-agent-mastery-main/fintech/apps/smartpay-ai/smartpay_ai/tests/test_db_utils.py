"""
Integration Tests for Database Query Utilities

Location: backend_python/smartpay_ai/tests/test_db_utils.py
Purpose: Verify database query patterns and repository implementations

Tests:
- Query builder functionality
- User repository operations
- Transaction repository operations
- Transaction management
- Error handling and retries
"""

import pytest
import asyncpg
from datetime import datetime, timedelta
from typing import AsyncGenerator

from smartpay_ai.shared.db_utils import (
    QueryBuilder,
    QueryOperator,
    WhereClause,
    OrderBy,
    BaseRepository,
    transaction,
    execute_with_retry,
    QueryCache,
    enable_query_cache,
    disable_query_cache,
    get_query_cache
)
from smartpay_ai.repositories import UserRepository, TransactionRepository


# Test database URL (use test database)
TEST_DATABASE_URL = "postgresql://localhost:5432/smartpay_test"


@pytest.fixture
async def db_pool() -> AsyncGenerator[asyncpg.Pool, None]:
    """Create test database connection pool"""
    pool = await asyncpg.create_pool(TEST_DATABASE_URL, min_size=1, max_size=5)
    yield pool
    await pool.close()


@pytest.fixture
async def clean_db(db_pool: asyncpg.Pool):
    """Clean test database before each test"""
    async with db_pool.acquire() as conn:
        # Clear test data
        await conn.execute("TRUNCATE users, transactions, wallets, login_attempts CASCADE")
    yield
    # Cleanup after test
    async with db_pool.acquire() as conn:
        await conn.execute("TRUNCATE users, transactions, wallets, login_attempts CASCADE")


@pytest.fixture
async def sample_user(db_pool: asyncpg.Pool, clean_db) -> dict:
    """Create sample user for tests"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO users (name, phone, email, kyc_tier, two_factor_enabled, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, "Test User", "+26481234567", "test@example.com", "basic", False, datetime.now())
        return dict(row)


@pytest.fixture
async def sample_transactions(db_pool: asyncpg.Pool, sample_user: dict) -> list:
    """Create sample transactions for tests"""
    async with db_pool.acquire() as conn:
        transactions = []
        
        # Create various transaction types
        txn_data = [
            ("debit", "Food", "Shoprite", 150.50, "completed"),
            ("debit", "Transport", "MTC", 50.00, "completed"),
            ("debit", "Entertainment", "Cinema", 80.00, "completed"),
            ("credit", None, None, 500.00, "completed"),
            ("payment", "Bills", "NamPower", 200.00, "completed"),
        ]
        
        for txn_type, category, merchant, amount, status in txn_data:
            row = await conn.fetchrow("""
                INSERT INTO transactions 
                (user_id, type, category, merchant, amount, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            """, sample_user["id"], txn_type, category, merchant, amount, status, datetime.now())
            transactions.append(dict(row))
        
        return transactions


class TestQueryBuilder:
    """Tests for QueryBuilder class"""
    
    async def test_simple_select(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test basic SELECT query"""
        query = QueryBuilder("users")\
            .select(["id", "name", "email"])\
            .where("id", QueryOperator.EQ, sample_user["id"])
        
        results = await query.fetch_all(db_pool)
        
        assert len(results) == 1
        assert results[0]["id"] == sample_user["id"]
        assert results[0]["name"] == sample_user["name"]
    
    async def test_multiple_where_clauses(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test multiple WHERE conditions"""
        query = QueryBuilder("users")\
            .where("id", QueryOperator.EQ, sample_user["id"])\
            .where("kyc_tier", QueryOperator.EQ, "basic")
        
        results = await query.fetch_all(db_pool)
        assert len(results) == 1
    
    async def test_in_operator(self, db_pool: asyncpg.Pool, clean_db):
        """Test IN operator with list"""
        # Create multiple users
        async with db_pool.acquire() as conn:
            user_ids = []
            for i in range(3):
                row = await conn.fetchrow("""
                    INSERT INTO users (name, phone, kyc_tier, created_at)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                """, f"User {i}", f"+26481234567{i}", "basic", datetime.now())
                user_ids.append(row["id"])
        
        query = QueryBuilder("users")\
            .where("id", QueryOperator.IN, user_ids)
        
        results = await query.fetch_all(db_pool)
        assert len(results) == 3
    
    async def test_order_by(self, db_pool: asyncpg.Pool, sample_transactions: list):
        """Test ORDER BY clause"""
        query = QueryBuilder("transactions")\
            .where("user_id", QueryOperator.EQ, sample_transactions[0]["user_id"])\
            .order_by("amount", "DESC")
        
        results = await query.fetch_all(db_pool)
        
        # Should be ordered by amount descending
        amounts = [r["amount"] for r in results]
        assert amounts == sorted(amounts, reverse=True)
    
    async def test_limit_offset(self, db_pool: asyncpg.Pool, sample_transactions: list):
        """Test LIMIT and OFFSET"""
        query = QueryBuilder("transactions")\
            .where("user_id", QueryOperator.EQ, sample_transactions[0]["user_id"])\
            .order_by("created_at", "DESC")\
            .limit(2)\
            .offset(1)
        
        results = await query.fetch_all(db_pool)
        assert len(results) == 2
    
    async def test_fetch_one(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test fetch_one method"""
        query = QueryBuilder("users")\
            .where("id", QueryOperator.EQ, sample_user["id"])
        
        result = await query.fetch_one(db_pool)
        
        assert result is not None
        assert result["id"] == sample_user["id"]
    
    async def test_fetch_val(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test fetch_val method"""
        query = QueryBuilder("users")\
            .select(["COUNT(*) as count"])\
            .where("kyc_tier", QueryOperator.EQ, "basic")
        
        count = await query.fetch_val(db_pool)
        assert count >= 1


class TestBaseRepository:
    """Tests for BaseRepository class"""
    
    async def test_find_by_id(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test find_by_id method"""
        repo = BaseRepository(db_pool, "users")
        user = await repo.find_by_id(sample_user["id"])
        
        assert user is not None
        assert user["id"] == sample_user["id"]
    
    async def test_find_all_with_filters(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test find_all with filters"""
        repo = BaseRepository(db_pool, "users")
        users = await repo.find_all(
            filters={"kyc_tier": "basic"},
            limit=10
        )
        
        assert len(users) > 0
        assert all(u["kyc_tier"] == "basic" for u in users)
    
    async def test_count(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test count method"""
        repo = BaseRepository(db_pool, "users")
        count = await repo.count(filters={"kyc_tier": "basic"})
        
        assert count >= 1
    
    async def test_exists(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test exists method"""
        repo = BaseRepository(db_pool, "users")
        
        exists = await repo.exists({"id": sample_user["id"]})
        assert exists is True
        
        not_exists = await repo.exists({"id": "nonexistent-id"})
        assert not_exists is False
    
    async def test_insert(self, db_pool: asyncpg.Pool, clean_db):
        """Test insert method"""
        repo = BaseRepository(db_pool, "users")
        
        new_user = await repo.insert({
            "name": "New User",
            "phone": "+26481111111",
            "email": "new@example.com",
            "kyc_tier": "standard",
            "created_at": datetime.now()
        })
        
        assert new_user["id"] is not None
        assert new_user["name"] == "New User"
    
    async def test_update(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test update method"""
        repo = BaseRepository(db_pool, "users")
        
        updated = await repo.update(
            filters={"id": sample_user["id"]},
            updates={"kyc_tier": "premium", "updated_at": datetime.now()}
        )
        
        assert len(updated) == 1
        assert updated[0]["kyc_tier"] == "premium"
    
    async def test_delete(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test delete method"""
        repo = BaseRepository(db_pool, "users")
        
        # Delete user
        deleted_count = await repo.delete({"id": sample_user["id"]})
        assert deleted_count == 1
        
        # Verify deletion
        user = await repo.find_by_id(sample_user["id"])
        assert user is None


class TestUserRepository:
    """Tests for UserRepository"""
    
    async def test_get_user_by_phone(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test get_user_by_phone"""
        repo = UserRepository(db_pool)
        user = await repo.get_user_by_phone(sample_user["phone"])
        
        assert user is not None
        assert user["id"] == sample_user["id"]
    
    async def test_get_user_kyc_tier(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test get_user_kyc_tier"""
        repo = UserRepository(db_pool)
        tier = await repo.get_user_kyc_tier(sample_user["id"])
        
        assert tier == "basic"
    
    async def test_get_daily_spent(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_daily_spent"""
        repo = UserRepository(db_pool)
        spent = await repo.get_daily_spent(sample_user["id"])
        
        # Should include debit and payment transactions
        assert spent > 0
    
    async def test_get_transaction_history_stats(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_transaction_history_stats"""
        repo = UserRepository(db_pool)
        stats = await repo.get_transaction_history_stats(sample_user["id"], days=30)
        
        assert stats["transaction_count"] > 0
        assert stats["total_debit"] > 0
        assert stats["avg_transaction_amount"] > 0
    
    async def test_enable_two_factor(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test enable_two_factor"""
        repo = UserRepository(db_pool)
        updated = await repo.enable_two_factor(sample_user["id"])
        
        assert updated is not None
        assert updated["two_factor_enabled"] is True
    
    async def test_search_users(self, db_pool: asyncpg.Pool, sample_user: dict):
        """Test search_users"""
        repo = UserRepository(db_pool)
        results = await repo.search_users("Test", limit=10)
        
        assert len(results) > 0
        assert any(r["id"] == sample_user["id"] for r in results)


class TestTransactionRepository:
    """Tests for TransactionRepository"""
    
    async def test_get_transactions_by_user(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_transactions_by_user"""
        repo = TransactionRepository(db_pool)
        txns = await repo.get_transactions_by_user(
            user_id=sample_user["id"],
            period_days=30
        )
        
        assert len(txns) > 0
        assert all(t["user_id"] == sample_user["id"] for t in txns)
    
    async def test_get_transactions_by_category(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test filtering by category"""
        repo = TransactionRepository(db_pool)
        food_txns = await repo.get_transactions_by_user(
            user_id=sample_user["id"],
            category="Food"
        )
        
        assert len(food_txns) > 0
        assert all(t["category"] == "Food" for t in food_txns)
    
    async def test_get_transaction_totals(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_transaction_totals"""
        repo = TransactionRepository(db_pool)
        totals = await repo.get_transaction_totals(sample_user["id"], period_days=30)
        
        assert totals["total_debit"] > 0
        assert totals["total_credit"] > 0
        assert "net_flow" in totals
    
    async def test_get_category_spending(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_category_spending"""
        repo = TransactionRepository(db_pool)
        breakdown = await repo.get_category_spending(sample_user["id"], period_days=30)
        
        assert len(breakdown) > 0
        assert all("category" in item for item in breakdown)
        assert all("total_amount" in item for item in breakdown)
    
    async def test_get_merchant_spending(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test get_merchant_spending"""
        repo = TransactionRepository(db_pool)
        merchants = await repo.get_merchant_spending(sample_user["id"], period_days=30)
        
        assert len(merchants) > 0
        assert all("merchant" in item for item in merchants)
    
    async def test_detect_anomalies(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test detect_anomalies"""
        # Add an anomalously large transaction
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO transactions 
                (user_id, type, category, amount, status, created_at)
                VALUES ($1, 'debit', 'Food', 1000.00, 'completed', $2)
            """, sample_user["id"], datetime.now())
        
        repo = TransactionRepository(db_pool)
        anomalies = await repo.detect_anomalies(
            user_id=sample_user["id"],
            threshold_multiplier=2.0,
            period_days=30
        )
        
        # Should detect the large transaction
        assert len(anomalies) > 0
    
    async def test_calculate_spending_trend(self, db_pool: asyncpg.Pool, sample_user: dict, sample_transactions: list):
        """Test calculate_spending_trend"""
        repo = TransactionRepository(db_pool)
        trend, percentage = await repo.calculate_spending_trend(
            user_id=sample_user["id"],
            current_days=7,
            previous_days=7
        )
        
        assert trend in ["increasing", "decreasing", "stable"]
        assert isinstance(percentage, float)


class TestTransactionManagement:
    """Tests for transaction management"""
    
    async def test_transaction_context(self, db_pool: asyncpg.Pool, clean_db):
        """Test transaction context manager"""
        async with transaction(db_pool) as conn:
            # Insert user
            user_row = await conn.fetchrow("""
                INSERT INTO users (name, phone, kyc_tier, created_at)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            """, "Txn User", "+26481999999", "basic", datetime.now())
            user_id = user_row["id"]
            
            # Insert transaction
            await conn.execute("""
                INSERT INTO transactions (user_id, type, amount, status, created_at)
                VALUES ($1, $2, $3, $4, $5)
            """, user_id, "debit", 100.00, "completed", datetime.now())
        
        # Verify both were committed
        async with db_pool.acquire() as conn:
            user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
            assert user is not None
            
            txn_count = await conn.fetchval(
                "SELECT COUNT(*) FROM transactions WHERE user_id = $1",
                user_id
            )
            assert txn_count == 1
    
    async def test_transaction_rollback(self, db_pool: asyncpg.Pool, clean_db):
        """Test transaction rollback on error"""
        try:
            async with transaction(db_pool) as conn:
                # Insert user
                await conn.execute("""
                    INSERT INTO users (name, phone, kyc_tier, created_at)
                    VALUES ($1, $2, $3, $4)
                """, "Rollback User", "+26481888888", "basic", datetime.now())
                
                # Trigger error (invalid data)
                raise Exception("Simulated error")
        except Exception:
            pass
        
        # Verify rollback occurred
        async with db_pool.acquire() as conn:
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM users WHERE phone = $1",
                "+26481888888"
            )
            assert count == 0


class TestQueryCache:
    """Tests for query caching"""
    
    def test_cache_set_get(self):
        """Test basic cache operations"""
        cache = QueryCache(ttl_seconds=60)
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        assert cache.get("nonexistent") is None
    
    def test_cache_expiry(self):
        """Test cache expiry"""
        import time
        
        cache = QueryCache(ttl_seconds=1)
        cache.set("key1", "value1")
        
        # Should exist immediately
        assert cache.get("key1") == "value1"
        
        # Wait for expiry
        time.sleep(1.1)
        
        # Should be expired
        assert cache.get("key1") is None
    
    async def test_get_or_fetch(self):
        """Test get_or_fetch method"""
        cache = QueryCache(ttl_seconds=60)
        
        call_count = 0
        
        async def fetch_fn():
            nonlocal call_count
            call_count += 1
            return "fetched_value"
        
        # First call should fetch
        value1 = await cache.get_or_fetch("key1", fetch_fn)
        assert value1 == "fetched_value"
        assert call_count == 1
        
        # Second call should use cache
        value2 = await cache.get_or_fetch("key1", fetch_fn)
        assert value2 == "fetched_value"
        assert call_count == 1  # Not incremented
    
    def test_global_cache(self):
        """Test global cache enable/disable"""
        # Initially disabled
        assert get_query_cache() is None
        
        # Enable
        enable_query_cache(ttl_seconds=30)
        assert get_query_cache() is not None
        
        # Disable
        disable_query_cache()
        assert get_query_cache() is None


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
