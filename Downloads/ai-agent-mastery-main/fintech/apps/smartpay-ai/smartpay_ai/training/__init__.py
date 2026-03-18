"""
Smartpay AI Training Module

Location: backend_python/smartpay_ai/training/__init__.py
Purpose: ML model training pipelines for fraud detection, credit scoring, and spending analysis
"""

from .data_loader import DataLoader
from .train_fraud_model import train_fraud_detection_model
from .train_credit_model import train_credit_scoring_model
from .train_spending_model import train_spending_analysis_model

__all__ = [
    "DataLoader",
    "train_fraud_detection_model",
    "train_credit_scoring_model",
    "train_spending_analysis_model",
]
