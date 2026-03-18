"""
User Analytics Queries

Location: backend_python/smartpay_ai/analytics/queries/user_queries.py
Purpose: Pre-optimized SQL queries for user behavior analytics
"""

USER_QUERIES = {
    "user_lifetime_value": """
        SELECT 
            user_id,
            MIN(timestamp) as first_transaction,
            MAX(timestamp) as last_transaction,
            EXTRACT(DAY FROM (MAX(timestamp) - MIN(timestamp))) as lifetime_days,
            COUNT(*) as total_transactions,
            SUM(amount) as lifetime_value,
            AVG(amount) as avg_transaction,
            COUNT(DISTINCT DATE(timestamp)) as active_days,
            COUNT(*) * 1.0 / NULLIF(EXTRACT(DAY FROM (MAX(timestamp) - MIN(timestamp))), 0) as txns_per_day
        FROM transactions
        WHERE status = 'completed'
          AND user_id = ?
        GROUP BY user_id
    """,
    
    "user_segmentation": """
        WITH user_metrics AS (
            SELECT 
                user_id,
                COUNT(*) as txn_count,
                SUM(amount) as total_spent,
                AVG(amount) as avg_spent,
                MAX(timestamp) as last_txn,
                EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(timestamp))) as days_since_last_txn
            FROM transactions
            WHERE status = 'completed'
              AND timestamp >= ?
            GROUP BY user_id
        )
        SELECT 
            user_id,
            txn_count,
            total_spent,
            avg_spent,
            days_since_last_txn,
            CASE 
                WHEN total_spent >= 10000 THEN 'high_value'
                WHEN total_spent >= 5000 THEN 'medium_value'
                ELSE 'low_value'
            END as value_segment,
            CASE 
                WHEN days_since_last_txn <= 7 THEN 'active'
                WHEN days_since_last_txn <= 30 THEN 'at_risk'
                ELSE 'inactive'
            END as activity_segment,
            CASE
                WHEN txn_count >= 20 THEN 'power_user'
                WHEN txn_count >= 10 THEN 'regular_user'
                ELSE 'casual_user'
            END as frequency_segment
        FROM user_metrics
        ORDER BY total_spent DESC
    """,
    
    "churn_prediction": """
        WITH user_activity AS (
            SELECT 
                user_id,
                MAX(timestamp) as last_transaction,
                EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(timestamp))) as days_inactive,
                COUNT(*) as total_transactions,
                AVG(amount) as avg_amount,
                STDDEV(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp)))) / 86400.0 as transaction_frequency_stddev
            FROM transactions
            WHERE status = 'completed'
            GROUP BY user_id
            HAVING COUNT(*) >= 3
        )
        SELECT 
            user_id,
            last_transaction,
            days_inactive,
            total_transactions,
            avg_amount,
            transaction_frequency_stddev,
            CASE 
                WHEN days_inactive > 60 THEN 'high_risk'
                WHEN days_inactive > 30 THEN 'medium_risk'
                WHEN days_inactive > 14 THEN 'low_risk'
                ELSE 'active'
            END as churn_risk,
            CASE
                WHEN days_inactive > 60 AND total_transactions < 5 THEN 0.8
                WHEN days_inactive > 30 AND total_transactions < 10 THEN 0.5
                WHEN days_inactive > 14 THEN 0.2
                ELSE 0.0
            END as churn_probability
        FROM user_activity
        WHERE days_inactive > 14
        ORDER BY churn_probability DESC, days_inactive DESC
    """,
    
    "user_preferences": """
        SELECT 
            user_id,
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_spent,
            AVG(amount) as avg_spent,
            MIN(amount) as min_spent,
            MAX(amount) as max_spent,
            STDDEV(amount) as stddev_spent,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY user_id) as category_preference_pct
        FROM transactions
        WHERE status = 'completed'
          AND user_id = ?
          AND timestamp >= ?
        GROUP BY user_id, category
        ORDER BY transaction_count DESC
    """,
    
    "user_engagement_score": """
        WITH user_metrics AS (
            SELECT 
                user_id,
                COUNT(*) as txn_count,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                COUNT(DISTINCT category) as categories_used,
                EXTRACT(DAY FROM (MAX(timestamp) - MIN(timestamp))) as account_age_days,
                MAX(timestamp) as last_activity
            FROM transactions
            WHERE status = 'completed'
              AND timestamp >= ?
            GROUP BY user_id
        )
        SELECT 
            user_id,
            txn_count,
            active_days,
            categories_used,
            account_age_days,
            last_activity,
            -- Engagement score (0-100)
            LEAST(100, (
                (txn_count * 2.0) +
                (active_days * 5.0) +
                (categories_used * 10.0) +
                (CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_activity)) <= 7 THEN 20 ELSE 0 END)
            )) as engagement_score
        FROM user_metrics
        WHERE user_id = ?
    """,
    
    "top_spenders": """
        SELECT 
            user_id,
            COUNT(*) as transaction_count,
            SUM(amount) as total_spent,
            AVG(amount) as avg_transaction,
            MAX(amount) as max_transaction,
            MIN(timestamp) as first_transaction,
            MAX(timestamp) as last_transaction,
            COUNT(DISTINCT category) as categories_used,
            COUNT(DISTINCT merchant) as merchants_used
        FROM transactions
        WHERE status = 'completed'
          AND timestamp >= ?
          AND timestamp < ?
        GROUP BY user_id
        ORDER BY total_spent DESC
        LIMIT ?
    """,
}
