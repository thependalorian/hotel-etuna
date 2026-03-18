"""
Credit Scoring Model Training

Location: backend_python/smartpay_ai/training/train_credit_model.py
Purpose: Train credit scoring model based on transaction history and loan repayment
Usage: python -m smartpay_ai.training.train_credit_model
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    auc
)
import joblib

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logging.warning("XGBoost not available, using sklearn models only")

from .data_loader import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_credit_scoring_model(
    db_path: str = ":memory:",
    pg_conn_string: str = None,
    output_dir: str = None,
    test_mode: bool = False
) -> Dict[str, Any]:
    """
    Train credit scoring ensemble model
    
    Args:
        db_path: DuckDB database path
        pg_conn_string: PostgreSQL connection string
        output_dir: Directory to save model and metrics
        test_mode: If True, use synthetic data for testing
        
    Returns:
        Training metrics and results
    """
    logger.info("=" * 60)
    logger.info("CREDIT SCORING MODEL TRAINING")
    logger.info("=" * 60)

    # Setup output directory
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "models" / "credit_scoring"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Output directory: {output_dir}")

    # Load data
    loader = DataLoader(db_path)

    if test_mode:
        logger.info("TEST MODE: Generating synthetic credit data")
        transactions_df, loan_df = generate_synthetic_credit_data(n_users=500)
    elif pg_conn_string:
        logger.info("Loading transaction data from PostgreSQL")
        transactions_df = loader.load_transactions_from_postgres(pg_conn_string, days_back=365)

        # Load loan data
        import asyncpg
        import asyncio

        async def _load_loans():
            conn = await asyncpg.connect(pg_conn_string)
            try:
                rows = await conn.fetch("""
                    SELECT 
                        user_id,
                        amount as loan_amount,
                        status,
                        (status = 'repaid') as repaid,
                        (status = 'defaulted') as default,
                        created_at,
                        due_date,
                        repaid_at
                    FROM loans
                """)
                return pd.DataFrame([dict(row) for row in rows])
            finally:
                await conn.close()

        loan_df = asyncio.run(_load_loans())
    else:
        logger.error("Either pg_conn_string or test_mode must be provided")
        return {}

    logger.info(f"Loaded {len(transactions_df)} transactions, {len(loan_df)} loans")

    # Feature engineering
    logger.info("Engineering credit scoring features")
    features_df = loader.engineer_credit_features(transactions_df, loan_df)

    # Create target variable: credit risk classification
    # Good: repayment_rate >= 0.8 and loans_defaulted == 0
    # Bad: repayment_rate < 0.5 or loans_defaulted > 0
    # Neutral: between (we'll exclude these for cleaner classification)

    features_df['credit_label'] = 'neutral'

    features_df.loc[
        (features_df['repayment_rate'] >= 0.8) & (features_df['loans_defaulted'] == 0),
        'credit_label'
    ] = 'good'

    features_df.loc[
        (features_df['repayment_rate'] < 0.5) | (features_df['loans_defaulted'] > 0),
        'credit_label'
    ] = 'bad'

    # Filter to users with loan history
    features_df = features_df[features_df['loan_count'] > 0].copy()

    # Exclude neutral labels for training
    features_df = features_df[features_df['credit_label'] != 'neutral'].copy()

    logger.info(f"Credit distribution - Good: {(features_df['credit_label'] == 'good').sum()}, "
                f"Bad: {(features_df['credit_label'] == 'bad').sum()}")

    # Select feature columns
    feature_cols = [
        'total_spending', 'avg_transaction', 'std_transaction', 'transaction_count',
        'account_age_days', 'transactions_per_day', 'category_diversity',
        'merchant_diversity', 'payment_regularity', 'total_borrowed',
        'loan_count', 'loans_repaid', 'loans_defaulted', 'repayment_rate'
    ]

    # Filter to available columns
    feature_cols = [col for col in feature_cols if col in features_df.columns]
    logger.info(f"Using {len(feature_cols)} features: {feature_cols}")

    # Prepare X and y
    X = features_df[feature_cols].fillna(0)
    y = (features_df['credit_label'] == 'good').astype(int)  # 1 = good credit, 0 = bad credit

    # Train/val/test split
    X_train, X_val, X_test, y_train, y_val, y_test = loader.train_test_split_data(
        X, y, test_size=0.2, val_size=0.1
    )

    # Normalize features
    X_train_scaled, X_val_scaled, X_test_scaled = loader.normalize_features(
        X_train, X_val, X_test
    )

    # Build ensemble model
    logger.info("Building ensemble credit scoring model")

    estimators = []

    # Model 1: Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    estimators.append(('rf', rf_model))

    # Model 2: Gradient Boosting
    gb_model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    estimators.append(('gb', gb_model))

    # Model 3: Logistic Regression
    lr_model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )
    estimators.append(('lr', lr_model))

    # Model 4: XGBoost (if available)
    if XGBOOST_AVAILABLE:
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        estimators.append(('xgb', xgb_model))

    # Create voting classifier
    ensemble = VotingClassifier(
        estimators=estimators,
        voting='soft'
    )

    # Train ensemble
    logger.info(f"Training ensemble with {len(estimators)} models")
    ensemble.fit(X_train_scaled, y_train)

    # Cross-validation
    logger.info("Performing 5-fold cross-validation")
    cv_scores = cross_val_score(
        ensemble, X_train_scaled, y_train,
        cv=5, scoring='roc_auc', n_jobs=-1
    )
    logger.info(f"Cross-validation ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Evaluation on test set
    logger.info("Evaluating on test set")
    y_pred = ensemble.predict(X_test_scaled)
    y_pred_proba = ensemble.predict_proba(X_test_scaled)[:, 1]

    # Metrics
    test_roc_auc = roc_auc_score(y_test, y_pred_proba)
    precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
    test_pr_auc = auc(recall, precision)

    conf_matrix = confusion_matrix(y_test, y_pred)
    class_report = classification_report(y_test, y_pred, output_dict=True)

    # Feature importance (from Random Forest)
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': ensemble.named_estimators_['rf'].feature_importances_
    }).sort_values('importance', ascending=False)

    logger.info("\n" + "=" * 60)
    logger.info("MODEL EVALUATION RESULTS")
    logger.info("=" * 60)
    logger.info(f"Test ROC-AUC Score: {test_roc_auc:.4f}")
    logger.info(f"Test PR-AUC Score: {test_pr_auc:.4f}")
    logger.info("\nConfusion Matrix:")
    logger.info(f"  TN: {conf_matrix[0][0]}, FP: {conf_matrix[0][1]}")
    logger.info(f"  FN: {conf_matrix[1][0]}, TP: {conf_matrix[1][1]}")
    logger.info("\nClassification Report:")
    logger.info(f"  Precision (good credit): {class_report['1']['precision']:.4f}")
    logger.info(f"  Recall (good credit): {class_report['1']['recall']:.4f}")
    logger.info(f"  F1-score (good credit): {class_report['1']['f1-score']:.4f}")
    logger.info("\nTop 10 Feature Importances:")
    for idx, row in feature_importance.head(10).iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")

    # Save model
    model_path = output_dir / "credit_scoring_ensemble.joblib"
    joblib.dump(ensemble, model_path)
    logger.info(f"\nModel saved to: {model_path}")

    # Save scaler
    scaler_path = output_dir / "credit_scoring_scaler.joblib"
    joblib.dump(loader.scaler, scaler_path)
    logger.info(f"Scaler saved to: {scaler_path}")

    # Save feature columns
    features_path = output_dir / "credit_scoring_features.json"
    with open(features_path, 'w') as f:
        json.dump(feature_cols, f, indent=2)
    logger.info(f"Feature list saved to: {features_path}")

    # Save metrics
    metrics = {
        "model_type": "credit_scoring_ensemble",
        "trained_at": datetime.now().isoformat(),
        "n_estimators": len(estimators),
        "estimator_names": [name for name, _ in estimators],
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "good_credit_rate": float(y.mean()),
        "cv_roc_auc_mean": float(cv_scores.mean()),
        "cv_roc_auc_std": float(cv_scores.std()),
        "test_roc_auc": float(test_roc_auc),
        "test_pr_auc": float(test_pr_auc),
        "confusion_matrix": conf_matrix.tolist(),
        "classification_report": class_report,
        "feature_importance": feature_importance.to_dict('records'),
        "feature_columns": feature_cols
    }

    metrics_path = output_dir / "credit_scoring_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to: {metrics_path}")

    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 60)

    loader.close()
    return metrics


def generate_synthetic_credit_data(n_users: int = 500):
    """Generate synthetic transaction and loan data for testing"""
    np.random.seed(42)

    # Generate transactions
    transactions = []
    for user_id in range(n_users):
        n_tx = np.random.randint(10, 200)
        for _ in range(n_tx):
            transactions.append({
                'id': f'tx_{len(transactions)}',
                'user_id': f'user_{user_id}',
                'amount': np.random.lognormal(mean=4.5, sigma=1.0),
                'category': np.random.choice(['food', 'transport', 'shopping', 'bills']),
                'merchant': f'merchant_{np.random.randint(1, 50)}',
                'timestamp': datetime.now(),
                'status': 'completed'
            })

    transactions_df = pd.DataFrame(transactions)

    # Generate loan data
    loans = []
    for user_id in range(n_users):
        n_loans = np.random.randint(1, 10)
        repayment_tendency = np.random.random()  # User's inherent repayment tendency

        for _ in range(n_loans):
            repaid = np.random.random() < repayment_tendency
            loans.append({
                'user_id': f'user_{user_id}',
                'loan_amount': np.random.uniform(500, 5000),
                'status': 'repaid' if repaid else np.random.choice(['repaid', 'defaulted'], p=[0.7, 0.3]),
                'repaid': repaid,
                'default': not repaid and np.random.random() < 0.3,
                'created_at': datetime.now(),
                'due_date': datetime.now(),
                'repaid_at': datetime.now() if repaid else None
            })

    loan_df = pd.DataFrame(loans)
    return transactions_df, loan_df


if __name__ == "__main__":
    import sys

    # Example usage
    pg_conn = os.getenv("DATABASE_URL")

    if pg_conn:
        logger.info("Using PostgreSQL connection from DATABASE_URL")
        metrics = train_credit_scoring_model(pg_conn_string=pg_conn)
    else:
        logger.info("No DATABASE_URL found, using test mode with synthetic data")
        metrics = train_credit_scoring_model(test_mode=True)

    print("\nTraining completed successfully!")
    print(f"Test ROC-AUC: {metrics['test_roc_auc']:.4f}")
    print(f"Test PR-AUC: {metrics['test_pr_auc']:.4f}")
