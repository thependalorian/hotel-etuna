"""
ML Service - Unified Machine Learning Interface for Smartpay AI Copilot

Provides a unified API for all ML models in the Smartpay ecosystem.
This service wraps all ML ensembles and provides:
- Real-time predictions
- Batch processing
- Model lifecycle management
- Graceful degradation on missing models

Trained weights are loaded from backend_python/smartpay_ai/models/<model_name>/ when present.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Base path for serialized models (resolved from this file so CWD-independent)
_MODELS_BASE = Path(__file__).resolve().parent / "models"


class MLModelType(str, Enum):
    """Available ML models in the Smartpay ecosystem."""
    FRAUD_DETECTION = "fraud_detection"
    CREDIT_SCORING = "credit_scoring"
    SPENDING_ANALYSIS = "spending_analysis"
    TRANSACTION_CLASSIFICATION = "transaction_classification"
    SAVINGS_FORECAST = "savings_forecast"


@dataclass
class MLPredictionResult:
    """Standard response format for ML predictions."""
    model: str
    prediction: Any
    confidence: float
    risk_level: Optional[str] = None
    recommendations: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class MLService:
    """
    Unified ML Service for Smartpay AI Copilot
    
    Provides a single interface to access all ML models:
    - Fraud Detection (real-time transaction fraud probability)
    - Credit Scoring (credit risk assessment)
    - Spending Analysis (spending pattern segmentation)
    - Transaction Classification (auto-categorize transactions)
    - Savings Forecast (savings goal achievement prediction)
    """
    
    def __init__(self):
        self._models: Dict[MLModelType, Any] = {}
        self._initialized = False
        logger.info("ML Service initialized")
    
    def initialize(self) -> bool:
        """
        Initialize all ML models.
        Returns True if all models loaded successfully.
        """
        if self._initialized:
            return True
            
        try:
            # Import all ML models
            from smartpay_ai.ml import (
                FraudDetectionEnsemble,
                CreditScoringEnsemble,
                SpendingAnalysisEngine,
                TransactionClassifier,
                SavingsForecastEngine,
                ML_AVAILABLE
            )
            
            if not ML_AVAILABLE:
                logger.warning("ML models not available (missing dependencies)")
                return False
            
            # Initialize models (lazy initialization - only when needed)
            self._models = {
                MLModelType.FRAUD_DETECTION: FraudDetectionEnsemble(),
                MLModelType.CREDIT_SCORING: CreditScoringEnsemble(),
                MLModelType.SPENDING_ANALYSIS: SpendingAnalysisEngine(),
                MLModelType.TRANSACTION_CLASSIFICATION: TransactionClassifier(),
                MLModelType.SAVINGS_FORECAST: SavingsForecastEngine(),
            }

            # Load trained weights from backend_python/smartpay_ai/models/ when present
            self._load_trained_weights()

            self._initialized = True
            logger.info(f"ML Service initialized with {len(self._models)} models")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize ML models: {e}")
            return False

    def _load_trained_weights(self) -> None:
        """Load trained weights from models/<model_name>/ when directory exists."""
        for model_type in self._models:
            model_dir = _MODELS_BASE / model_type.value
            if not model_dir.is_dir():
                logger.debug(f"No trained weights at {model_dir}, using untrained {model_type.value}")
                continue
            model = self._models[model_type]
            if not hasattr(model, "load"):
                continue
            try:
                model.load(model_dir)
                logger.info(f"Loaded trained weights for {model_type.value} from {model_dir}")
            except Exception as e:
                logger.warning(f"Could not load weights for {model_type.value} from {model_dir}: {e}")

    
    def predict(self, model_type: MLModelType, features: Dict[str, Any]) -> MLPredictionResult:
        """
        Get prediction from a specific ML model.
        
        Args:
            model_type: Type of ML model to use
            features: Input features for prediction
            
        Returns:
            MLPredictionResult with prediction, confidence, and recommendations
        """
        if not self._initialized:
            self.initialize()
        
        model = self._models.get(model_type)
        if not model:
            raise ValueError(f"Model {model_type} not found")
        
        try:
            # Convert features to numpy array
            import numpy as np
            
            # Get prediction based on model type
            if model_type == MLModelType.FRAUD_DETECTION:
                # Construct complete feature array (15 features)
                import math
                amount = features.get("amount", 0)
                hour = features.get("hour_of_day", 12)
                day_of_week = features.get("day_of_week", 0)
                
                feature_array = np.array([[
                    amount / 10000,  # amount_normalized
                    math.log(amount + 1),  # amount_log
                    hour,  # hour_of_day
                    day_of_week,  # day_of_week
                    1 if day_of_week >= 5 else 0,  # is_weekend
                    1 if hour >= 23 or hour <= 6 else 0,  # is_unusual_hour
                    features.get("merchant_category", 0),  # merchant_category
                    features.get("velocity_1h", 0),  # velocity_1h
                    features.get("velocity_24h", 0),  # velocity_24h
                    features.get("device_score", 1.0),  # device_score
                    features.get("amount_deviation", 0),  # amount_deviation
                    1 if amount % 100 == 0 else 0,  # round_number_flag
                    features.get("is_foreign", 0),  # is_foreign
                    features.get("account_age_days", 365),  # account_age_days
                    features.get("kyc_level", 1)  # kyc_level
                ]])
                result = model.predict_ensemble(feature_array)
                return MLPredictionResult(
                    model=model_type.value,
                    prediction=result.get("fraud_probability", 0),
                    confidence=result.get("confidence", 0),
                    risk_level=result.get("risk_level", "unknown"),
                    recommendations=result.get("recommendations", []),
                    metadata=result
                )
                
            elif model_type == MLModelType.CREDIT_SCORING:
                # Construct complete feature array (12 features)
                feature_array = np.array([[
                    features.get("transaction_history_score", 0.5),
                    features.get("loan_repayment_rate", 1.0),
                    features.get("account_age_days", 365),
                    features.get("monthly_income_estimate", 5000),
                    features.get("monthly_transaction_count", 20),
                    features.get("avg_balance", 3000),
                    features.get("payment_consistency", 0.8),
                    features.get("debt_to_income", 0.3),
                    features.get("num_previous_loans", 0),
                    features.get("default_history", 0),
                    features.get("kyc_level", 1),
                    features.get("account_activity_score", 0.7)
                ]])
                result = model.predict(feature_array)
                return MLPredictionResult(
                    model=model_type.value,
                    prediction=result.get("credit_score", 0),
                    confidence=result.get("confidence", 0),
                    risk_level=result.get("risk_category", "unknown"),
                    recommendations=result.get("recommendations", []),
                    metadata=result
                )
                
            elif model_type == MLModelType.SPENDING_ANALYSIS:
                # Construct complete feature array (10 features)
                feature_array = np.array([[
                    features.get("monthly_spending", 0),
                    features.get("transaction_count", 0),
                    features.get("category_diversity", 0),
                    features.get("avg_transaction_size", 200),
                    features.get("weekend_weekday_ratio", 0.3),
                    features.get("groceries_ratio", 0.3),
                    features.get("transport_ratio", 0.2),
                    features.get("utilities_ratio", 0.2),
                    features.get("entertainment_ratio", 0.1),
                    features.get("savings_rate", 0.2)
                ]])
                result = model.predict(feature_array)
                return MLPredictionResult(
                    model=model_type.value,
                    prediction=result.get("segment", "unknown"),
                    confidence=result.get("confidence", 0),
                    risk_level=result.get("spending_pattern", "unknown"),
                    recommendations=result.get("recommendations", []),
                    metadata=result
                )
                
            elif model_type == MLModelType.TRANSACTION_CLASSIFICATION:
                # Construct complete feature array (8 features)
                import math
                amount = features.get("amount", 0)
                day_of_week = features.get("day_of_week", 0)
                
                feature_array = np.array([[
                    amount / 10000,  # amount_normalized
                    math.log(amount + 1),  # amount_log
                    features.get("merchant_category", 0),  # merchant_category
                    features.get("hour_of_day", 12),  # hour_of_day
                    day_of_week,  # day_of_week
                    1 if day_of_week >= 5 else 0,  # is_weekend
                    1 if day_of_week >= 25 else 0,  # is_end_of_month (approx)
                    1 if day_of_week == 1 else 0  # is_salary_day (approx)
                ]])
                result = model.predict(feature_array)
                return MLPredictionResult(
                    model=model_type.value,
                    prediction=result.get("category", "unknown"),
                    confidence=result.get("confidence", 0),
                    metadata=result
                )
                
            elif model_type == MLModelType.SAVINGS_FORECAST:
                # Construct complete feature array (8 features)
                current_balance = features.get("current_balance", 0)
                monthly_contribution = features.get("monthly_contribution", 0)
                goal_amount = features.get("goal_amount", 0)
                monthly_income = features.get("avg_monthly_income", 5000)
                
                feature_array = np.array([[
                    current_balance,  # current_balance
                    monthly_contribution,  # monthly_contribution
                    goal_amount,  # goal_amount
                    features.get("contribution_consistency", 0.8),  # contribution_consistency
                    features.get("months_active", 6),  # months_active
                    features.get("income_stability", 0.8),  # income_stability
                    monthly_income,  # avg_monthly_income
                    monthly_contribution / monthly_income if monthly_income > 0 else 0.2  # savings_ratio
                ]])
                result = model.predict(feature_array)
                return MLPredictionResult(
                    model=model_type.value,
                    prediction=result.get("achievable_date", "unknown"),
                    confidence=result.get("probability", 0),
                    recommendations=result.get("recommendations", []),
                    metadata=result
                )
                
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
                
        except Exception as e:
            logger.error(f"Prediction failed for {model_type}: {e}")
            raise
    
    def batch_predict(
        self,
        model_type: MLModelType,
        features_batch: List[Dict[str, Any]]
    ) -> List[MLPredictionResult]:
        """
        Batch prediction for multiple samples.
        
        Args:
            model_type: Type of ML model to use
            features_batch: List of feature dictionaries
            
        Returns:
            List of MLPredictionResult objects
        """
        results = []
        for features in features_batch:
            try:
                result = self.predict(model_type, features)
                results.append(result)
            except Exception as e:
                logger.error(f"Batch prediction failed for sample: {e}")
                results.append(MLPredictionResult(
                    model=model_type.value,
                    prediction=None,
                    confidence=0.0,
                    metadata={"error": str(e)}
                ))
        return results
    
    def get_available_models(self) -> List[str]:
        """Get list of available ML models."""
        return [model.value for model in MLModelType]
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all ML models."""
        return {
            "initialized": self._initialized,
            "models_available": len(self._models),
            "models": list(MLModelType.__members__.keys())
        }


# Singleton instance for global use
_ml_service: Optional[MLService] = None


def get_ml_service() -> MLService:
    """Get the singleton ML service instance."""
    global _ml_service
    if _ml_service is None:
        _ml_service = MLService()
    return _ml_service


def predict_fraud(features: Dict[str, Any]) -> MLPredictionResult:
    """Convenience function for fraud detection."""
    return get_ml_service().predict(MLModelType.FRAUD_DETECTION, features)


def predict_credit_score(features: Dict[str, Any]) -> MLPredictionResult:
    """Convenience function for credit scoring."""
    return get_ml_service().predict(MLModelType.CREDIT_SCORING, features)


def analyze_spending(features: Dict[str, Any]) -> MLPredictionResult:
    """Convenience function for spending analysis."""
    return get_ml_service().predict(MLModelType.SPENDING_ANALYSIS, features)


def classify_transaction(features: Dict[str, Any]) -> MLPredictionResult:
    """Convenience function for transaction classification."""
    return get_ml_service().predict(MLModelType.TRANSACTION_CLASSIFICATION, features)


def forecast_savings(features: Dict[str, Any]) -> MLPredictionResult:
    """Convenience function for savings forecast."""
    return get_ml_service().predict(MLModelType.SAVINGS_FORECAST, features)
