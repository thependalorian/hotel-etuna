"""
ML service endpoints for Smartpay AI Copilot.

Location: backend_python/smartpay_ai/api/ml_endpoint.py
Purpose: Direct ML prediction, model management, and training endpoints.
         Used for fraud detection, transaction categorization, spend prediction.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from enum import Enum

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/ml", tags=["ml"])
_log = logging.getLogger(__name__)


# ─── Enums ───

class ModelType(str, Enum):
    """Available ML model types."""
    FRAUD_DETECTION = "fraud_detection"
    TRANSACTION_CATEGORIZATION = "transaction_categorization"
    SPEND_PREDICTION = "spend_prediction"
    RISK_ASSESSMENT = "risk_assessment"


class PredictionStatus(str, Enum):
    """Prediction status."""
    SUCCESS = "success"
    ERROR = "error"


# ─── Request/Response Models ───

class PredictionRequest(BaseModel):
    """Request for ML prediction."""
    model_type: ModelType = Field(..., description="Type of model to use")
    features: Dict[str, Any] = Field(..., description="Feature values for prediction")
    user_id: Optional[str] = Field(None, description="User ID for context")


class PredictionResponse(BaseModel):
    """Response from ML prediction."""
    status: PredictionStatus
    model_type: ModelType
    prediction: Any = Field(..., description="Prediction result (varies by model)")
    confidence: Optional[float] = Field(None, description="Prediction confidence (0-1)")
    explanation: Optional[Dict[str, Any]] = Field(None, description="Feature importance/SHAP values")
    error: Optional[str] = Field(None, description="Error message if failed")


class ModelInfo(BaseModel):
    """Information about an ML model."""
    model_type: ModelType
    version: str
    trained_at: Optional[str] = None
    accuracy: Optional[float] = None
    status: str = Field(..., description="ready, training, error")
    feature_count: Optional[int] = None


class ModelsListResponse(BaseModel):
    """List of available ML models."""
    models: List[ModelInfo]
    ml_enabled: bool


class MLHealthResponse(BaseModel):
    """ML service health status."""
    status: str = Field(..., description="ok, degraded, error")
    ml_enabled: bool
    models_loaded: int
    errors: List[str] = Field(default_factory=list)


class TrainingRequest(BaseModel):
    """Request to trigger model training."""
    model_type: ModelType
    training_data_path: Optional[str] = Field(None, description="Path to training data (optional)")
    hyperparameters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TrainingResponse(BaseModel):
    """Response from training trigger."""
    status: str
    message: str
    job_id: Optional[str] = None


# ─── Helper Functions ───

def _check_ml_available():
    """Check if ML service is enabled and available."""
    ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
    
    if not ml_enabled:
        raise HTTPException(
            status_code=503,
            detail="ML service is disabled. Set ML_ENABLED=true in .env"
        )
    
    try:
        from smartpay_ai.ml import ML_AVAILABLE
        if not ML_AVAILABLE:
            raise HTTPException(
                status_code=503,
                detail="ML dependencies not installed"
            )
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="ML module not available"
        )


async def _get_ml_service():
    """Get ML service instance."""
    try:
        from smartpay_ai.ml import get_ml_service
        return get_ml_service()
    except Exception as e:
        _log.error("Failed to get ML service: %s", e)
        raise HTTPException(status_code=500, detail="ML service initialization failed")


# ─── ML Endpoints ───

@router.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest) -> PredictionResponse:
    """
    Direct ML prediction endpoint.
    
    Supports:
    - Fraud detection (transaction risk score)
    - Transaction categorization (groceries, utilities, etc.)
    - Spend prediction (forecasted spending)
    - Risk assessment (loan approval, credit risk)
    
    Example request:
    ```json
    {
        "model_type": "fraud_detection",
        "features": {
            "amount": 5000.0,
            "merchant": "Unknown Store",
            "location": "Windhoek",
            "time_of_day": 22,
            "user_avg_transaction": 500.0
        },
        "user_id": "user-123"
    }
    ```
    """
    _check_ml_available()
    
    try:
        ml_service = await _get_ml_service()
        
        # Route to appropriate model
        if req.model_type == ModelType.FRAUD_DETECTION:
            result = ml_service.predict_fraud(req.features)
        elif req.model_type == ModelType.TRANSACTION_CATEGORIZATION:
            result = ml_service.categorize_transaction(req.features)
        elif req.model_type == ModelType.SPEND_PREDICTION:
            result = ml_service.predict_spending(req.features)
        elif req.model_type == ModelType.RISK_ASSESSMENT:
            result = ml_service.assess_risk(req.features)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {req.model_type}")
        
        return PredictionResponse(
            status=PredictionStatus.SUCCESS,
            model_type=req.model_type,
            prediction=result.get("prediction"),
            confidence=result.get("confidence"),
            explanation=result.get("explanation")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        _log.error("Prediction failed: %s", e, exc_info=True)
        return PredictionResponse(
            status=PredictionStatus.ERROR,
            model_type=req.model_type,
            prediction=None,
            error=str(e)
        )


@router.get("/models", response_model=ModelsListResponse)
async def list_models() -> ModelsListResponse:
    """
    List all available ML models and their status.
    
    Returns model information including version, accuracy, and readiness.
    """
    ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
    
    if not ml_enabled:
        return ModelsListResponse(
            models=[],
            ml_enabled=False
        )
    
    try:
        ml_service = await _get_ml_service()
        models_info = ml_service.list_models()
        
        models = [
            ModelInfo(
                model_type=ModelType(info["model_type"]),
                version=info.get("version", "unknown"),
                trained_at=info.get("trained_at"),
                accuracy=info.get("accuracy"),
                status=info.get("status", "unknown"),
                feature_count=info.get("feature_count")
            )
            for info in models_info
        ]
        
        return ModelsListResponse(
            models=models,
            ml_enabled=True
        )
    
    except ImportError:
        return ModelsListResponse(
            models=[],
            ml_enabled=False
        )
    except Exception as e:
        _log.error("Failed to list models: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=MLHealthResponse)
async def ml_health() -> MLHealthResponse:
    """
    ML service health check.
    
    Returns status of ML service and loaded models.
    """
    ml_enabled = os.getenv("ML_ENABLED", "false").lower() == "true"
    
    if not ml_enabled:
        return MLHealthResponse(
            status="disabled",
            ml_enabled=False,
            models_loaded=0
        )
    
    try:
        from smartpay_ai.ml import ML_AVAILABLE
        
        if not ML_AVAILABLE:
            return MLHealthResponse(
                status="unavailable",
                ml_enabled=True,
                models_loaded=0,
                errors=["ML dependencies not installed"]
            )
        
        ml_service = await _get_ml_service()
        models_info = ml_service.list_models()
        models_loaded = len([m for m in models_info if m.get("status") == "ready"])
        
        errors = [
            f"{m['model_type']}: {m.get('error', 'unknown error')}"
            for m in models_info
            if m.get("status") == "error"
        ]
        
        status = "ok" if models_loaded > 0 and not errors else "degraded" if models_loaded > 0 else "error"
        
        return MLHealthResponse(
            status=status,
            ml_enabled=True,
            models_loaded=models_loaded,
            errors=errors
        )
    
    except ImportError:
        return MLHealthResponse(
            status="unavailable",
            ml_enabled=False,
            models_loaded=0,
            errors=["ML module not found"]
        )
    except Exception as e:
        _log.error("ML health check failed: %s", e, exc_info=True)
        return MLHealthResponse(
            status="error",
            ml_enabled=True,
            models_loaded=0,
            errors=[str(e)]
        )


@router.post("/train", response_model=TrainingResponse)
async def train_model(
    req: TrainingRequest,
    background_tasks: BackgroundTasks
) -> TrainingResponse:
    """
    Trigger model training (async).
    
    Starts a background job to train or retrain a model.
    Returns immediately with a job ID to check status later.
    
    Note: This is a simplified version. In production, use Celery/RQ for proper job queue.
    """
    _check_ml_available()
    
    try:
        ml_service = await _get_ml_service()
        
        # Generate job ID
        import uuid
        job_id = str(uuid.uuid4())
        
        # Add training task to background
        async def train_task():
            try:
                _log.info("Starting training job %s for model %s", job_id, req.model_type)
                result = ml_service.train_model(
                    model_type=req.model_type.value,
                    data_path=req.training_data_path,
                    hyperparameters=req.hyperparameters
                )
                _log.info("Training job %s completed: %s", job_id, result)
            except Exception as e:
                _log.error("Training job %s failed: %s", job_id, e, exc_info=True)
        
        background_tasks.add_task(train_task)
        
        return TrainingResponse(
            status="started",
            message=f"Training job started for {req.model_type.value}",
            job_id=job_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        _log.error("Failed to start training: %s", e, exc_info=True)
        return TrainingResponse(
            status="error",
            message=f"Failed to start training: {str(e)}",
            job_id=None
        )
