"""
Savings Goal Forecaster - Smartpay AI Copilot

3-model ensemble for savings goal achievement prediction:
1. Random Forest Regressor (time-to-goal prediction)
2. Gradient Boosting Regressor (high accuracy forecasting)
3. Linear Regression (baseline trend analysis)

Target Performance:
- RMSE: <30 days for time prediction
- R²: >0.85
- Realistic recommendations

Namibian Context:
- NAD goals (typical: 1,000 - 50,000 NAD)
- Monthly contribution patterns
- Local savings behavior
"""

import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path
import joblib
import logging
from datetime import datetime, timedelta

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

logger = logging.getLogger(__name__)


@dataclass
class SavingsFeatures:
    """
    Feature vector for savings forecast (8 features)
    
    Features:
    - Current balance
    - Monthly contribution
    - Goal amount
    - Contribution consistency
    - Months active
    - Income stability
    """
    current_balance: float
    monthly_contribution: float
    goal_amount: float
    contribution_consistency: float
    months_active: int
    income_stability: float
    avg_monthly_income: float
    savings_ratio: float

    def to_array(self) -> np.ndarray:
        """Convert features to numpy array"""
        return np.array([
            self.current_balance,
            self.monthly_contribution,
            self.goal_amount,
            self.contribution_consistency,
            self.months_active,
            self.income_stability,
            self.avg_monthly_income,
            self.savings_ratio
        ])


class SavingsForecastEngine:
    """
    Savings goal achievement forecaster
    
    Predicts:
    - Time to reach goal (days)
    - Probability of achievement
    - Recommended adjustments
    """

    def __init__(self):
        self.rf_model: Optional[RandomForestRegressor] = None
        self.gb_model: Optional[GradientBoostingRegressor] = None
        self.lr_model: Optional[LinearRegression] = None
        self.scaler = StandardScaler()

        # Ensemble weights
        self.ensemble_weights = {
            'random_forest': 0.35,
            'gradient_boosting': 0.45,
            'linear': 0.20
        }

        self.is_trained = False
        self.feature_names = [
            'current_balance', 'monthly_contribution', 'goal_amount',
            'contribution_consistency', 'months_active', 'income_stability',
            'avg_monthly_income', 'savings_ratio'
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
            X_train: Training features (n_samples, 8)
            y_train: Training labels (months_to_goal)
            
        Returns:
            Performance metrics
        """
        logger.info("Training Savings Forecast Engine...")

        X_train_scaled = self.scaler.fit_transform(X_train)
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)

        # 1. Random Forest Regressor
        logger.info("Training Random Forest Regressor...")
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features='sqrt',
            n_jobs=-1,
            random_state=42
        )
        self.rf_model.fit(X_train_scaled, y_train)

        # 2. Gradient Boosting Regressor
        logger.info("Training Gradient Boosting Regressor...")
        self.gb_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=10,
            min_samples_leaf=5,
            subsample=0.8,
            random_state=42
        )
        self.gb_model.fit(X_train_scaled, y_train)

        # 3. Linear Regression
        logger.info("Training Linear Regression...")
        self.lr_model = LinearRegression()
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
        Forecast savings goal achievement
        
        Args:
            features: Feature vector (8,)
            
        Returns:
            {
                'months_to_goal': float,
                'achievable_date': str,
                'probability': float,
                'recommendations': list
            }
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        if features.ndim == 1:
            features = features.reshape(1, -1)

        features_scaled = self.scaler.transform(features)

        # Get predictions from each model
        rf_pred = self.rf_model.predict(features_scaled)[0]
        gb_pred = self.gb_model.predict(features_scaled)[0]
        lr_pred = self.lr_model.predict(features_scaled)[0]

        # Weighted ensemble
        months_to_goal = (
            self.ensemble_weights['random_forest'] * rf_pred +
            self.ensemble_weights['gradient_boosting'] * gb_pred +
            self.ensemble_weights['linear'] * lr_pred
        )

        # Ensure non-negative
        months_to_goal = max(0, months_to_goal)

        # Calculate achievable date
        achievable_date = datetime.now() + timedelta(days=int(months_to_goal * 30))
        achievable_date_str = achievable_date.strftime('%Y-%m-%d')

        # Calculate probability based on factors
        current_balance = features[0, 0]
        monthly_contribution = features[0, 1]
        goal_amount = features[0, 2]
        contribution_consistency = features[0, 3]
        income_stability = features[0, 5]

        # Probability factors
        progress_factor = min(current_balance / goal_amount, 1.0) if goal_amount > 0 else 0
        consistency_factor = contribution_consistency
        stability_factor = income_stability
        contribution_factor = min(monthly_contribution / 1000, 1.0)  # Normalize

        probability = float(
            0.3 * progress_factor +
            0.3 * consistency_factor +
            0.2 * stability_factor +
            0.2 * contribution_factor
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            features[0],
            months_to_goal,
            probability
        )

        return {
            'months_to_goal': float(months_to_goal),
            'achievable_date': achievable_date_str,
            'probability': probability,
            'recommendations': recommendations,
            'model_predictions': {
                'random_forest': float(rf_pred),
                'gradient_boosting': float(gb_pred),
                'linear_regression': float(lr_pred)
            }
        }

    def _generate_recommendations(
        self,
        features: np.ndarray,
        months_to_goal: float,
        probability: float
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        current_balance = features[0]
        monthly_contribution = features[1]
        goal_amount = features[2]
        contribution_consistency = features[3]

        # Time-based recommendations
        if months_to_goal > 24:
            recommendations.append(
                f"Goal is {int(months_to_goal)} months away. Consider increasing monthly contributions."
            )
            increased_contribution = (goal_amount - current_balance) / 18
            recommendations.append(
                f"Increase to NAD {increased_contribution:,.0f}/month to reach goal in 18 months"
            )
        elif months_to_goal > 12:
            recommendations.append(
                f"You're on track to reach your goal in {int(months_to_goal)} months"
            )
        else:
            recommendations.append(
                f"Great progress! Only {int(months_to_goal)} months to go"
            )

        # Consistency recommendations
        if contribution_consistency < 0.6:
            recommendations.append(
                "Set up automatic transfers to improve savings consistency"
            )
            recommendations.append(
                "Consistent contributions increase success rate by 40%"
            )

        # Probability-based recommendations
        if probability < 0.5:
            recommendations.append(
                "Current trajectory has low success probability"
            )
            recommendations.append(
                "Review and reduce discretionary spending"
            )
            recommendations.append(
                "Consider additional income sources"
            )
        elif probability < 0.75:
            recommendations.append(
                "You're doing well, but there's room for improvement"
            )
            recommendations.append(
                "Small increases in contributions have big impact"
            )
        else:
            recommendations.append(
                "Excellent! You're on track to reach your goal"
            )
            recommendations.append(
                "Maintain current savings discipline"
            )

        return recommendations

    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, float]:
        """Evaluate ensemble performance"""
        X_test_scaled = self.scaler.transform(X_test)

        predictions = []
        for i in range(len(X_test)):
            result = self.predict(X_test[i])
            predictions.append(result['months_to_goal'])

        y_pred = np.array(predictions)

        metrics = {
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'mae': mean_absolute_error(y_test, y_pred),
            'r2_score': r2_score(y_test, y_pred)
        }

        # Feature importance from Random Forest
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
        self.is_trained = metadata['is_trained']

        logger.info(f"Models loaded from {directory}")


def generate_training_data(n_samples: int = 5000) -> tuple:
    """
    Generate synthetic training data for savings forecast
    
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    np.random.seed(42)

    X = np.zeros((n_samples, 8))
    
    # Generate features
    X[:, 0] = np.random.uniform(0, 20000, n_samples)  # current_balance
    X[:, 1] = np.random.uniform(200, 3000, n_samples)  # monthly_contribution
    X[:, 2] = np.random.uniform(5000, 50000, n_samples)  # goal_amount
    X[:, 3] = np.random.uniform(0.3, 1.0, n_samples)  # contribution_consistency
    X[:, 4] = np.random.randint(1, 36, n_samples)  # months_active
    X[:, 5] = np.random.uniform(0.5, 1.0, n_samples)  # income_stability
    X[:, 6] = np.random.uniform(3000, 20000, n_samples)  # avg_monthly_income
    X[:, 7] = np.random.uniform(0.1, 0.5, n_samples)  # savings_ratio

    # Calculate target: months to goal
    # Formula: (goal - current) / (monthly_contribution * consistency)
    remaining = X[:, 2] - X[:, 0]  # goal - current
    effective_contribution = X[:, 1] * X[:, 3]  # contribution * consistency
    y = remaining / (effective_contribution + 1)  # Add 1 to avoid division by zero
    
    # Cap at reasonable max (5 years)
    y = np.clip(y, 0, 60)

    # Add some noise
    y += np.random.normal(0, 2, n_samples)
    y = np.maximum(y, 0)

    # Split 80/20
    split = int(0.8 * n_samples)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    return X_train, y_train, X_test, y_test


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)

    # Generate training data
    X_train, y_train, X_test, y_test = generate_training_data(n_samples=5000)

    # Train engine
    engine = SavingsForecastEngine()
    metrics = engine.train(X_train, y_train, X_test, y_test)

    # Evaluate
    test_metrics = engine.evaluate(X_test, y_test)
    print("\nTest Metrics:")
    for metric, value in test_metrics.items():
        if isinstance(value, (int, float)):
            print(f"{metric}: {value:.4f}")

    # Save models
    model_dir = Path(__file__).parent.parent / 'models' / 'savings_forecast'
    engine.save(model_dir)
    print(f"\nModels saved to {model_dir}")

    # Test prediction
    sample = X_test[0]
    result = engine.predict(sample)
    print(f"\nSample Forecast:")
    print(f"Months to Goal: {result['months_to_goal']:.1f}")
    print(f"Achievable Date: {result['achievable_date']}")
    print(f"Probability: {result['probability']:.2%}")
    print(f"Recommendations:")
    for rec in result['recommendations']:
        print(f"  - {rec}")
