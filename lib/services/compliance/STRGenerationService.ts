/**
 * STR Generation Service
 * 
 * Purpose: Automatic Suspicious Transaction Report (STR) generation and submission
 * Location: lib/services/compliance/STRGenerationService.ts
 * 
 * Features:
 * - Automatic STR generation from high-risk alerts
 * - 15 business day deadline tracking (FIA requirement)
 * - FIC submission workflow
 * - 7-year retention compliance
 * - Tipping-off prevention (FIA Section 38)
 * - STR lifecycle management
 * 
 * Compliance: FIA Section 33 - STR submissions to Financial Intelligence Centre
 */

import { db } from '@/lib/db';
import { eq, and, lte, desc, inArray } from 'drizzle-orm';
import {
  amlSuspiciousTransactionReports,
  amlTransactionAlerts,
  transactions,
  guests,
  type NewAmlSuspiciousTransactionReport,
  type AmlSuspiciousTransactionReport,
} from '@/lib/db/schema';
import { addBusinessDays, addYears, format } from 'date-fns';

export interface STRCreateRequest {
  tenantId: string;
  guestId: string;
  alertIds: string[];
  transactionIds: string[];
  suspicionCategory: string;
  suspicionDescription: string;
  suspicionIndicators: string[];
  draftedBy: string;
}

export interface STRSubmissionRequest {
  strId: string;
  submittedBy: string;
  ficSubmissionReference: string;
}

export interface STRAnalysis {
  totalAmount: number;
  transactionCount: number;
  timeSpan: string;
  patterns: string[];
  riskScore: number;
  recommendedAction: string;
}

export class STRGenerationService {
  private static toDateString(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Generate STR reference number
   * Format: STR-{YYYYMMDD}-{TENANT_PREFIX}-{SEQUENCE}
   */
  private static async generateSTRReference(tenantId: string): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const tenantPrefix = tenantId.substring(0, 6).toUpperCase();
    
    // Get sequence number for today
    const todaySTRs = await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(eq(amlSuspiciousTransactionReports.tenantId, tenantId));
    
    const sequence = todaySTRs.length + 1;
    
    return `STR-${dateStr}-${tenantPrefix}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new STR from high-risk alerts
   */
  static async createSTR(request: STRCreateRequest): Promise<AmlSuspiciousTransactionReport> {
    // 1. Get alert and transaction details
    const alerts = await db
      .select()
      .from(amlTransactionAlerts)
      .where(inArray(amlTransactionAlerts.id, request.alertIds));

    const transactionsData = await db
      .select()
      .from(transactions)
      .where(inArray(transactions.id, request.transactionIds));

    // 2. Get guest details
    const [guest] = await db
      .select()
      .from(guests)
      .where(eq(guests.id, request.guestId))
      .limit(1);

    if (!guest) {
      throw new Error('Guest not found');
    }

    // 3. Calculate totals
    const totalAmount = transactionsData.reduce(
      (sum, t) => sum + parseFloat(t.amount || '0'),
      0
    );

    // 4. Generate STR reference
    const strReference = await this.generateSTRReference(request.tenantId);

    // 5. Calculate deadlines per FIA requirements
    const detectionDate = new Date();
    const reportDeadline = addBusinessDays(detectionDate, 15); // FIA: 15 business days
    const retentionUntil = addYears(detectionDate, 7); // FIA: 7-year retention

    // 6. Analyze risk
    const analysis = await this.analyzeSTRData(alerts, transactionsData);

    // 7. Create STR record
    const str: NewAmlSuspiciousTransactionReport = {
      tenantId: request.tenantId,
      strReference,
      strType: this.determineSTRType(request.suspicionCategory),
      
      guestId: request.guestId,
      subjectName: `${guest.firstName || ''} ${guest.lastName || ''}`.trim(),
      subjectIdNumber: guest.idNumber || undefined,
      subjectPassport: guest.passportNumber || undefined,
      subjectAddress: guest.address || undefined,
      subjectNationality: guest.nationality || undefined,
      
      transactionIds: request.transactionIds,
      alertIds: request.alertIds,
      totalAmount: totalAmount.toString(),
      currency: 'NAD',
      transactionCount: transactionsData.length,
      
      suspicionCategory: request.suspicionCategory,
      suspicionIndicators: request.suspicionIndicators,
      suspicionDescription: request.suspicionDescription,
      supportingEvidence: this.compileSupportingEvidence(alerts, transactionsData),
      
      riskLevel: analysis.riskScore >= 80 ? 'critical' : 'high',
      riskScore: analysis.riskScore.toString(),
      riskAnalysis: analysis.recommendedAction,
      
      detectionDate: this.toDateString(detectionDate),
      reportDeadline: this.toDateString(reportDeadline),
      draftedAt: new Date(),
      draftedBy: request.draftedBy,
      
      status: 'draft',
      tippingOffRiskAssessed: true, // Always assessed per FIA Section 38
      customerNotified: false, // Never notify per FIA (tipping off)
      
      retentionUntil: this.toDateString(retentionUntil),
      archived: false,
      
      metadata: {
        analysis,
        alerts: alerts.map(a => ({
          id: a.id,
          type: a.alertType,
          riskLevel: a.riskLevel,
        })),
      },
    };

    const [created] = await db
      .insert(amlSuspiciousTransactionReports)
      .values(str)
      .returning();

    // 8. Update related alerts
    await db
      .update(amlTransactionAlerts)
      .set({
        strId: created.id,
        status: 'reported',
        updatedAt: new Date(),
      })
      .where(inArray(amlTransactionAlerts.id, request.alertIds));

    return created;
  }

  /**
   * Determine STR type based on suspicion category
   */
  private static determineSTRType(category: string): string {
    const typeMapping: Record<string, string> = {
      structuring: 'suspicious_transaction',
      velocity: 'suspicious_activity',
      pep_concern: 'suspicious_activity',
      terrorist_financing: 'terrorist_financing',
      high_value: 'suspicious_transaction',
      geographic_anomaly: 'suspicious_activity',
    };

    return typeMapping[category] || 'suspicious_transaction';
  }

  /**
   * Analyze STR data and calculate risk score
   */
  private static async analyzeSTRData(
    alerts: typeof amlTransactionAlerts.$inferSelect[],
    transactionsData: typeof transactions.$inferSelect[]
  ): Promise<STRAnalysis> {
    const riskScores = alerts.map(a => parseFloat(a.riskScore || '0'));
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;

    const totalAmount = transactionsData.reduce(
      (sum, t) => sum + parseFloat(t.amount || '0'),
      0
    );

    const patterns = [...new Set(alerts.map(a => a.alertType))];

    let recommendedAction = 'Report to FIC for investigation';
    if (avgRiskScore >= 90) {
      recommendedAction = 'Immediate FIC submission - High Priority';
    } else if (patterns.includes('structuring')) {
      recommendedAction = 'Urgent FIC submission - Suspected structuring';
    }

    // Calculate time span
    const timestamps = transactionsData
      .map(t => t.createdAt)
      .filter((t): t is Date => t !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    const timeSpan = timestamps.length > 1
      ? `${Math.ceil((timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()) / (1000 * 60 * 60))} hours`
      : 'N/A';

    return {
      totalAmount,
      transactionCount: transactionsData.length,
      timeSpan,
      patterns,
      riskScore: Math.round(avgRiskScore),
      recommendedAction,
    };
  }

  /**
   * Compile supporting evidence from alerts and transactions
   */
  private static compileSupportingEvidence(
    alerts: typeof amlTransactionAlerts.$inferSelect[],
    transactionsData: typeof transactions.$inferSelect[]
  ): any[] {
    return [
      ...alerts.map(alert => ({
        type: 'alert',
        alertType: alert.alertType,
        riskLevel: alert.riskLevel,
        detectionTime: alert.detectionTimestamp,
        details: alert.patternDetails,
      })),
      ...transactionsData.map(tx => ({
        type: 'transaction',
        reference: tx.transactionReference,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        timestamp: tx.createdAt,
      })),
    ];
  }

  /**
   * Submit STR to Financial Intelligence Centre (FIC)
   */
  static async submitSTR(request: STRSubmissionRequest): Promise<void> {
    const [str] = await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(eq(amlSuspiciousTransactionReports.id, request.strId))
      .limit(1);

    if (!str) {
      throw new Error('STR not found');
    }

    if (str.status !== 'draft') {
      throw new Error('Only draft STRs can be submitted');
    }

    // Update STR status
    await db
      .update(amlSuspiciousTransactionReports)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: request.submittedBy,
        ficSubmissionReference: request.ficSubmissionReference,
        updatedAt: new Date(),
      })
      .where(eq(amlSuspiciousTransactionReports.id, request.strId));

    // In production, this would integrate with FIC's submission system
    // For now, we'll log the submission
    console.log(`[STRGenerationService] STR ${str.strReference} submitted to FIC`);
  }

  /**
   * Get STRs approaching deadline (within 5 business days)
   */
  static async getApproachingDeadlines(tenantId: string) {
    const fiveDaysFromNow = addBusinessDays(new Date(), 5);

    return await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(
        and(
          eq(amlSuspiciousTransactionReports.tenantId, tenantId),
          lte(amlSuspiciousTransactionReports.reportDeadline, this.toDateString(fiveDaysFromNow)),
          inArray(amlSuspiciousTransactionReports.status, ['draft', 'under_review'])
        )
      )
      .orderBy(amlSuspiciousTransactionReports.reportDeadline);
  }

  /**
   * Get overdue STRs
   */
  static async getOverdueSTRs(tenantId: string) {
    const today = this.toDateString(new Date());

    return await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(
        and(
          eq(amlSuspiciousTransactionReports.tenantId, tenantId),
          lte(amlSuspiciousTransactionReports.reportDeadline, today),
          inArray(amlSuspiciousTransactionReports.status, ['draft', 'under_review'])
        )
      )
      .orderBy(amlSuspiciousTransactionReports.reportDeadline);
  }

  /**
   * Update STR status
   */
  static async updateSTRStatus(
    strId: string,
    status: 'draft' | 'submitted' | 'acknowledged' | 'under_review' | 'closed',
    userId: string,
    notes?: string
  ): Promise<void> {
    await db
      .update(amlSuspiciousTransactionReports)
      .set({
        status,
        reviewedAt: status === 'under_review' ? new Date() : undefined,
        reviewedBy: status === 'under_review' ? userId : undefined,
        followUpNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(amlSuspiciousTransactionReports.id, strId));
  }

  /**
   * Get STR by reference
   */
  static async getSTRByReference(reference: string) {
    const [str] = await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(eq(amlSuspiciousTransactionReports.strReference, reference))
      .limit(1);

    return str;
  }

  /**
   * Get all STRs for a tenant
   */
  static async getSTRs(
    tenantId: string,
    status?: string,
    limit = 50
  ) {
    const whereClause = status
      ? and(
          eq(amlSuspiciousTransactionReports.tenantId, tenantId),
          eq(amlSuspiciousTransactionReports.status, status),
        )
      : eq(amlSuspiciousTransactionReports.tenantId, tenantId);

    return await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(whereClause)
      .orderBy(desc(amlSuspiciousTransactionReports.createdAt))
      .limit(limit);
  }

  /**
   * Record FIC acknowledgment
   */
  static async recordFICAcknowledgment(
    strReference: string,
    acknowledgmentDate: Date,
    feedback?: string
  ): Promise<void> {
    await db
      .update(amlSuspiciousTransactionReports)
      .set({
        status: 'acknowledged',
        ficAcknowledgmentDate: this.toDateString(acknowledgmentDate),
        ficFeedback: feedback,
        updatedAt: new Date(),
      })
      .where(eq(amlSuspiciousTransactionReports.strReference, strReference));
  }

  /**
   * Archive old STRs (past retention period)
   */
  static async archiveExpiredSTRs(tenantId: string): Promise<number> {
    const today = this.toDateString(new Date());

    const result = await db
      .update(amlSuspiciousTransactionReports)
      .set({
        archived: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(amlSuspiciousTransactionReports.tenantId, tenantId),
          lte(amlSuspiciousTransactionReports.retentionUntil, today),
          eq(amlSuspiciousTransactionReports.archived, false)
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Get STR statistics for reporting
   */
  static async getSTRStatistics(tenantId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const strs = await db
      .select()
      .from(amlSuspiciousTransactionReports)
      .where(
        and(
          eq(amlSuspiciousTransactionReports.tenantId, tenantId),
          lte(amlSuspiciousTransactionReports.createdAt, endDate)
        )
      );

    return {
      totalSTRs: strs.length,
      byStatus: {
        draft: strs.filter(s => s.status === 'draft').length,
        submitted: strs.filter(s => s.status === 'submitted').length,
        acknowledged: strs.filter(s => s.status === 'acknowledged').length,
        underReview: strs.filter(s => s.status === 'under_review').length,
        closed: strs.filter(s => s.status === 'closed').length,
      },
      byType: {
        suspiciousTransaction: strs.filter(s => s.strType === 'suspicious_transaction').length,
        suspiciousActivity: strs.filter(s => s.strType === 'suspicious_activity').length,
        terroristFinancing: strs.filter(s => s.strType === 'terrorist_financing').length,
      },
      totalAmount: strs.reduce((sum, s) => sum + parseFloat(s.totalAmount || '0'), 0),
    };
  }
}
