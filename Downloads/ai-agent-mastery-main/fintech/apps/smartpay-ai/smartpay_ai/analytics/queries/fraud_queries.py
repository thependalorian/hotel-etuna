"""
Fraud Analytics Queries

Location: backend_python/smartpay_ai/analytics/queries/fraud_queries.py
Purpose: Pre-optimized SQL queries for fraud detection analytics
"""

FRAUD_QUERIES = {
    "high_risk_transactions": """
        SELECT 
            fe.transaction_id,
            t.user_id,
            t.amount,
            t.merchant,
            t.timestamp,
            fe.risk_score,
            fe.flagged_reason,
            fe.reviewed,
            fe.is_fraud
        FROM fraud_events fe
        JOIN transactions t ON fe.transaction_id = t.id
        WHERE fe.risk_score >= ?
          AND fe.timestamp >= ?
          AND fe.timestamp < ?
        ORDER BY fe.risk_score DESC, fe.timestamp DESC
        LIMIT ?
    """,
    
    "fraud_detection_accuracy": """
        WITH fraud_stats AS (
            SELECT 
                COUNT(*) as total_flagged,
                SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as true_positives,
                SUM(CASE WHEN NOT is_fraud AND reviewed THEN 1 ELSE 0 END) as false_positives,
                AVG(risk_score) as avg_risk_score
            FROM fraud_events
            WHERE timestamp >= ?
              AND timestamp < ?
              AND reviewed = TRUE
        )
        SELECT 
            total_flagged,
            true_positives,
            false_positives,
            avg_risk_score,
            true_positives * 100.0 / NULLIF(total_flagged, 0) as precision,
            false_positives * 100.0 / NULLIF(total_flagged, 0) as false_positive_rate
        FROM fraud_stats
    """,
    
    "user_risk_profile": """
        SELECT 
            urp.user_id,
            urp.risk_level,
            urp.risk_score,
            urp.total_transactions,
            urp.flagged_transactions,
            urp.flagged_transactions * 100.0 / NULLIF(urp.total_transactions, 0) as flag_rate,
            urp.last_updated,
            COUNT(fe.transaction_id) as recent_flags
        FROM user_risk_profiles urp
        LEFT JOIN fraud_events fe ON fe.transaction_id IN (
            SELECT id FROM transactions 
            WHERE user_id = urp.user_id 
              AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        )
        WHERE urp.user_id = ?
        GROUP BY urp.user_id, urp.risk_level, urp.risk_score, urp.total_transactions, 
                 urp.flagged_transactions, urp.last_updated
    """,
    
    "fraud_patterns": """
        WITH fraud_patterns AS (
            SELECT 
                flagged_reason,
                COUNT(*) as occurrence_count,
                AVG(fe.risk_score) as avg_risk_score,
                SUM(CASE WHEN fe.is_fraud THEN 1 ELSE 0 END) as confirmed_fraud_count,
                AVG(t.amount) as avg_amount
            FROM fraud_events fe
            JOIN transactions t ON fe.transaction_id = t.id
            WHERE fe.timestamp >= ?
              AND fe.timestamp < ?
            GROUP BY flagged_reason
        )
        SELECT 
            flagged_reason,
            occurrence_count,
            avg_risk_score,
            confirmed_fraud_count,
            confirmed_fraud_count * 100.0 / NULLIF(occurrence_count, 0) as confirmation_rate,
            avg_amount
        FROM fraud_patterns
        ORDER BY occurrence_count DESC
    """,
    
    "anomaly_detection": """
        WITH user_stats AS (
            SELECT 
                user_id,
                AVG(amount) as avg_amount,
                STDDEV(amount) as stddev_amount,
                COUNT(*) as txn_count
            FROM transactions
            WHERE status = 'completed'
              AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY user_id
            HAVING COUNT(*) >= 5
        ),
        recent_transactions AS (
            SELECT 
                t.id,
                t.user_id,
                t.amount,
                t.timestamp,
                us.avg_amount,
                us.stddev_amount,
                (t.amount - us.avg_amount) / NULLIF(us.stddev_amount, 0) as z_score
            FROM transactions t
            JOIN user_stats us ON t.user_id = us.user_id
            WHERE t.timestamp >= ?
              AND t.timestamp < ?
              AND t.status = 'completed'
        )
        SELECT 
            id as transaction_id,
            user_id,
            amount,
            timestamp,
            avg_amount as user_avg_amount,
            z_score,
            CASE 
                WHEN ABS(z_score) >= 3 THEN 'critical'
                WHEN ABS(z_score) >= 2 THEN 'high'
                WHEN ABS(z_score) >= 1.5 THEN 'medium'
                ELSE 'low'
            END as anomaly_severity
        FROM recent_transactions
        WHERE ABS(z_score) >= ?
        ORDER BY ABS(z_score) DESC
        LIMIT ?
    """,
    
    "velocity_violations": """
        WITH transaction_windows AS (
            SELECT 
                user_id,
                timestamp,
                amount,
                COUNT(*) OVER (
                    PARTITION BY user_id 
                    ORDER BY timestamp 
                    RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
                ) as txns_last_hour,
                SUM(amount) OVER (
                    PARTITION BY user_id 
                    ORDER BY timestamp 
                    RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
                ) as volume_last_hour
            FROM transactions
            WHERE timestamp >= ?
              AND timestamp < ?
              AND status = 'completed'
        )
        SELECT 
            user_id,
            timestamp,
            amount,
            txns_last_hour,
            volume_last_hour,
            CASE 
                WHEN txns_last_hour >= 10 THEN 'critical'
                WHEN txns_last_hour >= 5 THEN 'high'
                WHEN txns_last_hour >= 3 THEN 'medium'
                ELSE 'normal'
            END as velocity_risk
        FROM transaction_windows
        WHERE txns_last_hour >= ?
        ORDER BY txns_last_hour DESC, volume_last_hour DESC
        LIMIT ?
    """,
}
