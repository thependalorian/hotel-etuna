"""
Data Loader for ML Model Training

Location: backend_python/smartpay_ai/training/data_loader.py
Purpose: Load transaction data from PostgreSQL, feature engineering with NPS fraud patterns, 
         train/test split, normalization

Data Sources:
- PostgreSQL: transactions, users, loans, fraud_detection_rules, transaction_monitoring_alerts
- DuckDB: Analytics cache for fast aggregations

NPS Fraud Patterns (2013-2022):
- Card-not-present (CNP): 95% of card fraud
- Phone scams: 3% of incidents (19% of value)
- Phishing: 92.5% of EFT fraud
- SIM swap attacks
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any

import asyncpg
import duckdb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

logger = logging.getLogger(__name__)


class DataLoader:
    """Load and prepare data for ML model training from PostgreSQL"""

    def __init__(self, postgres_url: str, duckdb_path: str = ":memory:"):
        """
        Initialize DataLoader with PostgreSQL and DuckDB connections
        
        Args:
            postgres_url: PostgreSQL connection string (DATABASE_URL)
            duckdb_path: Path to DuckDB database file for analytics cache
        """
        self.postgres_url = postgres_url
        self.duckdb_path = duckdb_path
        self.duck_conn = duckdb.connect(duckdb_path)
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        logger.info(f"DataLoader initialized - PostgreSQL: {postgres_url[:30]}..., DuckDB: {duckdb_path}")

    async def load_transactions_from_postgres(
        self,
        days_back: int = 180,
        include_fraud_labels: bool = True,
        include_nps_features: bool = True
    ) -> pd.DataFrame:
        """
        Load transaction data from PostgreSQL with fraud labels and NPS fraud patterns
        
        Args:
            days_back: Number of days of historical data
            include_fraud_labels: Whether to load fraud labels from monitoring alerts
            include_nps_features: Whether to include NPS fraud pattern features
            
        Returns:
            DataFrame with transaction data and features
        """
        conn = await asyncpg.connect(self.postgres_url)
        try:
            cutoff_date = datetime.now() - timedelta(days=days_back)

            query = """
                SELECT 
                    t.id as transaction_id,
                    t.source_user_id as user_id,
                    t.amount,
                    t.type as category,
                    t.type as merchant,
                    t.created_at as timestamp,
                    t.source_wallet_id as wallet_id,
                    t.destination_wallet_id,
                    t.status,
                    t.metadata,
                    
                    -- User context
                    u.kyc_tier,
                    u.created_at as user_created_at,
                    u.metadata as user_metadata,
                    
                    -- Fraud labels from monitoring alerts
                    tma.id as alert_id,
                    tma.resolution_category,
                    tma.risk_score,
                    tma.alert_type,
                    
                    -- NPS fraud patterns
                    tma.detection_method,
                    
                    -- Fraud detection rules triggered
                    fdr.rule_type,
                    fdr.rule_name
                    
                FROM transactions t
                LEFT JOIN users u ON t.source_user_id = u.id
                LEFT JOIN transaction_monitoring_alerts tma ON t.id = tma.transaction_id
                LEFT JOIN fraud_rule_triggers frt ON t.id = frt.transaction_id
                LEFT JOIN fraud_detection_rules fdr ON frt.rule_id = fdr.id
                WHERE t.created_at >= $1
                    AND t.amount > 0
                    AND t.source_user_id IS NOT NULL
                ORDER BY t.created_at
            """

            rows = await conn.fetch(query, cutoff_date)
            df = pd.DataFrame([dict(row) for row in rows])
            
            # Add fraud label
            if include_fraud_labels:
                df['is_fraud'] = df['resolution_category'].apply(
                    lambda x: True if x == 'confirmed_fraud' 
                    else (False if x in ['false_positive', 'legitimate_activity'] 
                    else None)
                )
            
            logger.info(f"Loaded {len(df)} transactions from PostgreSQL")
            if include_fraud_labels:
                fraud_count = df['is_fraud'].sum()
                logger.info(f"  Fraud transactions: {fraud_count} ({fraud_count/len(df)*100:.2f}%)")
            
            return df

        finally:
            await conn.close()
    
    
    def load_transactions_sync(
        self,
        days_back: int = 180,
        include_fraud_labels: bool = True
    ) -> pd.DataFrame:
        """
        Synchronous wrapper for load_transactions_from_postgres
        
        Args:
            days_back: Number of days of historical data
            include_fraud_labels: Whether to load fraud labels
            
        Returns:
            DataFrame with transaction data
        """
        return asyncio.run(
            self.load_transactions_from_postgres(days_back, include_fraud_labels)
        )

    def load_transactions_from_duckdb(self, table: str = "transaction_analytics") -> pd.DataFrame:
        """
        Load transactions from DuckDB analytics cache
        
        Args:
            table: Table name
            
        Returns:
            DataFrame with transaction data
        """
        df = self.duck_conn.execute(f"SELECT * FROM {table}").df()
        logger.info(f"Loaded {len(df)} transactions from DuckDB")
        return df

    async def engineer_fraud_features(self, df: pd.DataFrame, include_nps_patterns: bool = True) -> pd.DataFrame:
        """
        Engineer features for fraud detection with NPS fraud patterns
        
        Args:
            df: Raw transaction DataFrame from PostgreSQL
            include_nps_patterns: Whether to include NPS fraud pattern features
            
        Returns:
            DataFrame with engineered features including NPS patterns
        """
        logger.info("Engineering fraud detection features with NPS patterns...")

        features_df = df.copy()

        # Time-based features
        features_df['hour'] = pd.to_datetime(features_df['timestamp']).dt.hour
        features_df['day_of_week'] = pd.to_datetime(features_df['timestamp']).dt.dayofweek
        features_df['is_weekend'] = features_df['day_of_week'].isin([5, 6]).astype(int)
        features_df['is_unusual_hour'] = ((features_df['hour'] >= 22) | (features_df['hour'] <= 5)).astype(int)

        # Amount-based features
        features_df['amount_normalized'] = np.minimum(features_df['amount'] / 10000.0, 1.0)
        features_df['amount_log'] = np.log1p(features_df['amount'])
        features_df['round_number_flag'] = (
            (features_df['amount'] % 100 == 0) | (features_df['amount'] % 1000 == 0)
        ).astype(int)

        # User-based aggregations (velocity features)
        features_df = features_df.sort_values('timestamp')
        
        # Velocity features
        features_df['velocity_1h'] = 0
        features_df['velocity_24h'] = 0
        
        for user_id in features_df['user_id'].unique():
            user_mask = features_df['user_id'] == user_id
            user_data = features_df[user_mask].copy()
            
            for idx, row in user_data.iterrows():
                current_time = row['timestamp']
                
                time_1h = current_time - pd.Timedelta(hours=1)
                recent_1h = user_data[(user_data['timestamp'] >= time_1h) & 
                                     (user_data['timestamp'] < current_time)]
                features_df.loc[idx, 'velocity_1h'] = len(recent_1h)
                
                time_24h = current_time - pd.Timedelta(hours=24)
                recent_24h = user_data[(user_data['timestamp'] >= time_24h) & 
                                      (user_data['timestamp'] < current_time)]
                features_df.loc[idx, 'velocity_24h'] = len(recent_24h)

        # User historical features
        user_stats = df.groupby('user_id')['amount'].agg([
            'mean', 'std', 'min', 'max', 'count'
        ]).reset_index()
        user_stats.columns = ['user_id', 'user_avg_amount', 'user_std_amount',
                              'user_min_amount', 'user_max_amount', 'user_tx_count']

        features_df = features_df.merge(user_stats, on='user_id', how='left')

        # Amount deviation from user average
        features_df['amount_deviation'] = (
            features_df['amount'] - features_df['user_avg_amount']
        ) / (features_df['user_std_amount'] + 1e-6)

        # Account age
        features_df['account_age_days'] = (
            features_df['timestamp'] - pd.to_datetime(features_df['user_created_at'])
        ).dt.days.fillna(0)
        
        # KYC level
        features_df['kyc_level'] = features_df['kyc_tier'].map({
            'basic': 0, 'standard': 1, 'premium': 2
        }).fillna(0)
        
        # Device score from metadata
        features_df['device_score'] = features_df['metadata'].apply(
            lambda x: x.get('device_trust_score', 0.8) if isinstance(x, dict) else 0.8
        )
        
        # Foreign transaction flag
        features_df['is_foreign'] = features_df['metadata'].apply(
            lambda x: 1 if isinstance(x, dict) and x.get('is_cross_border', False) else 0
        )
        
        # Merchant category (hash of type)
        features_df['merchant_category'] = features_df['category'].apply(
            lambda x: hash(str(x)) % 10 if x else 0
        )
        
        # ====================================================================
        # NPS FRAUD PATTERN FEATURES
        # ====================================================================
        if include_nps_patterns:
            logger.info("Adding NPS fraud pattern features...")
            
            # Card-not-present (CNP) - 95% of card fraud
            features_df['card_not_present'] = features_df['metadata'].apply(
                lambda x: 0 if isinstance(x, dict) and x.get('card_present', False) else 1
            )
            
            # Phone scam indicator (>10 transactions/hour)
            features_df['phone_scam_indicator'] = (features_df['velocity_1h'] > 10).astype(int)
            
            # Phishing indicator (failed login attempts from alerts)
            features_df['phishing_indicator'] = (
                features_df['alert_type'] == 'multiple_failed_attempts'
            ).astype(int)
            
            # SIM swap indicator (device + phone change)
            features_df['device_fingerprint_change'] = features_df['metadata'].apply(
                lambda x: 1 if isinstance(x, dict) and x.get('device_changed_recently', False) else 0
            )
            features_df['phone_change_recent'] = features_df['user_metadata'].apply(
                lambda x: 1 if isinstance(x, dict) and x.get('phone_changed_recently', False) else 0
            )
            features_df['sim_swap_indicator'] = (
                (features_df['device_fingerprint_change'] == 1) & 
                (features_df['phone_change_recent'] == 1)
            ).astype(int)
            
            # Failed login attempts count (from alert context)
            features_df['failed_login_attempts'] = features_df.apply(
                lambda row: 3 if row['alert_type'] == 'multiple_failed_attempts' else 0,
                axis=1
            )
            
            # Geographic anomaly
            features_df['geographic_anomaly'] = features_df['metadata'].apply(
                lambda x: 1 if isinstance(x, dict) and x.get('unusual_location', False) else 0
            )
            
            # Unusual login location
            features_df['unusual_login_location'] = features_df['metadata'].apply(
                lambda x: 1 if isinstance(x, dict) and x.get('login_location_anomaly', False) else 0
            )
            
            logger.info(f"Added {8} NPS fraud pattern features")

        # Encode categorical variables
        for col in ['category', 'merchant', 'status']:
            if col in features_df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    features_df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(
                        features_df[col].fillna('unknown').astype(str)
                    )
                else:
                    features_df[f'{col}_encoded'] = self.label_encoders[col].transform(
                        features_df[col].fillna('unknown').astype(str)
                    )

        logger.info(f"Engineered features: {features_df.shape[1]} columns")
        return features_df
    
    
    def engineer_fraud_features_sync(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Synchronous wrapper for engineer_fraud_features
        
        Args:
            df: Raw transaction DataFrame
            
        Returns:
            DataFrame with engineered features
        """
        return asyncio.run(self.engineer_fraud_features(df))

    async def engineer_credit_features(self, include_loans: bool = True) -> pd.DataFrame:
        """
        Engineer features for credit scoring from PostgreSQL
        
        Args:
            include_loans: Whether to include loan repayment history
            
        Returns:
            DataFrame with credit scoring features per user
        """
        logger.info("Engineering credit scoring features from PostgreSQL...")
        
        conn = await asyncpg.connect(self.postgres_url)
        try:
            query = """
            WITH user_transaction_stats AS (
                SELECT
                    t.source_user_id as user_id,
                    COUNT(*) as total_transactions,
                    AVG(t.amount) as avg_transaction_amount,
                    STDDEV(t.amount) as std_transaction_amount,
                    SUM(t.amount) as total_spending,
                    MIN(t.created_at) as first_transaction,
                    MAX(t.created_at) as last_transaction,
                    COUNT(DISTINCT t.type) as transaction_type_diversity,
                    COUNT(DISTINCT DATE_TRUNC('month', t.created_at)) as active_months
                FROM transactions t
                WHERE t.amount > 0
                    AND t.source_user_id IS NOT NULL
                GROUP BY t.source_user_id
            ),
            user_loan_stats AS (
                SELECT
                    l.user_id,
                    COUNT(*) as total_loans,
                    SUM(CASE WHEN l.status = 'repaid' THEN 1 ELSE 0 END) as loans_repaid,
                    SUM(CASE WHEN l.status = 'defaulted' THEN 1 ELSE 0 END) as loans_defaulted,
                    SUM(l.amount) as total_borrowed
                FROM loans l
                GROUP BY l.user_id
            ),
            user_wallet_stats AS (
                SELECT
                    w.user_id,
                    AVG(w.balance) as avg_balance
                FROM wallets w
                GROUP BY w.user_id
            )
            SELECT
                u.id as user_id,
                u.kyc_tier,
                u.created_at as account_created_at,
                
                -- Transaction stats
                COALESCE(uts.total_transactions, 0) as total_transactions,
                COALESCE(uts.avg_transaction_amount, 0) as avg_transaction_amount,
                COALESCE(uts.std_transaction_amount, 0) as std_transaction_amount,
                COALESCE(uts.total_spending, 0) as total_spending,
                COALESCE(uts.active_months, 0) as active_months,
                COALESCE(uts.transaction_type_diversity, 0) as transaction_diversity,
                
                -- Loan stats
                COALESCE(uls.total_loans, 0) as total_loans,
                COALESCE(uls.loans_repaid, 0) as loans_repaid,
                COALESCE(uls.loans_defaulted, 0) as loans_defaulted,
                COALESCE(uls.total_borrowed, 0) as total_borrowed,
                
                -- Wallet stats
                COALESCE(uws.avg_balance, 0) as avg_balance
                
            FROM users u
            LEFT JOIN user_transaction_stats uts ON u.id = uts.user_id
            LEFT JOIN user_loan_stats uls ON u.id = uls.user_id
            LEFT JOIN user_wallet_stats uws ON u.id = uws.user_id
            WHERE uts.total_transactions >= 5
            ORDER BY u.created_at
            """
            
            rows = await conn.fetch(query)
            df = pd.DataFrame([dict(row) for row in rows])
            
            # Calculate derived features
            df['account_age_days'] = (
                datetime.now() - pd.to_datetime(df['account_created_at'])
            ).dt.days
            
            df['transaction_history_score'] = np.minimum(
                df['total_transactions'] / (df['active_months'] + 1) / 30.0, 
                1.0
            )
            
            df['loan_repayment_rate'] = np.where(
                df['total_loans'] > 0,
                df['loans_repaid'] / df['total_loans'],
                1.0
            )
            
            df['monthly_income_estimate'] = np.where(
                df['active_months'] > 0,
                (df['total_spending'] / df['active_months']) * 1.5,
                0
            )
            
            df['monthly_transaction_count'] = np.where(
                df['active_months'] > 0,
                df['total_transactions'] / df['active_months'],
                0
            )
            
            df['payment_consistency'] = 1.0 / (
                1.0 + df['std_transaction_amount'] / (df['avg_transaction_amount'] + 1e-6)
            )
            
            df['debt_to_income'] = np.minimum(
                df['total_borrowed'] / ((df['monthly_income_estimate'] * 12) + 1e-6),
                1.0
            )
            
            df['kyc_level'] = df['kyc_tier'].map({
                'basic': 0, 'standard': 1, 'premium': 2
            }).fillna(0)
            
            df['account_activity_score'] = np.minimum(
                df['transaction_diversity'] / 10.0,
                1.0
            )
            
            logger.info(f"Engineered credit features for {len(df)} users")
            return df
            
        finally:
            await conn.close()
    
    
    def engineer_credit_features_sync(self) -> pd.DataFrame:
        """
        Synchronous wrapper for engineer_credit_features
        
        Returns:
            DataFrame with credit scoring features
        """
        return asyncio.run(self.engineer_credit_features())

    async def engineer_spending_features(self) -> pd.DataFrame:
        """
        Engineer features for spending pattern analysis from PostgreSQL
        
        Returns:
            DataFrame with spending analysis features per user-month
        """
        logger.info("Engineering spending analysis features from PostgreSQL...")
        
        conn = await asyncpg.connect(self.postgres_url)
        try:
            query = """
            WITH user_monthly_spending AS (
                SELECT
                    t.source_user_id as user_id,
                    DATE_TRUNC('month', t.created_at) as month,
                    SUM(t.amount) as monthly_spending,
                    COUNT(*) as transaction_count,
                    AVG(t.amount) as avg_transaction_size,
                    STDDEV(t.amount) as std_transaction_size,
                    COUNT(DISTINCT t.type) as category_diversity_raw,
                    
                    -- Weekend vs weekday
                    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM t.created_at) IN (0, 6)) as weekend_txs,
                    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM t.created_at) NOT IN (0, 6)) as weekday_txs,
                    
                    -- Category breakdowns (use type as proxy)
                    SUM(CASE WHEN t.type LIKE '%grocery%' OR t.type LIKE '%food%' THEN t.amount ELSE 0 END) as groceries_amount,
                    SUM(CASE WHEN t.type LIKE '%transport%' OR t.type LIKE '%fuel%' THEN t.amount ELSE 0 END) as transport_amount,
                    SUM(CASE WHEN t.type LIKE '%utility%' OR t.type LIKE '%bill%' THEN t.amount ELSE 0 END) as utilities_amount,
                    SUM(CASE WHEN t.type LIKE '%entertainment%' OR t.type LIKE '%movie%' THEN t.amount ELSE 0 END) as entertainment_amount
                    
                FROM transactions t
                WHERE t.amount > 0
                    AND t.source_user_id IS NOT NULL
                GROUP BY t.source_user_id, DATE_TRUNC('month', t.created_at)
            ),
            user_wallet_balances AS (
                SELECT
                    w.user_id,
                    AVG(w.balance) as avg_balance
                FROM wallets w
                GROUP BY w.user_id
            )
            SELECT
                ums.user_id,
                ums.month,
                ums.monthly_spending,
                ums.transaction_count,
                ums.category_diversity_raw,
                ums.avg_transaction_size,
                ums.weekend_txs,
                ums.weekday_txs,
                ums.groceries_amount,
                ums.transport_amount,
                ums.utilities_amount,
                ums.entertainment_amount,
                COALESCE(uwb.avg_balance, 0) as avg_balance
            FROM user_monthly_spending ums
            LEFT JOIN user_wallet_balances uwb ON ums.user_id = uwb.user_id
            WHERE ums.transaction_count >= 5
            ORDER BY ums.user_id, ums.month
            """
            
            rows = await conn.fetch(query)
            df = pd.DataFrame([dict(row) for row in rows])
            
            # Calculate derived features
            df['category_diversity'] = np.minimum(df['category_diversity_raw'] / 10.0, 1.0)
            
            df['weekend_weekday_ratio'] = df['weekend_txs'] / (df['weekday_txs'] + 1)
            
            total_spending = df['monthly_spending'] + 1e-6
            df['groceries_ratio'] = df['groceries_amount'] / total_spending
            df['transport_ratio'] = df['transport_amount'] / total_spending
            df['utilities_ratio'] = df['utilities_amount'] / total_spending
            df['entertainment_ratio'] = df['entertainment_amount'] / total_spending
            
            df['savings_rate'] = np.maximum(
                0,
                np.minimum(1.0, (df['avg_balance'] - df['monthly_spending']) / (df['avg_balance'] + 1e-6))
            )
            
            logger.info(f"Engineered spending features for {len(df)} user-months")
            return df
            
        finally:
            await conn.close()
    
    
    def engineer_spending_features_sync(self) -> pd.DataFrame:
        """
        Synchronous wrapper for engineer_spending_features
        
        Returns:
            DataFrame with spending analysis features
        """
        return asyncio.run(self.engineer_spending_features())

    def train_test_split_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
        val_size: float = 0.1,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """
        Split data into train/validation/test sets
        
        Args:
            X: Features
            y: Target variable
            test_size: Test set proportion
            val_size: Validation set proportion
            random_state: Random seed
            
        Returns:
            X_train, X_val, X_test, y_train, y_val, y_test
        """
        # First split: train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Second split: train vs val
        val_ratio = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_ratio, random_state=random_state, stratify=y_temp
        )

        logger.info(f"Data split - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        return X_train, X_val, X_test, y_train, y_val, y_test

    def normalize_features(
        self,
        X_train: pd.DataFrame,
        X_val: pd.DataFrame,
        X_test: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Normalize features using StandardScaler
        
        Args:
            X_train: Training features
            X_val: Validation features
            X_test: Test features
            
        Returns:
            Normalized X_train, X_val, X_test
        """
        self.scaler.fit(X_train)

        X_train_scaled = self.scaler.transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        X_test_scaled = self.scaler.transform(X_test)

        logger.info("Features normalized using StandardScaler")
        return X_train_scaled, X_val_scaled, X_test_scaled

    async def get_data_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics of available training data from PostgreSQL
        
        Returns:
            Dict with data summary
        """
        conn = await asyncpg.connect(self.postgres_url)
        try:
            summary = {}
            
            # Transaction counts
            tx_query = """
            SELECT
                COUNT(*) as total_transactions,
                COUNT(DISTINCT source_user_id) as total_users,
                COUNT(DISTINCT type) as total_categories,
                MIN(created_at) as earliest_transaction,
                MAX(created_at) as latest_transaction,
                SUM(amount) as total_volume
            FROM transactions
            WHERE amount > 0
            """
            tx_row = await conn.fetchrow(tx_query)
            summary['transactions'] = dict(tx_row)
            
            # Loan counts
            loan_query = """
            SELECT
                COUNT(*) as total_loans,
                COUNT(DISTINCT user_id) as total_borrowers,
                SUM(CASE WHEN status = 'repaid' THEN 1 ELSE 0 END) as loans_repaid,
                SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as loans_defaulted
            FROM loans
            """
            loan_row = await conn.fetchrow(loan_query)
            summary['loans'] = dict(loan_row)
            
            # Fraud alerts
            fraud_query = """
            SELECT
                COUNT(*) as total_alerts,
                COUNT(CASE WHEN resolution_category = 'confirmed_fraud' THEN 1 END) as confirmed_fraud,
                COUNT(CASE WHEN resolution_category = 'false_positive' THEN 1 END) as false_positives
            FROM transaction_monitoring_alerts
            """
            fraud_row = await conn.fetchrow(fraud_query)
            summary['fraud_alerts'] = dict(fraud_row)
            
            logger.info("Data summary retrieved from PostgreSQL")
            return summary
            
        finally:
            await conn.close()
    
    
    def get_data_summary_sync(self) -> Dict[str, Any]:
        """
        Synchronous wrapper for get_data_summary
        
        Returns:
            Dict with data summary
        """
        return asyncio.run(self.get_data_summary())
    
    
    def close(self):
        """Close DuckDB connection"""
        self.duck_conn.close()
        logger.info("DataLoader connections closed")
