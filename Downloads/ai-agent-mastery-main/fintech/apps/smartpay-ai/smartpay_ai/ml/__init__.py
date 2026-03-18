"""
Smartpay ML models - Production-ready machine learning ensembles.

Location: backend_python/smartpay_ai/ml/__init__.py
Purpose: Centralize ML availability flags; graceful import failure (Boy Scout: don't break system).

Available Models:
- FraudDetectionEnsemble: Real-time fraud detection (3-model ensemble)
- CreditScoringEnsemble: Credit risk assessment (3-model ensemble)
- SpendingAnalysisEngine: Spending pattern segmentation (3-model ensemble)
- TransactionClassifier: Auto-categorize transactions (3-model ensemble)
- SavingsForecastEngine: Savings goal achievement prediction (3-model ensemble)
"""

import logging

logger = logging.getLogger(__name__)

# Graceful degradation: ML is optional
ML_AVAILABLE = False
ML_IMPORT_ERROR = None

FraudDetectionEnsemble = None
CreditScoringEnsemble = None
SpendingAnalysisEngine = None
TransactionClassifier = None
SavingsForecastEngine = None

try:
    from .fraud_detection import FraudDetectionEnsemble
    from .credit_scoring import CreditScoringEnsemble
    from .spending_analysis import SpendingAnalysisEngine
    from .transaction_classification import TransactionClassifier
    from .savings_forecast import SavingsForecastEngine
    
    ML_AVAILABLE = True
    logger.info("ML models loaded successfully")
except ImportError as e:
    ML_IMPORT_ERROR = str(e)
    logger.info(f"ML models not available: {e}")
except Exception as e:
    ML_IMPORT_ERROR = str(e)
    logger.warning(f"ML initialization failed: {e}")

__all__ = [
    "ML_AVAILABLE",
    "ML_IMPORT_ERROR",
    "FraudDetectionEnsemble",
    "CreditScoringEnsemble",
    "SpendingAnalysisEngine",
    "TransactionClassifier",
    "SavingsForecastEngine",
]
