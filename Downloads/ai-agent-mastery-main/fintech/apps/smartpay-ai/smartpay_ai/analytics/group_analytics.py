"""
Group Analytics Engine using DuckDB

Location: backend_python/smartpay_ai/analytics/group_analytics.py
Purpose: Analyze group activity, split bills, member contributions, group health scores
Usage: Feeds Group Manager agent with group insights
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import duckdb
import pandas as pd

logger = logging.getLogger(__name__)


class GroupAnalytics:
    """Group activity and split bill analytics using DuckDB"""

    def __init__(self, db_path: str = ":memory:"):
        """
        Initialize DuckDB connection for group analytics
        
        Args:
            db_path: Path to DuckDB database file (default: in-memory)
        """
        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._init_schema()
        logger.info(f"GroupAnalytics initialized with DuckDB at {db_path}")

    def _init_schema(self):
        """Initialize DuckDB schema for group analytics"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS groups (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                created_by VARCHAR NOT NULL,
                created_at TIMESTAMP NOT NULL,
                status VARCHAR DEFAULT 'active'
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS group_members (
                group_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                joined_at TIMESTAMP NOT NULL,
                role VARCHAR DEFAULT 'member',
                status VARCHAR DEFAULT 'active',
                PRIMARY KEY (group_id, user_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS split_bills (
                id VARCHAR PRIMARY KEY,
                group_id VARCHAR NOT NULL,
                paid_by VARCHAR NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                description VARCHAR,
                split_method VARCHAR DEFAULT 'equal',
                created_at TIMESTAMP NOT NULL,
                status VARCHAR DEFAULT 'pending'
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS split_bill_shares (
                split_bill_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                share_amount DECIMAL(10,2) NOT NULL,
                paid BOOLEAN DEFAULT FALSE,
                paid_at TIMESTAMP,
                PRIMARY KEY (split_bill_id, user_id)
            )
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS group_transactions (
                id VARCHAR PRIMARY KEY,
                group_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR,
                description VARCHAR,
                created_at TIMESTAMP NOT NULL
            )
        """)

        logger.info("DuckDB schema initialized for group analytics")

    def load_groups_from_postgres(self, pg_conn_string: str):
        """
        Load group data from PostgreSQL into DuckDB
        
        Args:
            pg_conn_string: PostgreSQL connection string
        """
        import asyncpg
        import asyncio

        async def _load():
            conn = await asyncpg.connect(pg_conn_string)
            try:
                # Load groups
                groups = await conn.fetch("SELECT id, name, created_by, created_at, status FROM groups")
                if groups:
                    df = pd.DataFrame([dict(row) for row in groups])
                    self.conn.execute("DELETE FROM groups")
                    self.conn.register('groups_df', df)
                    self.conn.execute("INSERT INTO groups SELECT * FROM groups_df")
                    logger.info(f"Loaded {len(groups)} groups")

                # Load group members
                members = await conn.fetch("""
                    SELECT group_id, user_id, joined_at, role, status 
                    FROM group_members
                """)
                if members:
                    df = pd.DataFrame([dict(row) for row in members])
                    self.conn.execute("DELETE FROM group_members")
                    self.conn.register('members_df', df)
                    self.conn.execute("INSERT INTO group_members SELECT * FROM members_df")
                    logger.info(f"Loaded {len(members)} group members")

                # Load split bills
                bills = await conn.fetch("""
                    SELECT id, group_id, paid_by, total_amount, description, 
                           split_method, created_at, status 
                    FROM split_bills
                """)
                if bills:
                    df = pd.DataFrame([dict(row) for row in bills])
                    self.conn.execute("DELETE FROM split_bills")
                    self.conn.register('bills_df', df)
                    self.conn.execute("INSERT INTO split_bills SELECT * FROM bills_df")
                    logger.info(f"Loaded {len(bills)} split bills")

            finally:
                await conn.close()

        asyncio.run(_load())

    def group_activity_metrics(self, group_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Calculate group activity metrics
        
        Args:
            group_id: Group identifier
            days: Analysis period
            
        Returns:
            Group activity metrics
        """
        cutoff = datetime.now() - timedelta(days=days)

        # Basic group info
        group_info = self.conn.execute("""
            SELECT name, created_by, created_at, status
            FROM groups
            WHERE id = ?
        """, [group_id]).fetchone()

        if not group_info:
            return {"error": f"Group {group_id} not found"}

        # Member count
        member_count = self.conn.execute("""
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = ? AND status = 'active'
        """, [group_id]).fetchone()[0]

        # Transaction activity
        activity = self.conn.execute("""
            SELECT 
                COUNT(*) as transaction_count,
                SUM(amount) as total_volume,
                AVG(amount) as avg_amount
            FROM group_transactions
            WHERE group_id = ?
              AND created_at >= ?
        """, [group_id, cutoff]).fetchone()

        # Split bills stats
        split_stats = self.conn.execute("""
            SELECT 
                COUNT(*) as total_bills,
                SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END) as settled_bills,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bills,
                SUM(total_amount) as total_split_amount
            FROM split_bills
            WHERE group_id = ?
              AND created_at >= ?
        """, [group_id, cutoff]).fetchone()

        return {
            "group_id": group_id,
            "name": group_info[0],
            "created_by": group_info[1],
            "created_at": group_info[2].isoformat(),
            "status": group_info[3],
            "member_count": member_count,
            "period_days": days,
            "transaction_count": activity[0] if activity else 0,
            "total_volume": float(activity[1]) if activity and activity[1] else 0.0,
            "avg_transaction": float(activity[2]) if activity and activity[2] else 0.0,
            "split_bills_total": split_stats[0] if split_stats else 0,
            "split_bills_settled": split_stats[1] if split_stats else 0,
            "split_bills_pending": split_stats[2] if split_stats else 0,
            "total_split_amount": float(split_stats[3]) if split_stats and split_stats[3] else 0.0
        }

    def member_contribution_analysis(self, group_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Analyze individual member contributions to group
        
        Args:
            group_id: Group identifier
            days: Analysis period
            
        Returns:
            Member contribution breakdown
        """
        cutoff = datetime.now() - timedelta(days=days)

        results = self.conn.execute("""
            SELECT 
                gm.user_id,
                COUNT(gt.id) as transaction_count,
                SUM(gt.amount) as total_contributed,
                AVG(gt.amount) as avg_contribution,
                COUNT(sb.id) as bills_paid,
                SUM(sb.total_amount) as total_bills_paid
            FROM group_members gm
            LEFT JOIN group_transactions gt 
                ON gm.user_id = gt.user_id 
                AND gm.group_id = gt.group_id
                AND gt.created_at >= ?
            LEFT JOIN split_bills sb 
                ON gm.user_id = sb.paid_by 
                AND gm.group_id = sb.group_id
                AND sb.created_at >= ?
            WHERE gm.group_id = ?
              AND gm.status = 'active'
            GROUP BY gm.user_id
            ORDER BY total_contributed DESC
        """, [cutoff, cutoff, group_id]).fetchall()

        return [
            {
                "user_id": row[0],
                "transaction_count": row[1] or 0,
                "total_contributed": float(row[2]) if row[2] else 0.0,
                "avg_contribution": float(row[3]) if row[3] else 0.0,
                "bills_paid": row[4] or 0,
                "total_bills_paid": float(row[5]) if row[5] else 0.0
            }
            for row in results
        ]

    def split_bill_patterns(self, group_id: str) -> Dict[str, Any]:
        """
        Analyze split bill patterns in a group
        
        Args:
            group_id: Group identifier
            
        Returns:
            Split bill pattern analysis
        """
        # Overall split bill stats
        overall = self.conn.execute("""
            SELECT 
                COUNT(*) as total_bills,
                AVG(total_amount) as avg_bill_amount,
                SUM(CASE WHEN status = 'settled' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as settlement_rate,
                AVG(
                    CASE WHEN status = 'settled' 
                    THEN EXTRACT(EPOCH FROM (
                        SELECT MIN(paid_at) 
                        FROM split_bill_shares 
                        WHERE split_bill_id = split_bills.id
                    ) - created_at) / 86400.0
                    END
                ) as avg_settlement_days
            FROM split_bills
            WHERE group_id = ?
        """, [group_id]).fetchone()

        # Who pays most often
        top_payers = self.conn.execute("""
            SELECT 
                paid_by as user_id,
                COUNT(*) as times_paid,
                SUM(total_amount) as total_paid
            FROM split_bills
            WHERE group_id = ?
            GROUP BY paid_by
            ORDER BY times_paid DESC
            LIMIT 5
        """, [group_id]).fetchall()

        # Who owes most often
        top_debtors = self.conn.execute("""
            SELECT 
                user_id,
                COUNT(*) as bills_owed,
                SUM(share_amount) as total_owed
            FROM split_bill_shares
            WHERE split_bill_id IN (SELECT id FROM split_bills WHERE group_id = ?)
              AND paid = FALSE
            GROUP BY user_id
            ORDER BY total_owed DESC
            LIMIT 5
        """, [group_id]).fetchall()

        return {
            "group_id": group_id,
            "total_bills": overall[0] if overall else 0,
            "avg_bill_amount": float(overall[1]) if overall and overall[1] else 0.0,
            "settlement_rate": float(overall[2]) if overall and overall[2] else 0.0,
            "avg_settlement_days": float(overall[3]) if overall and overall[3] else 0.0,
            "top_payers": [
                {
                    "user_id": row[0],
                    "times_paid": row[1],
                    "total_paid": float(row[2])
                }
                for row in top_payers
            ],
            "top_debtors": [
                {
                    "user_id": row[0],
                    "bills_owed": row[1],
                    "total_owed": float(row[2])
                }
                for row in top_debtors
            ]
        }

    def group_health_score(self, group_id: str) -> Dict[str, Any]:
        """
        Calculate group health score based on activity and engagement
        
        Args:
            group_id: Group identifier
            
        Returns:
            Group health score and factors
        """
        # Activity score (0-40 points)
        activity = self.conn.execute("""
            SELECT COUNT(*) 
            FROM group_transactions
            WHERE group_id = ?
              AND created_at >= ?
        """, [group_id, datetime.now() - timedelta(days=30)]).fetchone()[0]

        activity_score = min(40, activity * 2)  # 2 points per transaction, max 40

        # Member engagement (0-30 points)
        member_count = self.conn.execute("""
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = ? AND status = 'active'
        """, [group_id]).fetchone()[0]

        active_members = self.conn.execute("""
            SELECT COUNT(DISTINCT user_id)
            FROM group_transactions
            WHERE group_id = ?
              AND created_at >= ?
        """, [group_id, datetime.now() - timedelta(days=30)]).fetchone()[0]

        engagement_rate = (active_members / member_count * 100) if member_count > 0 else 0
        engagement_score = engagement_rate * 0.3  # Max 30 points

        # Settlement rate (0-30 points)
        settlement = self.conn.execute("""
            SELECT 
                COUNT(CASE WHEN status = 'settled' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(*), 0) as settlement_rate
            FROM split_bills
            WHERE group_id = ?
        """, [group_id]).fetchone()

        settlement_rate = settlement[0] if settlement and settlement[0] else 0
        settlement_score = settlement_rate * 0.3  # Max 30 points

        total_score = activity_score + engagement_score + settlement_score

        return {
            "group_id": group_id,
            "health_score": round(total_score, 2),
            "health_grade": (
                "A" if total_score >= 80 else
                "B" if total_score >= 60 else
                "C" if total_score >= 40 else
                "D"
            ),
            "factors": {
                "activity_score": round(activity_score, 2),
                "engagement_score": round(engagement_score, 2),
                "settlement_score": round(settlement_score, 2)
            },
            "metrics": {
                "transaction_count": activity,
                "member_count": member_count,
                "active_members": active_members,
                "engagement_rate": round(engagement_rate, 2),
                "settlement_rate": round(settlement_rate, 2)
            }
        }

    def export_insights_for_agent(self, group_id: str) -> Dict[str, Any]:
        """
        Export comprehensive group insights for Group Manager agent
        
        Args:
            group_id: Group identifier
            
        Returns:
            Complete group analysis for agent consumption
        """
        return {
            "group_id": group_id,
            "activity_metrics": self.group_activity_metrics(group_id, days=30),
            "member_contributions": self.member_contribution_analysis(group_id, days=30),
            "split_bill_patterns": self.split_bill_patterns(group_id),
            "health_score": self.group_health_score(group_id),
            "generated_at": datetime.now().isoformat()
        }

    def close(self):
        """Close DuckDB connection"""
        self.conn.close()
        logger.info("GroupAnalytics connection closed")
