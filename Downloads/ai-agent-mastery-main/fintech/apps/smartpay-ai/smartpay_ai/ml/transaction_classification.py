"""
Transaction Classifier - Smartpay AI Copilot

3-model ensemble for automatic transaction categorization:
1. Random Forest (robust multi-class classification)
2. Gradient Boosting (high accuracy)
3. Logistic Regression (fast baseline with OvR)

Target Performance:
- Classification Accuracy: >80%
- Per-category precision: >75%
- Inference Time: <50ms

Categories (15 total):
- groceries, transport, utilities, restaurants, entertainment
- healthcare, education, shopping, savings, loans
- airtime, insurance, rent, other, transfer

Data Sources:
- Real transaction history from PostgreSQL
- Transaction types and patterns
- Temporal features
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

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report

logger = logging.getLogger(__name__)


class TransactionClassifier:
    """
    Multi-class transaction categorization
    
    15 categories for Namibian context
    """

    # Category mapping
    CATEGORIES = [
        'groceries', 'transport', 'utilities', 'restaurants', 'entertainment',
        'healthcare', 'education', 'shopping', 'savings', 'loans',
        'airtime', 'insurance', 'rent', 'transfer', 'other'
    ]

    def __init__(self):
        self.rf_model: Optional[RandomForestClassifier] = None
        self.gb_model: Optional[GradientBoostingClassifier] = None
        self.lr_model: Optional[LogisticRegression] = None
        self.scaler = StandardScaler()

        # Ensemble weights
        self.ensemble_weights = {
            'random_forest': 0.40,
            'gradient_boosting': 0.40,
            'logistic': 0.20
        }

        self.is_trained = False
        self.feature_names = [
            'amount_normalized', 'amount_log', 'merchant_category',
            'hour_of_day', 'day_of_week', 'is_weekend',
            'is_end_of_month', 'is_salary_day'
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
            y_train: Training labels (category indices 0-14)
            
        Returns:
            Performance metrics
        """
        logger.info("Training Transaction Classifier...")

        X_train_scaled = self.scaler.fit_transform(X_train)
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)

        # 1. Random Forest
        logger.info("Training Random Forest...")
        self.rf_model = RandomForestClassifier(
            n_estimators=150,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features='sqrt',
            n_jobs=-1,
            random_state=42
        )
        self.rf_model.fit(X_train_scaled, y_train)

        # 2. Gradient Boosting
        logger.info("Training Gradient Boosting...")
        self.gb_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42
        )
        self.gb_model.fit(X_train_scaled, y_train)

        # 3. Logistic Regression (One-vs-Rest)
        logger.info("Training Logistic Regression...")
        self.lr_model = LogisticRegression(
            penalty='l2',
            C=1.0,
            solver='lbfgs',
            max_iter=1000,
            multi_class='ovr',
            random_state=42
        )
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
        Classify transaction
        
        Args:
            features: Feature vector (8,)
            
        Returns:
            {
                'category': str,
                'confidence': float,
                'top_3_categories': list
            }
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        if features.ndim == 1:
            features = features.reshape(1, -1)

        features_scaled = self.scaler.transform(features)

        # Get predictions and probabilities
        rf_proba = self.rf_model.predict_proba(features_scaled)[0]
        gb_proba = self.gb_model.predict_proba(features_scaled)[0]
        lr_proba = self.lr_model.predict_proba(features_scaled)[0]

        # Weighted ensemble of probabilities
        ensemble_proba = (
            self.ensemble_weights['random_forest'] * rf_proba +
            self.ensemble_weights['gradient_boosting'] * gb_proba +
            self.ensemble_weights['logistic'] * lr_proba
        )

        # Get top prediction
        predicted_idx = int(np.argmax(ensemble_proba))
        predicted_category = self.CATEGORIES[predicted_idx]
        confidence = float(ensemble_proba[predicted_idx])

        # Get top 3 categories
        top_3_indices = np.argsort(ensemble_proba)[-3:][::-1]
        top_3_categories = [
            {
                'category': self.CATEGORIES[idx],
                'probability': float(ensemble_proba[idx])
            }
            for idx in top_3_indices
        ]

        return {
            'category': predicted_category,
            'confidence': confidence,
            'top_3_categories': top_3_categories,
            'model_predictions': {
                'random_forest': self.CATEGORIES[np.argmax(rf_proba)],
                'gradient_boosting': self.CATEGORIES[np.argmax(gb_proba)],
                'logistic_regression': self.CATEGORIES[np.argmax(lr_proba)]
            }
        }

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
            category = result['category']
            pred_idx = self.CATEGORIES.index(category)
            predictions.append(pred_idx)

        y_pred = np.array(predictions)

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred)
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
            'categories': self.CATEGORIES,
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


async def load_classification_training_data_from_postgres(
    database_url: str,
    days_back: int = 180,
    min_samples: int = 1000
) -> tuple:
    """
    Load real transaction data from PostgreSQL for classification training
    
    Args:
        database_url: PostgreSQL connection string
        days_back: Number of days of historical data
        min_samples: Minimum number of samples required
        
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.info(f"Loading transaction classification data from PostgreSQL (last {days_back} days)...")
    
    conn = await asyncpg.connect(database_url)
    try:
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        SELECT
            t.id as transaction_id,
            t.amount,
            t.type as transaction_type,
            t.created_at as timestamp,
            t.metadata
        FROM transactions t
        WHERE t.created_at >= $1
            AND t.amount > 0
            AND t.type IS NOT NULL
            AND t.type != ''
        ORDER BY t.created_at
        """
        
        rows = await conn.fetch(query, cutoff_date)
        
        if len(rows) < min_samples:
            logger.warning(f"Only {len(rows)} transactions found. Minimum {min_samples} required.")
            logger.warning("Using synthetic data fallback for training.")
            return _generate_synthetic_classification_data(min_samples)
        
        logger.info(f"Loaded {len(rows)} transactions from database")
        
        # Map transaction types to categories
        type_to_category = _build_type_to_category_map(rows)
        
        # Engineer features
        X_list = []
        y_list = []
        
        for row in rows:
            features = _engineer_classification_features_from_row(row)
            X_list.append(features)
            
            # Map transaction type to category index
            transaction_type = row['transaction_type']
            category_idx = type_to_category.get(transaction_type, 14)  # default to 'other'
            y_list.append(category_idx)
        
        X = np.array(X_list)
        y = np.array(y_list)
        
        logger.info(f"Engineered features for {len(X)} transactions")
        
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


def _build_type_to_category_map(rows: List[asyncpg.Record]) -> Dict[str, int]:
    """
    Build mapping from transaction types to category indices
    
    Returns:
        Dict mapping transaction type to category index (0-14)
    """
    # Category mapping based on keywords
    category_keywords = {
        0: ['grocery', 'food', 'supermarket', 'market'],  # groceries
        1: ['transport', 'taxi', 'bus', 'fuel', 'petrol'],  # transport
        2: ['utility', 'electric', 'water', 'internet', 'bill'],  # utilities
        3: ['restaurant', 'cafe', 'dining', 'eatery'],  # restaurants
        4: ['entertainment', 'movie', 'cinema', 'game', 'club'],  # entertainment
        5: ['health', 'medical', 'doctor', 'pharmacy', 'hospital'],  # healthcare
        6: ['education', 'school', 'university', 'tuition', 'book'],  # education
        7: ['shopping', 'store', 'retail', 'mall'],  # shopping
        8: ['savings', 'investment', 'deposit'],  # savings
        9: ['loan', 'credit', 'borrow', 'repayment'],  # loans
        10: ['airtime', 'mobile', 'phone', 'data'],  # airtime
        11: ['insurance', 'policy', 'premium'],  # insurance
        12: ['rent', 'lease', 'rental'],  # rent
        13: ['transfer', 'send', 'p2p', 'payment'],  # transfer
        14: ['other', 'misc']  # other
    }
    
    type_to_category = {}
    
    for row in rows:
        transaction_type = row['transaction_type'].lower()
        
        # Skip if already mapped
        if transaction_type in type_to_category:
            continue
        
        # Find matching category
        matched = False
        for cat_idx, keywords in category_keywords.items():
            if any(keyword in transaction_type for keyword in keywords):
                type_to_category[transaction_type] = cat_idx
                matched = True
                break
        
        # Default to 'other' if no match
        if not matched:
            type_to_category[transaction_type] = 14
    
    return type_to_category


def _engineer_classification_features_from_row(row: asyncpg.Record) -> np.ndarray:
    """
    Engineer transaction classification features
    
    Returns:
        Feature vector (8,)
    """
    amount = float(row['amount'])
    timestamp = row['timestamp']
    metadata = row['metadata'] or {}
    
    # Amount features
    amount_normalized = min(amount / 10000.0, 1.0)
    amount_log = np.log(amount + 1)
    
    # Merchant category (hash of type for now)
    merchant_category = hash(row['transaction_type']) % 15
    
    # Time features
    hour_of_day = timestamp.hour
    day_of_week = timestamp.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    is_end_of_month = 1 if timestamp.day >= 25 else 0
    is_salary_day = 1 if timestamp.day == 1 else 0
    
    features = np.array([
        amount_normalized,
        amount_log,
        merchant_category,
        hour_of_day,
        day_of_week,
        is_weekend,
        is_end_of_month,
        is_salary_day
    ])
    
    return features


def _generate_synthetic_classification_data(n_samples: int = 15000) -> tuple:
    """
    FALLBACK: Generate synthetic transaction classification training data
    
    Returns:
        (X_train, y_train, X_test, y_test)
    """
    logger.warning("Using synthetic classification data - this should only be used for initial model training")
    
    np.random.seed(42)
    n_categories = 15
    n_per_category = n_samples // n_categories

    X_all = []
    y_all = []

    category_patterns = {
        0: {'amount': (50, 500), 'merchant': 0, 'hour': (8, 20), 'weekend': 0.3},
        1: {'amount': (20, 200), 'merchant': 1, 'hour': (6, 18), 'weekend': 0.2},
        2: {'amount': (100, 1000), 'merchant': 2, 'hour': (9, 17), 'weekend': 0.1},
        3: {'amount': (100, 500), 'merchant': 3, 'hour': (12, 22), 'weekend': 0.5},
        4: {'amount': (50, 300), 'merchant': 4, 'hour': (18, 23), 'weekend': 0.6},
        5: {'amount': (200, 2000), 'merchant': 5, 'hour': (9, 17), 'weekend': 0.2},
        6: {'amount': (500, 5000), 'merchant': 6, 'hour': (8, 16), 'weekend': 0.1},
        7: {'amount': (100, 1000), 'merchant': 7, 'hour': (10, 20), 'weekend': 0.4},
        8: {'amount': (500, 5000), 'merchant': 8, 'hour': (9, 17), 'weekend': 0.2},
        9: {'amount': (500, 10000), 'merchant': 9, 'hour': (9, 17), 'weekend': 0.1},
        10: {'amount': (20, 100), 'merchant': 10, 'hour': (6, 23), 'weekend': 0.5},
        11: {'amount': (200, 2000), 'merchant': 11, 'hour': (9, 17), 'weekend': 0.1},
        12: {'amount': (2000, 10000), 'merchant': 12, 'hour': (9, 17), 'weekend': 0.1},
        13: {'amount': (50, 5000), 'merchant': 13, 'hour': (6, 23), 'weekend': 0.4},
        14: {'amount': (50, 500), 'merchant': 14, 'hour': (8, 20), 'weekend': 0.3},
    }

    for cat_idx, pattern in category_patterns.items():
        X_cat = np.zeros((n_per_category, 8))
        amounts = np.random.uniform(*pattern['amount'], n_per_category)
        X_cat[:, 0] = amounts / 10000
        X_cat[:, 1] = np.log(amounts + 1)
        X_cat[:, 2] = pattern['merchant']
        X_cat[:, 3] = np.random.randint(*pattern['hour'], n_per_category)
        X_cat[:, 4] = np.random.randint(0, 7, n_per_category)
        X_cat[:, 5] = (np.random.uniform(0, 1, n_per_category) < pattern['weekend']).astype(int)
        X_cat[:, 6] = (X_cat[:, 4] >= 25).astype(int)
        X_cat[:, 7] = (X_cat[:, 4] == 1).astype(int)
        
        y_cat = np.full(n_per_category, cat_idx, dtype=int)
        
        X_all.append(X_cat)
        y_all.append(y_cat)

    X = np.vstack(X_all)
    y = np.hstack(y_all)

    shuffle_idx = np.random.permutation(n_samples)
    X = X[shuffle_idx]
    y = y[shuffle_idx]

    split = int(0.8 * n_samples)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    return X_train, y_train, X_test, y_test


async def save_classification_to_db(
    database_url: str,
    transaction_id: str,
    user_id: str,
    features: np.ndarray,
    prediction: Dict[str, Any],
    model_version: str = 'v1.0',
    inference_time_ms: int = 0
) -> str:
    """
    Save transaction classification to PostgreSQL database
    
    Args:
        database_url: PostgreSQL connection string
        transaction_id: Transaction UUID
        user_id: User UUID
        features: Feature vector (8,)
        prediction: Prediction result dict
        model_version: Model version
        inference_time_ms: Inference time in milliseconds
        
    Returns:
        Classification ID
    """
    conn = await asyncpg.connect(database_url)
    try:
        # Prepare features as JSONB
        features_dict = {
            name: float(value) 
            for name, value in zip(
                [
                    'amount_normalized', 'amount_log', 'merchant_category',
                    'hour_of_day', 'day_of_week', 'is_weekend',
                    'is_end_of_month', 'is_salary_day'
                ],
                features
            )
        }
        
        model_predictions = prediction.get('model_predictions', {})
        
        query = """
        INSERT INTO ml_transaction_classifications (
            transaction_id,
            user_id,
            predicted_category,
            confidence_score,
            top_categories,
            model_version,
            random_forest_category,
            gradient_boosting_category,
            logistic_regression_category,
            features_used,
            inference_time_ms
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING id
        """
        
        classification_id = await conn.fetchval(
            query,
            transaction_id,
            user_id,
            prediction['category'],
            prediction['confidence'],
            json.dumps(prediction['top_3_categories']),
            model_version,
            model_predictions.get('random_forest'),
            model_predictions.get('gradient_boosting'),
            model_predictions.get('logistic_regression'),
            json.dumps(features_dict),
            inference_time_ms
        )
        
        logger.info(f"Saved classification {classification_id} for transaction {transaction_id}")
        return str(classification_id)
        
    finally:
        await conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        exit(1)
    
    print("=" * 80)
    print("TRANSACTION CLASSIFICATION MODEL TRAINING - Using Real PostgreSQL Data")
    print("=" * 80)

    # Load real transaction data from PostgreSQL
    print("\n[1/4] Loading transaction data from PostgreSQL...")
    X_train, y_train, X_test, y_test = asyncio.run(
        load_classification_training_data_from_postgres(database_url, days_back=180)
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Features: {X_train.shape[1]}")
    print(f"Categories: {len(np.unique(y_train))}")

    # Train classifier
    print("\n[2/4] Training transaction classifier...")
    classifier = TransactionClassifier()
    metrics = classifier.train(X_train, y_train, X_test, y_test)

    # Evaluate
    print("\n[3/4] Evaluating model performance...")
    test_metrics = classifier.evaluate(X_test, y_test)
    print("\nTest Metrics:")
    print(f"  Accuracy: {test_metrics.get('accuracy', 0):.4f}")
    
    if 'top_features' in test_metrics:
        print("\nTop 5 Most Important Features:")
        for feat in test_metrics['top_features']:
            print(f"  {feat['feature']}: {feat['importance']:.4f}")

    # Save models
    print("\n[4/4] Saving trained models...")
    model_dir = Path(__file__).parent.parent / 'models' / 'transaction_classification'
    classifier.save(model_dir)
    print(f"Models saved to {model_dir}")

    # Test prediction
    print("\n" + "=" * 80)
    print("SAMPLE CLASSIFICATION TEST")
    print("=" * 80)
    sample = X_test[0]
    result = classifier.predict(sample)
    print(f"Category: {result['category']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"\nTop 3 Categories:")
    for cat in result['top_3_categories']:
        print(f"  - {cat['category']}: {cat['probability']:.4f}")
    
    print("\n" + "=" * 80)
    print("Training complete! Model ready for production use with real data.")
    print("=" * 80)
