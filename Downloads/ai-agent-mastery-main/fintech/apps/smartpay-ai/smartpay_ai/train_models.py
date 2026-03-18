"""
Train all ML models for Smartpay AI Copilot

This script:
1. Generates synthetic training data for all 5 models
2. Trains each ensemble model
3. Evaluates performance
4. Saves trained models to disk
5. Reports metrics

Run this script to create pre-trained models:
    python -m smartpay_ai.train_models
"""

import logging
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.ml.fraud_detection import (
    FraudDetectionEnsemble,
    generate_training_data as generate_fraud_data
)
from smartpay_ai.ml.credit_scoring import (
    CreditScoringEnsemble,
    generate_training_data as generate_credit_data
)
from smartpay_ai.ml.spending_analysis import (
    SpendingAnalysisEngine,
    generate_training_data as generate_spending_data
)
from smartpay_ai.ml.transaction_classification import (
    TransactionClassifier,
    generate_training_data as generate_transaction_data
)
from smartpay_ai.ml.savings_forecast import (
    SavingsForecastEngine,
    generate_training_data as generate_savings_data
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_fraud_detection():
    """Train fraud detection ensemble"""
    logger.info("=" * 80)
    logger.info("TRAINING FRAUD DETECTION ENSEMBLE")
    logger.info("=" * 80)
    
    # Generate data
    X_train, y_train, X_test, y_test = generate_fraud_data(n_samples=10000)
    logger.info(f"Generated {len(X_train)} training samples, {len(X_test)} test samples")
    
    # Train
    ensemble = FraudDetectionEnsemble()
    ensemble.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    metrics = ensemble.evaluate(X_test, y_test)
    logger.info("Fraud Detection Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            logger.info(f"  {metric}: {value:.4f}")
    
    # Save
    model_dir = Path(__file__).parent / 'models' / 'fraud_detection'
    ensemble.save(model_dir)
    logger.info(f"Models saved to {model_dir}")
    
    return metrics


def train_credit_scoring():
    """Train credit scoring ensemble"""
    logger.info("=" * 80)
    logger.info("TRAINING CREDIT SCORING ENSEMBLE")
    logger.info("=" * 80)
    
    # Generate data
    X_train, y_train, X_test, y_test = generate_credit_data(n_samples=5000)
    logger.info(f"Generated {len(X_train)} training samples, {len(X_test)} test samples")
    
    # Train
    ensemble = CreditScoringEnsemble()
    ensemble.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    metrics = ensemble.evaluate(X_test, y_test)
    logger.info("Credit Scoring Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            logger.info(f"  {metric}: {value:.4f}")
    
    # Save
    model_dir = Path(__file__).parent / 'models' / 'credit_scoring'
    ensemble.save(model_dir)
    logger.info(f"Models saved to {model_dir}")
    
    return metrics


def train_spending_analysis():
    """Train spending analysis engine"""
    logger.info("=" * 80)
    logger.info("TRAINING SPENDING ANALYSIS ENGINE")
    logger.info("=" * 80)
    
    # Generate data
    X_train, y_train, X_test, y_test = generate_spending_data(n_samples=3000)
    logger.info(f"Generated {len(X_train)} training samples, {len(X_test)} test samples")
    
    # Train
    engine = SpendingAnalysisEngine()
    engine.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    metrics = engine.evaluate(X_test, y_test)
    logger.info("Spending Analysis Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            logger.info(f"  {metric}: {value:.4f}")
    
    # Save
    model_dir = Path(__file__).parent / 'models' / 'spending_analysis'
    engine.save(model_dir)
    logger.info(f"Models saved to {model_dir}")
    
    return metrics


def train_transaction_classification():
    """Train transaction classifier"""
    logger.info("=" * 80)
    logger.info("TRAINING TRANSACTION CLASSIFIER")
    logger.info("=" * 80)
    
    # Generate data
    X_train, y_train, X_test, y_test = generate_transaction_data(n_samples=15000)
    logger.info(f"Generated {len(X_train)} training samples, {len(X_test)} test samples")
    
    # Train
    classifier = TransactionClassifier()
    classifier.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    metrics = classifier.evaluate(X_test, y_test)
    logger.info("Transaction Classification Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            logger.info(f"  {metric}: {value:.4f}")
    
    # Save
    model_dir = Path(__file__).parent / 'models' / 'transaction_classification'
    classifier.save(model_dir)
    logger.info(f"Models saved to {model_dir}")
    
    return metrics


def train_savings_forecast():
    """Train savings forecast engine"""
    logger.info("=" * 80)
    logger.info("TRAINING SAVINGS FORECAST ENGINE")
    logger.info("=" * 80)
    
    # Generate data
    X_train, y_train, X_test, y_test = generate_savings_data(n_samples=5000)
    logger.info(f"Generated {len(X_train)} training samples, {len(X_test)} test samples")
    
    # Train
    engine = SavingsForecastEngine()
    engine.train(X_train, y_train, X_test, y_test)
    
    # Evaluate
    metrics = engine.evaluate(X_test, y_test)
    logger.info("Savings Forecast Metrics:")
    for metric, value in metrics.items():
        if isinstance(value, (int, float)):
            logger.info(f"  {metric}: {value:.4f}")
    
    # Save
    model_dir = Path(__file__).parent / 'models' / 'savings_forecast'
    engine.save(model_dir)
    logger.info(f"Models saved to {model_dir}")
    
    return metrics


def main():
    """Train all models"""
    logger.info("*" * 80)
    logger.info("SMARTPAY AI COPILOT - MODEL TRAINING")
    logger.info("*" * 80)
    
    all_metrics = {}
    
    try:
        # Train all models
        all_metrics['fraud_detection'] = train_fraud_detection()
        all_metrics['credit_scoring'] = train_credit_scoring()
        all_metrics['spending_analysis'] = train_spending_analysis()
        all_metrics['transaction_classification'] = train_transaction_classification()
        all_metrics['savings_forecast'] = train_savings_forecast()
        
        # Summary
        logger.info("=" * 80)
        logger.info("TRAINING COMPLETE - SUMMARY")
        logger.info("=" * 80)
        
        print("\n" + "=" * 80)
        print("SMARTPAY AI COPILOT - ML MODELS SUMMARY")
        print("=" * 80)
        
        print("\n1. FRAUD DETECTION ENSEMBLE")
        print("   - Models: Random Forest, XGBoost, Logistic Regression")
        print("   - Features: 15 (amount, time, velocity, device, merchant)")
        print(f"   - Accuracy: {all_metrics['fraud_detection'].get('accuracy', 0):.2%}")
        print(f"   - Precision: {all_metrics['fraud_detection'].get('precision', 0):.2%}")
        print(f"   - Recall: {all_metrics['fraud_detection'].get('recall', 0):.2%}")
        print(f"   - ROC-AUC: {all_metrics['fraud_detection'].get('roc_auc', 0):.4f}")
        
        print("\n2. CREDIT SCORING ENSEMBLE")
        print("   - Models: Random Forest, Gradient Boosting, Logistic Regression")
        print("   - Features: 12 (transaction history, loans, account age)")
        print(f"   - ROC-AUC: {all_metrics['credit_scoring'].get('roc_auc', 0):.4f}")
        print(f"   - Accuracy: {all_metrics['credit_scoring'].get('accuracy', 0):.2%}")
        print(f"   - Precision: {all_metrics['credit_scoring'].get('precision', 0):.2%}")
        
        print("\n3. SPENDING ANALYSIS ENGINE")
        print("   - Models: K-Means, Random Forest, Gradient Boosting")
        print("   - Features: 10 (spending, categories, patterns)")
        print("   - Segments: conservative, balanced, high_spender")
        print(f"   - Accuracy: {all_metrics['spending_analysis'].get('accuracy', 0):.2%}")
        print(f"   - Silhouette Score: {all_metrics['spending_analysis'].get('silhouette_score', 0):.4f}")
        
        print("\n4. TRANSACTION CLASSIFIER")
        print("   - Models: Random Forest, Gradient Boosting, Logistic Regression")
        print("   - Features: 8 (amount, merchant, time, day)")
        print("   - Categories: 15 (groceries, transport, utilities, etc.)")
        print(f"   - Accuracy: {all_metrics['transaction_classification'].get('accuracy', 0):.2%}")
        
        print("\n5. SAVINGS FORECAST ENGINE")
        print("   - Models: Random Forest Regressor, Gradient Boosting, Linear Regression")
        print("   - Features: 8 (balance, contribution, goal, consistency)")
        print(f"   - RMSE: {all_metrics['savings_forecast'].get('rmse', 0):.2f} months")
        print(f"   - MAE: {all_metrics['savings_forecast'].get('mae', 0):.2f} months")
        print(f"   - R² Score: {all_metrics['savings_forecast'].get('r2_score', 0):.4f}")
        
        print("\n" + "=" * 80)
        print("All models trained successfully!")
        print("Models saved to: backend_python/smartpay_ai/models/")
        print("=" * 80 + "\n")
        
        return True
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
