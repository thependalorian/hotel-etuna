"""
Fraud Detection Model Training

Location: backend_python/smartpay_ai/training/train_fraud_model.py
Purpose: Train ensemble fraud detection model (RandomForest + XGBoost + LogisticRegression)
Usage: python -m smartpay_ai.training.train_fraud_model
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
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


def train_fraud_detection_model(
    db_path: str = ":memory:",
    pg_conn_string: str = None,
    output_dir: str = None,
    test_mode: bool = False
) -> Dict[str, Any]:
    """
    Train fraud detection ensemble model
    
    Args:
        db_path: DuckDB database path
        pg_conn_string: PostgreSQL connection string
        output_dir: Directory to save model and metrics
        test_mode: If True, use synthetic data for testing
        
    Returns:
        Training metrics and results
    """
    logger.info("=" * 60)
    logger.info("FRAUD DETECTION MODEL TRAINING")
    logger.info("=" * 60)

    # Setup output directory
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "models" / "fraud_detection"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Output directory: {output_dir}")

    # Load data
    loader = DataLoader(db_path)

    if test_mode:
        logger.info("TEST MODE: Generating synthetic fraud data")
        df = generate_synthetic_fraud_data(n_samples=5000)
    elif pg_conn_string:
        logger.info("Loading transaction data from PostgreSQL")
        df = loader.load_transactions_from_postgres(
            pg_conn_string,
            days_back=180,
            include_fraud_labels=True
        )
    else:
        logger.info("Loading transaction data from DuckDB")
        df = loader.load_transactions_from_duckdb()

        # If no fraud labels, we need to generate some for training
        if 'is_fraud' not in df.columns:
            logger.warning("No fraud labels found, adding synthetic fraud labels")
            df = add_synthetic_fraud_labels(df)

    logger.info(f"Loaded {len(df)} transactions")

    # Feature engineering
    logger.info("Engineering fraud detection features")
    features_df = loader.engineer_fraud_features(df)

    # Select feature columns
    feature_cols = [
        'amount', 'amount_log', 'hour', 'day_of_week', 'is_weekend', 'is_night',
        'tx_count_1h', 'tx_count_24h', 'amount_sum_1h', 'amount_sum_24h',
        'user_avg_amount', 'user_std_amount', 'user_tx_count',
        'amount_deviation', 'merchant_frequency',
        'category_encoded', 'status_encoded'
    ]

    # Filter to available columns
    feature_cols = [col for col in feature_cols if col in features_df.columns]
    logger.info(f"Using {len(feature_cols)} features: {feature_cols}")

    # Prepare X and y
    X = features_df[feature_cols].fillna(0)
    y = features_df['is_fraud'].astype(int)

    logger.info(f"Target distribution - Fraud: {y.sum()} ({y.mean()*100:.2f}%), "
                f"Legitimate: {(~y.astype(bool)).sum()} ({(1-y.mean())*100:.2f}%)")

    # Train/val/test split
    X_train, X_val, X_test, y_train, y_val, y_test = loader.train_test_split_data(
        X, y, test_size=0.2, val_size=0.1
    )

    # Normalize features
    X_train_scaled, X_val_scaled, X_test_scaled = loader.normalize_features(
        X_train, X_val, X_test
    )

    # Build ensemble model
    logger.info("Building ensemble fraud detection model")

    estimators = []

    # Model 1: Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=20,
        min_samples_leaf=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    estimators.append(('rf', rf_model))

    # Model 2: Logistic Regression
    lr_model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )
    estimators.append(('lr', lr_model))

    # Model 3: XGBoost (if available)
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
    logger.info(f"  Precision (fraud): {class_report['1']['precision']:.4f}")
    logger.info(f"  Recall (fraud): {class_report['1']['recall']:.4f}")
    logger.info(f"  F1-score (fraud): {class_report['1']['f1-score']:.4f}")
    logger.info("\nTop 10 Feature Importances:")
    for idx, row in feature_importance.head(10).iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")

    # Save model
    model_path = output_dir / "fraud_detection_ensemble.joblib"
    joblib.dump(ensemble, model_path)
    logger.info(f"\nModel saved to: {model_path}")

    # Save scaler
    scaler_path = output_dir / "fraud_detection_scaler.joblib"
    joblib.dump(loader.scaler, scaler_path)
    logger.info(f"Scaler saved to: {scaler_path}")

    # Save feature columns
    features_path = output_dir / "fraud_detection_features.json"
    with open(features_path, 'w') as f:
        json.dump(feature_cols, f, indent=2)
    logger.info(f"Feature list saved to: {features_path}")

    # Save metrics
    metrics = {
        "model_type": "fraud_detection_ensemble",
        "trained_at": datetime.now().isoformat(),
        "n_estimators": len(estimators),
        "estimator_names": [name for name, _ in estimators],
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "fraud_rate": float(y.mean()),
        "cv_roc_auc_mean": float(cv_scores.mean()),
        "cv_roc_auc_std": float(cv_scores.std()),
        "test_roc_auc": float(test_roc_auc),
        "test_pr_auc": float(test_pr_auc),
        "confusion_matrix": conf_matrix.tolist(),
        "classification_report": class_report,
        "feature_importance": feature_importance.to_dict('records'),
        "feature_columns": feature_cols
    }

    metrics_path = output_dir / "fraud_detection_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to: {metrics_path}")

    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 60)

    loader.close()
    return metrics


def generate_synthetic_fraud_data(n_samples: int = 5000) -> pd.DataFrame:
    """Generate synthetic transaction data with fraud labels for testing"""
    np.random.seed(42)

    n_fraud = int(n_samples * 0.05)  # 5% fraud rate
    n_legit = n_samples - n_fraud

    # Legitimate transactions
    legit_data = {
        'id': [f'tx_{i}' for i in range(n_legit)],
        'user_id': [f'user_{np.random.randint(1, 100)}' for _ in range(n_legit)],
        'amount': np.random.lognormal(mean=4.5, sigma=1.0, size=n_legit),  # ~N$90 avg
        'category': np.random.choice(['food', 'transport', 'shopping', 'bills'], n_legit),
        'merchant': [f'merchant_{np.random.randint(1, 50)}' for _ in range(n_legit)],
        'timestamp': pd.date_range(end=datetime.now(), periods=n_legit, freq='1h'),
        'wallet_id': [f'wallet_{np.random.randint(1, 20)}' for _ in range(n_legit)],
        'status': 'completed',
        'is_fraud': [False] * n_legit
    }

    # Fraudulent transactions (different patterns)
    fraud_data = {
        'id': [f'tx_fraud_{i}' for i in range(n_fraud)],
        'user_id': [f'user_{np.random.randint(1, 100)}' for _ in range(n_fraud)],
        'amount': np.random.lognormal(mean=6.5, sigma=1.5, size=n_fraud),  # Higher amounts
        'category': np.random.choice(['shopping', 'electronics', 'other'], n_fraud),
        'merchant': [f'merchant_{np.random.randint(51, 100)}' for _ in range(n_fraud)],  # Different merchants
        'timestamp': pd.date_range(end=datetime.now(), periods=n_fraud, freq='30min'),  # Higher velocity
        'wallet_id': [f'wallet_{np.random.randint(1, 20)}' for _ in range(n_fraud)],
        'status': 'completed',
        'is_fraud': [True] * n_fraud
    }

    df = pd.concat([pd.DataFrame(legit_data), pd.DataFrame(fraud_data)], ignore_index=True)
    return df.sample(frac=1).reset_index(drop=True)  # Shuffle


def add_synthetic_fraud_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Add synthetic fraud labels based on heuristics"""
    df = df.copy()

    # Simple heuristic: mark top 5% of amounts as potential fraud
    amount_threshold = df['amount'].quantile(0.95)
    df['is_fraud'] = (df['amount'] > amount_threshold).astype(bool)

    return df


if __name__ == "__main__":
    import sys

    # Example usage
    pg_conn = os.getenv("DATABASE_URL")

    if pg_conn:
        logger.info("Using PostgreSQL connection from DATABASE_URL")
        metrics = train_fraud_detection_model(pg_conn_string=pg_conn)
    else:
        logger.info("No DATABASE_URL found, using test mode with synthetic data")
        metrics = train_fraud_detection_model(test_mode=True)

    print("\nTraining completed successfully!")
    print(f"Test ROC-AUC: {metrics['test_roc_auc']:.4f}")
    print(f"Test PR-AUC: {metrics['test_pr_auc']:.4f}")
