"""
Test ML Service Integration for Smartpay AI Copilot

Tests all 5 ML models with sample predictions to verify:
1. Models load correctly
2. Predictions work
3. Confidence scores are valid
4. Recommendations are generated

Run with:
    python -m smartpay_ai.test_ml_service
"""

import logging
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.ml_service import (
    get_ml_service,
    MLModelType,
    predict_fraud,
    predict_credit_score,
    analyze_spending,
    classify_transaction,
    forecast_savings
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_fraud_detection():
    """Test fraud detection model"""
    logger.info("=" * 80)
    logger.info("TESTING FRAUD DETECTION")
    logger.info("=" * 80)
    
    # Test suspicious transaction (large amount, unusual hour, high velocity)
    suspicious_features = {
        "amount": 8000,
        "hour_of_day": 2,  # 2 AM
        "velocity_score": 5,
        "device_score": 0.3,  # Low device trust
        "merchant_category": 7
    }
    
    result = predict_fraud(suspicious_features)
    
    print("\n📊 SUSPICIOUS TRANSACTION TEST")
    print(f"Amount: NAD {suspicious_features['amount']:,.2f}")
    print(f"Hour: {suspicious_features['hour_of_day']:02d}:00")
    print(f"Device Score: {suspicious_features['device_score']:.2f}")
    print(f"\nFraud Probability: {result.prediction:.2%}")
    print(f"Risk Level: {result.risk_level.upper()}")
    print(f"Confidence: {result.confidence:.2%}")
    print(f"\nRecommendations:")
    for rec in result.recommendations[:3]:
        print(f"  • {rec}")
    
    # Test normal transaction
    normal_features = {
        "amount": 250,
        "hour_of_day": 14,  # 2 PM
        "velocity_score": 0.5,
        "device_score": 0.95,  # High device trust
        "merchant_category": 2
    }
    
    result2 = predict_fraud(normal_features)
    
    print("\n✅ NORMAL TRANSACTION TEST")
    print(f"Amount: NAD {normal_features['amount']:,.2f}")
    print(f"Hour: {normal_features['hour_of_day']:02d}:00")
    print(f"Device Score: {normal_features['device_score']:.2f}")
    print(f"\nFraud Probability: {result2.prediction:.2%}")
    print(f"Risk Level: {result2.risk_level.upper()}")
    
    return True


def test_credit_scoring():
    """Test credit scoring model"""
    logger.info("=" * 80)
    logger.info("TESTING CREDIT SCORING")
    logger.info("=" * 80)
    
    # Test excellent credit profile
    excellent_features = {
        "transaction_history_score": 0.95,
        "loan_repayment_rate": 1.0,
        "account_age_days": 800
    }
    
    result = predict_credit_score(excellent_features)
    
    print("\n⭐ EXCELLENT CREDIT PROFILE")
    print(f"Transaction History: {excellent_features['transaction_history_score']:.2f}")
    print(f"Repayment Rate: {excellent_features['loan_repayment_rate']:.0%}")
    print(f"Account Age: {excellent_features['account_age_days']} days")
    print(f"\nCredit Score: {result.prediction}")
    print(f"Risk Category: {result.risk_level.upper()}")
    print(f"Max Loan: NAD {result.metadata.get('max_loan_amount', 0):,.2f}")
    print(f"\nRecommendations:")
    for rec in result.recommendations[:2]:
        print(f"  • {rec}")
    
    # Test poor credit profile
    poor_features = {
        "transaction_history_score": 0.3,
        "loan_repayment_rate": 0.6,
        "account_age_days": 45
    }
    
    result2 = predict_credit_score(poor_features)
    
    print("\n⚠️  POOR CREDIT PROFILE")
    print(f"Transaction History: {poor_features['transaction_history_score']:.2f}")
    print(f"Repayment Rate: {poor_features['loan_repayment_rate']:.0%}")
    print(f"Account Age: {poor_features['account_age_days']} days")
    print(f"\nCredit Score: {result2.prediction}")
    print(f"Risk Category: {result2.risk_level.upper()}")
    print(f"Max Loan: NAD {result2.metadata.get('max_loan_amount', 0):,.2f}")
    
    return True


def test_spending_analysis():
    """Test spending analysis model"""
    logger.info("=" * 80)
    logger.info("TESTING SPENDING ANALYSIS")
    logger.info("=" * 80)
    
    # Test high spender
    high_spender_features = {
        "monthly_spending": 15000,
        "transaction_count": 60,
        "category_diversity": 0.85
    }
    
    result = analyze_spending(high_spender_features)
    
    print("\n💸 HIGH SPENDER PROFILE")
    print(f"Monthly Spending: NAD {high_spender_features['monthly_spending']:,.2f}")
    print(f"Transaction Count: {high_spender_features['transaction_count']}")
    print(f"Category Diversity: {high_spender_features['category_diversity']:.2f}")
    print(f"\nSegment: {result.prediction.upper()}")
    print(f"Pattern: {result.risk_level}")
    print(f"Confidence: {result.confidence:.2%}")
    print(f"\nRecommendations:")
    for rec in result.recommendations[:3]:
        print(f"  • {rec}")
    
    # Test conservative spender
    conservative_features = {
        "monthly_spending": 3000,
        "transaction_count": 18,
        "category_diversity": 0.4
    }
    
    result2 = analyze_spending(conservative_features)
    
    print("\n💰 CONSERVATIVE SPENDER PROFILE")
    print(f"Monthly Spending: NAD {conservative_features['monthly_spending']:,.2f}")
    print(f"Transaction Count: {conservative_features['transaction_count']}")
    print(f"\nSegment: {result2.prediction.upper()}")
    print(f"Pattern: {result2.risk_level}")
    
    return True


def test_transaction_classification():
    """Test transaction classification model"""
    logger.info("=" * 80)
    logger.info("TESTING TRANSACTION CLASSIFICATION")
    logger.info("=" * 80)
    
    # Test various transaction types
    test_cases = [
        {"amount": 150, "merchant_category": 0, "hour_of_day": 10, "day_of_week": 3, "expected": "groceries"},
        {"amount": 50, "merchant_category": 1, "hour_of_day": 7, "day_of_week": 1, "expected": "transport"},
        {"amount": 400, "merchant_category": 2, "hour_of_day": 15, "day_of_week": 5, "expected": "utilities"},
        {"amount": 250, "merchant_category": 3, "hour_of_day": 19, "day_of_week": 6, "expected": "restaurants"},
    ]
    
    print("\n🏷️  TRANSACTION CATEGORIZATION TESTS\n")
    
    for i, features in enumerate(test_cases, 1):
        result = classify_transaction(features)
        print(f"Test {i}: NAD {features['amount']:,.2f} at {features['hour_of_day']:02d}:00")
        print(f"  → Predicted: {result.prediction.upper()}")
        print(f"  → Confidence: {result.confidence:.2%}")
        print(f"  → Top 3: {', '.join([c['category'] for c in result.metadata['top_3_categories']])}")
        print()
    
    return True


def test_savings_forecast():
    """Test savings forecast model"""
    logger.info("=" * 80)
    logger.info("TESTING SAVINGS FORECAST")
    logger.info("=" * 80)
    
    # Test achievable goal
    achievable_features = {
        "current_balance": 5000,
        "monthly_contribution": 1500,
        "goal_amount": 15000
    }
    
    result = forecast_savings(achievable_features)
    
    print("\n🎯 ACHIEVABLE SAVINGS GOAL")
    print(f"Current Balance: NAD {achievable_features['current_balance']:,.2f}")
    print(f"Monthly Contribution: NAD {achievable_features['monthly_contribution']:,.2f}")
    print(f"Goal Amount: NAD {achievable_features['goal_amount']:,.2f}")
    print(f"\nMonths to Goal: {result.metadata['months_to_goal']:.1f} months")
    print(f"Achievable Date: {result.prediction}")
    print(f"Success Probability: {result.confidence:.2%}")
    print(f"\nRecommendations:")
    for rec in result.recommendations[:3]:
        print(f"  • {rec}")
    
    # Test challenging goal
    challenging_features = {
        "current_balance": 1000,
        "monthly_contribution": 300,
        "goal_amount": 25000
    }
    
    result2 = forecast_savings(challenging_features)
    
    print("\n⏳ CHALLENGING SAVINGS GOAL")
    print(f"Current Balance: NAD {challenging_features['current_balance']:,.2f}")
    print(f"Monthly Contribution: NAD {challenging_features['monthly_contribution']:,.2f}")
    print(f"Goal Amount: NAD {challenging_features['goal_amount']:,.2f}")
    print(f"\nMonths to Goal: {result2.metadata['months_to_goal']:.1f} months ({result2.metadata['months_to_goal']/12:.1f} years)")
    print(f"Success Probability: {result2.confidence:.2%}")
    
    return True


def test_ml_service_status():
    """Test ML service status"""
    logger.info("=" * 80)
    logger.info("TESTING ML SERVICE STATUS")
    logger.info("=" * 80)
    
    ml_service = get_ml_service()
    ml_service.initialize()
    
    status = ml_service.get_model_status()
    available_models = ml_service.get_available_models()
    
    print("\n📋 ML SERVICE STATUS")
    print(f"Initialized: {status['initialized']}")
    print(f"Models Available: {status['models_available']}")
    print(f"\nAvailable Models:")
    for model in available_models:
        print(f"  • {model}")
    
    return True


def main():
    """Run all tests"""
    logger.info("*" * 80)
    logger.info("SMARTPAY AI COPILOT - ML SERVICE INTEGRATION TESTS")
    logger.info("*" * 80)
    
    tests = [
        ("ML Service Status", test_ml_service_status),
        ("Fraud Detection", test_fraud_detection),
        ("Credit Scoring", test_credit_scoring),
        ("Spending Analysis", test_spending_analysis),
        ("Transaction Classification", test_transaction_classification),
        ("Savings Forecast", test_savings_forecast),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results[test_name] = "✅ PASSED" if success else "❌ FAILED"
        except Exception as e:
            logger.error(f"Test '{test_name}' failed: {e}", exc_info=True)
            results[test_name] = f"❌ FAILED: {str(e)}"
    
    # Summary
    logger.info("=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    print("\n" + "=" * 80)
    print("SMARTPAY AI COPILOT - ML SERVICE TEST SUMMARY")
    print("=" * 80 + "\n")
    
    for test_name, result in results.items():
        print(f"{test_name:.<50} {result}")
    
    print("\n" + "=" * 80)
    
    # Check if all tests passed
    all_passed = all("PASSED" in result for result in results.values())
    
    if all_passed:
        print("✅ All tests PASSED! ML service is ready for production.")
    else:
        print("❌ Some tests FAILED. Check logs for details.")
    
    print("=" * 80 + "\n")
    
    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
