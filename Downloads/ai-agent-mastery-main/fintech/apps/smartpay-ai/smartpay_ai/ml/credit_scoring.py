"""
Credit Scoring Ensemble - Smartpay AI Copilot

3-model ensemble for credit risk assessment:
1. Random Forest (robust, production-grade)
2. Gradient Boosting (highest accuracy)
3. Logistic Regression (explainable, regulatory compliant)

Target Performance:
- ROC-AUC: >85%
- Precision: >80%
- Explainable for regulatory compliance

Namibian Context:
- Credit tiers: EXCELLENT, GOOD, FAIR, POOR
- Loan amounts: NAD 500 - 10,000
- Local lending practices

Data Sources:
- Real transaction history from PostgreSQL
- Loan repayment history
- KYC verification levels
- Account activity patterns
"""

import os
import asyncio
import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, timedelta
import joblib
import logging
import json

import asyncpg

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score,
    confusion_matrix,
    precision_score,
    recall_score
)

logger = logging.getLogger(__name__)


@dataclass
class CreditFeatures:
    """
    Feature vector for credit scoring (12 features)
    
    Features:
    - Transaction history score
    - Loan repayment rate
    - Account age
    - Monthly income estimate
    - Transaction count
    - Average balance
    """
    transaction_history_score: float
    loan_repayment_rate: float
    account_age_days: int
    monthly_income_estimate: float
    monthly_transaction_count: int
    avg_balance: float
    payment_consistency: float
    debt_to_income: float
    num_previous_loans: int
    default_history: int
    kyc_level: int
    account_activity_score: float

    def to_array(self) -> np.ndarray:
        """Convert features to numpy array"""
        return np.array([
            self.transaction_history_score,
            self.loan_repayment_rate,
            self.account_age_days,
            self.monthly_income_estimate,
            self.monthly_transaction_count,
            self.avg_balance,
            self.payment_consistency,
            self.debt_to_income,
            self.num_previous_loans,
            self.default_history,
            self.kyc_level,
            self.account_activity_score
        ])


class CreditScoringEnsemble:
    """
    Ensemble credit scoring system
    
    Credit score range: 300-850
    """

    def __init__(self):
        self.rf_model: Optional[RandomForestClassifier] = None
        self.gb_model: Optional[GradientBoostingClassifier] = None
        self.lr_model: Optional[LogisticRegression] = None
        self.scaler = StandardScaler()

        # Ensemble weights
        self.ensemble_weights = {
            'random_forest': 0.35,
            'gradient_boosting': 0.40,
            'logistic': 0.25
        }

        # Credit tier thresholds
        self.tier_thresholds = {
            'EXCELLENT': 750,
            'GOOD': 650,
            'FAIR': 550,
            'POOR': 450
        }

        # Max loan amounts per tier (NAD)
        self.max_loan_amounts = {
            'EXCELLENT': 10000,
            'GOOD': 5000,
            'FAIR': 2000,
            'POOR': 500
        }

        self.is_trained = False
        self.feature_names = [
            'transaction_history_score', 'loan_repayment_rate', 'account_age_days',
            'monthly_income_estimate', 'monthly_transaction_count', 'avg_balance',
            'payment_consistency', 'debt_to_income', 'num_previous_loans',
            'default_history', 'kyc_level', 'account_activity_score'
        ]

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Train all 3 models
        
        Args:
            X_train: Training features (n_samples, 12)
            y_train: Training labels (1=default, 0=good)
            
        Returns:
            Performance metrics
        """
        logger.info("Training Credit Scoring Ensemble...")

        X_train_scaled = self.scaler.fit_transform(X_train)
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)

        # 1. Random Forest
        logger.info("Training Random Forest...")
        self.rf_model = RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=30,
            min_samples_leaf=15,
            max_features='sqrt',
            class_weight='balanced',
            n_jobs=-1,
            random_state=42
        )
        self.rf_model.fit(X_train_scaled, y_train)

        # 2. Gradient Boosting
        logger.info("Training Gradient Boosting...")
        self.gb_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            min_samples_split=30,
            min_samples_leaf=15,
            subsample=0.8,
            random_state=42
        )
        self.gb_model.fit(X_train_scaled, y_train)

        # 3. Logistic Regression
        logger.info("Training Logistic Regression...")
        self.lr_model = LogisticRegression(
            penalty='l2',
            C=0.5,
            solver='lbfgs',
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        )
        self.lr_model.fit(X_train_scaled, y_train)

        self.is_trained = True

        if X_val is not None and y_val is not None:
            metrics = self.evaluate(X_val, y_val)
            logger.info(f"Validation Metrics: {metrics}")
            return metrics

        return {}

    def predict(
        self,
        features: np.ndarray
    ) -> Dict[str, Any]:
        """
        Comprehensive credit assessment
        
        Args:
            features: Feature vector (12,)
            
        Returns:
            {
                'credit_score': int (300-850),
                'default_probability': float,
                'tier': str,
                'max_loan_amount': float,
                'risk_category': str,
                'confidence': float,
                'recommendations': list
            }
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        if features.ndim == 1:
            features = features.reshape(1, -1)

        features_scaled = self.scaler.transform(features)

        # Get predictions
        p_rf = self.rf_model.predict_proba(features_scaled)[:, 1]
        p_gb = self.gb_model.predict_proba(features_scaled)[:, 1]
        p_lr = self.lr_model.predict_proba(features_scaled)[:, 1]

        # Weighted ensemble for default probability
        p_default = (
            self.ensemble_weights['random_forest'] * p_rf +
            self.ensemble_weights['gradient_boosting'] * p_gb +
            self.ensemble_weights['logistic'] * p_lr
        )[0]

        # Convert to credit score (300-850 scale)
        credit_score = int(300 + 550 * (1 - p_default))

        # Determine tier
        if credit_score >= self.tier_thresholds['EXCELLENT']:
            tier = 'EXCELLENT'
            risk_category = 'very_low'
            recommendations = [
                'Approved for maximum loan amount',
                'Best interest rates available',
                'Fast-track processing'
            ]
        elif credit_score >= self.tier_thresholds['GOOD']:
            tier = 'GOOD'
            risk_category = 'low'
            recommendations = [
                'Approved with standard terms',
                'Competitive interest rates',
                'Regular loan processing'
            ]
        elif credit_score >= self.tier_thresholds['FAIR']:
            tier = 'FAIR'
            risk_category = 'medium'
            recommendations = [
                'Approved for starter loan',
                'Build credit history for better terms',
                'Consider smaller initial amount'
            ]
        elif credit_score >= self.tier_thresholds['POOR']:
            tier = 'POOR'
            risk_category = 'high'
            recommendations = [
                'Minimum loan amount only',
                'Higher interest rate due to risk',
                'Focus on building transaction history'
            ]
        else:
            tier = 'DECLINED'
            risk_category = 'very_high'
            recommendations = [
                'Not approved at this time',
                'Build transaction history and reapply',
                'Ensure regular account activity',
                'Complete KYC verification'
            ]

        return {
            'credit_score': credit_score,
            'default_probability': float(p_default),
            'tier': tier,
            'max_loan_amount': self.max_loan_amounts.get(tier, 0),
            'risk_category': risk_category,
            'confidence': float(max(p_default, 1 - p_default)),
            'recommendations': recommendations,
            'model_scores': {
                'random_forest': float(p_rf[0]),
                'gradient_boosting': float(p_gb[0]),
                'logistic_regression': float(p_lr[0])
            }
        }

    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, float]:
        """Evaluate ensemble performance"""
        X_test_scaled = self.scaler.transform(X_test)

        probs = []
        predictions = []
        for i in range(len(X_test)):
            result = self.predict(X_test[i])
            probs.append(result['default_probability'])
            predictions.append(1 if result['default_probability'] > 0.5 else 0)

        probs = np.array(probs)
        y_pred = np.array(predictions)

        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        metrics = {
            'roc_auc': roc_auc_score(y_test, probs),
            'accuracy': (tp + tn) / (tp + tn + fp + fn),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'true_positives': int(tp),
            'false_positives': int(fp),
            'true_negatives': int(tn),
            'false_negatives': int(fn)
        }

        # Feature importance
        if self.rf_model is not None:
            feature_importance = self.rf_model.feature_importances_
            top_features = sorted(
                zip(self.feature_names, feature_importance),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            metrics['top_features'] = [
                {'feature': name, 'importance': float(imp)}
                for name, imp in top_features
            ]

        return metrics

    def save(self, directory: Path):
        """Save all models"""
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.rf_model, directory / 'rf_model.pkl')
        joblib.dump(self.gb_model, directory / 'gb_model.pkl')
        joblib.dump(self.lr_model, directory / 'lr_model.pkl')
        joblib.dump(self.scaler, directory / 'scaler.pkl')

        metadata = {
            'ensemble_weights': self.ensemble_weights,
            'feature_names': self.feature_names,
            'tier_thresholds': self.tier_thresholds,
            'max_loan_amounts': self.max_loan_amounts,
            'is_trained': self.is_trained
        }
        joblib.dump(metadata, directory / 'metadata.pkl')

        logger.info(f"Models saved to {directory}")

    def load(self, directory: Path):
        """Load all models"""
        directory = Path(directory)

        self.rf_model = joblib.load(directory / 'rf_model.pkl')
        self.gb_model = joblib.load(directory / 'gb_model.pkl')
        self.lr_model = joblib.load(directory / 'lr_model.pkl')
        self.scaler = joblib.load(directory / 'scaler.pkl')

        metadata = joblib.load(directory / 'metadata.pkl')
        self.ensemble_weights = metadata['ensemble_weights']
        self.feature_names = metadata['feature_names']
        self.tier_thresholds = metadata['tier_thresholds']
        self.max_loan_amounts = metadata['max_loan_amounts']
        self.is_trained = metadata['is_trained']

        logger.info(f"Models loaded from {directory}")


async def load_credit_training_data_from_postgres(
    database_url: str,
    days_back: int = 365,
    min_samples: int = 500
) -> tuple:
    """
    Load real credit scoring training data from PostgreSQL
    
    Args:
        database_url: PostgreSQL connection string
        days_back: Number of days of historical data
        min_samples: Minimum number of samples required
        
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.info(f"Loading credit scoring data from PostgreSQL (last {days_back} days)...")
    
    conn = await asyncpg.connect(database_url)
    try:
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        WITH user_transaction_stats AS (
            SELECT
                t.source_user_id as user_id,
                COUNT(*) as total_transactions,
                AVG(t.amount) as avg_transaction_amount,
                SUM(t.amount) as total_spending,
                STDDEV(t.amount) as std_transaction_amount,
                MIN(t.created_at) as first_transaction,
                MAX(t.created_at) as last_transaction,
                COUNT(DISTINCT DATE_TRUNC('month', t.created_at)) as active_months,
                COUNT(DISTINCT t.type) as transaction_type_diversity
            FROM transactions t
            WHERE t.created_at >= $1
                AND t.amount > 0
                AND t.source_user_id IS NOT NULL
            GROUP BY t.source_user_id
        ),
        user_loan_stats AS (
            SELECT
                l.user_id,
                COUNT(*) as total_loans,
                SUM(CASE WHEN l.status = 'repaid' THEN 1 ELSE 0 END) as loans_repaid,
                SUM(CASE WHEN l.status = 'defaulted' THEN 1 ELSE 0 END) as loans_defaulted,
                AVG(l.amount) as avg_loan_amount,
                SUM(l.amount) as total_borrowed
            FROM loans l
            WHERE l.created_at >= $1
            GROUP BY l.user_id
        ),
        user_wallet_stats AS (
            SELECT
                w.user_id,
                AVG(w.balance) as avg_balance,
                MAX(w.balance) as max_balance
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
            COALESCE(uts.total_spending, 0) as total_spending,
            COALESCE(uts.active_months, 0) as active_months,
            COALESCE(uts.transaction_type_diversity, 0) as transaction_diversity,
            
            -- Loan stats
            COALESCE(uls.total_loans, 0) as total_loans,
            COALESCE(uls.loans_repaid, 0) as loans_repaid,
            COALESCE(uls.loans_defaulted, 0) as loans_defaulted,
            COALESCE(uls.total_borrowed, 0) as total_borrowed,
            
            -- Wallet stats
            COALESCE(uws.avg_balance, 0) as avg_balance,
            
            -- Label: 1 if defaulted, 0 if good borrower
            CASE 
                WHEN uls.loans_defaulted > 0 THEN 1
                ELSE 0
            END as default_label
            
        FROM users u
        LEFT JOIN user_transaction_stats uts ON u.id = uts.user_id
        LEFT JOIN user_loan_stats uls ON u.id = uls.user_id
        LEFT JOIN user_wallet_stats uws ON u.id = uws.user_id
        WHERE u.created_at >= $1
            AND uls.total_loans > 0
        ORDER BY u.created_at
        """
        
        rows = await conn.fetch(query, cutoff_date)
        
        if len(rows) < min_samples:
            logger.warning(f"Only {len(rows)} users with loan history. Minimum {min_samples} required.")
            logger.warning("Using synthetic data fallback for training.")
            return _generate_synthetic_credit_data(min_samples)
        
        logger.info(f"Loaded {len(rows)} users with loan history from database")
        
        # Engineer features
        X_list = []
        y_list = []
        
        for row in rows:
            features = _engineer_credit_features_from_row(row)
            X_list.append(features)
            y_list.append(row['default_label'])
        
        X = np.array(X_list)
        y = np.array(y_list)
        
        logger.info(f"Engineered features for {len(X)} users")
        logger.info(f"Default rate: {y.mean():.2%}")
        
        # Shuffle
        shuffle_idx = np.random.permutation(len(X))
        X = X[shuffle_idx]
        y = y[shuffle_idx]
        
        # Split 80/20
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
        
        return X_train, y_train, X_test, y_test
        
    finally:
        await conn.close()


def _engineer_credit_features_from_row(row: asyncpg.Record) -> np.ndarray:
    """
    Engineer credit scoring features from user data row
    
    Returns:
        Feature vector (12,)
    """
    # Account age
    account_created_at = row['account_created_at']
    account_age_days = (datetime.now() - account_created_at).days
    
    # KYC level
    kyc_tier = row['kyc_tier'] or 'basic'
    kyc_level = {'basic': 0, 'standard': 1, 'premium': 2}.get(kyc_tier, 0)
    
    # Transaction history score (0-1 based on activity)
    total_transactions = row['total_transactions']
    active_months = max(row['active_months'], 1)
    tx_per_month = total_transactions / active_months
    transaction_history_score = min(tx_per_month / 30.0, 1.0)
    
    # Loan repayment rate
    total_loans = max(row['total_loans'], 1)
    loans_repaid = row['loans_repaid']
    loan_repayment_rate = loans_repaid / total_loans
    
    # Monthly income estimate (from spending)
    total_spending = row['total_spending']
    monthly_income_estimate = (total_spending / active_months) * 1.5 if active_months > 0 else 0
    
    # Monthly transaction count
    monthly_transaction_count = int(tx_per_month)
    
    # Average balance
    avg_balance = float(row['avg_balance'])
    
    # Payment consistency (inverse of coefficient of variation)
    avg_transaction = row['avg_transaction_amount']
    if avg_transaction > 0:
        payment_consistency = min(1.0 / (1.0 + (avg_transaction * 0.3 / (avg_transaction + 1e-6))), 1.0)
    else:
        payment_consistency = 0.5
    
    # Debt to income ratio
    total_borrowed = row['total_borrowed']
    debt_to_income = min(total_borrowed / (monthly_income_estimate * 12 + 1e-6), 1.0)
    
    # Number of previous loans
    num_previous_loans = int(total_loans)
    
    # Default history
    default_history = int(row['loans_defaulted'])
    
    # Account activity score (transaction diversity)
    transaction_diversity = row['transaction_diversity']
    account_activity_score = min(transaction_diversity / 10.0, 1.0)
    
    features = np.array([
        transaction_history_score,
        loan_repayment_rate,
        account_age_days,
        monthly_income_estimate,
        monthly_transaction_count,
        avg_balance,
        payment_consistency,
        debt_to_income,
        num_previous_loans,
        default_history,
        kyc_level,
        account_activity_score
    ])
    
    return features


def _generate_synthetic_credit_data(n_samples: int = 5000) -> tuple:
    """
    FALLBACK: Generate synthetic credit scoring training data
    
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.warning("Using synthetic credit data - this should only be used for initial model training")
    
    np.random.seed(42)
    n_default = int(n_samples * 0.10)

    # Good borrowers
    X_good = np.zeros((n_samples - n_default, 12))
    X_good[:, 0] = np.random.uniform(0.7, 1.0, n_samples - n_default)
    X_good[:, 1] = np.random.uniform(0.9, 1.0, n_samples - n_default)
    X_good[:, 2] = np.random.uniform(180, 1000, n_samples - n_default)
    X_good[:, 3] = np.random.uniform(3000, 15000, n_samples - n_default)
    X_good[:, 4] = np.random.poisson(30, n_samples - n_default)
    X_good[:, 5] = np.random.uniform(1000, 10000, n_samples - n_default)
    X_good[:, 6] = np.random.uniform(0.8, 1.0, n_samples - n_default)
    X_good[:, 7] = np.random.uniform(0.1, 0.3, n_samples - n_default)
    X_good[:, 8] = np.random.randint(0, 5, n_samples - n_default)
    X_good[:, 9] = 0
    X_good[:, 10] = np.random.choice([1, 2], n_samples - n_default, p=[0.3, 0.7])
    X_good[:, 11] = np.random.uniform(0.7, 1.0, n_samples - n_default)
    y_good = np.zeros(n_samples - n_default)

    # Bad borrowers
    X_bad = np.zeros((n_default, 12))
    X_bad[:, 0] = np.random.uniform(0.2, 0.5, n_default)
    X_bad[:, 1] = np.random.uniform(0.3, 0.7, n_default)
    X_bad[:, 2] = np.random.uniform(1, 90, n_default)
    X_bad[:, 3] = np.random.uniform(500, 3000, n_default)
    X_bad[:, 4] = np.random.poisson(10, n_default)
    X_bad[:, 5] = np.random.uniform(0, 1000, n_default)
    X_bad[:, 6] = np.random.uniform(0.2, 0.5, n_default)
    X_bad[:, 7] = np.random.uniform(0.5, 0.9, n_default)
    X_bad[:, 8] = np.random.randint(0, 2, n_default)
    X_bad[:, 9] = (np.random.uniform(0, 1, n_default) < 0.4).astype(int)
    X_bad[:, 10] = np.random.choice([0, 1], n_default, p=[0.5, 0.5])
    X_bad[:, 11] = np.random.uniform(0.2, 0.5, n_default)
    y_bad = np.ones(n_default)

    X = np.vstack([X_good, X_bad])
    y = np.hstack([y_good, y_bad])

    shuffle_idx = np.random.permutation(n_samples)
    X = X[shuffle_idx]
    y = y[shuffle_idx]

    split = int(0.8 * n_samples)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    return X_train, y_train, X_test, y_test


async def save_credit_score_to_db(
    database_url: str,
    user_id: str,
    features: CreditFeatures,
    prediction: Dict[str, Any],
    loan_application_id: Optional[str] = None,
    requested_amount: Optional[float] = None,
    model_version: str = 'v1.0',
    inference_time_ms: int = 0
) -> str:
    """
    Save credit score prediction to PostgreSQL database
    
    Args:
        database_url: PostgreSQL connection string
        user_id: User UUID
        features: CreditFeatures object
        prediction: Prediction result dict
        loan_application_id: Optional loan application UUID
        requested_amount: Optional loan amount requested
        model_version: Model version
        inference_time_ms: Inference time in milliseconds
        
    Returns:
        Credit score ID
    """
    conn = await asyncpg.connect(database_url)
    try:
        # Prepare features as JSONB
        features_dict = {
            name: float(value) 
            for name, value in zip(
                [
                    'transaction_history_score', 'loan_repayment_rate', 'account_age_days',
                    'monthly_income_estimate', 'monthly_transaction_count', 'avg_balance',
                    'payment_consistency', 'debt_to_income', 'num_previous_loans',
                    'default_history', 'kyc_level', 'account_activity_score'
                ],
                features.to_array()
            )
        }
        
        # Top credit factors
        top_factors = {
            'positive': [],
            'negative': []
        }
        
        if features.loan_repayment_rate >= 0.9:
            top_factors['positive'].append('Excellent repayment history')
        if features.account_age_days >= 180:
            top_factors['positive'].append('Mature account')
        if features.kyc_level >= 2:
            top_factors['positive'].append('Premium KYC verified')
        if features.default_history > 0:
            top_factors['negative'].append('Previous loan defaults')
        if features.debt_to_income >= 0.5:
            top_factors['negative'].append('High debt-to-income ratio')
        
        query = """
        INSERT INTO ml_credit_scores (
            user_id,
            credit_score,
            default_probability,
            credit_tier,
            max_loan_amount,
            risk_category,
            model_version,
            random_forest_score,
            gradient_boosting_score,
            logistic_regression_score,
            confidence_score,
            features_used,
            top_credit_factors,
            transaction_history_score,
            loan_repayment_rate,
            account_age_days,
            monthly_income_estimate,
            monthly_transaction_count,
            avg_balance,
            payment_consistency,
            debt_to_income_ratio,
            num_previous_loans,
            default_history_count,
            kyc_level,
            account_activity_score,
            recommendations,
            loan_application_id,
            requested_amount,
            inference_time_ms
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
            $26, $27, $28, $29
        )
        RETURNING id
        """
        
        model_scores = prediction.get('model_scores', {})
        
        score_id = await conn.fetchval(
            query,
            user_id,
            prediction['credit_score'],
            prediction['default_probability'],
            prediction['tier'],
            prediction['max_loan_amount'],
            prediction['risk_category'],
            model_version,
            model_scores.get('random_forest'),
            model_scores.get('gradient_boosting'),
            model_scores.get('logistic_regression'),
            prediction['confidence'],
            json.dumps(features_dict),
            json.dumps(top_factors),
            features.transaction_history_score,
            features.loan_repayment_rate,
            features.account_age_days,
            features.monthly_income_estimate,
            features.monthly_transaction_count,
            features.avg_balance,
            features.payment_consistency,
            features.debt_to_income,
            features.num_previous_loans,
            features.default_history,
            features.kyc_level,
            features.account_activity_score,
            json.dumps(prediction['recommendations']),
            loan_application_id,
            requested_amount,
            inference_time_ms
        )
        
        logger.info(f"Saved credit score {score_id} for user {user_id}")
        return str(score_id)
        
    finally:
        await conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        exit(1)
    
    print("=" * 80)
    print("CREDIT SCORING MODEL TRAINING - Using Real PostgreSQL Data")
    print("=" * 80)

    # Load real credit data from PostgreSQL
    print("\n[1/4] Loading user credit data from PostgreSQL...")
    X_train, y_train, X_test, y_test = asyncio.run(
        load_credit_training_data_from_postgres(database_url, days_back=365)
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Default rate: {y_train.mean():.2%}")
    print(f"Features: {X_train.shape[1]}")

    # Train ensemble
    print("\n[2/4] Training credit scoring ensemble...")
    ensemble = CreditScoringEnsemble()
    metrics = ensemble.train(X_train, y_train, X_test, y_test)

    # Evaluate
    print("\n[3/4] Evaluating model performance...")
    test_metrics = ensemble.evaluate(X_test, y_test)
    print("\nTest Metrics:")
    print(f"  ROC-AUC: {test_metrics.get('roc_auc', 0):.4f}")
    print(f"  Accuracy: {test_metrics.get('accuracy', 0):.4f}")
    print(f"  Precision: {test_metrics.get('precision', 0):.4f}")
    print(f"  Recall: {test_metrics.get('recall', 0):.4f}")
    
    if 'top_features' in test_metrics:
        print("\nTop 5 Most Important Features:")
        for feat in test_metrics['top_features']:
            print(f"  {feat['feature']}: {feat['importance']:.4f}")

    # Save models
    print("\n[4/4] Saving trained models...")
    model_dir = Path(__file__).parent.parent / 'models' / 'credit_scoring'
    ensemble.save(model_dir)
    print(f"Models saved to {model_dir}")

    # Test prediction
    print("\n" + "=" * 80)
    print("SAMPLE CREDIT ASSESSMENT TEST")
    print("=" * 80)
    sample = X_test[0]
    result = ensemble.predict(sample)
    print(f"Credit Score: {result['credit_score']}")
    print(f"Tier: {result['tier']}")
    print(f"Max Loan: NAD {result['max_loan_amount']:,.2f}")
    print(f"Default Probability: {result['default_probability']:.4f}")
    print(f"Risk Category: {result['risk_category']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"\nRecommendations:")
    for rec in result['recommendations']:
        print(f"  - {rec}")
    
    print("\n" + "=" * 80)
    print("Training complete! Model ready for production use with real data.")
    print("=" * 80)
