#!/usr/bin/env python3
"""
DuckDB ETL Sync Cron Job

Location: backend_python/scripts/etl_sync_cron.py
Purpose: Scheduled task to sync PostgreSQL data to DuckDB for analytics
Usage: Run via cron or scheduled task manager

Crontab Example:
    # Run incremental sync every hour
    0 * * * * cd /path/to/backend_python && python3 scripts/etl_sync_cron.py --sync-type incremental --days-back 1

    # Run full sync daily at 2 AM
    0 2 * * * cd /path/to/backend_python && python3 scripts/etl_sync_cron.py --sync-type full
"""

import os
import sys
import argparse
import logging
import asyncio
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from smartpay_ai.analytics.etl_pipeline import run_etl_sync


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/etl_sync.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def load_config():
    """Load configuration from environment variables"""
    config = {
        "pg_conn_string": os.getenv(
            "POSTGRES_CONN_STRING",
            "postgresql://user:password@localhost:5432/smartpay"
        ),
        "notification_email": os.getenv("ETL_NOTIFICATION_EMAIL"),
        "slack_webhook": os.getenv("ETL_SLACK_WEBHOOK"),
    }
    
    return config


def send_notification(results: dict, config: dict):
    """
    Send notification about ETL sync results
    
    Args:
        results: ETL sync results
        config: Configuration with notification settings
    """
    success_count = results.get("success_count", 0)
    total_tables = results.get("total_tables", 0)
    duration = results.get("duration_seconds", 0)
    
    status = "SUCCESS" if success_count == total_tables else "PARTIAL FAILURE"
    
    message = f"""
DuckDB ETL Sync Report - {status}
{'=' * 50}
Sync Type: {results.get('sync_type', 'unknown')}
Started: {results.get('started_at', 'unknown')}
Completed: {results.get('completed_at', 'unknown')}
Duration: {duration:.2f} seconds
Success: {success_count}/{total_tables} tables

Table Results:
"""
    
    for table_result in results.get("tables", []):
        table_name = table_result.get("table", "unknown")
        table_status = table_result.get("status", "unknown")
        rows_synced = table_result.get("rows_synced", 0)
        
        message += f"  - {table_name}: {table_status} ({rows_synced} rows)\n"
    
    logger.info(message)
    
    # Send email notification (if configured)
    if config.get("notification_email"):
        try:
            import smtplib
            from email.mime.text import MIMEText
            
            msg = MIMEText(message)
            msg["Subject"] = f"DuckDB ETL Sync - {status}"
            msg["From"] = os.getenv("SMTP_FROM", "noreply@smartpay.na")
            msg["To"] = config["notification_email"]
            
            smtp = smtplib.SMTP(
                os.getenv("SMTP_HOST", "localhost"),
                int(os.getenv("SMTP_PORT", "25"))
            )
            smtp.send_message(msg)
            smtp.quit()
            
            logger.info(f"Email notification sent to {config['notification_email']}")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    
    # Send Slack notification (if configured)
    if config.get("slack_webhook"):
        try:
            import requests
            
            color = "good" if status == "SUCCESS" else "warning"
            
            payload = {
                "text": f"DuckDB ETL Sync - {status}",
                "attachments": [{
                    "color": color,
                    "text": message,
                    "footer": "Smartpay Analytics",
                    "ts": int(datetime.now().timestamp())
                }]
            }
            
            response = requests.post(
                config["slack_webhook"],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("Slack notification sent successfully")
            else:
                logger.error(f"Slack notification failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")


async def main():
    """Main ETL sync execution"""
    parser = argparse.ArgumentParser(description="DuckDB ETL Sync Cron Job")
    parser.add_argument(
        "--sync-type",
        choices=["full", "incremental"],
        default="incremental",
        help="Type of sync to perform"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=1,
        help="Days to look back for incremental sync"
    )
    parser.add_argument(
        "--pg-conn-string",
        type=str,
        help="PostgreSQL connection string (overrides env var)"
    )
    parser.add_argument(
        "--no-notification",
        action="store_true",
        help="Disable notifications"
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Override connection string if provided
    if args.pg_conn_string:
        config["pg_conn_string"] = args.pg_conn_string
    
    logger.info(f"Starting {args.sync_type} ETL sync (days_back={args.days_back})")
    
    try:
        # Run ETL sync
        results = await run_etl_sync(
            pg_conn_string=config["pg_conn_string"],
            sync_type=args.sync_type,
            days_back=args.days_back
        )
        
        # Send notifications
        if not args.no_notification:
            send_notification(results, config)
        
        # Exit with appropriate code
        success_count = results.get("success_count", 0)
        total_tables = results.get("total_tables", 0)
        
        if success_count == total_tables:
            logger.info("ETL sync completed successfully")
            sys.exit(0)
        else:
            logger.warning(f"ETL sync partially failed ({success_count}/{total_tables} succeeded)")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"ETL sync failed with error: {e}", exc_info=True)
        
        # Send error notification
        if not args.no_notification:
            error_results = {
                "sync_type": args.sync_type,
                "started_at": datetime.now().isoformat(),
                "completed_at": datetime.now().isoformat(),
                "duration_seconds": 0,
                "success_count": 0,
                "total_tables": 0,
                "tables": [],
                "error": str(e)
            }
            send_notification(error_results, config)
        
        sys.exit(2)


if __name__ == "__main__":
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Run main function
    asyncio.run(main())
