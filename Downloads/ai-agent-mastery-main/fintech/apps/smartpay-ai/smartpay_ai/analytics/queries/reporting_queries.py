"""
Business Reporting Queries

Location: backend_python/smartpay_ai/analytics/queries/reporting_queries.py
Purpose: Pre-optimized SQL queries for business intelligence reporting
"""

REPORTING_QUERIES = {
    "executive_dashboard": """
        WITH daily_metrics AS (
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as transaction_count,
                SUM(amount) as revenue,
                COUNT(DISTINCT user_id) as active_users
            FROM transactions
            WHERE status = 'completed'
              AND timestamp >= ?
              AND timestamp < ?
            GROUP BY DATE(timestamp)
        ),
        growth_metrics AS (
            SELECT 
                date,
                transaction_count,
                revenue,
                active_users,
                LAG(revenue) OVER (ORDER BY date) as prev_day_revenue,
                LAG(active_users) OVER (ORDER BY date) as prev_day_users
            FROM daily_metrics
        )
        SELECT 
            date,
            transaction_count,
            revenue,
            active_users,
            (revenue - prev_day_revenue) * 100.0 / NULLIF(prev_day_revenue, 0) as revenue_growth_pct,
            (active_users - prev_day_users) * 100.0 / NULLIF(prev_day_users, 0) as user_growth_pct
        FROM growth_metrics
        ORDER BY date DESC
    """,
    
    "monthly_summary": """
        SELECT 
            DATE_TRUNC('month', timestamp) as month,
            COUNT(*) as total_transactions,
            SUM(amount) as total_revenue,
            AVG(amount) as avg_transaction_value,
            COUNT(DISTINCT user_id) as active_users,
            COUNT(DISTINCT merchant) as active_merchants,
            COUNT(DISTINCT category) as categories_used,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY month DESC
    """,
    
    "category_performance": """
        SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_revenue,
            AVG(amount) as avg_transaction,
            COUNT(DISTINCT user_id) as unique_users,
            MIN(amount) as min_transaction,
            MAX(amount) as max_transaction,
            STDDEV(amount) as stddev_transaction,
            SUM(amount) * 100.0 / (SELECT SUM(amount) FROM transactions WHERE status = 'completed' AND timestamp >= ? AND timestamp < ?) as revenue_share_pct
        FROM transactions
        WHERE status = 'completed'
          AND timestamp >= ?
          AND timestamp < ?
        GROUP BY category
        ORDER BY total_revenue DESC
    """,
    
    "user_acquisition_funnel": """
        WITH user_first_txn AS (
            SELECT 
                user_id,
                DATE(MIN(timestamp)) as first_transaction_date,
                COUNT(*) FILTER (WHERE timestamp <= MIN(timestamp) + INTERVAL '7 days') as txns_week_1,
                COUNT(*) FILTER (WHERE timestamp <= MIN(timestamp) + INTERVAL '30 days') as txns_month_1
            FROM transactions
            WHERE status = 'completed'
            GROUP BY user_id
            HAVING MIN(timestamp) >= ?
        )
        SELECT 
            first_transaction_date,
            COUNT(*) as new_users,
            SUM(CASE WHEN txns_week_1 >= 2 THEN 1 ELSE 0 END) as activated_week_1,
            SUM(CASE WHEN txns_month_1 >= 5 THEN 1 ELSE 0 END) as power_users_month_1,
            SUM(CASE WHEN txns_week_1 >= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as activation_rate,
            SUM(CASE WHEN txns_month_1 >= 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as power_user_rate
        FROM user_first_txn
        GROUP BY first_transaction_date
        ORDER BY first_transaction_date DESC
    """,
    
    "payment_method_distribution": """
        SELECT 
            COALESCE(wallet_id, 'unknown') as payment_method,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT user_id) as unique_users,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM transactions
        WHERE timestamp >= ?
          AND timestamp < ?
        GROUP BY wallet_id
        ORDER BY total_volume DESC
    """,
    
    "geographic_distribution": """
        SELECT 
            COALESCE(merchant_location, 'unknown') as location,
            COUNT(*) as transaction_count,
            SUM(amount) as total_volume,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT merchant) as unique_merchants
        FROM transactions
        WHERE status = 'completed'
          AND timestamp >= ?
          AND timestamp < ?
          AND merchant_location IS NOT NULL
        GROUP BY merchant_location
        ORDER BY total_volume DESC
        LIMIT 20
    """,
    
    "customer_lifetime_analysis": """
        WITH user_cohorts AS (
            SELECT 
                user_id,
                DATE_TRUNC('month', MIN(timestamp)) as cohort_month,
                COUNT(*) as total_transactions,
                SUM(amount) as lifetime_value,
                EXTRACT(DAY FROM (MAX(timestamp) - MIN(timestamp))) as customer_lifetime_days
            FROM transactions
            WHERE status = 'completed'
            GROUP BY user_id
        )
        SELECT 
            cohort_month,
            COUNT(*) as cohort_size,
            AVG(total_transactions) as avg_transactions_per_user,
            AVG(lifetime_value) as avg_lifetime_value,
            AVG(customer_lifetime_days) as avg_lifetime_days,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lifetime_value) as median_lifetime_value
        FROM user_cohorts
        WHERE cohort_month >= ?
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
    """,
}
