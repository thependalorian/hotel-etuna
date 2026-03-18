"""
Spending Analysis Engine - Smartpay AI Copilot

3-model ensemble for spending pattern segmentation:
1. K-Means Clustering (unsupervised segmentation)
2. Random Forest Classifier (supervised classification)
3. Gradient Boosting (pattern recognition)

Target Performance:
- Classification Accuracy: >80%
- Segment consistency
- Actionable recommendations

Namibian Context:
- NAD spending patterns
- Local categories (groceries, transport, utilities)
- Typical monthly budgets

Data Sources:
- Real transaction history from PostgreSQL
- Category spending distributions
- Temporal spending patterns
"""

import os
import asyncio
import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, timedelta
import joblib
import logging
import json

import asyncpg

from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, silhouette_score

logger = logging.getLogger(__name__)


@dataclass
class SpendingFeatures:
    """
    Feature vector for spending analysis (10 features)
    
    Features:
    - Monthly spending total
    - Transaction count
    - Category distribution (diversity)
    - Average transaction size
    - Weekend vs weekday ratio
    """
    monthly_spending: float
    transaction_count: int
    category_diversity: float
    avg_transaction_size: float
    weekend_weekday_ratio: float
    groceries_ratio: float
    transport_ratio: float
    utilities_ratio: float
    entertainment_ratio: float
    savings_rate: float

    def to_array(self) -> np.ndarray:
        """Convert features to numpy array"""
        return np.array([
            self.monthly_spending,
            self.transaction_count,
            self.category_diversity,
            self.avg_transaction_size,
            self.weekend_weekday_ratio,
            self.groceries_ratio,
            self.transport_ratio,
            self.utilities_ratio,
            self.entertainment_ratio,
            self.savings_rate
        ])


class SpendingAnalysisEngine:
    """
    Spending pattern analysis and segmentation
    
    Segments:
    - conservative: Low spending, high savings
    - balanced: Moderate spending, diversified
    - high_spender: High spending, low savings
    """

    def __init__(self):
        self.kmeans: Optional[KMeans] = None
        self.rf_model: Optional[RandomForestClassifier] = None
        self.gb_model: Optional[GradientBoostingClassifier] = None
        self.scaler = StandardScaler()

        # Ensemble weights
        self.ensemble_weights = {
            'kmeans': 0.30,
            'random_forest': 0.35,
            'gradient_boosting': 0.35
        }

        # Segment mapping
        self.segment_labels = {
            0: 'conservative',
            1: 'balanced',
            2: 'high_spender'
        }

        self.is_trained = False
        self.feature_names = [
            'monthly_spending', 'transaction_count', 'category_diversity',
            'avg_transaction_size', 'weekend_weekday_ratio', 'groceries_ratio',
            'transport_ratio', 'utilities_ratio', 'entertainment_ratio', 'savings_rate'
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
            X_train: Training features (n_samples, 10)
            y_train: Training labels (0=conservative, 1=balanced, 2=high_spender)
            
        Returns:
            Performance metrics
        """
        logger.info("Training Spending Analysis Engine...")

        X_train_scaled = self.scaler.fit_transform(X_train)
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)

        # 1. K-Means Clustering
        logger.info("Training K-Means...")
        self.kmeans = KMeans(
            n_clusters=3,
            init='k-means++',
            n_init=10,
            max_iter=300,
            random_state=42
        )
        self.kmeans.fit(X_train_scaled)

        # 2. Random Forest
        logger.info("Training Random Forest...")
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            min_samples_leaf=10,
            max_features='sqrt',
            n_jobs=-1,
            random_state=42
        )
        self.rf_model.fit(X_train_scaled, y_train)

        # 3. Gradient Boosting
        logger.info("Training Gradient Boosting...")
        self.gb_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=4,
            min_samples_split=20,
            min_samples_leaf=10,
            random_state=42
        )
        self.gb_model.fit(X_train_scaled, y_train)

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
        Analyze spending pattern
        
        Args:
            features: Feature vector (10,)
            
        Returns:
            {
                'segment': str,
                'spending_pattern': str,
                'confidence': float,
                'recommendations': list
            }
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        if features.ndim == 1:
            features = features.reshape(1, -1)

        features_scaled = self.scaler.transform(features)

        # Get predictions from each model
        kmeans_pred = self.kmeans.predict(features_scaled)[0]
        rf_pred = self.rf_model.predict(features_scaled)[0]
        rf_proba = self.rf_model.predict_proba(features_scaled)[0]
        gb_pred = self.gb_model.predict(features_scaled)[0]
        gb_proba = self.gb_model.predict_proba(features_scaled)[0]

        # Weighted voting
        vote_weights = np.zeros(3)
        vote_weights[kmeans_pred] += self.ensemble_weights['kmeans']
        vote_weights[rf_pred] += self.ensemble_weights['random_forest']
        vote_weights[gb_pred] += self.ensemble_weights['gradient_boosting']

        final_segment = int(np.argmax(vote_weights))
        segment_label = self.segment_labels[final_segment]

        # Confidence (average probability from RF and GB)
        confidence = float((rf_proba[final_segment] + gb_proba[final_segment]) / 2)

        # Generate recommendations based on segment
        recommendations = self._generate_recommendations(segment_label, features[0])

        return {
            'segment': segment_label,
            'spending_pattern': self._describe_pattern(segment_label),
            'confidence': confidence,
            'recommendations': recommendations,
            'model_predictions': {
                'kmeans': self.segment_labels[kmeans_pred],
                'random_forest': self.segment_labels[rf_pred],
                'gradient_boosting': self.segment_labels[gb_pred]
            }
        }

    def _describe_pattern(self, segment: str) -> str:
        """Describe spending pattern"""
        patterns = {
            'conservative': 'Low spending with high savings focus',
            'balanced': 'Moderate spending across categories',
            'high_spender': 'High spending with lower savings'
        }
        return patterns.get(segment, 'Unknown pattern')

    def _generate_recommendations(self, segment: str, features: np.ndarray) -> List[str]:
        """Generate recommendations based on segment"""
        if segment == 'conservative':
            return [
                'Great job maintaining low spending!',
                'Consider setting up automatic savings',
                'Explore investment opportunities',
                'Your savings rate is healthy'
            ]
        elif segment == 'balanced':
            return [
                'Well-balanced spending across categories',
                'Consider increasing savings by 5-10%',
                'Review entertainment expenses for optimization',
                'Maintain current spending discipline'
            ]
        else:  # high_spender
            return [
                'High spending detected - review budget',
                'Focus on reducing discretionary expenses',
                'Set up savings goals to build emergency fund',
                'Consider the 50/30/20 budgeting rule',
                'Track daily expenses to identify savings opportunities'
            ]

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
            segment = result['segment']
            pred_label = [k for k, v in self.segment_labels.items() if v == segment][0]
            predictions.append(pred_label)

        y_pred = np.array(predictions)

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'silhouette_score': silhouette_score(X_test_scaled, y_pred)
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

        joblib.dump(self.kmeans, directory / 'kmeans.pkl')
        joblib.dump(self.rf_model, directory / 'rf_model.pkl')
        joblib.dump(self.gb_model, directory / 'gb_model.pkl')
        joblib.dump(self.scaler, directory / 'scaler.pkl')

        metadata = {
            'ensemble_weights': self.ensemble_weights,
            'feature_names': self.feature_names,
            'segment_labels': self.segment_labels,
            'is_trained': self.is_trained
        }
        joblib.dump(metadata, directory / 'metadata.pkl')

        logger.info(f"Models saved to {directory}")

    def load(self, directory: Path):
        """Load all models"""
        directory = Path(directory)

        self.kmeans = joblib.load(directory / 'kmeans.pkl')
        self.rf_model = joblib.load(directory / 'rf_model.pkl')
        self.gb_model = joblib.load(directory / 'gb_model.pkl')
        self.scaler = joblib.load(directory / 'scaler.pkl')

        metadata = joblib.load(directory / 'metadata.pkl')
        self.ensemble_weights = metadata['ensemble_weights']
        self.feature_names = metadata['feature_names']
        self.segment_labels = metadata['segment_labels']
        self.is_trained = metadata['is_trained']

        logger.info(f"Models loaded from {directory}")


async def load_spending_training_data_from_postgres(
    database_url: str,
    days_back: int = 90,
    min_samples: int = 300
) -> tuple:
    """
    Load real spending pattern data from PostgreSQL
    
    Args:
        database_url: PostgreSQL connection string
        days_back: Number of days of historical data
        min_samples: Minimum number of samples required
        
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.info(f"Loading spending analysis data from PostgreSQL (last {days_back} days)...")
    
    conn = await asyncpg.connect(database_url)
    try:
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        WITH user_monthly_spending AS (
            SELECT
                t.source_user_id as user_id,
                DATE_TRUNC('month', t.created_at) as month,
                SUM(t.amount) as monthly_spending,
                COUNT(*) as transaction_count,
                AVG(t.amount) as avg_transaction_size,
                COUNT(DISTINCT t.type) as category_diversity_raw,
                
                -- Weekend vs weekday
                COUNT(*) FILTER (WHERE EXTRACT(DOW FROM t.created_at) IN (0, 6)) as weekend_txs,
                COUNT(*) FILTER (WHERE EXTRACT(DOW FROM t.created_at) NOT IN (0, 6)) as weekday_txs,
                
                -- Category breakdowns (use type as proxy for category)
                SUM(CASE WHEN t.type LIKE '%grocery%' OR t.type LIKE '%food%' THEN t.amount ELSE 0 END) as groceries_amount,
                SUM(CASE WHEN t.type LIKE '%transport%' OR t.type LIKE '%fuel%' THEN t.amount ELSE 0 END) as transport_amount,
                SUM(CASE WHEN t.type LIKE '%utility%' OR t.type LIKE '%bill%' THEN t.amount ELSE 0 END) as utilities_amount,
                SUM(CASE WHEN t.type LIKE '%entertainment%' OR t.type LIKE '%movie%' THEN t.amount ELSE 0 END) as entertainment_amount
                
            FROM transactions t
            WHERE t.created_at >= $1
                AND t.amount > 0
                AND t.source_user_id IS NOT NULL
            GROUP BY t.source_user_id, DATE_TRUNC('month', t.created_at)
        ),
        user_wallet_balances AS (
            SELECT
                w.user_id,
                AVG(w.balance) as avg_balance
            FROM wallets w
            GROUP BY w.user_id
        )
        SELECT
            ums.user_id,
            ums.month,
            ums.monthly_spending,
            ums.transaction_count,
            ums.category_diversity_raw,
            ums.avg_transaction_size,
            ums.weekend_txs,
            ums.weekday_txs,
            ums.groceries_amount,
            ums.transport_amount,
            ums.utilities_amount,
            ums.entertainment_amount,
            COALESCE(uwb.avg_balance, 0) as avg_balance
        FROM user_monthly_spending ums
        LEFT JOIN user_wallet_balances uwb ON ums.user_id = uwb.user_id
        WHERE ums.transaction_count >= 5
        ORDER BY ums.user_id, ums.month
        """
        
        rows = await conn.fetch(query, cutoff_date)
        
        if len(rows) < min_samples:
            logger.warning(f"Only {len(rows)} user-months found. Minimum {min_samples} required.")
            logger.warning("Using synthetic data fallback for training.")
            return _generate_synthetic_spending_data(min_samples)
        
        logger.info(f"Loaded {len(rows)} user-months from database")
        
        # Engineer features and assign labels
        X_list = []
        y_list = []
        
        for row in rows:
            features = _engineer_spending_features_from_row(row)
            X_list.append(features)
            
            # Auto-label based on spending patterns
            monthly_spending = row['monthly_spending']
            savings_rate = (row['avg_balance'] - monthly_spending) / (row['avg_balance'] + 1e-6)
            
            if monthly_spending < 5000 and savings_rate > 0.25:
                label = 0  # conservative
            elif monthly_spending < 10000:
                label = 1  # balanced
            else:
                label = 2  # high_spender
            
            y_list.append(label)
        
        X = np.array(X_list)
        y = np.array(y_list)
        
        logger.info(f"Engineered features for {len(X)} user-months")
        logger.info(f"Segment distribution - Conservative: {(y==0).sum()}, Balanced: {(y==1).sum()}, High: {(y==2).sum()}")
        
        # Shuffle
        shuffle_idx = np.random.permutation(len(X))
        X = X[shuffle_idx]
        y = y[shuffle_idx]
        
        # Split 80/20
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
        
        return X_train, y_train, X_test, y_test
        
    finally:
        await conn.close()


def _engineer_spending_features_from_row(row: asyncpg.Record) -> np.ndarray:
    """
    Engineer spending analysis features from user-month row
    
    Returns:
        Feature vector (10,)
    """
    monthly_spending = float(row['monthly_spending'])
    transaction_count = int(row['transaction_count'])
    avg_transaction_size = float(row['avg_transaction_size'])
    
    # Category diversity (0-1 scale)
    category_diversity = min(row['category_diversity_raw'] / 10.0, 1.0)
    
    # Weekend vs weekday ratio
    weekend_txs = row['weekend_txs']
    weekday_txs = row['weekday_txs']
    weekend_weekday_ratio = weekend_txs / (weekday_txs + 1)
    
    # Category ratios (as fraction of total spending)
    total = monthly_spending + 1e-6
    groceries_ratio = row['groceries_amount'] / total
    transport_ratio = row['transport_amount'] / total
    utilities_ratio = row['utilities_amount'] / total
    entertainment_ratio = row['entertainment_amount'] / total
    
    # Savings rate (estimated from balance)
    avg_balance = float(row['avg_balance'])
    savings_rate = max(0, min(1.0, (avg_balance - monthly_spending) / (avg_balance + 1e-6)))
    
    features = np.array([
        monthly_spending,
        transaction_count,
        category_diversity,
        avg_transaction_size,
        weekend_weekday_ratio,
        groceries_ratio,
        transport_ratio,
        utilities_ratio,
        entertainment_ratio,
        savings_rate
    ])
    
    return features


def _generate_synthetic_spending_data(n_samples: int = 3000) -> tuple:
    """
    FALLBACK: Generate synthetic spending analysis training data
    
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.warning("Using synthetic spending data - this should only be used for initial model training")
    
    np.random.seed(42)
    n_per_class = n_samples // 3

    # Conservative spenders
    X_conservative = np.zeros((n_per_class, 10))
    X_conservative[:, 0] = np.random.uniform(2000, 5000, n_per_class)
    X_conservative[:, 1] = np.random.poisson(20, n_per_class)
    X_conservative[:, 2] = np.random.uniform(0.3, 0.6, n_per_class)
    X_conservative[:, 3] = np.random.uniform(50, 200, n_per_class)
    X_conservative[:, 4] = np.random.uniform(0.2, 0.4, n_per_class)
    X_conservative[:, 5] = np.random.uniform(0.4, 0.6, n_per_class)
    X_conservative[:, 6] = np.random.uniform(0.1, 0.2, n_per_class)
    X_conservative[:, 7] = np.random.uniform(0.2, 0.3, n_per_class)
    X_conservative[:, 8] = np.random.uniform(0.05, 0.15, n_per_class)
    X_conservative[:, 9] = np.random.uniform(0.25, 0.45, n_per_class)
    y_conservative = np.zeros(n_per_class, dtype=int)

    # Balanced spenders
    X_balanced = np.zeros((n_per_class, 10))
    X_balanced[:, 0] = np.random.uniform(5000, 10000, n_per_class)
    X_balanced[:, 1] = np.random.poisson(35, n_per_class)
    X_balanced[:, 2] = np.random.uniform(0.6, 0.8, n_per_class)
    X_balanced[:, 3] = np.random.uniform(150, 350, n_per_class)
    X_balanced[:, 4] = np.random.uniform(0.3, 0.5, n_per_class)
    X_balanced[:, 5] = np.random.uniform(0.3, 0.4, n_per_class)
    X_balanced[:, 6] = np.random.uniform(0.15, 0.25, n_per_class)
    X_balanced[:, 7] = np.random.uniform(0.15, 0.25, n_per_class)
    X_balanced[:, 8] = np.random.uniform(0.15, 0.25, n_per_class)
    X_balanced[:, 9] = np.random.uniform(0.15, 0.25, n_per_class)
    y_balanced = np.ones(n_per_class, dtype=int)

    # High spenders
    X_high = np.zeros((n_per_class, 10))
    X_high[:, 0] = np.random.uniform(10000, 20000, n_per_class)
    X_high[:, 1] = np.random.poisson(50, n_per_class)
    X_high[:, 2] = np.random.uniform(0.7, 0.95, n_per_class)
    X_high[:, 3] = np.random.uniform(300, 600, n_per_class)
    X_high[:, 4] = np.random.uniform(0.4, 0.6, n_per_class)
    X_high[:, 5] = np.random.uniform(0.2, 0.3, n_per_class)
    X_high[:, 6] = np.random.uniform(0.15, 0.25, n_per_class)
    X_high[:, 7] = np.random.uniform(0.1, 0.2, n_per_class)
    X_high[:, 8] = np.random.uniform(0.3, 0.5, n_per_class)
    X_high[:, 9] = np.random.uniform(0.0, 0.1, n_per_class)
    y_high = np.full(n_per_class, 2, dtype=int)

    X = np.vstack([X_conservative, X_balanced, X_high])
    y = np.hstack([y_conservative, y_balanced, y_high])

    shuffle_idx = np.random.permutation(n_samples)
    X = X[shuffle_idx]
    y = y[shuffle_idx]

    split = int(0.8 * n_samples)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    return X_train, y_train, X_test, y_test


async def save_spending_prediction_to_db(
    database_url: str,
    user_id: str,
    features: SpendingFeatures,
    prediction: Dict[str, Any],
    analysis_period_start: datetime,
    analysis_period_end: datetime,
    model_version: str = 'v1.0',
    inference_time_ms: int = 0
) -> str:
    """
    Save spending prediction to PostgreSQL database
    
    Args:
        database_url: PostgreSQL connection string
        user_id: User UUID
        features: SpendingFeatures object
        prediction: Prediction result dict
        analysis_period_start: Start date of analysis period
        analysis_period_end: End date of analysis period
        model_version: Model version
        inference_time_ms: Inference time in milliseconds
        
    Returns:
        Prediction ID
    """
    conn = await asyncpg.connect(database_url)
    try:
        # Prepare features as JSONB
        features_dict = {
            name: float(value) 
            for name, value in zip(
                [
                    'monthly_spending', 'transaction_count', 'category_diversity',
                    'avg_transaction_size', 'weekend_weekday_ratio', 'groceries_ratio',
                    'transport_ratio', 'utilities_ratio', 'entertainment_ratio', 'savings_rate'
                ],
                features.to_array()
            )
        }
        
        model_predictions = prediction.get('model_predictions', {})
        
        query = """
        INSERT INTO ml_spending_predictions (
            user_id,
            spending_segment,
            spending_pattern,
            confidence_score,
            model_version,
            kmeans_prediction,
            random_forest_prediction,
            gradient_boosting_prediction,
            analysis_period_start,
            analysis_period_end,
            monthly_spending,
            transaction_count,
            category_diversity,
            avg_transaction_size,
            groceries_ratio,
            transport_ratio,
            utilities_ratio,
            entertainment_ratio,
            savings_rate,
            features_used,
            recommendations,
            inference_time_ms
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING id
        """
        
        prediction_id = await conn.fetchval(
            query,
            user_id,
            prediction['segment'],
            prediction['spending_pattern'],
            prediction['confidence'],
            model_version,
            model_predictions.get('kmeans'),
            model_predictions.get('random_forest'),
            model_predictions.get('gradient_boosting'),
            analysis_period_start.date(),
            analysis_period_end.date(),
            features.monthly_spending,
            features.transaction_count,
            features.category_diversity,
            features.avg_transaction_size,
            features.groceries_ratio,
            features.transport_ratio,
            features.utilities_ratio,
            features.entertainment_ratio,
            features.savings_rate,
            json.dumps(features_dict),
            json.dumps(prediction['recommendations']),
            inference_time_ms
        )
        
        logger.info(f"Saved spending prediction {prediction_id} for user {user_id}")
        return str(prediction_id)
        
    finally:
        await conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        exit(1)
    
    print("=" * 80)
    print("SPENDING ANALYSIS MODEL TRAINING - Using Real PostgreSQL Data")
    print("=" * 80)

    # Load real spending data from PostgreSQL
    print("\n[1/4] Loading spending pattern data from PostgreSQL...")
    X_train, y_train, X_test, y_test = asyncio.run(
        load_spending_training_data_from_postgres(database_url, days_back=90)
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Features: {X_train.shape[1]}")
    print(f"Segments - Conservative: {(y_train==0).sum()}, Balanced: {(y_train==1).sum()}, High: {(y_train==2).sum()}")

    # Train engine
    print("\n[2/4] Training spending analysis engine...")
    engine = SpendingAnalysisEngine()
    metrics = engine.train(X_train, y_train, X_test, y_test)

    # Evaluate
    print("\n[3/4] Evaluating model performance...")
    test_metrics = engine.evaluate(X_test, y_test)
    print("\nTest Metrics:")
    print(f"  Accuracy: {test_metrics.get('accuracy', 0):.4f}")
    print(f"  Silhouette Score: {test_metrics.get('silhouette_score', 0):.4f}")
    
    if 'top_features' in test_metrics:
        print("\nTop 5 Most Important Features:")
        for feat in test_metrics['top_features']:
            print(f"  {feat['feature']}: {feat['importance']:.4f}")

    # Save models
    print("\n[4/4] Saving trained models...")
    model_dir = Path(__file__).parent.parent / 'models' / 'spending_analysis'
    engine.save(model_dir)
    print(f"Models saved to {model_dir}")

    # Test prediction
    print("\n" + "=" * 80)
    print("SAMPLE SPENDING ANALYSIS TEST")
    print("=" * 80)
    sample = X_test[0]
    result = engine.predict(sample)
    print(f"Segment: {result['segment']}")
    print(f"Pattern: {result['spending_pattern']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"\nRecommendations:")
    for rec in result['recommendations']:
        print(f"  - {rec}")
    
    print("\n" + "=" * 80)
    print("Training complete! Model ready for production use with real data.")
    print("=" * 80)
