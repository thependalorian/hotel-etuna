"""
Transaction Analytics Queries

Location: backend_python/smartpay_ai/analytics/queries/transaction_queries.py
Purpose: Pre-optimized SQL queries for transaction analytics
"""

TRANSACTION_QUERIES = {
    "daily_summary": """
        SELECT 
            DATE(timestamp) as date,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT merchant) as unique_merchants,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
    """,
    
    "category_breakdown": """
        SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            SUM(amount) * 100.0 / (SELECT SUM(amount) FROM transactions WHERE timestamp >= ? AND timestamp < ?) as percentage
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
          AND status = 'completed'
        GROUP BY category
        ORDER BY total_amount DESC
    """,
    
    "merchant_ranking": """
        SELECT 
            merchant,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_transaction,
            COUNT(DISTINCT user_id) as unique_customers,
            MAX(timestamp) as last_transaction
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
          AND status = 'completed'
          AND merchant IS NOT NULL
        GROUP BY merchant
        ORDER BY total_volume DESC
        LIMIT ?
    """,
    
    "hourly_distribution": """
        SELECT 
            EXTRACT(HOUR FROM timestamp) as hour,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_amount
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
          AND status = 'completed'
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
    """,
    
    "top_users_by_volume": """
        SELECT 
            user_id,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_transaction,
            MAX(timestamp) as last_transaction,
            COUNT(DISTINCT category) as categories_used,
            COUNT(DISTINCT merchant) as merchants_used
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
          AND status = 'completed'
        GROUP BY user_id
        ORDER BY total_volume DESC
        LIMIT ?
    """,
    
    "failed_transactions_analysis": """
        SELECT 
            status,
            COUNT(*) as count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT user_id) as affected_users
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
          AND status != 'completed'
        GROUP BY status
        ORDER BY count DESC
    """,
    
    "transaction_velocity": """
        SELECT 
            user_id,
            COUNT(*) as txn_count,
            SUM(amount) as total_amount,
            MAX(timestamp) - MIN(timestamp) as time_span,
            COUNT(*) * 1.0 / EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) * 3600 as txns_per_hour
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
        GROUP BY user_id
        HAVING COUNT(*) >= ?
        ORDER BY txns_per_hour DESC
    """,
    
    "cohort_analysis": """
        WITH user_first_txn AS (
            SELECT 
                user_id,
                DATE_TRUNC('month', MIN(timestamp)) as cohort_month
            FROM transactions
            WHERE status = 'completed'
            GROUP BY user_id
        ),
        cohort_activity AS (
            SELECT 
                uft.cohort_month,
                DATE_TRUNC('month', t.timestamp) as activity_month,
                COUNT(DISTINCT t.user_id) as active_users
            FROM user_first_txn uft
            JOIN transactions t ON uft.user_id = t.user_id
            WHERE t.status = 'completed'
              AND t.timestamp >= ?
            GROUP BY uft.cohort_month, DATE_TRUNC('month', t.timestamp)
        ),
        cohort_sizes AS (
            SELECT 
                cohort_month,
                COUNT(DISTINCT user_id) as cohort_size
            FROM user_first_txn
            WHERE cohort_month >= ?
            GROUP BY cohort_month
        )
        SELECT 
            ca.cohort_month,
            ca.activity_month,
            ca.active_users,
            cs.cohort_size,
            ca.active_users * 100.0 / cs.cohort_size as retention_rate,
            EXTRACT(MONTH FROM AGE(ca.activity_month, ca.cohort_month)) as months_since_first
        FROM cohort_activity ca
        JOIN cohort_sizes cs ON ca.cohort_month = cs.cohort_month
        ORDER BY ca.cohort_month, ca.activity_month
    """,
    
    "revenue_forecast": """
        WITH monthly_revenue AS (
            SELECT 
                DATE_TRUNC('month', timestamp) as month,
                SUM(amount) as revenue
            FROM transactions
            WHERE status = 'completed'
              AND timestamp >= ?
            GROUP BY DATE_TRUNC('month', timestamp)
        ),
        revenue_with_lag AS (
            SELECT 
                month,
                revenue,
                LAG(revenue, 1) OVER (ORDER BY month) as prev_month_revenue,
                LAG(revenue, 2) OVER (ORDER BY month) as prev_prev_month_revenue
            FROM monthly_revenue
        )
        SELECT 
            month,
            revenue,
            prev_month_revenue,
            (revenue - prev_month_revenue) * 100.0 / NULLIF(prev_month_revenue, 0) as mom_growth_pct,
            (revenue + prev_month_revenue + prev_prev_month_revenue) / 3.0 as three_month_avg,
            revenue * 1.1 as forecast_next_month_conservative,
            revenue * ((revenue / NULLIF(prev_month_revenue, 0))) as forecast_next_month_trend
        FROM revenue_with_lag
        ORDER BY month DESC
    """,
}
