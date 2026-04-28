/**
 * Uptime Monitoring & Alerting Service (PSD-12 Compliance)
 * 
 * Purpose: Monitor system uptime and alert on availability issues
 * Location: /lib/services/security/UptimeMonitoringService.ts
 * 
 * PSD-12 Requirements:
 * - Minimum 99.9% uptime (Maximum 43.2 minutes downtime per month)
 * - RTO (Recovery Time Objective): Within 2 hours
 * - RPO (Recovery Point Objective): 5 minutes for critical systems
 * - Real-time monitoring and alerting
 * - Automated incident creation for outages
 * 
 * Monitors:
 * - API endpoint availability
 * - Database connectivity
 * - External service dependencies
 * - Response time performance
 * - Error rates
 * 
 * Following System Design Principles:
 * - High Availability
 * - Monitoring & Observability
 * - Error Handling & Logging
 * 
 * @version 1.0.0
 * @since 2026-04-21
 */

import { db, systemLogs } from '@/lib/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { SecurityIncidentService } from './SecurityIncidentService';

// ============================================================================
// TYPES
// ============================================================================

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export interface HealthCheckResult {
  service: string;
  status: ServiceStatus;
  responseTimeMs: number;
  timestamp: Date;
  error?: string;
  details?: Record<string, unknown>;
}

export interface UptimeMetrics {
  uptimePercentage: number; // 0-100
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTimeMs: number;
  lastCheckAt: Date;
  downtimeDurationMs: number;
  downtimeIncidents: number;
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: {
    responseTimeMs: number; // Alert if response time exceeds this
    errorRate: number; // Alert if error rate exceeds this (0-1)
    consecutiveFailures: number; // Alert after this many consecutive failures
  };
}

export type AlertChannel = 'email' | 'sms' | 'slack' | 'webhook';

export interface Alert {
  service: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// ============================================================================
// UPTIME MONITORING SERVICE
// ============================================================================

export class UptimeMonitoringService {
  // PSD-12 Requirements
  private static readonly TARGET_UPTIME_PERCENTAGE = 99.9;
  private static readonly MAX_DOWNTIME_MS_PER_MONTH = 43.2 * 60 * 1000; // 43.2 minutes
  private static readonly RTO_MS = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly RPO_MS = 5 * 60 * 1000; // 5 minutes

  // Monitoring configuration
  private static readonly CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly CONSECUTIVE_FAILURES_THRESHOLD = 3;
  private static readonly RESPONSE_TIME_THRESHOLD_MS = 2000; // 2 seconds

  // Service endpoints to monitor
  private static readonly CRITICAL_ENDPOINTS = [
    '/api/health',
    '/api/auth/login',
    '/api/payments',
    '/api/bookings',
  ];

  // State tracking
  private static consecutiveFailures = new Map<string, number>();
  private static lastAlertTime = new Map<string, number>();
  private static downtimeStart = new Map<string, Date | null>();

  /**
   * Check health of all critical services
   */
  static async checkAllServices(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Check API endpoints
    for (const endpoint of this.CRITICAL_ENDPOINTS) {
      const result = await this.checkEndpoint(endpoint);
      results.push(result);

      // Handle failures
      if (result.status === 'down') {
        await this.handleServiceFailure(result);
      } else {
        await this.handleServiceRecovery(result);
      }
    }

    // Check database connectivity
    const dbResult = await this.checkDatabaseHealth();
    results.push(dbResult);

    if (dbResult.status === 'down') {
      await this.handleServiceFailure(dbResult);
    } else {
      await this.handleServiceRecovery(dbResult);
    }

    // Log health check results
    await this.logHealthCheckResults(results);

    return results;
  }

  /**
   * Check individual endpoint health
   */
  private static async checkEndpoint(endpoint: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const service = `api:${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;
      const status: ServiceStatus = response.ok
        ? responseTimeMs > this.RESPONSE_TIME_THRESHOLD_MS
          ? 'degraded'
          : 'operational'
        : 'down';

      return {
        service,
        status,
        responseTimeMs,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
          endpoint,
        },
      };
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      return {
        service,
        status: 'down',
        responseTimeMs,
        timestamp: new Date(),
        error: error.message || 'Request failed',
        details: {
          endpoint,
          errorType: error.name,
        },
      };
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const service = 'database:postgres';

    try {
      // Simple query to test database connectivity
      await db.execute(sql`SELECT 1`);

      const responseTimeMs = Date.now() - startTime;
      const status: ServiceStatus =
        responseTimeMs > this.RESPONSE_TIME_THRESHOLD_MS ? 'degraded' : 'operational';

      return {
        service,
        status,
        responseTimeMs,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      return {
        service,
        status: 'down',
        responseTimeMs,
        timestamp: new Date(),
        error: error.message || 'Database connection failed',
        details: {
          errorType: error.name,
        },
      };
    }
  }

  /**
   * Handle service failure
   */
  private static async handleServiceFailure(
    result: HealthCheckResult
  ): Promise<void> {
    const { service } = result;

    // Increment consecutive failures
    const failures = (this.consecutiveFailures.get(service) || 0) + 1;
    this.consecutiveFailures.set(service, failures);

    // Track downtime start
    if (!this.downtimeStart.get(service)) {
      this.downtimeStart.set(service, new Date());
    }

    // Alert on threshold
    if (failures >= this.CONSECUTIVE_FAILURES_THRESHOLD) {
      await this.sendAlert({
        service,
        severity: 'critical',
        message: `Service ${service} is down (${failures} consecutive failures)`,
        timestamp: new Date(),
        details: {
          responseTimeMs: result.responseTimeMs,
          error: result.error,
          ...result.details,
        },
      });

      // Create security incident for critical services
      if (this.isCriticalService(service)) {
        await SecurityIncidentService.createIncident({
          incidentType: 'system_failure',
          severity: 'critical',
          title: `Critical service ${service} is down`,
          description: `Service ${service} has failed health checks ${failures} times consecutively. Error: ${result.error || 'Unknown'}`,
          affectedSystems: [service],
          metadata: {
            consecutiveFailures: failures,
            responseTimeMs: result.responseTimeMs,
            error: result.error,
            ...result.details,
          },
        });
      }
    }
  }

  /**
   * Handle service recovery
   */
  private static async handleServiceRecovery(
    result: HealthCheckResult
  ): Promise<void> {
    const { service } = result;
    const previousFailures = this.consecutiveFailures.get(service) || 0;

    // If recovering from failure, send recovery alert
    if (previousFailures >= this.CONSECUTIVE_FAILURES_THRESHOLD) {
      const downtimeStartTime = this.downtimeStart.get(service);
      const downtimeDurationMs = downtimeStartTime
        ? Date.now() - downtimeStartTime.getTime()
        : 0;

      await this.sendAlert({
        service,
        severity: 'warning',
        message: `Service ${service} has recovered`,
        timestamp: new Date(),
        details: {
          downtimeDurationMs,
          downtimeDurationMinutes: (downtimeDurationMs / (1000 * 60)).toFixed(2),
          previousFailures,
        },
      });

      // Check if downtime exceeded RTO
      if (downtimeDurationMs > this.RTO_MS) {
        console.warn(
          `[UptimeMonitoringService] Service ${service} exceeded RTO: ${(downtimeDurationMs / (1000 * 60)).toFixed(2)} minutes (limit: ${this.RTO_MS / (1000 * 60)} minutes)`
        );
      }
    }

    // Reset failure tracking
    this.consecutiveFailures.set(service, 0);
    this.downtimeStart.set(service, null);
  }

  /**
   * Send alert through configured channels
   */
  private static async sendAlert(alert: Alert): Promise<void> {
    try {
      // Rate limit alerts (don't send more than once per 5 minutes per service)
      const lastAlert = this.lastAlertTime.get(alert.service) || 0;
      const timeSinceLastAlert = Date.now() - lastAlert;
      const minAlertInterval = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastAlert < minAlertInterval) {
        console.log(
          `[UptimeMonitoringService] Alert rate limited for ${alert.service} (${(timeSinceLastAlert / 1000).toFixed(0)}s since last alert)`
        );
        return;
      }

      this.lastAlertTime.set(alert.service, Date.now());

      // Log alert
      console.warn('[UptimeMonitoringService] ALERT:', alert);

      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'uptime-monitoring',
            alert,
          }),
        });
      }

      // Log to system logs
      await db.insert(systemLogs).values({
        tenantId: null,
        userId: null,
        level: alert.severity === 'critical' ? 'error' : 'warn',
        category: 'uptime_monitoring',
        message: alert.message,
        metadata: {
          service: alert.service,
          timestamp: alert.timestamp.toISOString(),
          ...alert.details,
        },
      });
    } catch (error: any) {
      console.error('[UptimeMonitoringService] Failed to send alert:', error);
    }
  }

  /**
   * Log health check results
   */
  private static async logHealthCheckResults(
    results: HealthCheckResult[]
  ): Promise<void> {
    try {
      for (const result of results) {
        await db.insert(systemLogs).values({
          tenantId: null,
          userId: null,
          level: result.status === 'operational' ? 'info' : 'warn',
          category: 'health_check',
          message: `Health check: ${result.service} - ${result.status}`,
          metadata: {
            service: result.service,
            status: result.status,
            responseTimeMs: result.responseTimeMs,
            error: result.error,
            ...result.details,
          },
        });
      }
    } catch (error) {
      console.error('[UptimeMonitoringService] Failed to log health check results:', error);
    }
  }

  /**
   * Get uptime metrics for a service
   */
  static async getUptimeMetrics(
    service: string,
    startDate: Date,
    endDate: Date
  ): Promise<UptimeMetrics> {
    try {
      // In production, query from a dedicated metrics database or time-series database
      // For now, calculate from system logs

      const logs = await db
        .select()
        .from(systemLogs)
        .where(
          and(
            eq(systemLogs.category, 'health_check'),
            sql`${systemLogs.metadata}->>'service' = ${service}`,
            gte(systemLogs.createdAt, startDate),
            sql`${systemLogs.createdAt} <= ${endDate}`
          )
        );

      const totalChecks = logs.length;
      const successfulChecks = logs.filter(
        (log) =>
          (log.metadata as any)?.status === 'operational' ||
          (log.metadata as any)?.status === 'degraded'
      ).length;
      const failedChecks = totalChecks - successfulChecks;

      const uptimePercentage =
        totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

      const responseTimes = logs
        .map((log) => (log.metadata as any)?.responseTimeMs)
        .filter((time) => typeof time === 'number');
      const averageResponseTimeMs =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      // Calculate downtime duration (approximate)
      const downtimeDurationMs =
        (failedChecks * this.CHECK_INTERVAL_MS);

      // Count downtime incidents (consecutive failures)
      let downtimeIncidents = 0;
      let consecutiveFailures = 0;
      for (const log of logs) {
        if ((log.metadata as any)?.status === 'down') {
          consecutiveFailures++;
        } else {
          if (consecutiveFailures >= this.CONSECUTIVE_FAILURES_THRESHOLD) {
            downtimeIncidents++;
          }
          consecutiveFailures = 0;
        }
      }

      return {
        uptimePercentage,
        totalChecks,
        successfulChecks,
        failedChecks,
        averageResponseTimeMs,
        lastCheckAt: logs[logs.length - 1]?.createdAt || new Date(),
        downtimeDurationMs,
        downtimeIncidents,
      };
    } catch (error: any) {
      console.error('[UptimeMonitoringService] Get uptime metrics error:', error);
      return {
        uptimePercentage: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTimeMs: 0,
        lastCheckAt: new Date(),
        downtimeDurationMs: 0,
        downtimeIncidents: 0,
      };
    }
  }

  /**
   * Get overall system uptime
   */
  static async getSystemUptime(startDate: Date, endDate: Date): Promise<UptimeMetrics> {
    try {
      // Get metrics for all critical services
      const serviceMetrics = await Promise.all(
        [...this.CRITICAL_ENDPOINTS.map((e) => `api:${e}`), 'database:postgres'].map(
          (service) => this.getUptimeMetrics(service, startDate, endDate)
        )
      );

      // Calculate overall metrics
      const totalChecks = serviceMetrics.reduce((sum, m) => sum + m.totalChecks, 0);
      const successfulChecks = serviceMetrics.reduce(
        (sum, m) => sum + m.successfulChecks,
        0
      );
      const failedChecks = serviceMetrics.reduce((sum, m) => sum + m.failedChecks, 0);

      const uptimePercentage =
        totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

      const averageResponseTimeMs =
        serviceMetrics.reduce((sum, m) => sum + m.averageResponseTimeMs, 0) /
        serviceMetrics.length;

      const downtimeDurationMs = Math.max(
        ...serviceMetrics.map((m) => m.downtimeDurationMs)
      );

      const downtimeIncidents = serviceMetrics.reduce(
        (sum, m) => sum + m.downtimeIncidents,
        0
      );

      return {
        uptimePercentage,
        totalChecks,
        successfulChecks,
        failedChecks,
        averageResponseTimeMs,
        lastCheckAt: new Date(),
        downtimeDurationMs,
        downtimeIncidents,
      };
    } catch (error: any) {
      console.error('[UptimeMonitoringService] Get system uptime error:', error);
      return {
        uptimePercentage: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTimeMs: 0,
        lastCheckAt: new Date(),
        downtimeDurationMs: 0,
        downtimeIncidents: 0,
      };
    }
  }

  /**
   * Check if uptime meets PSD-12 requirements
   */
  static async checkComplianceStatus(
    startDate: Date,
    endDate: Date
  ): Promise<{
    compliant: boolean;
    uptimePercentage: number;
    downtimeDurationMs: number;
    maxAllowedDowntimeMs: number;
    details: string[];
  }> {
    const metrics = await this.getSystemUptime(startDate, endDate);
    const details: string[] = [];

    // Calculate max allowed downtime for the period
    const periodDurationMs = endDate.getTime() - startDate.getTime();
    const maxAllowedDowntimeMs =
      (periodDurationMs * (100 - this.TARGET_UPTIME_PERCENTAGE)) / 100;

    // Check uptime percentage
    const uptimeCompliant =
      metrics.uptimePercentage >= this.TARGET_UPTIME_PERCENTAGE;
    if (!uptimeCompliant) {
      details.push(
        `Uptime ${metrics.uptimePercentage.toFixed(3)}% is below target ${this.TARGET_UPTIME_PERCENTAGE}%`
      );
    }

    // Check downtime duration
    const downtimeCompliant = metrics.downtimeDurationMs <= maxAllowedDowntimeMs;
    if (!downtimeCompliant) {
      details.push(
        `Downtime ${(metrics.downtimeDurationMs / (1000 * 60)).toFixed(2)} minutes exceeds limit ${(maxAllowedDowntimeMs / (1000 * 60)).toFixed(2)} minutes`
      );
    }

    return {
      compliant: uptimeCompliant && downtimeCompliant,
      uptimePercentage: metrics.uptimePercentage,
      downtimeDurationMs: metrics.downtimeDurationMs,
      maxAllowedDowntimeMs,
      details,
    };
  }

  /**
   * Check if service is critical
   */
  private static isCriticalService(service: string): boolean {
    return (
      this.CRITICAL_ENDPOINTS.some((endpoint) => service === `api:${endpoint}`) ||
      service === 'database:postgres'
    );
  }
}

// ============================================================================
// CRON JOB HELPER
// ============================================================================

/**
 * Uptime monitoring cron job
 * Should be called every minute
 */
export async function runUptimeMonitoringCheck(): Promise<void> {
  try {
    console.log('[UptimeMonitoringService] Running health checks...');
    const results = await UptimeMonitoringService.checkAllServices();

    const downServices = results.filter((r) => r.status === 'down');
    if (downServices.length > 0) {
      console.warn(
        `[UptimeMonitoringService] ${downServices.length} services are down:`,
        downServices.map((r) => r.service)
      );
    } else {
      console.log('[UptimeMonitoringService] All services operational');
    }
  } catch (error: any) {
    console.error('[UptimeMonitoringService] Health check failed:', error);
  }
}
