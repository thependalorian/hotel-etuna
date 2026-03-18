"""
Fraud Analytics Engine using DuckDB

Location: backend_python/smartpay_ai/analytics/fraud_analytics.py
Purpose: Transaction velocity tracking, anomaly detection, risk pattern identification
Usage: Feeds Security Guardian agent with fraud insights

MIGRATION NOTE:
Transaction limits now imported from centralized config.transaction_limits module.
Uses centralized KYC tier limits for fraud detection rules (DRY violation #4 fix).
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

import duckdb
import pandas as pd
import numpy as np

# Import centralized transaction limits (PSD-6 compliance)
from smartpay_ai.config.transaction_limits import (
    EMONEY_LIMITS,
    KYCTier,
    RiskAmountThresholds,
)

logger = logging.getLogger(__name__)


class FraudAnalytics:
    """Real-time fraud detection analytics using DuckDB"""

    def __init__(self, db_path: str = ":memory:"):
        """
        Initialize DuckDB connection for fraud analytics
        
        Args:
            db_path: Path to DuckDB database file (default: in-memory)
        """
        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._init_schema()
        logger.info(f"FraudAnalytics initialized with DuckDB at {db_path}")

    def _init_schema(self):
        """Initialize DuckDB schema for fraud analytics"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR,
                merchant VARCHAR,
                merchant_location VARCHAR,
                timestamp TIMESTAMP NOT NULL,
                wallet_id VARCHAR,
                status VARCHAR DEFAULT 'completed',
                device_id VARCHAR,
                ip_address VARCHAR,
                currency VARCHAR DEFAULT 'NAD'
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS fraud_events (
                transaction_id VARCHAR PRIMARY KEY,
                is_fraud BOOLEAN NOT NULL,
                risk_score DECIMAL(5,2),
                flagged_reason VARCHAR,
                timestamp TIMESTAMP NOT NULL,
                reviewed BOOLEAN DEFAULT FALSE,
                reviewed_by VARCHAR,
                reviewed_at TIMESTAMP
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS user_risk_profiles (
                user_id VARCHAR PRIMARY KEY,
                risk_level VARCHAR DEFAULT 'low',
                risk_score DECIMAL(5,2) DEFAULT 0,
                total_transactions INTEGER DEFAULT 0,
                flagged_transactions INTEGER DEFAULT 0,
                last_updated TIMESTAMP,
                kyc_tier INTEGER DEFAULT 1
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS fraud_rules (
                rule_id VARCHAR PRIMARY KEY,
                rule_name VARCHAR NOT NULL,
                rule_type VARCHAR NOT NULL,
                threshold_value DECIMAL(10,2),
                severity VARCHAR DEFAULT 'medium',
                enabled BOOLEAN DEFAULT TRUE
            )
        """)

        # Initialize default fraud rules
        self._init_fraud_rules()

        logger.info("DuckDB schema initialized for fraud analytics")

    def _init_fraud_rules(self):
        """Initialize default fraud detection rules"""
        default_rules = [
            ("velocity_1h", "High velocity (1 hour)", "velocity", 10.0, "high"),
            ("velocity_24h", "High velocity (24 hours)", "velocity", 50.0, "medium"),
            ("large_transaction", "Large transaction amount", "amount", 5000.0, "high"),
            ("unusual_merchant", "Unusual merchant category", "merchant", 0.0, "medium"),
            ("location_change", "Rapid location change", "location", 0.0, "high"),
            ("device_change", "Multiple devices", "device", 3.0, "medium"),
            ("kyc_limit", "KYC tier limit exceeded", "kyc", 0.0, "high"),
        ]

        for rule_id, name, rule_type, threshold, severity in default_rules:
            self.conn.execute("""
                INSERT OR IGNORE INTO fraud_rules 
                (rule_id, rule_name, rule_type, threshold_value, severity)
                VALUES (?, ?, ?, ?, ?)
            """, [rule_id, name, rule_type, threshold, severity])

    def load_transactions_from_postgres(self, pg_conn_string: str, days_back: int = 30):
        """
        Load transaction data from PostgreSQL for fraud analysis
        
        Args:
            pg_conn_string: PostgreSQL connection string
            days_back: Number of days of historical data to load
        """
        import asyncpg
        import asyncio

        async def _load():
            conn = await asyncpg.connect(pg_conn_string)
            try:
                cutoff_date = datetime.now() - timedelta(days=days_back)
                rows = await conn.fetch("""
                    SELECT 
                        id, user_id, amount, category, merchant,
                        created_at as timestamp, wallet_id, status
                    FROM transactions
                    WHERE created_at >= $1
                    ORDER BY created_at DESC
                """, cutoff_date)

                if rows:
                    df = pd.DataFrame([dict(row) for row in rows])
                    self.conn.execute("DELETE FROM transactions")
                    self.conn.register('transactions_df', df)
                    self.conn.execute("INSERT INTO transactions SELECT * FROM transactions_df")
                    logger.info(f"Loaded {len(rows)} transactions for fraud analysis")
            finally:
                await conn.close()

        asyncio.run(_load())

    def load_transactions_from_dataframe(self, df: pd.DataFrame):
        """
        Load transactions from pandas DataFrame
        
        Args:
            df: DataFrame with transaction columns
        """
        self.conn.execute("DELETE FROM transactions")
        self.conn.register('transactions_df', df)
        
        # Select columns explicitly to match schema
        self.conn.execute("""
            INSERT INTO transactions 
            (id, user_id, amount, category, merchant, merchant_location, 
             timestamp, wallet_id, status, device_id, ip_address, currency)
            SELECT 
                id, user_id, amount, category, merchant,
                COALESCE(merchant_location, 'unknown') as merchant_location,
                timestamp, wallet_id, status,
                COALESCE(device_id, 'unknown') as device_id,
                COALESCE(ip_address, 'unknown') as ip_address,
                COALESCE(currency, 'NAD') as currency
            FROM transactions_df
        """)
        logger.info(f"Loaded {len(df)} transactions from DataFrame")

    def transaction_velocity_tracking(self, user_id: str, window_hours: int = 1) -> Dict[str, Any]:
        """
        Track transaction velocity for a user
        
        Args:
            user_id: User identifier
            window_hours: Time window in hours
            
        Returns:
            Velocity metrics
        """
        cutoff = datetime.now() - timedelta(hours=window_hours)

        result = self.conn.execute("""
            SELECT 
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                MAX(amount) as max_amount,
                COUNT(DISTINCT merchant) as unique_merchants,
                COUNT(DISTINCT category) as unique_categories
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
        """, [user_id, cutoff]).fetchone()

        # Calculate risk based on velocity
        tx_count = result[0] if result else 0
        total_amount = float(result[1]) if result and result[1] else 0.0

        # Risk thresholds for Namibia context (aligned with centralized limits)
        # DRY Violation #4 fix: Use centralized risk amount thresholds
        if window_hours == 1:
            high_velocity = 10
            # Custom hourly threshold (analytics-specific sensitivity)
            high_amount = 2000  # NAD - May differ from standard limits for hourly analysis
        elif window_hours == 24:
            high_velocity = 50
            # Align with HIGH risk threshold for daily analysis (N$10,000)
            high_amount = RiskAmountThresholds.HIGH_AMOUNT  # NAD
        else:
            high_velocity = 5
            # Align with STANDARD risk threshold for general monitoring (N$1,000)
            high_amount = RiskAmountThresholds.STANDARD_AMOUNT  # NAD

        risk_score = 0.0
        risk_factors = []

        if tx_count > high_velocity:
            risk_score += 30.0
            risk_factors.append(f"High velocity: {tx_count} transactions in {window_hours}h")

        if total_amount > high_amount:
            risk_score += 25.0
            risk_factors.append(f"High amount: N${total_amount:.2f} in {window_hours}h")

        return {
            "user_id": user_id,
            "window_hours": window_hours,
            "transaction_count": tx_count,
            "total_amount": total_amount,
            "avg_amount": float(result[2]) if result and result[2] else 0.0,
            "max_amount": float(result[3]) if result and result[3] else 0.0,
            "unique_merchants": result[4] if result else 0,
            "unique_categories": result[5] if result else 0,
            "risk_score": round(risk_score, 2),
            "risk_factors": risk_factors
        }

    def anomaly_detection_rules(self, transaction_id: str) -> Dict[str, Any]:
        """
        Apply rule-based anomaly detection to a transaction
        
        Args:
            transaction_id: Transaction identifier
            
        Returns:
            Anomaly detection results
        """
        # Get transaction details
        tx = self.conn.execute("""
            SELECT 
                id, user_id, amount, category, merchant,
                timestamp, device_id, ip_address
            FROM transactions
            WHERE id = ?
        """, [transaction_id]).fetchone()

        if not tx:
            return {"error": f"Transaction {transaction_id} not found"}

        user_id = tx[1]
        amount = float(tx[2])
        timestamp = tx[5]

        anomalies = []
        risk_score = 0.0

        # Rule 1: Check velocity (1 hour)
        velocity_1h = self.transaction_velocity_tracking(user_id, window_hours=1)
        if velocity_1h["transaction_count"] > 10:
            anomalies.append({
                "rule": "velocity_1h",
                "severity": "high",
                "detail": f"{velocity_1h['transaction_count']} transactions in 1 hour"
            })
            risk_score += 30.0

        # Rule 2: Large transaction
        user_avg = self.conn.execute("""
            SELECT AVG(amount)
            FROM transactions
            WHERE user_id = ?
              AND timestamp < ?
              AND timestamp >= ?
        """, [user_id, timestamp, timestamp - timedelta(days=30)]).fetchone()

        avg_amount = float(user_avg[0]) if user_avg and user_avg[0] else 100.0

        if amount > avg_amount * 5:
            anomalies.append({
                "rule": "large_transaction",
                "severity": "high",
                "detail": f"Amount N${amount:.2f} is 5x user average"
            })
            risk_score += 25.0

        # Rule 3: Unusual time
        hour = timestamp.hour
        if hour < 5 or hour > 23:  # Late night transactions
            anomalies.append({
                "rule": "unusual_time",
                "severity": "low",
                "detail": f"Transaction at {hour}:00 (unusual time)"
            })
            risk_score += 10.0

        # Rule 4: New merchant
        merchant_count = self.conn.execute("""
            SELECT COUNT(*)
            FROM transactions
            WHERE user_id = ?
              AND merchant = ?
              AND timestamp < ?
        """, [user_id, tx[4], timestamp]).fetchone()[0]

        if merchant_count == 0 and amount > 500:
            anomalies.append({
                "rule": "new_merchant_high_amount",
                "severity": "medium",
                "detail": f"First time at merchant with N${amount:.2f}"
            })
            risk_score += 15.0

        # Rule 5: KYC tier limit check
        user_profile = self.conn.execute("""
            SELECT kyc_tier, risk_level
            FROM user_risk_profiles
            WHERE user_id = ?
        """, [user_id]).fetchone()

        kyc_tier = user_profile[0] if user_profile else 1
        
        # Use centralized KYC tier limits (PSD-1/PSD-3 compliance)
        tier_map = {1: KYCTier.BASIC, 2: KYCTier.STANDARD, 3: KYCTier.PREMIUM}
        tier_enum = tier_map.get(kyc_tier, KYCTier.BASIC)
        tier_limits = EMONEY_LIMITS[tier_enum]
        max_single_limit = tier_limits.max_single_transaction

        if amount > max_single_limit:
            anomalies.append({
                "rule": "kyc_limit",
                "severity": "high",
                "detail": f"Amount N${amount:.2f} exceeds {tier_enum.value} tier limit of N${max_single_limit:.2f}"
            })
            risk_score += 35.0

        return {
            "transaction_id": transaction_id,
            "user_id": user_id,
            "amount": amount,
            "risk_score": round(min(risk_score, 100.0), 2),
            "risk_level": (
                "critical" if risk_score >= 70 else
                "high" if risk_score >= 50 else
                "medium" if risk_score >= 30 else
                "low"
            ),
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies,
            "timestamp": timestamp.isoformat()
        }

    def risk_pattern_identification(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Identify risk patterns for a user over time
        
        Args:
            user_id: User identifier
            days: Analysis period
            
        Returns:
            Risk pattern analysis
        """
        cutoff = datetime.now() - timedelta(days=days)

        # Transaction patterns
        patterns = self.conn.execute("""
            SELECT 
                COUNT(*) as total_transactions,
                AVG(amount) as avg_amount,
                STDDEV(amount) as stddev_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount,
                COUNT(DISTINCT merchant) as unique_merchants,
                COUNT(DISTINCT category) as unique_categories,
                COUNT(DISTINCT DATE_TRUNC('day', timestamp)) as active_days
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
        """, [user_id, cutoff]).fetchone()

        # Fraud events
        fraud_count = self.conn.execute("""
            SELECT COUNT(*)
            FROM fraud_events fe
            JOIN transactions t ON fe.transaction_id = t.id
            WHERE t.user_id = ?
              AND fe.timestamp >= ?
              AND fe.is_fraud = TRUE
        """, [user_id, cutoff]).fetchone()[0]

        # Time-based patterns
        hourly_dist = self.conn.execute("""
            SELECT 
                EXTRACT(HOUR FROM timestamp) as hour,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = ?
              AND timestamp >= ?
            GROUP BY hour
            ORDER BY count DESC
            LIMIT 5
        """, [user_id, cutoff]).fetchall()

        # Calculate coefficient of variation (risk indicator)
        avg = float(patterns[1]) if patterns and patterns[1] else 0.0
        stddev = float(patterns[2]) if patterns and patterns[2] else 0.0
        cv = (stddev / avg * 100) if avg > 0 else 0.0

        # Risk assessment
        risk_indicators = []
        risk_score = 0.0

        if fraud_count > 0:
            risk_score += 40.0
            risk_indicators.append(f"{fraud_count} fraud events detected")

        if cv > 100:  # High variance in transaction amounts
            risk_score += 20.0
            risk_indicators.append(f"High transaction variance (CV: {cv:.1f}%)")

        if patterns and patterns[4] and float(patterns[4]) > 5000:  # Max transaction > N$5000
            risk_score += 15.0
            risk_indicators.append(f"Large transaction detected: N${patterns[4]:.2f}")

        return {
            "user_id": user_id,
            "period_days": days,
            "total_transactions": patterns[0] if patterns else 0,
            "avg_amount": avg,
            "stddev_amount": stddev,
            "coefficient_of_variation": round(cv, 2),
            "min_amount": float(patterns[3]) if patterns and patterns[3] else 0.0,
            "max_amount": float(patterns[4]) if patterns and patterns[4] else 0.0,
            "unique_merchants": patterns[5] if patterns else 0,
            "unique_categories": patterns[6] if patterns else 0,
            "active_days": patterns[7] if patterns else 0,
            "fraud_events": fraud_count,
            "risk_score": round(risk_score, 2),
            "risk_level": (
                "critical" if risk_score >= 70 else
                "high" if risk_score >= 50 else
                "medium" if risk_score >= 30 else
                "low"
            ),
            "risk_indicators": risk_indicators,
            "peak_hours": [
                {"hour": row[0], "count": row[1]}
                for row in hourly_dist
            ]
        }

    def update_user_risk_profile(self, user_id: str):
        """
        Update user risk profile based on transaction history
        
        Args:
            user_id: User identifier
        """
        risk_analysis = self.risk_pattern_identification(user_id, days=30)

        self.conn.execute("""
            INSERT OR REPLACE INTO user_risk_profiles
            (user_id, risk_level, risk_score, total_transactions, 
             flagged_transactions, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            user_id,
            risk_analysis["risk_level"],
            risk_analysis["risk_score"],
            risk_analysis["total_transactions"],
            risk_analysis["fraud_events"],
            datetime.now()
        ])

        logger.info(f"Updated risk profile for user {user_id}: {risk_analysis['risk_level']}")

    def export_insights_for_agent(self, user_id: str) -> Dict[str, Any]:
        """
        Export comprehensive fraud insights for Security Guardian agent
        
        Args:
            user_id: User identifier
            
        Returns:
            Complete fraud analysis for agent consumption
        """
        return {
            "user_id": user_id,
            "velocity_1h": self.transaction_velocity_tracking(user_id, window_hours=1),
            "velocity_24h": self.transaction_velocity_tracking(user_id, window_hours=24),
            "risk_patterns": self.risk_pattern_identification(user_id, days=30),
            "generated_at": datetime.now().isoformat()
        }

    def close(self):
        """Close DuckDB connection"""
        self.conn.close()
        logger.info("FraudAnalytics connection closed")
