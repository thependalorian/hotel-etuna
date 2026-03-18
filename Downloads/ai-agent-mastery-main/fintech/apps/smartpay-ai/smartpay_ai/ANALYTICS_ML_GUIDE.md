# Smartpay AI Analytics & ML Training Pipelines

**Location:** `backend_python/smartpay_ai/`

**Purpose:** Real-time analytics and ML model training for fraud detection, credit scoring, and spending analysis using DuckDB for fast OLAP queries.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Analytics Modules](#analytics-modules)
4. [ML Training Pipelines](#ml-training-pipelines)
5. [DuckDB Schema](#duckdb-schema)
6. [Usage Examples](#usage-examples)
7. [Integration with Agents](#integration-with-agents)
8. [Production Deployment](#production-deployment)

---

## Overview

Smartpay AI uses **DuckDB** for high-performance analytics and **scikit-learn + XGBoost** for machine learning. The system provides:

- **Real-time analytics** for user spending, group activity, and fraud detection
- **ML model training** pipelines for fraud detection, credit scoring, and spending segmentation
- **Agent integration** to power AI-driven financial insights
- **Namibian context** with KYC tier limits, typical spending patterns (N$50-N$500/day)

**Key Technologies:**
- **DuckDB**: OLAP analytics (100x faster than traditional databases for aggregations)
- **LanceDB**: Vector database with bge-m3 embeddings for semantic search
- **scikit-learn**: Random Forest, Logistic Regression, clustering
- **XGBoost**: Gradient boosting for ensemble models
- **pandas/numpy**: Data manipulation and feature engineering
- **bge-m3**: Multilingual embeddings (1024-dimensional, via Ollama)

---

## Architecture

```
smartpay_ai/
├── analytics/                     # Real-time analytics engines
│   ├── spending_analytics.py      # User spending patterns
│   ├── group_analytics.py         # Group activity metrics
│   └── fraud_analytics.py         # Fraud detection rules
│
├── training/                      # ML model training
│   ├── data_loader.py             # Feature engineering pipeline
│   ├── train_fraud_model.py       # Fraud detection ensemble
│   ├── train_credit_model.py      # Credit scoring ensemble
│   └── train_spending_model.py    # Spending clustering
│
└── models/                        # Trained models (saved here)
    ├── fraud_detection/
    │   ├── fraud_detection_ensemble.joblib
    │   ├── fraud_detection_scaler.joblib
    │   ├── fraud_detection_features.json
    │   └── fraud_detection_metrics.json
    │
    ├── credit_scoring/
    │   ├── credit_scoring_ensemble.joblib
    │   └── credit_scoring_metrics.json
    │
    └── spending_analysis/
        ├── spending_clustering.joblib
        ├── spending_classifier.joblib
        └── cluster_profiles.json
```

---

## Analytics Modules

### 1. Spending Analytics (`spending_analytics.py`)

**Purpose:** Fast aggregations on user spending patterns for Transaction Analyst agent.

**Key Features:**
- Category-wise spending breakdown
- Time-series spending trends (daily/weekly/monthly)
- Budget variance analysis
- Materialized views for common queries

**Example Usage:**
```python
from smartpay_ai.analytics import SpendingAnalytics

# Initialize with DuckDB
analytics = SpendingAnalytics(db_path="analytics.duckdb")

# Load data from PostgreSQL
analytics.load_transactions_from_postgres(
    pg_conn_string=DATABASE_URL,
    days_back=90
)

# Get user spending insights
insights = analytics.export_insights_for_agent(user_id="user_123")
print(insights)
# {
#   "overall_metrics": {
#     "total_spending": 12500.00,
#     "avg_transaction": 125.50,
#     "transaction_count": 99,
#     ...
#   },
#   "category_breakdown": [...],
#   "time_series": [...],
#   "budget_variance": [...]
# }

# Materialize patterns for fast queries
analytics.materialize_spending_patterns()

analytics.close()
```

**Key Methods:**
- `aggregate_user_spending(user_id, days)` - Overall spending metrics
- `category_spending_breakdown(user_id, days)` - Category analysis
- `time_series_spending(user_id, days, interval)` - Trends
- `budget_variance_analysis(user_id)` - Budget vs actual
- `export_insights_for_agent(user_id)` - Complete analysis for agents

---

### 2. Group Analytics (`group_analytics.py`)

**Purpose:** Analyze group activity, split bills, and member contributions for Group Manager agent.

**Key Features:**
- Group activity metrics (transaction volume, member count)
- Member contribution analysis
- Split bill patterns and settlement rates
- Group health scores

**Example Usage:**
```python
from smartpay_ai.analytics import GroupAnalytics

analytics = GroupAnalytics(db_path="analytics.duckdb")
analytics.load_groups_from_postgres(DATABASE_URL)

# Get group health score
health = analytics.group_health_score(group_id="group_456")
print(health)
# {
#   "health_score": 85.5,
#   "health_grade": "A",
#   "factors": {
#     "activity_score": 38.0,
#     "engagement_score": 27.5,
#     "settlement_score": 20.0
#   }
# }

# Export for agent
insights = analytics.export_insights_for_agent(group_id="group_456")
```

**Key Methods:**
- `group_activity_metrics(group_id, days)` - Activity stats
- `member_contribution_analysis(group_id, days)` - Individual contributions
- `split_bill_patterns(group_id)` - Bill splitting behavior
- `group_health_score(group_id)` - Health assessment (0-100)

---

### 3. Fraud Analytics (`fraud_analytics.py`)

**Purpose:** Real-time fraud detection analytics for Security Guardian agent.

**Key Features:**
- Transaction velocity tracking (1h, 24h windows)
- Rule-based anomaly detection
- Risk pattern identification
- KYC tier limit enforcement

**Example Usage:**
```python
from smartpay_ai.analytics import FraudAnalytics

analytics = FraudAnalytics(db_path="analytics.duckdb")
analytics.load_transactions_from_postgres(DATABASE_URL, days_back=30)

# Check transaction velocity
velocity = analytics.transaction_velocity_tracking(user_id="user_123", window_hours=1)
print(velocity)
# {
#   "transaction_count": 8,
#   "total_amount": 1500.00,
#   "risk_score": 30.0,
#   "risk_factors": ["High velocity: 8 transactions in 1h"]
# }

# Analyze specific transaction
anomalies = analytics.anomaly_detection_rules(transaction_id="tx_789")
print(anomalies)
# {
#   "risk_score": 65.0,
#   "risk_level": "high",
#   "anomalies_detected": 3,
#   "anomalies": [...]
# }

# Get risk patterns
risk = analytics.risk_pattern_identification(user_id="user_123", days=30)
```

**Fraud Detection Rules:**
1. **Velocity (1h)**: >10 transactions → High risk
2. **Velocity (24h)**: >50 transactions → Medium risk
3. **Large transaction**: >5x user average → High risk
4. **Unusual time**: 23:00-05:00 → Low risk
5. **New merchant + high amount**: >N$500 → Medium risk
6. **KYC tier limits**: 
   - Tier 1: N$500 per transaction
   - Tier 2: N$2,000 per transaction
   - Tier 3: N$10,000 per transaction

---

## ML Training Pipelines

### Prerequisites

Install dependencies:
```bash
cd backend_python
pip install -r requirements.txt
```

Required packages:
- `duckdb==1.1.3`
- `scikit-learn==1.5.2`
- `xgboost==2.1.2`
- `pandas==2.2.3`
- `numpy==2.1.3`

---

### 1. Fraud Detection Model Training

**File:** `training/train_fraud_model.py`

**Model:** Ensemble (Random Forest + XGBoost + Logistic Regression)

**Features:**
- Amount-based: `amount`, `amount_log`, `amount_deviation`
- Velocity: `tx_count_1h`, `tx_count_24h`, `amount_sum_1h`, `amount_sum_24h`
- Temporal: `hour`, `day_of_week`, `is_weekend`, `is_night`
- User history: `user_avg_amount`, `user_std_amount`, `user_tx_count`
- Merchant: `merchant_frequency`, `category_encoded`

**Training:**
```bash
# With PostgreSQL data
export DATABASE_URL="postgresql://user:pass@host:port/db"
python -m smartpay_ai.training.train_fraud_model

# Test mode (synthetic data)
python -m smartpay_ai.training.train_fraud_model
```

**Output:**
- `models/fraud_detection/fraud_detection_ensemble.joblib` - Trained model
- `models/fraud_detection/fraud_detection_scaler.joblib` - Feature scaler
- `models/fraud_detection/fraud_detection_features.json` - Feature list
- `models/fraud_detection/fraud_detection_metrics.json` - Performance metrics

**Expected Performance:**
- ROC-AUC: >0.85
- PR-AUC: >0.70
- 5-fold CV: ~0.83 ± 0.03

---

### 2. Credit Scoring Model Training

**File:** `training/train_credit_model.py`

**Model:** Ensemble (Random Forest + Gradient Boosting + Logistic Regression + XGBoost)

**Features:**
- Transaction behavior: `total_spending`, `avg_transaction`, `transaction_count`
- Account history: `account_age_days`, `transactions_per_day`
- Diversity: `category_diversity`, `merchant_diversity`
- Loan history: `loan_count`, `loans_repaid`, `loans_defaulted`, `repayment_rate`
- Regularity: `payment_regularity` (coefficient of variation)

**Training:**
```bash
export DATABASE_URL="postgresql://user:pass@host:port/db"
python -m smartpay_ai.training.train_credit_model

# Test mode
python -m smartpay_ai.training.train_credit_model
```

**Credit Scoring Logic:**
- **Good credit (1)**: `repayment_rate >= 0.8` AND `loans_defaulted == 0`
- **Bad credit (0)**: `repayment_rate < 0.5` OR `loans_defaulted > 0`

**Expected Performance:**
- ROC-AUC: >0.80
- PR-AUC: >0.75

---

### 3. Spending Analysis Model Training

**File:** `training/train_spending_model.py`

**Model:** KMeans Clustering + Random Forest Classifier

**Features:**
- `monthly_spending` - Total monthly expenditure
- `avg_transaction` - Average transaction size
- `std_transaction` - Spending volatility
- `transaction_count` - Transaction frequency

**Training:**
```bash
export DATABASE_URL="postgresql://user:pass@host:port/db"
export N_CLUSTERS=5  # Optional: default is 5
python -m smartpay_ai.training.train_spending_model
```

**Output:**
- `models/spending_analysis/spending_clustering.joblib` - KMeans model
- `models/spending_analysis/spending_classifier.joblib` - Classifier
- `models/spending_analysis/cluster_profiles.json` - Cluster descriptions

**Spending Clusters:**
1. **Low Spender**: <N$1,000/month
2. **Moderate Spender**: N$1,000-N$3,000/month
3. **High Spender**: N$3,000-N$6,000/month
4. **Premium Spender**: >N$6,000/month

**Expected Performance:**
- Silhouette Score: >0.50
- Davies-Bouldin Index: <1.5

---

## DuckDB Schema

### Transactions Table
```sql
CREATE TABLE transactions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR,
    merchant VARCHAR,
    timestamp TIMESTAMP NOT NULL,
    wallet_id VARCHAR,
    status VARCHAR DEFAULT 'completed',
    currency VARCHAR DEFAULT 'NAD'
);
```

### User Spending Patterns (Materialized)
```sql
CREATE TABLE user_spending_patterns (
    user_id VARCHAR,
    month DATE,
    total_spending DECIMAL(10,2),
    transaction_count INTEGER,
    top_category VARCHAR,
    avg_transaction DECIMAL(10,2),
    category_distribution JSON,
    PRIMARY KEY (user_id, month)
);
```

### Fraud Events
```sql
CREATE TABLE fraud_events (
    transaction_id VARCHAR PRIMARY KEY,
    is_fraud BOOLEAN NOT NULL,
    risk_score DECIMAL(5,2),
    flagged_reason VARCHAR,
    timestamp TIMESTAMP NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE
);
```

### Groups & Split Bills
```sql
CREATE TABLE groups (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL,
    status VARCHAR DEFAULT 'active'
);

CREATE TABLE split_bills (
    id VARCHAR PRIMARY KEY,
    group_id VARCHAR NOT NULL,
    paid_by VARCHAR NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    split_method VARCHAR DEFAULT 'equal',
    status VARCHAR DEFAULT 'pending'
);
```

---

## Usage Examples

### Complete Analytics Workflow

```python
from smartpay_ai.analytics import SpendingAnalytics, FraudAnalytics

# 1. Initialize analytics
spending = SpendingAnalytics(db_path="analytics.duckdb")
fraud = FraudAnalytics(db_path="analytics.duckdb")

# 2. Load data from PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
spending.load_transactions_from_postgres(DATABASE_URL, days_back=90)
fraud.load_transactions_from_postgres(DATABASE_URL, days_back=30)

# 3. Run analytics
user_id = "user_123"

# Spending insights
spending_insights = spending.export_insights_for_agent(user_id)

# Fraud analysis
fraud_insights = fraud.export_insights_for_agent(user_id)

# 4. Update risk profile
fraud.update_user_risk_profile(user_id)

# 5. Close connections
spending.close()
fraud.close()
```

### Complete Training Workflow

```python
from smartpay_ai.training import (
    train_fraud_detection_model,
    train_credit_scoring_model,
    train_spending_analysis_model
)

DATABASE_URL = os.getenv("DATABASE_URL")

# Train all models
fraud_metrics = train_fraud_detection_model(pg_conn_string=DATABASE_URL)
credit_metrics = train_credit_scoring_model(pg_conn_string=DATABASE_URL)
spending_metrics = train_spending_analysis_model(pg_conn_string=DATABASE_URL)

print(f"Fraud ROC-AUC: {fraud_metrics['test_roc_auc']:.4f}")
print(f"Credit ROC-AUC: {credit_metrics['test_roc_auc']:.4f}")
print(f"Spending Silhouette: {spending_metrics['silhouette_score']:.4f}")
```

---

## Integration with Agents

### Transaction Analyst Agent

**Uses:** `SpendingAnalytics`

```python
from smartpay_ai.analytics import SpendingAnalytics

async def get_spending_insights(user_id: str):
    analytics = SpendingAnalytics(db_path="analytics.duckdb")
    insights = analytics.export_insights_for_agent(user_id)
    analytics.close()
    
    return {
        "total_spending": insights["overall_metrics"]["total_spending"],
        "top_categories": insights["category_breakdown"][:3],
        "budget_alerts": [
            b for b in insights["budget_variance"]
            if b["status"] in ["exceeded", "warning"]
        ]
    }
```

### Security Guardian Agent

**Uses:** `FraudAnalytics` + `fraud_detection_ensemble.joblib`

```python
from smartpay_ai.analytics import FraudAnalytics
import joblib

async def check_transaction_fraud(transaction_id: str):
    analytics = FraudAnalytics(db_path="analytics.duckdb")
    
    # Rule-based analysis
    anomalies = analytics.anomaly_detection_rules(transaction_id)
    
    # ML-based prediction (if model exists)
    try:
        model = joblib.load("models/fraud_detection/fraud_detection_ensemble.joblib")
        # ... feature engineering and prediction
    except FileNotFoundError:
        pass
    
    analytics.close()
    return anomalies
```

### Group Manager Agent

**Uses:** `GroupAnalytics`

```python
from smartpay_ai.analytics import GroupAnalytics

async def get_group_health(group_id: str):
    analytics = GroupAnalytics(db_path="analytics.duckdb")
    insights = analytics.export_insights_for_agent(group_id)
    analytics.close()
    
    return {
        "health_score": insights["health_score"],
        "recommendations": generate_recommendations(insights)
    }
```

---

## Production Deployment

### 1. Database Setup

```bash
# Install PostgreSQL (production data)
# Install DuckDB (analytics)

# Load initial data
python -c "
from smartpay_ai.analytics import SpendingAnalytics
analytics = SpendingAnalytics('production_analytics.duckdb')
analytics.load_transactions_from_postgres('$DATABASE_URL', days_back=90)
analytics.materialize_spending_patterns()
analytics.close()
"
```

### 2. Model Training Schedule

Use cron jobs to retrain models periodically:

```bash
# Retrain fraud model weekly (Sundays at 2 AM)
0 2 * * 0 cd /path/to/backend_python && python -m smartpay_ai.training.train_fraud_model

# Retrain credit model monthly (1st of month at 3 AM)
0 3 1 * * cd /path/to/backend_python && python -m smartpay_ai.training.train_credit_model

# Retrain spending model monthly (1st of month at 4 AM)
0 4 1 * * cd /path/to/backend_python && python -m smartpay_ai.training.train_spending_model
```

### 3. Analytics Refresh

```bash
# Refresh analytics data daily (1 AM)
0 1 * * * python /path/to/refresh_analytics.py
```

Example `refresh_analytics.py`:
```python
import os
from smartpay_ai.analytics import SpendingAnalytics, FraudAnalytics, GroupAnalytics

DATABASE_URL = os.getenv("DATABASE_URL")
ANALYTICS_DB = "production_analytics.duckdb"

# Refresh spending analytics
spending = SpendingAnalytics(ANALYTICS_DB)
spending.load_transactions_from_postgres(DATABASE_URL, days_back=90)
spending.materialize_spending_patterns()
spending.close()

# Refresh fraud analytics
fraud = FraudAnalytics(ANALYTICS_DB)
fraud.load_transactions_from_postgres(DATABASE_URL, days_back=30)
fraud.close()

# Refresh group analytics
groups = GroupAnalytics(ANALYTICS_DB)
groups.load_groups_from_postgres(DATABASE_URL)
groups.close()

print("Analytics refreshed successfully")
```

### 4. Model Loading in FastAPI

```python
# In FastAPI startup
from contextlib import asynccontextmanager
import joblib

models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models at startup
    try:
        models["fraud"] = joblib.load("smartpay_ai/models/fraud_detection/fraud_detection_ensemble.joblib")
        models["credit"] = joblib.load("smartpay_ai/models/credit_scoring/credit_scoring_ensemble.joblib")
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.warning(f"ML models not available: {e}")
    
    yield
    
    # Cleanup
    models.clear()

app = FastAPI(lifespan=lifespan)
```

---

## Performance Considerations

### DuckDB Advantages
- **100x faster** aggregations vs PostgreSQL for OLAP queries
- **In-memory or persistent** storage
- **Parallel query execution**
- **Columnar storage** for analytics

### Best Practices
1. **Materialize common queries** for instant agent responses
2. **Refresh analytics daily** (off-peak hours)
3. **Use DuckDB for reads**, PostgreSQL for writes
4. **Train models monthly** with latest data
5. **Monitor model drift** and retrain when performance degrades

---

## Troubleshooting

### Issue: DuckDB file locked
**Solution:** Ensure only one process accesses the file at a time. Use separate DB files for concurrent access.

### Issue: Low fraud detection accuracy
**Solution:** 
- Check fraud label quality
- Increase training data (need >1000 fraud samples)
- Adjust class weights or use SMOTE for imbalanced data

### Issue: Spending clusters not meaningful
**Solution:**
- Adjust `n_clusters` parameter (try 3-7)
- Use longer historical period (6-12 months)
- Add more features (category diversity, merchant patterns)

---

## Next Steps

1. **Deploy to production** with cron-based model retraining
2. **Add monitoring** for model performance drift
3. **Implement A/B testing** for fraud detection thresholds
4. **Expand features** with device fingerprinting, geolocation
5. **Add interpretability** with SHAP values for model explanations

---

**Created by:** Smartpay AI Team  
**Last Updated:** March 17, 2026  
**Version:** 1.0.0
