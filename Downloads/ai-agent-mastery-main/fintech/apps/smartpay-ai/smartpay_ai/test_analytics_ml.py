"""
Test Script for Analytics and ML Pipelines

Location: backend_python/smartpay_ai/test_analytics_ml.py
Purpose: Verify analytics modules and ML training pipelines work correctly
Usage: python -m smartpay_ai.test_analytics_ml
"""

import logging
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_analytics_modules():
    """Test all analytics modules with synthetic data"""
    logger.info("=" * 60)
    logger.info("TESTING ANALYTICS MODULES")
    logger.info("=" * 60)

    try:
        from smartpay_ai.analytics import SpendingAnalytics, GroupAnalytics, FraudAnalytics
        import pandas as pd
        import numpy as np
        from datetime import datetime, timedelta

        # Generate synthetic data
        n_transactions = 1000
        transactions = []

        for i in range(n_transactions):
            transactions.append({
                'id': f'tx_{i}',
                'user_id': f'user_{i % 50}',  # 50 unique users
                'amount': float(np.random.lognormal(mean=4.5, sigma=1.0)),
                'category': np.random.choice(['food', 'transport', 'shopping', 'bills']),
                'merchant': f'merchant_{np.random.randint(1, 20)}',
                'timestamp': datetime.now() - timedelta(hours=np.random.randint(0, 720)),
                'wallet_id': f'wallet_{i % 10}',
                'status': 'completed',
                'currency': 'NAD'
            })

        df = pd.DataFrame(transactions)

        # Test SpendingAnalytics
        logger.info("\n1. Testing SpendingAnalytics...")
        spending = SpendingAnalytics(db_path=":memory:")
        spending.load_transactions_from_dataframe(df)

        insights = spending.export_insights_for_agent(user_id="user_1")
        logger.info(f"   ✓ Spending insights generated for user_1")
        logger.info(f"     Total spending: N${insights['overall_metrics']['total_spending']:.2f}")
        logger.info(f"     Categories: {len(insights['category_breakdown'])}")

        spending.close()

        # Test FraudAnalytics
        logger.info("\n2. Testing FraudAnalytics...")
        fraud = FraudAnalytics(db_path=":memory:")
        
        # Add extra columns required by FraudAnalytics schema
        df_fraud = df.copy()
        df_fraud['merchant_location'] = 'Windhoek'
        df_fraud['device_id'] = [f'device_{i % 10}' for i in range(len(df_fraud))]
        df_fraud['ip_address'] = '127.0.0.1'
        
        fraud.load_transactions_from_dataframe(df_fraud)

        velocity = fraud.transaction_velocity_tracking(user_id="user_1", window_hours=24)
        logger.info(f"   ✓ Velocity tracking completed")
        logger.info(f"     Transactions (24h): {velocity['transaction_count']}")
        logger.info(f"     Risk score: {velocity['risk_score']}")

        risk_patterns = fraud.risk_pattern_identification(user_id="user_1", days=30)
        logger.info(f"   ✓ Risk pattern analysis completed")
        logger.info(f"     Risk level: {risk_patterns['risk_level']}")

        fraud.close()

        logger.info("\n✅ All analytics modules passed!")
        return True

    except Exception as e:
        logger.error(f"\n❌ Analytics test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_training_pipelines():
    """Test all ML training pipelines with synthetic data"""
    logger.info("\n" + "=" * 60)
    logger.info("TESTING ML TRAINING PIPELINES")
    logger.info("=" * 60)

    try:
        from smartpay_ai.training import (
            train_fraud_detection_model,
            train_credit_scoring_model,
            train_spending_analysis_model
        )

        # Test Fraud Detection Training
        logger.info("\n1. Testing Fraud Detection Model Training...")
        fraud_metrics = train_fraud_detection_model(test_mode=True)
        logger.info(f"   ✓ Fraud model trained successfully")
        logger.info(f"     ROC-AUC: {fraud_metrics['test_roc_auc']:.4f}")
        logger.info(f"     PR-AUC: {fraud_metrics['test_pr_auc']:.4f}")

        # Test Credit Scoring Training
        logger.info("\n2. Testing Credit Scoring Model Training...")
        credit_metrics = train_credit_scoring_model(test_mode=True)
        logger.info(f"   ✓ Credit model trained successfully")
        logger.info(f"     ROC-AUC: {credit_metrics['test_roc_auc']:.4f}")
        logger.info(f"     PR-AUC: {credit_metrics['test_pr_auc']:.4f}")

        # Test Spending Analysis Training
        logger.info("\n3. Testing Spending Analysis Model Training...")
        spending_metrics = train_spending_analysis_model(test_mode=True, n_clusters=4)
        logger.info(f"   ✓ Spending model trained successfully")
        logger.info(f"     Silhouette Score: {spending_metrics['silhouette_score']:.4f}")
        logger.info(f"     Clusters: {spending_metrics['n_clusters']}")

        logger.info("\n✅ All ML training pipelines passed!")
        return True

    except Exception as e:
        logger.error(f"\n❌ Training test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_loading():
    """Test loading saved models"""
    logger.info("\n" + "=" * 60)
    logger.info("TESTING MODEL LOADING")
    logger.info("=" * 60)

    try:
        import joblib
        import json
        from pathlib import Path

        models_dir = Path(__file__).parent / "models"

        # Check fraud detection model
        fraud_model_path = models_dir / "fraud_detection" / "fraud_detection_ensemble.joblib"
        if fraud_model_path.exists():
            model = joblib.load(fraud_model_path)
            logger.info("   ✓ Fraud detection model loaded")
        else:
            logger.warning("   ⚠ Fraud detection model not found (run training first)")

        # Check credit scoring model
        credit_model_path = models_dir / "credit_scoring" / "credit_scoring_ensemble.joblib"
        if credit_model_path.exists():
            model = joblib.load(credit_model_path)
            logger.info("   ✓ Credit scoring model loaded")
        else:
            logger.warning("   ⚠ Credit scoring model not found (run training first)")

        # Check spending analysis model
        spending_model_path = models_dir / "spending_analysis" / "spending_clustering.joblib"
        if spending_model_path.exists():
            model = joblib.load(spending_model_path)
            logger.info("   ✓ Spending analysis model loaded")
        else:
            logger.warning("   ⚠ Spending analysis model not found (run training first)")

        logger.info("\n✅ Model loading test completed!")
        return True

    except Exception as e:
        logger.error(f"\n❌ Model loading test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("SMARTPAY AI ANALYTICS & ML PIPELINE TESTS")
    logger.info("=" * 60)

    results = {
        "analytics": test_analytics_modules(),
        "training": test_training_pipelines(),
        "loading": test_model_loading()
    }

    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"  {test_name.upper()}: {status}")

    all_passed = all(results.values())

    if all_passed:
        logger.info("\n🎉 All tests passed successfully!")
        logger.info("\nNext steps:")
        logger.info("  1. Train models with real data: python -m smartpay_ai.training.train_fraud_model")
        logger.info("  2. Set up analytics refresh cron job")
        logger.info("  3. Integrate with AI agents")
        return 0
    else:
        logger.error("\n⚠️  Some tests failed. Check logs above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
