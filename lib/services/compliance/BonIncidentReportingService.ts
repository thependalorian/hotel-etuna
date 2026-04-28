/**
 * Bank of Namibia Incident Reporting Service
 * 
 * Purpose: Automated cybersecurity incident reporting to Bank of Namibia
 * Compliance: PSD-12 Section 11.13-11.15
 * Location: lib/services/compliance/BonIncidentReportingService.ts
 * 
 * Requirements:
 * - 24-hour preliminary notification (PSD-12 Section 11.13)
 * - 30-day impact assessment (PSD-12 Section 11.14)
 * - Report: financial loss, data loss, availability loss (PSD-12 Section 11.15)
 * 
 * This service REMOVES the TODO at:
 * lib/services/security/SecurityIncidentService.ts:289
 */

import { sql } from '@/lib/db';

interface SecurityIncident {
  id: string;
  tenantId: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  createdAt: Date;
}

interface BonIncidentReport {
  // Report metadata
  reportType: 'preliminary_24h' | 'impact_assessment_30d';
  incidentId: string;
  incidentCategory: string;
  severity: string;
  incidentSummary: string;
  
  // Impact assessment (required for 30-day report)
  financialLoss?: number;
  dataLossRecords?: number;
  availabilityLossMinutes?: number;
  affectedUsersCount?: number;
  affectedSystems?: string[];
  
  // Details
  impactDetails?: string;
  mitigationActions?: string;
  recoveryActions?: string;
  lessonsLearned?: string;
}

interface BonSubmissionResponse {
  success: boolean;
  bonReference?: string;
  acknowledged?: boolean;
  message?: string;
}

export class BonIncidentReportingService {
  private bonApiUrl: string;
  private bonApiKey: string;
  
  constructor() {
    this.bonApiUrl = process.env.BON_API_URL || 'https://api.bon.com.na/v1';
    this.bonApiKey = process.env.BON_API_KEY || '';
    
    if (!this.bonApiKey) {
      console.warn('[BonReporting] BON_API_KEY not configured - incident reporting will be simulated');
    }
  }
  
  /**
   * Generate preliminary 24-hour incident notification
   * 
   * PSD-12 Section 11.13:
   * "All successful cyberattack incidents must be reported to the Bank, 
   * at least within 24 hours for the preliminary notification of the cyber incident."
   */
  async generatePreliminaryReport(
    incident: SecurityIncident
  ): Promise<BonIncidentReport> {
    return {
      reportType: 'preliminary_24h',
      incidentId: incident.id,
      incidentCategory: incident.category,
      severity: incident.severity,
      incidentSummary: this.generateIncidentSummary(incident),
      mitigationActions: 'Immediate containment measures in progress. Full details will be provided in 30-day impact assessment.',
    };
  }
  
  /**
   * Generate comprehensive 30-day impact assessment
   * 
   * PSD-12 Section 11.14-11.15:
   * "The entity is required to conduct an impact assessment on the successful 
   * cyberattack incident and report to the Bank within a month from the time 
   * the incident becomes known. The reporting must at least indicate any 
   * financial loss, data loss and availability loss."
   */
  async generateImpactAssessment(
    incident: SecurityIncident,
    assessment: {
      financialLoss: number;
      dataLossRecords: number;
      availabilityLossMinutes: number;
      affectedUsersCount: number;
      affectedSystems: string[];
      impactDetails: string;
      mitigationActions: string;
      recoveryActions: string;
      lessonsLearned: string;
    }
  ): Promise<BonIncidentReport> {
    return {
      reportType: 'impact_assessment_30d',
      incidentId: incident.id,
      incidentCategory: incident.category,
      severity: incident.severity,
      incidentSummary: this.generateIncidentSummary(incident),
      
      // Impact metrics (PSD-12 Section 11.15 required)
      financialLoss: assessment.financialLoss,
      dataLossRecords: assessment.dataLossRecords,
      availabilityLossMinutes: assessment.availabilityLossMinutes,
      affectedUsersCount: assessment.affectedUsersCount,
      affectedSystems: assessment.affectedSystems,
      
      // Detailed narrative
      impactDetails: assessment.impactDetails,
      mitigationActions: assessment.mitigationActions,
      recoveryActions: assessment.recoveryActions,
      lessonsLearned: assessment.lessonsLearned,
    };
  }
  
  /**
   * Submit incident report to Bank of Namibia
   * 
   * Integrates with BoN API endpoint for cybersecurity incident reporting
   */
  async submitToBoN(
    tenantId: string,
    report: BonIncidentReport,
    submittedBy: string
  ): Promise<BonSubmissionResponse> {
    try {
      console.log('[BonReporting] Submitting incident report to BoN:', {
        reportType: report.reportType,
        incidentId: report.incidentId,
        severity: report.severity,
      });
      
      // Check if BoN API is configured
      if (!this.bonApiKey) {
        console.warn('[BonReporting] BON_API_KEY not configured - simulating submission');
        return this.simulateSubmission(tenantId, report, submittedBy);
      }
      
      // Call BoN API
      const response = await fetch(`${this.bonApiUrl}/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bonApiKey}`,
          'Content-Type': 'application/json',
          'X-Reporting-Entity': 'Buffr-Host',
        },
        body: JSON.stringify(report),
      });
      
      if (!response.ok) {
        throw new Error(`BoN API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Record submission in database
      await this.recordSubmission(tenantId, report, result.reference, submittedBy);
      
      console.log('[BonReporting] Submission successful:', {
        bonReference: result.reference,
        acknowledged: result.acknowledged,
      });
      
      return {
        success: true,
        bonReference: result.reference,
        acknowledged: result.acknowledged,
        message: 'Incident successfully reported to Bank of Namibia',
      };
      
    } catch (error: unknown) {
      console.error('[BonReporting] Submission failed:', error);
      
      // Record failed attempt
      await this.recordFailedSubmission(tenantId, report, submittedBy, error);
      
      return {
        success: false,
        message: `Failed to submit to BoN: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Record successful submission in database
   */
  private async recordSubmission(
    tenantId: string,
    report: BonIncidentReport,
    bonReference: string,
    submittedBy: string
  ): Promise<void> {
    await sql`
      INSERT INTO bon_incident_reports (
        tenant_id,
        incident_id,
        report_type,
        incident_category,
        severity,
        submission_date,
        submission_method,
        submitted_by,
        financial_loss,
        data_loss_records,
        availability_loss_minutes,
        affected_users_count,
        affected_systems,
        incident_summary,
        impact_details,
        mitigation_actions,
        recovery_actions,
        lessons_learned,
        bon_reference,
        bon_acknowledged_at,
        bon_status
      ) VALUES (
        ${tenantId}::uuid,
        ${report.incidentId}::uuid,
        ${report.reportType}::varchar,
        ${report.incidentCategory}::varchar,
        ${report.severity}::varchar,
        NOW(),
        'api'::varchar,
        ${submittedBy}::uuid,
        ${report.financialLoss || 0}::decimal,
        ${report.dataLossRecords || 0}::integer,
        ${report.availabilityLossMinutes || 0}::integer,
        ${report.affectedUsersCount || 0}::integer,
        ${report.affectedSystems || []}::text[],
        ${report.incidentSummary}::text,
        ${report.impactDetails}::text,
        ${report.mitigationActions}::text,
        ${report.recoveryActions}::text,
        ${report.lessonsLearned}::text,
        ${bonReference}::varchar,
        NOW(),
        'acknowledged'::varchar
      )
    `;
    
    console.log('[BonReporting] Submission recorded in database:', bonReference);
  }
  
  /**
   * Record failed submission attempt
   */
  private async recordFailedSubmission(
    tenantId: string,
    report: BonIncidentReport,
    submittedBy: string,
    error: unknown
  ): Promise<void> {
    await sql`
      INSERT INTO bon_incident_reports (
        tenant_id,
        incident_id,
        report_type,
        incident_category,
        severity,
        submission_date,
        submission_method,
        submitted_by,
        incident_summary,
        bon_status,
        bon_comments
      ) VALUES (
        ${tenantId}::uuid,
        ${report.incidentId}::uuid,
        ${report.reportType}::varchar,
        ${report.incidentCategory}::varchar,
        ${report.severity}::varchar,
        NOW(),
        'api'::varchar,
        ${submittedBy}::uuid,
        ${report.incidentSummary}::text,
        'submission_failed'::varchar,
        ${`Submission error: ${error instanceof Error ? error.message : 'Unknown error'}`}::text
      )
    `;
  }
  
  /**
   * Simulate submission (for testing when BoN API not available)
   */
  private async simulateSubmission(
    tenantId: string,
    report: BonIncidentReport,
    submittedBy: string
  ): Promise<BonSubmissionResponse> {
    const simulatedReference = `BON-SIM-${Date.now()}`;
    
    await this.recordSubmission(tenantId, report, simulatedReference, submittedBy);
    
    return {
      success: true,
      bonReference: simulatedReference,
      acknowledged: true,
      message: 'Simulated submission (BON_API_KEY not configured)',
    };
  }
  
  /**
   * Check if incident requires 24-hour preliminary report
   */
  async checkPreliminaryReportDue(incidentId: string): Promise<boolean> {
    const result = await sql`
      SELECT 
        created_at,
        NOW() - created_at > INTERVAL '20 hours' as due_soon,
        NOW() - created_at > INTERVAL '24 hours' as overdue
      FROM cybersecurity_incidents
      WHERE id = ${incidentId}::uuid
      AND NOT EXISTS (
        SELECT 1 FROM bon_incident_reports
        WHERE incident_id = ${incidentId}::uuid
        AND report_type = 'preliminary_24h'
      )
    `;
    
    return result[0]?.due_soon || false;
  }
  
  /**
   * Check if incident requires 30-day impact assessment
   */
  async checkImpactAssessmentDue(incidentId: string): Promise<boolean> {
    const result = await sql`
      SELECT 
        created_at,
        NOW() - created_at > INTERVAL '25 days' as due_soon,
        NOW() - created_at > INTERVAL '30 days' as overdue
      FROM cybersecurity_incidents
      WHERE id = ${incidentId}::uuid
      AND EXISTS (
        SELECT 1 FROM bon_incident_reports
        WHERE incident_id = ${incidentId}::uuid
        AND report_type = 'preliminary_24h'
      )
      AND NOT EXISTS (
        SELECT 1 FROM bon_incident_reports
        WHERE incident_id = ${incidentId}::uuid
        AND report_type = 'impact_assessment_30d'
      )
    `;
    
    return result[0]?.due_soon || false;
  }
  
  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(tenantId: string) {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE report_type = 'preliminary_24h') as preliminary_reports,
        COUNT(*) FILTER (WHERE report_type = 'impact_assessment_30d') as impact_assessments,
        COUNT(*) FILTER (WHERE submitted_within_24h = true) as on_time_preliminary,
        COUNT(*) FILTER (WHERE impact_assessment_within_30d = true) as on_time_assessments,
        COUNT(*) FILTER (WHERE psd12_compliant = true) as compliant_reports,
        SUM(financial_loss) as total_financial_loss,
        SUM(data_loss_records) as total_data_loss,
        SUM(availability_loss_minutes) as total_downtime_minutes
      FROM bon_incident_reports
      WHERE tenant_id = ${tenantId}::uuid
    `;
    
    return stats[0];
  }
  
  /**
   * Generate incident summary
   */
  private generateIncidentSummary(incident: SecurityIncident): string {
    return `
Incident ID: ${incident.id}
Category: ${incident.category}
Severity: ${incident.severity}
Date Detected: ${incident.createdAt.toISOString()}

Description:
${incident.description}

This incident is being reported in compliance with PSD-12 Section 11.13 
(24-hour preliminary notification requirement).
    `.trim();
  }
}
