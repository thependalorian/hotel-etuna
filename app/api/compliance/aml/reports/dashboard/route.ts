/**
 * AML Compliance Dashboard API
 * 
 * Purpose: Aggregated compliance reporting and statistics
 * Endpoint: GET /api/compliance/aml/reports/dashboard
 * 
 * Features:
 * - Real-time alert statistics
 * - STR submission tracking
 * - Deadline warnings
 * 
 * Compliance: FIA reporting requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { AMLMonitoringService } from '@/lib/services/compliance/AMLMonitoringService';
import { STRGenerationService } from '@/lib/services/compliance/STRGenerationService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const tenantId = user.tenantId;
      const year = parseInt(req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString());

      // Fetch all compliance data in parallel
      const [
        pendingAlerts,
        approachingDeadlines,
        overdueSTRs,
        strStatistics,
      ] = await Promise.all([
        AMLMonitoringService.getPendingAlerts(tenantId),
        STRGenerationService.getApproachingDeadlines(tenantId),
        STRGenerationService.getOverdueSTRs(tenantId),
        STRGenerationService.getSTRStatistics(tenantId, year),
      ]);

      // Calculate risk distribution
      const riskDistribution = {
        critical: pendingAlerts.filter(a => a.riskLevel === 'critical').length,
        high: pendingAlerts.filter(a => a.riskLevel === 'high').length,
        medium: pendingAlerts.filter(a => a.riskLevel === 'medium').length,
        low: pendingAlerts.filter(a => a.riskLevel === 'low').length,
      };

      // Alert type breakdown
      const alertTypes = pendingAlerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            pendingAlerts: pendingAlerts.length,
            approachingDeadlines: approachingDeadlines.length,
            overdueSTRs: overdueSTRs.length,
          },
          alerts: {
            total: pendingAlerts.length,
            riskDistribution,
            byType: alertTypes,
            recentAlerts: pendingAlerts.slice(0, 10),
          },
          str: {
            ...strStatistics,
            approachingDeadlines: approachingDeadlines.length,
            overdue: overdueSTRs.length,
            deadlineWarnings: approachingDeadlines.slice(0, 5).map(str => ({
              strReference: str.strReference,
              deadline: str.reportDeadline,
              daysRemaining: Math.ceil(
                (new Date(str.reportDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
            })),
          },
        },
      }, { status: 200 });
    } catch (error) {
      securityLogger.error('[AML Dashboard API] Error:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      }, { status: 500 });
    }
  });
}
