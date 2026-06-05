/**
 * Security Incident Logging Service (PSD-12 Compliance)
 * 
 * Purpose: Log and manage security incidents as per PSD-12 requirements
 * Location: /lib/services/security/SecurityIncidentService.ts
 * 
 * PSD-12 Requirements:
 * - All security incidents must be logged within the cybersecurity_incidents table
 * - Incidents must include: severity, detection time, response time, resolution time
 * - Bank of Namibia must be notified of critical incidents within 2 hours
 * - RPO (Recovery Point Objective): 5 minutes for critical systems
 * - RTO (Recovery Time Objective): Within 2 hours
 * 
 * Incident Types:
 * - Unauthorized access attempts
 * - Data breaches
 * - System failures
 * - DDoS attacks
 * - Malware detection
 * - Configuration changes
 * - Failed authentication attempts
 * 
 * Following System Design Principles:
 * - Security Architecture (Incident Management)
 * - Compliance & Audit
 * - Error Handling & Logging
 * 
 * @version 1.0.0
 * @since 2026-04-21
 */

import { db, cybersecurityIncidents, auditTrail } from '@/lib/db';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { securityLogger } from '@/lib/utils/security-logger';

// ============================================================================
// TYPES
// ============================================================================

export type IncidentType =
  | 'unauthorized_access'
  | 'data_breach'
  | 'system_failure'
  | 'ddos_attack'
  | 'malware'
  | 'config_change'
  | 'failed_auth'
  | 'fraud_detected'
  | 'payment_failure'
  | 'api_abuse'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus =
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'resolved'
  | 'closed';

export interface CreateIncidentRequest {
  tenantId?: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  affectedSystems?: string[];
  affectedUsers?: string[];
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface IncidentReport {
  incidentId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  detectedAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  reportedToBonAt?: Date;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  affectedSystems: string[];
  affectedUsers: string[];
  metadata?: Record<string, unknown>;
}

export interface IncidentStatistics {
  totalIncidents: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  averageResponseTimeMinutes: number;
  averageResolutionTimeMinutes: number;
  criticalIncidentsLast24h: number;
  unresolvedIncidents: number;
}

// ============================================================================
// SECURITY INCIDENT SERVICE
// ============================================================================

export class SecurityIncidentService {
  // PSD-12 Requirements
  private static readonly BON_NOTIFICATION_THRESHOLD_MINUTES = 120; // 2 hours
  private static readonly CRITICAL_INCIDENT_RTO_MINUTES = 120; // 2 hours
  private static readonly CRITICAL_INCIDENT_RPO_MINUTES = 5; // 5 minutes

  /**
   * Create security incident
   * PSD-12 REQUIREMENT: Log all security incidents
   */
  static async createIncident(
    request: CreateIncidentRequest
  ): Promise<IncidentReport> {
    try {
      const detectedAt = new Date();

      // Insert incident into database
      const [incident] = await db
        .insert(cybersecurityIncidents)
        .values({
          tenantId: request.tenantId || null,
          incidentReference: `INC-${Date.now()}`,
          incidentType: request.incidentType,
          severity: request.severity,
          status: 'open',
          incidentDescription: request.description,
          affectedSystems: request.affectedSystems || [],
          detectedAt,
          bonReportingDeadline: new Date(
            detectedAt.getTime() + this.BON_NOTIFICATION_THRESHOLD_MINUTES * 60 * 1000
          ),
          financialLoss: null,
          availabilityLossMinutes: null,
          updatedAt: detectedAt,
        })
        .returning();

      // Log to audit trail
      await db.insert(auditTrail).values({
        tenantId: request.tenantId || null,
        userId: null,
        action: 'security_incident_created',
        resourceType: 'security_incident',
        resourceId: incident.id,
        newValues: {
          incidentType: request.incidentType,
          severity: request.severity,
          title: request.title,
          detectedAt: detectedAt.toISOString(),
        },
        ipAddress: request.ipAddress || null,
        userAgent: request.userAgent || null,
      });

      // If critical, trigger BoN notification workflow
      if (request.severity === 'critical') {
        await this.triggerBonNotificationWorkflow(incident.id);
      }

      return this.formatIncidentReport(incident);
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Create incident error:', error);
      throw new Error(`Failed to create security incident: ${error.message}`);
    }
  }

  /**
   * Update incident status
   */
  static async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    notes?: string
  ): Promise<IncidentReport> {
    try {
      const now = new Date();

      // Get current incident
      const current = await db.query.cybersecurityIncidents.findFirst({
        where: eq(cybersecurityIncidents.id, incidentId),
      });

      if (!current) {
        throw new Error(`Incident not found: ${incidentId}`);
      }

      // Calculate response and resolution times
      const updates: any = {
        status,
        updatedAt: now,
      };

      if (status === 'investigating' && !current.recoveryStartedAt) {
        updates.recoveryStartedAt = now;
      }

      if (status === 'resolved' && !current.recoveryCompletedAt) {
        updates.recoveryCompletedAt = now;
        updates.recoveryTimeMinutes = this.calculateMinutesDiff(
          current.detectedAt,
          now
        );

        // Check if resolution time meets PSD-12 RTO requirements
        if (
          current.severity === 'critical' &&
          updates.recoveryTimeMinutes > this.CRITICAL_INCIDENT_RTO_MINUTES
        ) {
          securityLogger.warn(
            `[SecurityIncidentService] Critical incident ${incidentId} exceeded RTO: ${updates.recoveryTimeMinutes} minutes (limit: ${this.CRITICAL_INCIDENT_RTO_MINUTES})`
          );
        }
      }

      // Update incident
      const [updated] = await db
        .update(cybersecurityIncidents)
        .set(updates)
        .where(eq(cybersecurityIncidents.id, incidentId))
        .returning();

      // Log to audit trail
      await db.insert(auditTrail).values({
        tenantId: current.tenantId || null,
        userId: null,
        action: 'security_incident_updated',
        resourceType: 'security_incident',
        resourceId: incidentId,
        oldValues: {
          status: current.status,
        },
        newValues: {
          status,
          notes,
          updatedAt: now.toISOString(),
        },
      });

      return this.formatIncidentReport(updated);
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Update incident status error:', error);
      throw new Error(`Failed to update incident status: ${error.message}`);
    }
  }

  /**
   * Report incident to Bank of Namibia
   * PSD-12 REQUIREMENT: Critical incidents must be reported within 2 hours
   */
  static async reportToBoN(incidentId: string): Promise<boolean> {
    try {
      const incident = await db.query.cybersecurityIncidents.findFirst({
        where: eq(cybersecurityIncidents.id, incidentId),
      });

      if (!incident) {
        throw new Error(`Incident not found: ${incidentId}`);
      }

      const now = new Date();

      // Check if already reported
      if (incident.reportedToBonAt) {
        securityLogger.warn(`Incident ${incidentId} already reported to BoN`);
        return true;
      }

      // Check if within notification threshold
      const minutesSinceDetection = this.calculateMinutesDiff(
        incident.detectedAt,
        now
      );

      if (minutesSinceDetection > this.BON_NOTIFICATION_THRESHOLD_MINUTES) {
        securityLogger.warn(
          `[SecurityIncidentService] Incident ${incidentId} reported to BoN after threshold: ${minutesSinceDetection} minutes (limit: ${this.BON_NOTIFICATION_THRESHOLD_MINUTES})`
        );
      }

      const bonApiUrl = process.env.BON_API_URL;
      const bonApiKey = process.env.BON_API_KEY;
      const reportPayload = {
        incidentId: incident.id,
        incidentType: incident.incidentType,
        severity: incident.severity,
        title: incident.incidentReference,
        description: incident.incidentDescription,
        detectedAt: incident.detectedAt.toISOString(),
        minutesSinceDetection,
      };

      if (bonApiUrl && bonApiKey) {
        const response = await fetch(`${bonApiUrl.replace(/\/$/, '')}/incidents`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bonApiKey}`,
            'Content-Type': 'application/json',
            'X-Reporting-Entity': 'buffr-host',
          },
          body: JSON.stringify(reportPayload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`BoN API error (${response.status}): ${text}`);
        }
      } else {
        securityLogger.warn(
          '[SecurityIncidentService] BON_API_URL/BON_API_KEY missing; BoN submission simulated',
          reportPayload
        );
      }

      // Update incident with BoN notification timestamp
      await db
        .update(cybersecurityIncidents)
        .set({
          reportedToBonAt: now,
          updatedAt: now,
        })
        .where(eq(cybersecurityIncidents.id, incidentId));

      // Log to audit trail
      await db.insert(auditTrail).values({
        tenantId: incident.tenantId || null,
        userId: null,
        action: 'security_incident_reported_to_bon',
        resourceType: 'security_incident',
        resourceId: incidentId,
        newValues: {
          reportedAt: now.toISOString(),
          minutesSinceDetection,
        },
      });

      return true;
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Report to BoN error:', error);
      return false;
    }
  }

  /**
   * Get incident by ID
   */
  static async getIncident(incidentId: string): Promise<IncidentReport | null> {
    try {
      const incident = await db.query.cybersecurityIncidents.findFirst({
        where: eq(cybersecurityIncidents.id, incidentId),
      });

      if (!incident) {
        return null;
      }

      return this.formatIncidentReport(incident);
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Get incident error:', error);
      return null;
    }
  }

  /**
   * List incidents with filtering
   */
  static async listIncidents(options?: {
    tenantId?: string;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    limit?: number;
    offset?: number;
  }): Promise<IncidentReport[]> {
    try {
      const { tenantId, severity, status, limit = 50, offset = 0 } = options || {};

      const conditions: any[] = [];
      if (tenantId) {
        conditions.push(eq(cybersecurityIncidents.tenantId, tenantId));
      }
      if (severity) {
        conditions.push(eq(cybersecurityIncidents.severity, severity));
      }
      if (status) {
        conditions.push(eq(cybersecurityIncidents.status, status));
      }

      const incidents = await db
        .select()
        .from(cybersecurityIncidents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(cybersecurityIncidents.detectedAt))
        .limit(limit)
        .offset(offset);

      return incidents.map(this.formatIncidentReport);
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] List incidents error:', error);
      return [];
    }
  }

  /**
   * Get incident statistics
   */
  static async getStatistics(
    tenantId?: string,
    timeWindow?: Date
  ): Promise<IncidentStatistics> {
    try {
      const conditions: any[] = [];
      if (tenantId) {
        conditions.push(eq(cybersecurityIncidents.tenantId, tenantId));
      }
      if (timeWindow) {
        conditions.push(gte(cybersecurityIncidents.detectedAt, timeWindow));
      }

      const incidents = await db
        .select()
        .from(cybersecurityIncidents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Count by type
      const byType: Record<IncidentType, number> = {} as any;
      incidents.forEach((i) => {
        byType[i.incidentType as IncidentType] =
          (byType[i.incidentType as IncidentType] || 0) + 1;
      });

      // Count by severity
      const bySeverity: Record<IncidentSeverity, number> = {} as any;
      incidents.forEach((i) => {
        bySeverity[i.severity as IncidentSeverity] =
          (bySeverity[i.severity as IncidentSeverity] || 0) + 1;
      });

      // Count by status
      const byStatus: Record<IncidentStatus, number> = {} as any;
      incidents.forEach((i) => {
        byStatus[i.status as IncidentStatus] =
          (byStatus[i.status as IncidentStatus] || 0) + 1;
      });

      // Calculate average response and resolution times
      const averageResponseTimeMinutes =
        incidents.length > 0
          ? incidents
              .filter((i) => i.recoveryStartedAt)
              .reduce(
                (sum, i) => sum + this.calculateMinutesDiff(i.detectedAt, i.recoveryStartedAt as Date),
                0
              ) / Math.max(1, incidents.filter((i) => i.recoveryStartedAt).length)
          : 0;

      const withResolutionTime = incidents.filter((i) => i.recoveryTimeMinutes);
      const averageResolutionTimeMinutes =
        withResolutionTime.length > 0
          ? withResolutionTime.reduce(
              (sum, i) => sum + (i.recoveryTimeMinutes || 0),
              0
            ) / withResolutionTime.length
          : 0;

      // Critical incidents in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const criticalIncidentsLast24h = incidents.filter(
        (i) =>
          i.severity === 'critical' &&
          i.detectedAt >= twentyFourHoursAgo
      ).length;

      // Unresolved incidents
      const unresolvedIncidents = incidents.filter(
        (i) => i.status !== 'resolved' && i.status !== 'closed'
      ).length;

      return {
        totalIncidents: incidents.length,
        byType,
        bySeverity,
        byStatus,
        averageResponseTimeMinutes,
        averageResolutionTimeMinutes,
        criticalIncidentsLast24h,
        unresolvedIncidents,
      };
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Get statistics error:', error);
      return {
        totalIncidents: 0,
        byType: {} as any,
        bySeverity: {} as any,
        byStatus: {} as any,
        averageResponseTimeMinutes: 0,
        averageResolutionTimeMinutes: 0,
        criticalIncidentsLast24h: 0,
        unresolvedIncidents: 0,
      };
    }
  }

  /**
   * Check for overdue BoN notifications
   * PSD-12 REQUIREMENT: Critical incidents must be reported within 2 hours
   */
  static async checkOverdueNotifications(): Promise<string[]> {
    try {
      const thresholdTime = new Date(
        Date.now() - this.BON_NOTIFICATION_THRESHOLD_MINUTES * 60 * 1000
      );

      const overdueIncidents = await db
        .select()
        .from(cybersecurityIncidents)
        .where(
          and(
            eq(cybersecurityIncidents.severity, 'critical'),
            sql`${cybersecurityIncidents.reportedToBonAt} IS NULL`,
            sql`${cybersecurityIncidents.detectedAt} < ${thresholdTime}`
          )
        );

      return overdueIncidents.map((i) => i.id);
    } catch (error: any) {
      securityLogger.error('[SecurityIncidentService] Check overdue notifications error:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Trigger Bank of Namibia notification workflow for critical incidents
   */
  private static async triggerBonNotificationWorkflow(
    incidentId: string
  ): Promise<void> {
    securityLogger.warn(
      `[SecurityIncidentService] CRITICAL INCIDENT DETECTED: ${incidentId}. Bank of Namibia must be notified within ${this.BON_NOTIFICATION_THRESHOLD_MINUTES} minutes.`
    );
  }

  /**
   * Calculate minutes difference between two dates
   */
  private static calculateMinutesDiff(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Format incident for response
   */
  private static formatIncidentReport(incident: any): IncidentReport {
    return {
      incidentId: incident.id,
      incidentType: incident.incidentType,
      severity: incident.severity,
      status: (incident.status as IncidentStatus) || 'detected',
      title: incident.incidentReference,
      description: incident.incidentDescription,
      detectedAt: incident.detectedAt,
      respondedAt: incident.recoveryStartedAt || undefined,
      resolvedAt: incident.recoveryCompletedAt || undefined,
      reportedToBonAt: incident.reportedToBonAt || undefined,
      responseTimeMinutes: incident.recoveryStartedAt
        ? this.calculateMinutesDiff(incident.detectedAt, incident.recoveryStartedAt)
        : undefined,
      resolutionTimeMinutes: incident.recoveryTimeMinutes || undefined,
      affectedSystems: incident.affectedSystems || [],
      affectedUsers: [],
      metadata: incident.metadata as Record<string, unknown> || undefined,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create incident from request
 */
export async function createIncidentFromRequest(
  req: NextRequest,
  incidentType: IncidentType,
  severity: IncidentSeverity,
  title: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<IncidentReport> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return SecurityIncidentService.createIncident({
    incidentType,
    severity,
    title,
    description,
    ipAddress: ip,
    userAgent: req.headers.get('user-agent') || undefined,
    metadata: {
      pathname: req.nextUrl.pathname,
      method: req.method,
      ...metadata,
    },
  });
}

/**
 * Log security incident (shorthand)
 */
export async function logSecurityIncident(
  type: IncidentType,
  severity: IncidentSeverity,
  title: string,
  description: string,
  options?: {
    tenantId?: string;
    affectedSystems?: string[];
    affectedUsers?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await SecurityIncidentService.createIncident({
      tenantId: options?.tenantId,
      incidentType: type,
      severity,
      title,
      description,
      affectedSystems: options?.affectedSystems,
      affectedUsers: options?.affectedUsers,
      metadata: options?.metadata,
    });
  } catch (error) {
    securityLogger.error('[logSecurityIncident] Failed to log incident:', error);
  }
}
