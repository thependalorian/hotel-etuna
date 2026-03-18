"""
Configuration Synchronization for Python Backend.

Fetches and caches KRI thresholds and compliance config from Node.js backend.
Implements TTL-based caching and auto-refresh on changes.

Location: backend_python/smartpay_ai/compliance/config_sync.py
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class ConfigSync:
    """
    Synchronize compliance configuration from Node.js backend.
    
    Features:
    - Fetch KRI thresholds from Node.js
    - Cache with TTL (default 5 minutes)
    - Auto-refresh on changes
    - Background refresh task
    """

    def __init__(
        self,
        node_backend_url: Optional[str] = None,
        cache_ttl_seconds: int = 300,  # 5 minutes
        timeout: float = 5.0,
    ):
        """
        Initialize config sync.
        
        Args:
            node_backend_url: Base URL for Node.js backend
            cache_ttl_seconds: Cache TTL in seconds
            timeout: HTTP request timeout
        """
        self.node_backend_url = node_backend_url or os.getenv(
            "NODE_BACKEND_URL", "http://localhost:3000"
        )
        self.cache_ttl_seconds = cache_ttl_seconds
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)

        # Cache storage
        self._fraud_thresholds: Optional[Dict[str, float]] = None
        self._fraud_thresholds_expires_at: Optional[datetime] = None

        self._kri_metrics: Optional[Dict[str, Any]] = None
        self._kri_metrics_expires_at: Optional[datetime] = None

        self._compliance_config: Optional[Dict[str, Any]] = None
        self._compliance_config_expires_at: Optional[datetime] = None

        # Background refresh task
        self._refresh_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self):
        """Start background refresh task."""
        if self._running:
            return

        self._running = True
        self._refresh_task = asyncio.create_task(self._background_refresh())
        logger.info("ConfigSync started with TTL=%ds", self.cache_ttl_seconds)

    async def stop(self):
        """Stop background refresh task."""
        self._running = False
        if self._refresh_task:
            self._refresh_task.cancel()
            try:
                await self._refresh_task
            except asyncio.CancelledError:
                pass
        await self.client.aclose()
        logger.info("ConfigSync stopped")

    # -------------------------------------------------------------------------
    # Fraud Detection Thresholds
    # -------------------------------------------------------------------------

    async def get_fraud_thresholds(self, force_refresh: bool = False) -> Dict[str, float]:
        """
        Get fraud detection thresholds from cache or Node.js.
        
        Args:
            force_refresh: Force refresh from Node.js
        
        Returns:
            {
                "low_threshold": float,
                "medium_threshold": float,
                "high_threshold": float
            }
        """
        now = datetime.now()

        # Check cache
        if (
            not force_refresh
            and self._fraud_thresholds is not None
            and self._fraud_thresholds_expires_at is not None
            and now < self._fraud_thresholds_expires_at
        ):
            logger.debug("Returning cached fraud thresholds")
            return self._fraud_thresholds

        # Fetch from Node.js
        try:
            response = await self.client.get(
                f"{self.node_backend_url}/api/v1/compliance/fraud-thresholds"
            )
            response.raise_for_status()
            thresholds = response.json()

            # Update cache
            self._fraud_thresholds = thresholds
            self._fraud_thresholds_expires_at = now + timedelta(
                seconds=self.cache_ttl_seconds
            )

            logger.info("Fetched fraud thresholds from Node.js: %s", thresholds)
            return thresholds

        except Exception as e:
            logger.warning(f"Failed to fetch fraud thresholds: {e}")

            # Return cached value if available
            if self._fraud_thresholds is not None:
                logger.warning("Using expired cached thresholds")
                return self._fraud_thresholds

            # Fallback defaults
            logger.warning("Using default thresholds")
            return {
                "low_threshold": 0.3,
                "medium_threshold": 0.6,
                "high_threshold": 1.0,
            }

    # -------------------------------------------------------------------------
    # KRI Metrics
    # -------------------------------------------------------------------------

    async def get_kri_metrics(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get KRI metrics from cache or Node.js.
        
        Returns:
            {
                "fraud_detection_rate": float,
                "system_uptime": float,
                "api_error_rate": float,
                "trust_account_compliance": float,
                ...
            }
        """
        now = datetime.now()

        # Check cache
        if (
            not force_refresh
            and self._kri_metrics is not None
            and self._kri_metrics_expires_at is not None
            and now < self._kri_metrics_expires_at
        ):
            logger.debug("Returning cached KRI metrics")
            return self._kri_metrics

        # Fetch from Node.js
        try:
            response = await self.client.get(
                f"{self.node_backend_url}/api/v1/compliance/kri-metrics"
            )
            response.raise_for_status()
            metrics = response.json()

            # Update cache
            self._kri_metrics = metrics
            self._kri_metrics_expires_at = now + timedelta(
                seconds=self.cache_ttl_seconds
            )

            logger.info("Fetched KRI metrics from Node.js")
            return metrics

        except Exception as e:
            logger.warning(f"Failed to fetch KRI metrics: {e}")

            # Return cached value if available
            if self._kri_metrics is not None:
                logger.warning("Using expired cached KRI metrics")
                return self._kri_metrics

            # Empty fallback
            return {}

    # -------------------------------------------------------------------------
    # Compliance Configuration
    # -------------------------------------------------------------------------

    async def get_compliance_config(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get general compliance configuration.
        
        Returns:
            {
                "fia_str_threshold": float,
                "fia_ctr_threshold": float,
                "penalty_rates": {...},
                "emoney_limits": {...},
                ...
            }
        """
        now = datetime.now()

        # Check cache
        if (
            not force_refresh
            and self._compliance_config is not None
            and self._compliance_config_expires_at is not None
            and now < self._compliance_config_expires_at
        ):
            logger.debug("Returning cached compliance config")
            return self._compliance_config

        # Fetch from Node.js
        try:
            response = await self.client.get(
                f"{self.node_backend_url}/api/v1/compliance/config"
            )
            response.raise_for_status()
            config = response.json()

            # Update cache
            self._compliance_config = config
            self._compliance_config_expires_at = now + timedelta(
                seconds=self.cache_ttl_seconds
            )

            logger.info("Fetched compliance config from Node.js")
            return config

        except Exception as e:
            logger.warning(f"Failed to fetch compliance config: {e}")

            # Return cached value if available
            if self._compliance_config is not None:
                logger.warning("Using expired cached compliance config")
                return self._compliance_config

            # Empty fallback
            return {}

    # -------------------------------------------------------------------------
    # Cache Management
    # -------------------------------------------------------------------------

    async def invalidate_cache(self):
        """Invalidate all cached config."""
        logger.info("Invalidating all cached config")
        self._fraud_thresholds = None
        self._fraud_thresholds_expires_at = None
        self._kri_metrics = None
        self._kri_metrics_expires_at = None
        self._compliance_config = None
        self._compliance_config_expires_at = None

    async def refresh_all(self):
        """Force refresh all config from Node.js."""
        logger.info("Force refreshing all config")
        await asyncio.gather(
            self.get_fraud_thresholds(force_refresh=True),
            self.get_kri_metrics(force_refresh=True),
            self.get_compliance_config(force_refresh=True),
        )

    # -------------------------------------------------------------------------
    # Background Refresh
    # -------------------------------------------------------------------------

    async def _background_refresh(self):
        """Background task to periodically refresh config."""
        # Initial load
        try:
            await self.refresh_all()
        except Exception as e:
            logger.error(f"Initial config load failed: {e}")

        # Periodic refresh
        refresh_interval = min(self.cache_ttl_seconds // 2, 60)  # Refresh more frequently than TTL
        logger.info(f"Background refresh every {refresh_interval}s")

        while self._running:
            try:
                await asyncio.sleep(refresh_interval)
                
                # Check if any cache is about to expire
                now = datetime.now()
                needs_refresh = False

                if (
                    self._fraud_thresholds_expires_at is None
                    or now >= self._fraud_thresholds_expires_at - timedelta(seconds=30)
                ):
                    needs_refresh = True

                if (
                    self._kri_metrics_expires_at is None
                    or now >= self._kri_metrics_expires_at - timedelta(seconds=30)
                ):
                    needs_refresh = True

                if (
                    self._compliance_config_expires_at is None
                    or now >= self._compliance_config_expires_at - timedelta(seconds=30)
                ):
                    needs_refresh = True

                if needs_refresh:
                    logger.debug("Background refresh triggered")
                    await self.refresh_all()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background refresh error: {e}")

    # -------------------------------------------------------------------------
    # Context Manager
    # -------------------------------------------------------------------------

    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()


# Global singleton instance
_config_sync_instance: Optional[ConfigSync] = None


def get_config_sync() -> ConfigSync:
    """
    Get global ConfigSync instance (singleton).
    
    Call await config_sync.start() to begin background refresh.
    """
    global _config_sync_instance
    if _config_sync_instance is None:
        _config_sync_instance = ConfigSync()
    return _config_sync_instance
