/**
 * Bank of Namibia Incident Reporting API
 * 
 * Purpose: Submit cybersecurity incidents to Bank of Namibia
 * Compliance: PSD-12 Section 11.13-11.15
 * Location: app/api/compliance/psd/bon-incident/route.ts
 * 
 * Requirements:
 * - 24-hour preliminary notification (PSD-12 Section 11.13)
 * - 30-day impact assessment (PSD-12 Section 11.14)
 * - Report: financial loss, data loss, availability loss (PSD-12 Section 11.15)
 * 
 * This endpoint REMOVES the TODO at:
 * lib/services/security/SecurityIncidentService.ts:289
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { BonIncidentReportingService } from '@/lib/services/compliance/BonIncidentReportingService';
import { neon } from '@neondatabase/serverless';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

// Preliminary report schema (24-hour notification)
const preliminaryReportSchema = z.object({
  reportType: z.literal('preliminary_24h'),
  incidentId: entityId('Invalid incident ID'),
  tenantId: entityId('Invalid tenant ID'),
  submittedBy: entityId('Invalid submitter ID'),
});

// Impact assessment schema (30-day report)
const impactAssessmentSchema = z.object({
  reportType: z.literal('impact_assessment_30d'),
  incidentId: entityId('Invalid incident ID'),
  tenantId: entityId('Invalid tenant ID'),
  submittedBy: entityId('Invalid submitter ID'),
  
  // Impact metrics (PSD-12 Section 11.15 required)
  financialLoss: z.number().min(0, 'Financial loss must be non-negative'),
  dataLossRecords: z.number().int().min(0, 'Data loss records must be non-negative'),
  availabilityLossMinutes: z.number().int().min(0, 'Availability loss must be non-negative'),
  affectedUsersCount: z.number().int().min(0, 'Affected users count must be non-negative'),
  affectedSystems: z.array(z.string()).default([]),
  
  // Detailed narrative
  impactDetails: z.string().min(50, 'Impact details must be at least 50 characters'),
  mitigationActions: z.string().min(50, 'Mitigation actions must be at least 50 characters'),
  recoveryActions: z.string().min(50, 'Recovery actions must be at least 50 characters'),
  lessonsLearned: z.string().optional(),
});

const reportSchema = z.discriminatedUnion('reportType', [
  preliminaryReportSchema,
  impactAssessmentSchema,
]);

/**
 * POST /api/compliance/psd/bon-incident
 * 
 * Submit incident report to Bank of Namibia
 * 
 * Report Types:
 * 1. preliminary_24h - Must be submitted within 24 hours of incident
 * 2. impact_assessment_30d - Must be submitted within 30 days of incident
 */
export async function POST(req: NextRequest) {
  return withTenantApiAuth(req, async (request, user) => {
    try {
      // Parse and validate request
      const body = await request.json();
      const validatedData = reportSchema.parse(body);
      
      securityLogger.info('[API:BonIncident] Processing incident report', {
        reportType: validatedData.reportType,
        incidentId: validatedData.incidentId,
        tenantId: user.tenantId,
      });
      
      // Initialize service
      const bonService = new BonIncidentReportingService();
      
      // Generate appropriate report based on type
      let report;
      if (validatedData.reportType === 'preliminary_24h') {
        // Fetch incident details from database
        const sql = neon(process.env.DATABASE_URL!);
        const incident = await sql`
          SELECT id, tenant_id, category, severity, description, created_at
          FROM cybersecurity_incidents
          WHERE id = ${validatedData.incidentId}::uuid
        `;
        
        if (!incident || incident.length === 0) {
          return NextResponse.json(
            { error: 'Incident not found' },
            { status: 404 }
          );
        }
        
        report = await bonService.generatePreliminaryReport({
          id: incident[0].id,
          tenantId: incident[0].tenant_id,
          category: incident[0].category,
          severity: incident[0].severity,
          description: incident[0].description,
          createdAt: new Date(incident[0].created_at),
        });
        
      } else {
        // Impact assessment (30-day)
        const sql = neon(process.env.DATABASE_URL!);
        const incident = await sql`
          SELECT id, tenant_id, category, severity, description, created_at
          FROM cybersecurity_incidents
          WHERE id = ${validatedData.incidentId}::uuid
        `;
        
        if (!incident || incident.length === 0) {
          return NextResponse.json(
            { error: 'Incident not found' },
            { status: 404 }
          );
        }
        
        report = await bonService.generateImpactAssessment(
          {
            id: incident[0].id,
            tenantId: incident[0].tenant_id,
            category: incident[0].category,
            severity: incident[0].severity,
            description: incident[0].description,
            createdAt: new Date(incident[0].created_at),
          },
          {
            financialLoss: validatedData.financialLoss,
            dataLossRecords: validatedData.dataLossRecords,
            availabilityLossMinutes: validatedData.availabilityLossMinutes,
            affectedUsersCount: validatedData.affectedUsersCount,
            affectedSystems: validatedData.affectedSystems,
            impactDetails: validatedData.impactDetails,
            mitigationActions: validatedData.mitigationActions,
            recoveryActions: validatedData.recoveryActions,
            lessonsLearned: validatedData.lessonsLearned || '',
          }
        );
      }
      
      // Submit to Bank of Namibia
      const submissionResult = await bonService.submitToBoN(
        user.tenantId,
        report,
        validatedData.submittedBy
      );
      
      if (!submissionResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to submit to Bank of Namibia',
            message: submissionResult.message,
          },
          { status: 500 }
        );
      }
      
      securityLogger.info('[API:BonIncident] Report submitted successfully', {
        bonReference: submissionResult.bonReference,
        reportType: validatedData.reportType,
        tenantId: user.tenantId,
      });
      
      return NextResponse.json({
        success: true,
        data: {
          bonReference: submissionResult.bonReference,
          acknowledged: submissionResult.acknowledged,
          reportType: validatedData.reportType,
          submittedAt: new Date().toISOString(),
        },
        message: 'Incident successfully reported to Bank of Namibia',
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      
      securityLogger.error('[API:BonIncident] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process incident report',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/compliance/psd/bon-incident (tenant from session via withTenantApiAuth)
 * 
 * Get incident reporting compliance dashboard
 */
export async function GET(req: NextRequest) {
  return withTenantApiAuth(req, async (_request, user) => {
  try {
    const bonService = new BonIncidentReportingService();
    
    // Get compliance dashboard
    const dashboard = await bonService.getComplianceDashboard(user.tenantId);
    
    // Calculate compliance rate
    const totalPreliminary = Number(dashboard.preliminary_reports || 0);
    const onTimePreliminary = Number(dashboard.on_time_preliminary || 0);
    const preliminaryComplianceRate = totalPreliminary > 0 
      ? (onTimePreliminary / totalPreliminary) * 100 
      : 100;
    
    const totalImpact = Number(dashboard.impact_assessments || 0);
    const onTimeImpact = Number(dashboard.on_time_assessments || 0);
    const impactComplianceRate = totalImpact > 0 
      ? (onTimeImpact / totalImpact) * 100 
      : 100;
    
    return NextResponse.json({
      success: true,
      data: {
        dashboard,
        complianceRates: {
          preliminary24h: preliminaryComplianceRate,
          impactAssessment30d: impactComplianceRate,
          overall: (preliminaryComplianceRate + impactComplianceRate) / 2,
        },
        targets: {
          preliminary24h: 100, // 100% within 24 hours
          impactAssessment30d: 100, // 100% within 30 days
        },
      },
    });
    
  } catch (error) {
    securityLogger.error('[API:BonIncident:Stats] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch BoN incident reporting statistics',
      },
      { status: 500 }
    );
  }
  });
}
