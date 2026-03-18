# Database Query Utils - Quick Reference

**Quick start guide for using the new database abstraction layer**

---

## 🚀 Import Statements

```python
# Core utilities
from smartpay_ai.shared.db_utils import (
    QueryBuilder,
    QueryOperator,
    BaseRepository,
    transaction,
    execute_with_retry,
    QueryCache,
    enable_query_cache
)

# Repositories
from smartpay_ai.repositories import (
    UserRepository,
    TransactionRepository
)
```

---

## 👤 User Queries

### Get User

```python
repo = UserRepository(db_pool)

# By ID
user = await repo.get_user_by_id(user_id)

# By phone
user = await repo.get_user_by_phone("+26481234567")

# By email
user = await repo.get_user_by_email("user@example.com")

# With wallet info (single JOIN query)
user_with_wallet = await repo.get_user_with_wallet(user_id)
```

### User Statistics

```python
# KYC tier
tier = await repo.get_user_kyc_tier(user_id)

# Spending
daily = await repo.get_daily_spent(user_id)
monthly = await repo.get_monthly_spent(user_id, year=2026, month=3)

# Transaction stats
stats = await repo.get_transaction_history_stats(user_id, days=30)
# Returns: {transaction_count, total_debit, total_credit, avg_transaction_amount, 
#           transactions_last_hour, transactions_last_24h, ...}

# Account info
age_days = await repo.get_account_age_days(user_id)
```

### Security Checks

```python
# Failed logins
failed = await repo.get_failed_login_attempts(user_id, hours=24)

# Device trust
is_trusted, device_info = await repo.is_device_trusted(user_id, device_id)
# device_info: {is_trusted, first_seen, last_seen, login_count, days_known, status}

# Device count
device_count = await repo.get_device_count(user_id, days=7)
```

### Updates

```python
# Update KYC tier
await repo.update_kyc_tier(user_id, "premium")

# Enable 2FA
await repo.enable_two_factor(user_id)
```

### Search

```python
# Search users
users = await repo.search_users("John", limit=10)

# Get users by tier
premium_users = await repo.get_users_by_tier("premium", limit=50)
```

---

## 💳 Transaction Queries

### Get Transactions

```python
repo = TransactionRepository(db_pool)

# Basic list
txns = await repo.get_transactions_by_user(user_id, period_days=30)

# With filters
food_txns = await repo.get_transactions_by_user(
    user_id=user_id,
    period_days=30,
    transaction_type="debit",
    category="Food",
    status="completed",
    limit=10,
    offset=0
)

# By wallet
wallet_txns = await repo.get_transactions_by_wallet(wallet_id, period_days=7)

# Pending
pending = await repo.get_pending_transactions(user_id)

# Large transactions
large = await repo.get_large_transactions(user_id, min_amount=1000.0, period_days=30)
```

### Aggregations

```python
# Totals by type
totals = await repo.get_transaction_totals(user_id, period_days=30)
# Returns: {total_debit, total_credit, total_fees, net_flow}

# Category breakdown
breakdown = await repo.get_category_spending(user_id, period_days=30)
# Returns: [{category, transaction_count, total_amount, avg_amount, percentage}, ...]

# Top merchants
merchants = await repo.get_merchant_spending(user_id, period_days=30, limit=10)
# Returns: [{merchant, transaction_count, total_amount, avg_amount}, ...]

# Time-series data
series = await repo.get_time_series_data(
    user_id=user_id,
    period_days=30,
    interval="day"  # or "week", "month"
)
# Returns: [{period, transaction_count, debit_amount, credit_amount, net_amount}, ...]
```

### Analysis

```python
# Detect anomalies
anomalies = await repo.detect_anomalies(
    user_id=user_id,
    threshold_multiplier=2.0,
    period_days=30
)
# Returns: [{transaction, reason, severity, multiplier}, ...]

# Spending trend
trend, percentage = await repo.calculate_spending_trend(
    user_id=user_id,
    current_days=30,
    previous_days=30
)
# Returns: ("increasing"/"decreasing"/"stable", percentage_change)

# Recent count
count = await repo.count_recent_transactions(user_id, hours=1)
```

### Recipient History

```python
# Get recipient history
history = await repo.get_recipient_transaction_history(recipient_id, limit=50)
```

---

## 🔧 Advanced: Query Builder

### Basic Query

```python
# Simple SELECT with WHERE
users = await QueryBuilder("users")\\
    .where("kyc_tier", QueryOperator.EQ, "premium")\\
    .fetch_all(db_pool)
```

### Multiple Filters

```python
# Multiple WHERE conditions (AND)
users = await QueryBuilder("users")\\
    .where("kyc_tier", QueryOperator.EQ, "premium")\\
    .where("created_at", QueryOperator.GTE, cutoff_date)\\
    .where("two_factor_enabled", QueryOperator.EQ, True)\\
    .fetch_all(db_pool)
```

### IN Operator

```python
# WHERE field IN (values)
users = await QueryBuilder("users")\\
    .where("id", QueryOperator.IN, [id1, id2, id3])\\
    .fetch_all(db_pool)
```

### Ordering and Pagination

```python
# ORDER BY + LIMIT + OFFSET
results = await QueryBuilder("transactions")\\
    .where("user_id", QueryOperator.EQ, user_id)\\
    .order_by("created_at", "DESC")\\
    .limit(20)\\
    .offset(40)\\
    .fetch_all(db_pool)
```

### Select Specific Fields

```python
# SELECT specific columns
users = await QueryBuilder("users")\\
    .select(["id", "name", "email"])\\
    .where("kyc_tier", QueryOperator.EQ, "premium")\\
    .fetch_all(db_pool)
```

### Fetch Methods

```python
query = QueryBuilder("users").where("id", QueryOperator.EQ, user_id)

# Fetch all rows as list of dicts
results = await query.fetch_all(db_pool)

# Fetch first row as dict (or None)
result = await query.fetch_one(db_pool)

# Fetch single value
count = await QueryBuilder("users")\\
    .select(["COUNT(*)"])\\
    .fetch_val(db_pool)
```

---

## 🔄 Advanced: Base Repository

### Custom Repository

```python
class WalletRepository(BaseRepository):
    def __init__(self, db_pool):
        super().__init__(db_pool, "wallets")
    
    async def get_user_wallets(self, user_id: str):
        return await self.find_all(
            filters={"user_id": user_id},
            order_by=("created_at", "DESC")
        )
    
    async def get_primary_wallet(self, user_id: str):
        wallets = await self.find_all(
            filters={"user_id": user_id, "is_primary": True},
            limit=1
        )
        return wallets[0] if wallets else None

# Usage
wallet_repo = WalletRepository(db_pool)
wallets = await wallet_repo.get_user_wallets(user_id)
```

### Generic Operations

```python
repo = BaseRepository(db_pool, "any_table")

# Find by ID
record = await repo.find_by_id(record_id)

# Find with filters
records = await repo.find_all(
    filters={"status": "active", "user_id": user_id},
    order_by=("created_at", "DESC"),
    limit=10
)

# Count
count = await repo.count(filters={"status": "active"})

# Exists
exists = await repo.exists({"user_id": user_id})

# Insert
new_record = await repo.insert({
    "field1": "value1",
    "field2": "value2"
})

# Update
updated = await repo.update(
    filters={"id": record_id},
    updates={"status": "completed"}
)

# Delete
deleted_count = await repo.delete({"id": record_id})
```

---

## 💾 Transactions

### Atomic Operations

```python
from smartpay_ai.shared.db_utils import transaction

# Multiple operations in one transaction
async with transaction(db_pool) as conn:
    # Insert user
    user_row = await conn.fetchrow("""
        INSERT INTO users (name, phone) VALUES ($1, $2) RETURNING id
    """, name, phone)
    
    # Insert wallet
    await conn.execute("""
        INSERT INTO wallets (user_id, balance_cents) VALUES ($1, $2)
    """, user_row["id"], 0)
    
    # Automatically commits on success
    # Automatically rolls back on exception
```

---

## 🔁 Retry Logic

### Automatic Retry

```python
from smartpay_ai.shared.db_utils import execute_with_retry

# Retry on transient failures
results = await execute_with_retry(
    db_pool=db_pool,
    query="SELECT * FROM users WHERE id = $1",
    params=[user_id],
    max_retries=3,
    retry_delay=0.5  # seconds
)
```

---

## 💾 Query Caching

### Enable Caching

```python
from smartpay_ai.shared.db_utils import (
    enable_query_cache,
    disable_query_cache,
    get_query_cache
)

# Enable global cache
enable_query_cache(ttl_seconds=60)

# Use cache
cache = get_query_cache()
result = await cache.get_or_fetch(
    key=f"user_{user_id}_profile",
    fetch_fn=lambda: repo.get_user_by_id(user_id)
)

# Disable cache
disable_query_cache()
```

### Manual Caching

```python
from smartpay_ai.shared.db_utils import QueryCache

# Create dedicated cache
cache = QueryCache(ttl_seconds=300)  # 5 minutes

# Set value
cache.set("key", "value")

# Get value
value = cache.get("key")

# Get or fetch
result = await cache.get_or_fetch(
    key="expensive_query_result",
    fetch_fn=lambda: expensive_query()
)
```

---

## 📋 All Query Operators

```python
QueryOperator.EQ          # =
QueryOperator.NE          # !=
QueryOperator.GT          # >
QueryOperator.GTE         # >=
QueryOperator.LT          # <
QueryOperator.LTE         # <=
QueryOperator.IN          # IN (...)
QueryOperator.NOT_IN      # NOT IN (...)
QueryOperator.LIKE        # LIKE
QueryOperator.ILIKE       # ILIKE (case-insensitive)
QueryOperator.IS_NULL     # IS NULL
QueryOperator.IS_NOT_NULL # IS NOT NULL
```

---

## 🎯 Common Patterns

### Pattern 1: Get User Risk Profile

```python
async def get_user_risk_profile(user_id: str, db_pool):
    user_repo = UserRepository(db_pool)
    txn_repo = TransactionRepository(db_pool)
    
    # Get user info
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        return None
    
    # Get security metrics
    failed_logins = await user_repo.get_failed_login_attempts(user_id, hours=24)
    device_count = await user_repo.get_device_count(user_id, days=7)
    
    # Get transaction patterns
    stats = await user_repo.get_transaction_history_stats(user_id, days=30)
    anomalies = await txn_repo.detect_anomalies(user_id, threshold_multiplier=2.0)
    
    return {
        "user": user,
        "security": {
            "failed_logins_24h": failed_logins,
            "device_count_7d": device_count
        },
        "transactions": stats,
        "anomalies": anomalies
    }
```

### Pattern 2: Generate Spending Report

```python
async def generate_spending_report(user_id: str, period_days: int, db_pool):
    repo = TransactionRepository(db_pool)
    
    # Get all spending data
    totals = await repo.get_transaction_totals(user_id, period_days)
    categories = await repo.get_category_spending(user_id, period_days)
    merchants = await repo.get_merchant_spending(user_id, period_days, limit=5)
    trend, pct = await repo.calculate_spending_trend(user_id, period_days, period_days)
    
    return {
        "period_days": period_days,
        "totals": totals,
        "by_category": categories,
        "top_merchants": merchants,
        "trend": {
            "direction": trend,
            "percentage_change": pct
        }
    }
```

### Pattern 3: Check Transaction Safety

```python
async def check_transaction_safety(
    user_id: str,
    recipient_id: str,
    amount: float,
    db_pool
):
    user_repo = UserRepository(db_pool)
    txn_repo = TransactionRepository(db_pool)
    
    # Check user status
    user = await user_repo.get_user_by_id(user_id)
    daily_spent = await user_repo.get_daily_spent(user_id)
    
    # Check recipient reputation
    recipient_history = await txn_repo.get_recipient_transaction_history(recipient_id, limit=10)
    
    # Check velocity
    recent_count = await txn_repo.count_recent_transactions(user_id, hours=1)
    
    # Determine safety
    is_safe = (
        user and
        daily_spent + amount < 5000 and  # Under daily limit
        len(recipient_history) > 0 and  # Known recipient
        recent_count < 5  # Not too many recent transactions
    )
    
    return {
        "is_safe": is_safe,
        "user_kyc_tier": user["kyc_tier"] if user else None,
        "daily_spent": daily_spent,
        "recipient_tx_count": len(recipient_history),
        "recent_tx_count": recent_count
    }
```

---

## ⚡ Performance Tips

### 1. Reuse Repositories

```python
# ✅ Good: Create once, reuse
class MyService:
    def __init__(self, db_pool):
        self.user_repo = UserRepository(db_pool)
        self.txn_repo = TransactionRepository(db_pool)
    
    async def method1(self):
        return await self.user_repo.get_user_by_id(...)
    
    async def method2(self):
        return await self.txn_repo.get_transactions_by_user(...)

# ❌ Bad: Create every time
async def get_user(user_id, db_pool):
    repo = UserRepository(db_pool)  # Wasteful
    return await repo.get_user_by_id(user_id)
```

### 2. Use Database-Level Aggregation

```python
# ✅ Good: Database aggregates
totals = await repo.get_transaction_totals(user_id)

# ❌ Bad: Fetch all, aggregate in Python
all_txns = await repo.get_transactions_by_user(user_id)
total = sum(t["amount"] for t in all_txns)  # Slow for large datasets
```

### 3. Enable Caching for Hot Data

```python
# For frequently read, rarely changed data
enable_query_cache(ttl_seconds=300)  # 5 minutes

# Good candidates:
# - User profiles (kyc_tier, limits)
# - Configuration data
# - Reference data (categories, merchants)

# Bad candidates:
# - Real-time balances
# - Pending transactions
# - Live fraud scores
```

---

## 🐛 Debugging

### Print Generated SQL

```python
query = QueryBuilder("users")\\
    .where("id", QueryOperator.EQ, user_id)\\
    .where("kyc_tier", QueryOperator.EQ, "premium")

sql, params = query.build_query()
print(f"SQL: {sql}")
print(f"Params: {params}")
# SQL: SELECT * FROM users WHERE id = $1 AND kyc_tier = $2
# Params: ['user-123', 'premium']
```

### Check Query Results

```python
# Use fetch_one for debugging
result = await query.fetch_one(db_pool)
print(f"Result: {result}")

# Check count first
count = await repo.count(filters={"status": "active"})
print(f"Active records: {count}")
```

---

## 📚 More Examples

See:
- Full guide: `DB_QUERY_REFACTORING.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- Tests: `tests/test_db_utils.py`
- Refactored files: `agents/security_guardian/tools.py`, `agents/transaction_analyst/tools.py`

---

*Quick Reference v1.0 - March 18, 2026*
