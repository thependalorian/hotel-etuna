"""
Spending Analysis Model Training

Location: backend_python/smartpay_ai/training/train_spending_model.py
Purpose: Train spending pattern analysis model (clustering + classification)
Usage: python -m smartpay_ai.training.train_spending_model
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
import joblib

from .data_loader import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_spending_analysis_model(
    db_path: str = ":memory:",
    pg_conn_string: str = None,
    output_dir: str = None,
    test_mode: bool = False,
    n_clusters: int = 5
) -> Dict[str, Any]:
    """
    Train spending pattern analysis model (clustering + prediction)
    
    Args:
        db_path: DuckDB database path
        pg_conn_string: PostgreSQL connection string
        output_dir: Directory to save model and metrics
        test_mode: If True, use synthetic data for testing
        n_clusters: Number of spending clusters to identify
        
    Returns:
        Training metrics and results
    """
    logger.info("=" * 60)
    logger.info("SPENDING ANALYSIS MODEL TRAINING")
    logger.info("=" * 60)

    # Setup output directory
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "models" / "spending_analysis"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Output directory: {output_dir}")

    # Load data
    loader = DataLoader(db_path)

    if test_mode:
        logger.info("TEST MODE: Generating synthetic spending data")
        df = generate_synthetic_spending_data(n_users=300)
    elif pg_conn_string:
        logger.info("Loading transaction data from PostgreSQL")
        df = loader.load_transactions_from_postgres(pg_conn_string, days_back=365)
    else:
        logger.error("Either pg_conn_string or test_mode must be provided")
        return {}

    logger.info(f"Loaded {len(df)} transactions")

    # Feature engineering
    logger.info("Engineering spending analysis features")
    features_df = loader.engineer_spending_features(df)

    logger.info(f"Extracted features for {len(features_df)} user-months")

    # Select feature columns for clustering
    feature_cols = [
        'monthly_spending', 'avg_transaction', 'std_transaction', 'transaction_count'
    ]

    # Aggregate to user level (average across months)
    user_features = features_df.groupby('user_id')[feature_cols].mean().reset_index()

    logger.info(f"Analyzing {len(user_features)} unique users")

    # Prepare features for clustering
    X = user_features[feature_cols].fillna(0)

    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ==================== CLUSTERING ====================
    logger.info(f"\nPerforming KMeans clustering with {n_clusters} clusters")

    # Determine optimal number of clusters using elbow method
    inertias = []
    silhouettes = []
    K_range = range(3, min(8, len(user_features) // 10))

    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        inertias.append(kmeans.inertia_)
        silhouettes.append(silhouette_score(X_scaled, kmeans.labels_))

    logger.info("\nCluster analysis:")
    for k, inertia, silhouette in zip(K_range, inertias, silhouettes):
        logger.info(f"  k={k}: Inertia={inertia:.2f}, Silhouette={silhouette:.4f}")

    # Train final clustering model
    clustering_model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    user_features['spending_cluster'] = clustering_model.fit_predict(X_scaled)

    # Clustering metrics
    silhouette = silhouette_score(X_scaled, user_features['spending_cluster'])
    davies_bouldin = davies_bouldin_score(X_scaled, user_features['spending_cluster'])

    logger.info(f"\nFinal clustering metrics (k={n_clusters}):")
    logger.info(f"  Silhouette Score: {silhouette:.4f}")
    logger.info(f"  Davies-Bouldin Index: {davies_bouldin:.4f}")

    # Analyze cluster characteristics
    logger.info("\nCluster characteristics:")
    cluster_profiles = []

    for cluster_id in range(n_clusters):
        cluster_data = user_features[user_features['spending_cluster'] == cluster_id]
        cluster_size = len(cluster_data)

        profile = {
            'cluster_id': int(cluster_id),
            'size': int(cluster_size),
            'percentage': float(cluster_size / len(user_features) * 100),
            'avg_monthly_spending': float(cluster_data['monthly_spending'].mean()),
            'avg_transaction': float(cluster_data['avg_transaction'].mean()),
            'avg_transaction_count': float(cluster_data['transaction_count'].mean()),
            'spending_volatility': float(cluster_data['std_transaction'].mean())
        }

        cluster_profiles.append(profile)

        # Assign human-readable labels
        if profile['avg_monthly_spending'] < 1000:
            label = "Low Spender"
        elif profile['avg_monthly_spending'] < 3000:
            label = "Moderate Spender"
        elif profile['avg_monthly_spending'] < 6000:
            label = "High Spender"
        else:
            label = "Premium Spender"

        profile['label'] = label

        logger.info(f"\n  Cluster {cluster_id} ({label}):")
        logger.info(f"    Users: {cluster_size} ({profile['percentage']:.1f}%)")
        logger.info(f"    Avg Monthly Spending: N${profile['avg_monthly_spending']:.2f}")
        logger.info(f"    Avg Transaction: N${profile['avg_transaction']:.2f}")
        logger.info(f"    Avg Transaction Count: {profile['avg_transaction_count']:.1f}")

    # ==================== CLASSIFIER ====================
    # Train a classifier to predict spending cluster for new users
    logger.info("\nTraining spending cluster classifier")

    X_train = X_scaled
    y_train = user_features['spending_cluster']

    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )

    classifier.fit(X_train, y_train)

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': classifier.feature_importances_
    }).sort_values('importance', ascending=False)

    logger.info("\nFeature importance for cluster prediction:")
    for idx, row in feature_importance.iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")

    # ==================== SAVE MODELS ====================

    # Save clustering model
    clustering_path = output_dir / "spending_clustering.joblib"
    joblib.dump(clustering_model, clustering_path)
    logger.info(f"\nClustering model saved to: {clustering_path}")

    # Save classifier
    classifier_path = output_dir / "spending_classifier.joblib"
    joblib.dump(classifier, classifier_path)
    logger.info(f"Classifier saved to: {classifier_path}")

    # Save scaler
    scaler_path = output_dir / "spending_scaler.joblib"
    joblib.dump(scaler, scaler_path)
    logger.info(f"Scaler saved to: {scaler_path}")

    # Save feature columns
    features_path = output_dir / "spending_features.json"
    with open(features_path, 'w') as f:
        json.dump(feature_cols, f, indent=2)
    logger.info(f"Feature list saved to: {features_path}")

    # Save cluster profiles
    profiles_path = output_dir / "cluster_profiles.json"
    with open(profiles_path, 'w') as f:
        json.dump(cluster_profiles, f, indent=2)
    logger.info(f"Cluster profiles saved to: {profiles_path}")

    # ==================== SAVE METRICS ====================

    metrics = {
        "model_type": "spending_analysis_clustering",
        "trained_at": datetime.now().isoformat(),
        "n_clusters": n_clusters,
        "n_users": len(user_features),
        "n_transactions": len(df),
        "silhouette_score": float(silhouette),
        "davies_bouldin_index": float(davies_bouldin),
        "cluster_profiles": cluster_profiles,
        "feature_importance": feature_importance.to_dict('records'),
        "feature_columns": feature_cols,
        "elbow_analysis": {
            "k_values": list(K_range),
            "inertias": [float(i) for i in inertias],
            "silhouette_scores": [float(s) for s in silhouettes]
        }
    }

    metrics_path = output_dir / "spending_analysis_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to: {metrics_path}")

    # ==================== PATTERN RECOGNITION ====================
    # Additional analysis: spending patterns over time
    logger.info("\nAnalyzing spending patterns over time")

    monthly_trends = features_df.groupby('month').agg({
        'monthly_spending': 'mean',
        'transaction_count': 'mean'
    }).reset_index()

    # Identify peak spending months
    if len(monthly_trends) > 0:
        peak_month = monthly_trends.loc[monthly_trends['monthly_spending'].idxmax(), 'month']
        logger.info(f"  Peak spending month: {peak_month}")

        # Month-over-month growth
        monthly_trends['mom_growth'] = monthly_trends['monthly_spending'].pct_change()
        avg_growth = monthly_trends['mom_growth'].mean()
        logger.info(f"  Average month-over-month growth: {avg_growth*100:.2f}%")

    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 60)

    loader.close()
    return metrics


def generate_synthetic_spending_data(n_users: int = 300) -> pd.DataFrame:
    """Generate synthetic transaction data for testing"""
    np.random.seed(42)

    transactions = []

    # Define user spending archetypes
    archetypes = {
        'low_spender': {'mean': 3.5, 'sigma': 0.5, 'n_tx': (10, 30)},
        'moderate_spender': {'mean': 4.5, 'sigma': 0.8, 'n_tx': (30, 80)},
        'high_spender': {'mean': 5.5, 'sigma': 1.0, 'n_tx': (80, 150)},
        'premium_spender': {'mean': 6.5, 'sigma': 1.2, 'n_tx': (100, 200)}
    }

    for user_id in range(n_users):
        # Randomly assign archetype
        archetype_name = np.random.choice(list(archetypes.keys()))
        archetype = archetypes[archetype_name]

        # Generate transactions over 12 months
        for month in range(1, 13):
            n_tx = np.random.randint(*archetype['n_tx']) // 12  # Per month

            for _ in range(n_tx):
                transactions.append({
                    'id': f'tx_{len(transactions)}',
                    'user_id': f'user_{user_id}',
                    'amount': np.random.lognormal(mean=archetype['mean'], sigma=archetype['sigma']),
                    'category': np.random.choice(['food', 'transport', 'shopping', 'bills']),
                    'merchant': f'merchant_{np.random.randint(1, 50)}',
                    'timestamp': datetime(2025, month, np.random.randint(1, 28)),
                    'status': 'completed'
                })

    df = pd.DataFrame(transactions)
    logger.info(f"Generated {len(df)} synthetic transactions for {n_users} users")
    return df


if __name__ == "__main__":
    import sys

    # Example usage
    pg_conn = os.getenv("DATABASE_URL")
    n_clusters = int(os.getenv("N_CLUSTERS", "5"))

    if pg_conn:
        logger.info("Using PostgreSQL connection from DATABASE_URL")
        metrics = train_spending_analysis_model(
            pg_conn_string=pg_conn,
            n_clusters=n_clusters
        )
    else:
        logger.info("No DATABASE_URL found, using test mode with synthetic data")
        metrics = train_spending_analysis_model(
            test_mode=True,
            n_clusters=n_clusters
        )

    print("\nTraining completed successfully!")
    print(f"Silhouette Score: {metrics['silhouette_score']:.4f}")
    print(f"Number of clusters: {metrics['n_clusters']}")
    print("\nCluster distribution:")
    for profile in metrics['cluster_profiles']:
        print(f"  {profile['label']}: {profile['size']} users ({profile['percentage']:.1f}%)")
