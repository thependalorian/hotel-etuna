"""
User Repository - Centralized User Data Access Layer

Location: backend_python/smartpay_ai/repositories/user_repository.py
Purpose: Eliminate duplicate user query patterns across agents and services

Common Queries:
- Get user by ID/phone/email
- Check KYC tier and limits
- Get spending totals (daily/monthly)
- Get user profile with wallet info
- Track login attempts and device trust

DRY Violation Fix: Consolidates 50+ duplicate user query patterns
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

import asyncpg

from smartpay_ai.shared.db_utils import (
    BaseRepository,
    QueryBuilder,
    QueryOperator,
    transaction
)

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository):
    """Repository for user data access with common query patterns"""
    
    def __init__(self, db_pool: asyncpg.Pool):
        super().__init__(db_pool, "users")
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID
        
        Args:
            user_id: User ID
        
        Returns:
            User dict or None
        """
        return await self.find_by_id(user_id)
    
    async def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """
        Get user by phone number
        
        Args:
            phone: Phone number
        
        Returns:
            User dict or None
        """
        return await self.query()\
            .where("phone", QueryOperator.EQ, phone)\
            .limit(1)\
            .fetch_one(self.db_pool)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address
        
        Args:
            email: Email address
        
        Returns:
            User dict or None
        """
        return await self.query()\
            .where("email", QueryOperator.EQ, email)\
            .limit(1)\
            .fetch_one(self.db_pool)
    
    async def get_user_with_wallet(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user with primary wallet information
        
        Args:
            user_id: User ID
        
        Returns:
            User dict with wallet fields or None
        """
        query = """
            SELECT 
                u.*,
                w.id as wallet_id,
                w.wallet_number,
                w.balance_cents,
                w.currency
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id AND w.is_primary = true
            WHERE u.id = $1
            LIMIT 1
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None
    
    async def get_user_kyc_tier(self, user_id: str) -> Optional[str]:
        """
        Get user's KYC tier
        
        Args:
            user_id: User ID
        
        Returns:
            KYC tier string or None
        """
        result = await self.query()\
            .select(["kyc_tier"])\
            .where("id", QueryOperator.EQ, user_id)\
            .fetch_one(self.db_pool)
        
        return result.get("kyc_tier") if result else None
    
    async def get_daily_spent(
        self,
        user_id: str,
        date: Optional[datetime] = None
    ) -> float:
        """
        Get total amount spent by user today (or specified date)
        
        Args:
            user_id: User ID
            date: Date to calculate for (default: today)
        
        Returns:
            Total spent amount
        """
        if date is None:
            date = datetime.now()
        
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        query = """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = $1
              AND type IN ('debit', 'payment', 'transfer_out')
              AND status = 'completed'
              AND created_at >= $2
              AND created_at < $3
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval(query, user_id, start_of_day, end_of_day)
            return float(result) if result else 0.0
    
    async def get_monthly_spent(
        self,
        user_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> float:
        """
        Get total amount spent by user this month (or specified month)
        
        Args:
            user_id: User ID
            year: Year (default: current year)
            month: Month (default: current month)
        
        Returns:
            Total spent amount
        """
        now = datetime.now()
        if year is None:
            year = now.year
        if month is None:
            month = now.month
        
        start_of_month = datetime(year, month, 1)
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)
        
        query = """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = $1
              AND type IN ('debit', 'payment', 'transfer_out')
              AND status = 'completed'
              AND created_at >= $2
              AND created_at < $3
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval(query, user_id, start_of_month, end_of_month)
            return float(result) if result else 0.0
    
    async def get_transaction_history_stats(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get user's transaction history statistics
        
        Args:
            user_id: User ID
            days: Number of days to analyze
        
        Returns:
            Dict with transaction statistics
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        query = """
            SELECT 
                COUNT(*) as transaction_count,
                COALESCE(SUM(CASE WHEN type IN ('debit', 'payment', 'transfer_out') THEN amount ELSE 0 END), 0) as total_debit,
                COALESCE(SUM(CASE WHEN type IN ('credit', 'load', 'transfer_in') THEN amount ELSE 0 END), 0) as total_credit,
                COALESCE(AVG(CASE WHEN type IN ('debit', 'payment', 'transfer_out') THEN amount ELSE NULL END), 0) as avg_transaction_amount,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as transactions_last_hour,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as transactions_last_24h
            FROM transactions
            WHERE user_id = $1
              AND created_at >= $2
              AND status = 'completed'
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, cutoff)
            if not row:
                return {
                    "transaction_count": 0,
                    "total_debit": 0.0,
                    "total_credit": 0.0,
                    "avg_transaction_amount": 0.0,
                    "active_days": 0,
                    "transactions_last_hour": 0,
                    "transactions_last_24h": 0,
                    "avg_transactions_per_hour": 0.0
                }
            
            result = dict(row)
            result["total_debit"] = float(result["total_debit"])
            result["total_credit"] = float(result["total_credit"])
            result["avg_transaction_amount"] = float(result["avg_transaction_amount"])
            
            # Calculate average transactions per hour
            hours_in_period = days * 24
            result["avg_transactions_per_hour"] = (
                result["transaction_count"] / hours_in_period
                if hours_in_period > 0 else 0.0
            )
            
            return result
    
    async def get_failed_login_attempts(
        self,
        user_id: str,
        hours: int = 24
    ) -> int:
        """
        Get count of failed login attempts in time window
        
        Args:
            user_id: User ID
            hours: Time window in hours
        
        Returns:
            Count of failed attempts
        """
        cutoff = datetime.now() - timedelta(hours=hours)
        
        query = """
            SELECT COUNT(*) as count
            FROM login_attempts
            WHERE user_id = $1
              AND success = false
              AND created_at >= $2
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval(query, user_id, cutoff)
            return int(result) if result else 0
    
    async def get_account_age_days(self, user_id: str) -> int:
        """
        Get account age in days
        
        Args:
            user_id: User ID
        
        Returns:
            Account age in days
        """
        query = """
            SELECT EXTRACT(DAY FROM NOW() - created_at) as age_days
            FROM users
            WHERE id = $1
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval(query, user_id)
            return int(result) if result else 0
    
    async def get_device_count(
        self,
        user_id: str,
        days: int = 7
    ) -> int:
        """
        Get count of distinct devices used by user
        
        Args:
            user_id: User ID
            days: Time window in days
        
        Returns:
            Number of distinct devices
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        query = """
            SELECT COUNT(DISTINCT device_id) as device_count
            FROM login_attempts
            WHERE user_id = $1
              AND created_at >= $2
        """
        
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval(query, user_id, cutoff)
            return int(result) if result else 0
    
    async def is_device_trusted(
        self,
        user_id: str,
        device_id: str
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if device is trusted for user
        
        Args:
            user_id: User ID
            device_id: Device identifier
        
        Returns:
            Tuple of (is_trusted, device_info_dict)
        """
        query = """
            SELECT 
                MIN(created_at) as first_seen,
                MAX(created_at) as last_seen,
                COUNT(*) as login_count
            FROM login_attempts
            WHERE user_id = $1 
              AND device_id = $2 
              AND success = true
        """
        
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, device_id)
            
            if not row or row["login_count"] == 0:
                return False, {
                    "is_trusted": False,
                    "first_seen": None,
                    "last_seen": None,
                    "login_count": 0,
                    "status": "new_device"
                }
            
            login_count = int(row["login_count"])
            first_seen = row["first_seen"]
            
            # Device is trusted if used 5+ times over 7+ days
            days_known = (datetime.now() - first_seen).days if first_seen else 0
            is_trusted = login_count >= 5 and days_known >= 7
            
            device_info = {
                "is_trusted": is_trusted,
                "first_seen": first_seen.isoformat() if first_seen else None,
                "last_seen": row["last_seen"].isoformat() if row["last_seen"] else None,
                "login_count": login_count,
                "days_known": days_known,
                "status": "trusted" if is_trusted else "known_device"
            }
            
            return is_trusted, device_info
    
    async def update_kyc_tier(
        self,
        user_id: str,
        new_tier: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update user's KYC tier
        
        Args:
            user_id: User ID
            new_tier: New KYC tier
        
        Returns:
            Updated user dict or None
        """
        results = await self.update(
            filters={"id": user_id},
            updates={"kyc_tier": new_tier, "updated_at": datetime.now()}
        )
        return results[0] if results else None
    
    async def enable_two_factor(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Enable two-factor authentication for user
        
        Args:
            user_id: User ID
        
        Returns:
            Updated user dict or None
        """
        results = await self.update(
            filters={"id": user_id},
            updates={"two_factor_enabled": True, "updated_at": datetime.now()}
        )
        return results[0] if results else None
    
    async def search_users(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search users by name, phone, or email
        
        Args:
            query: Search query
            limit: Maximum results
        
        Returns:
            List of matching users
        """
        search_query = f"%{query}%"
        
        sql = """
            SELECT id, name, phone, email, smartpay_id, kyc_tier
            FROM users
            WHERE name ILIKE $1
               OR phone ILIKE $1
               OR email ILIKE $1
               OR smartpay_id ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2
        """
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(sql, search_query, limit)
            return [dict(row) for row in rows]
    
    async def get_users_by_tier(
        self,
        kyc_tier: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all users with specific KYC tier
        
        Args:
            kyc_tier: KYC tier to filter by
            limit: Optional limit on results
        
        Returns:
            List of users
        """
        return await self.find_all(
            filters={"kyc_tier": kyc_tier},
            order_by=("created_at", "DESC"),
            limit=limit
        )
