/**
 * PEP Screening Service
 * 
 * Purpose: Politically Exposed Person identification and enhanced due diligence
 * Location: lib/services/compliance/PEPScreeningService.ts
 * 
 * Features:
 * - PEP database management
 * - Guest PEP screening and matching
 * - Enhanced Due Diligence (EDD) workflow
 * - Source of wealth/funds verification
 * - Close associate and family member identification
 * - 12-month cooling-off period tracking
 * 
 * Compliance: FIA Section 25 - Enhanced CDD for PEPs
 */

import { db } from '@/lib/db';
import { eq, and, or, like, sql, desc } from 'drizzle-orm';
import {
  amlPepDatabase,
  amlGuestPepFlags,
  amlDueDiligenceRecords,
  guests,
  type NewAmlPepDatabase,
  type NewAmlGuestPepFlag,
  type NewAmlDueDiligenceRecord,
  type AmlPepDatabase,
  type AmlGuestPepFlag,
} from '@/lib/db/schema';

export interface PEPCreateRequest {
  tenantId: string;
  fullName: string;
  dateOfBirth?: Date;
  nationality?: string;
  idNumber?: string;
  passportNumber?: string;
  pepCategory: string;
  positionTitle: string;
  organization?: string;
  countryOfOffice?: string;
  isDomesticPep?: boolean;
  isForeignPep?: boolean;
  source: string;
  verifiedBy: string;
}

export interface PEPScreeningResult {
  isMatch: boolean;
  matches: Array<{
    pepId: string;
    fullName: string;
    pepCategory: string;
    matchConfidence: number;
    matchReason: string;
  }>;
  requiresEDD: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface EDDRequest {
  tenantId: string;
  guestId: string;
  pepFlagId?: string;
  sourceOfWealth: string;
  sourceOfFunds: string;
  purposeOfRelationship: string;
  expectedTransactionVolume: string;
  assessedBy: string;
}

export class PEPScreeningService {
  private static toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Add a new PEP to the database
   */
  static async addPEP(request: PEPCreateRequest): Promise<AmlPepDatabase> {
    const pepRecord: NewAmlPepDatabase = {
      tenantId: request.tenantId,
      fullName: request.fullName,
      dateOfBirth: request.dateOfBirth ? this.toDateString(request.dateOfBirth) : undefined,
      nationality: request.nationality,
      idNumber: request.idNumber,
      passportNumber: request.passportNumber,
      pepCategory: request.pepCategory,
      positionTitle: request.positionTitle,
      organization: request.organization,
      countryOfOffice: request.countryOfOffice,
      isDomesticPep: request.isDomesticPep || false,
      isForeignPep: request.isForeignPep || false,
      riskLevel: 'high', // PEPs are always high risk by default
      source: request.source,
      verifiedBy: request.verifiedBy,
      verificationDate: this.toDateString(new Date()),
      isActive: true,
      metadata: {},
    };

    const [inserted] = await db
      .insert(amlPepDatabase)
      .values(pepRecord)
      .returning();

    return inserted;
  }

  /**
   * Screen a guest against PEP database
   */
  static async screenGuest(
    guestId: string,
    tenantId: string
  ): Promise<PEPScreeningResult> {
    // Get guest details
    const [guest] = await db
      .select()
      .from(guests)
      .where(eq(guests.id, guestId))
      .limit(1);

    if (!guest) {
      throw new Error('Guest not found');
    }

    const matches: PEPScreeningResult['matches'] = [];

    // 1. Exact name match
    const exactMatches = await this.findExactNameMatch(
      guest.firstName || '',
      guest.lastName || '',
      tenantId
    );
    matches.push(...exactMatches);

    // 2. ID/Passport number match
    if (guest.idNumber || guest.passportNumber) {
      const idMatches = await this.findIdMatch(
        guest.idNumber,
        guest.passportNumber,
        tenantId
      );
      matches.push(...idMatches);
    }

    // 3. Fuzzy name matching (for close associates)
    const fuzzyMatches = await this.findFuzzyNameMatch(
      guest.firstName || '',
      guest.lastName || '',
      tenantId
    );
    matches.push(...fuzzyMatches);

    const isMatch = matches.length > 0;
    const requiresEDD = isMatch;

    // Determine risk level based on matches
    let riskLevel: PEPScreeningResult['riskLevel'] = 'low';
    if (isMatch) {
      const highestConfidence = Math.max(...matches.map(m => m.matchConfidence));
      if (highestConfidence >= 90) riskLevel = 'critical';
      else if (highestConfidence >= 70) riskLevel = 'high';
      else riskLevel = 'medium';
    }

    // If match found, create PEP flag
    if (isMatch && matches.length > 0) {
      await this.createPEPFlag(guestId, tenantId, matches[0]);
    }

    return {
      isMatch,
      matches,
      requiresEDD,
      riskLevel,
    };
  }

  /**
   * Find exact name matches in PEP database
   */
  private static async findExactNameMatch(
    firstName: string,
    lastName: string,
    tenantId: string
  ): Promise<PEPScreeningResult['matches']> {
    const fullName = `${firstName} ${lastName}`.trim();
    
    const peps = await db
      .select()
      .from(amlPepDatabase)
      .where(
        and(
          eq(amlPepDatabase.tenantId, tenantId),
          eq(amlPepDatabase.isActive, true),
          like(amlPepDatabase.fullName, `%${fullName}%`)
        )
      );

    return peps.map(pep => ({
      pepId: pep.id,
      fullName: pep.fullName,
      pepCategory: pep.pepCategory,
      matchConfidence: 95,
      matchReason: 'Exact name match',
    }));
  }

  /**
   * Find ID/Passport number matches
   */
  private static async findIdMatch(
    idNumber: string | null,
    passportNumber: string | null,
    tenantId: string
  ): Promise<PEPScreeningResult['matches']> {
    if (!idNumber && !passportNumber) return [];

    const peps = await db
      .select()
      .from(amlPepDatabase)
      .where(
        and(
          eq(amlPepDatabase.tenantId, tenantId),
          eq(amlPepDatabase.isActive, true),
          or(
            idNumber ? eq(amlPepDatabase.idNumber, idNumber) : undefined,
            passportNumber ? eq(amlPepDatabase.passportNumber, passportNumber) : undefined
          )
        )
      );

    return peps.map(pep => ({
      pepId: pep.id,
      fullName: pep.fullName,
      pepCategory: pep.pepCategory,
      matchConfidence: 100,
      matchReason: 'ID/Passport number match',
    }));
  }

  /**
   * Find fuzzy name matches (for close associates/family)
   */
  private static async findFuzzyNameMatch(
    firstName: string,
    lastName: string,
    tenantId: string
  ): Promise<PEPScreeningResult['matches']> {
    // Using PostgreSQL trigram similarity
    const similarityThreshold = 0.6;

    const peps = await db
      .select()
      .from(amlPepDatabase)
      .where(
        and(
          eq(amlPepDatabase.tenantId, tenantId),
          eq(amlPepDatabase.isActive, true),
          sql`similarity(full_name, ${`${firstName} ${lastName}`.trim()}) > ${similarityThreshold}`
        )
      );

    return peps.map(pep => ({
      pepId: pep.id,
      fullName: pep.fullName,
      pepCategory: pep.pepCategory,
      matchConfidence: 65,
      matchReason: 'Fuzzy name match - possible close associate',
    }));
  }

  /**
   * Create a PEP flag for a guest
   */
  private static async createPEPFlag(
    guestId: string,
    tenantId: string,
    match: PEPScreeningResult['matches'][0]
  ): Promise<AmlGuestPepFlag> {
    // Check if flag already exists
    const existing = await db
      .select()
      .from(amlGuestPepFlags)
      .where(
        and(
          eq(amlGuestPepFlags.guestId, guestId),
          eq(amlGuestPepFlags.pepId, match.pepId),
          eq(amlGuestPepFlags.isActive, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const flag: NewAmlGuestPepFlag = {
      tenantId,
      guestId,
      pepId: match.pepId,
      flagType: match.matchConfidence >= 90 ? 'direct_match' : 'close_associate',
      matchConfidence: match.matchConfidence.toString(),
      matchCriteria: { reason: match.matchReason },
      eddCompleted: false,
      ongoingMonitoringLevel: 'enhanced',
      isActive: true,
      metadata: {},
    };

    const [inserted] = await db
      .insert(amlGuestPepFlags)
      .values(flag)
      .returning();

    return inserted;
  }

  /**
   * Initiate Enhanced Due Diligence (EDD) process
   */
  static async initiateEDD(request: EDDRequest): Promise<void> {
    const ddRecord: NewAmlDueDiligenceRecord = {
      tenantId: request.tenantId,
      guestId: request.guestId,
      ddLevel: 'enhanced',
      riskLevel: 'high',
      riskAssessmentDate: this.toDateString(new Date()),
      riskAssessmentBy: request.assessedBy,
      
      sourceOfWealthDeclared: request.sourceOfWealth,
      sourceOfWealthVerified: false,
      
      sourceOfFundsDeclared: request.sourceOfFunds,
      sourceOfFundsVerified: false,
      
      purposeOfRelationship: request.purposeOfRelationship,
      expectedTransactionVolume: request.expectedTransactionVolume,
      
      isPep: true,
      pepFlagId: request.pepFlagId,
      
      reviewFrequencyDays: 90, // Enhanced monitoring: quarterly reviews
      nextReviewDate: this.toDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      
      approved: false,
      metadata: {},
    };

    await db.insert(amlDueDiligenceRecords).values(ddRecord);
  }

  /**
   * Complete EDD verification
   */
  static async completeEDD(
    recordId: string,
    approvedBy: string,
    verificationNotes: string
  ): Promise<void> {
    await db
      .update(amlDueDiligenceRecords)
      .set({
        sourceOfWealthVerified: true,
        sourceOfFundsVerified: true,
        approved: true,
        approvedBy,
        approvedAt: new Date(),
        notes: verificationNotes,
        updatedAt: new Date(),
      })
      .where(eq(amlDueDiligenceRecords.id, recordId));
  }

  /**
   * Get all active PEP flags for a tenant
   */
  static async getActivePEPFlags(tenantId: string) {
    return await db
      .select({
        flag: amlGuestPepFlags,
        pep: amlPepDatabase,
        guest: guests,
      })
      .from(amlGuestPepFlags)
      .leftJoin(amlPepDatabase, eq(amlGuestPepFlags.pepId, amlPepDatabase.id))
      .leftJoin(guests, eq(amlGuestPepFlags.guestId, guests.id))
      .where(
        and(
          eq(amlGuestPepFlags.tenantId, tenantId),
          eq(amlGuestPepFlags.isActive, true)
        )
      )
      .orderBy(desc(amlGuestPepFlags.createdAt));
  }

  /**
   * Check if a PEP is in cooling-off period
   */
  static async checkCoolingOffPeriod(pepId: string): Promise<boolean> {
    const [pep] = await db
      .select()
      .from(amlPepDatabase)
      .where(eq(amlPepDatabase.id, pepId))
      .limit(1);

    if (!pep || !pep.positionEndDate) return false;

    const coolingOffEnd = pep.coolingOffPeriodEnd
      ? new Date(pep.coolingOffPeriodEnd)
      : new Date(new Date(pep.positionEndDate).getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months

    return new Date() < coolingOffEnd;
  }

  /**
   * Get pending EDD reviews
   */
  static async getPendingEDDReviews(tenantId: string) {
    return await db
      .select()
      .from(amlDueDiligenceRecords)
      .where(
        and(
          eq(amlDueDiligenceRecords.tenantId, tenantId),
          eq(amlDueDiligenceRecords.approved, false),
          eq(amlDueDiligenceRecords.isPep, true)
        )
      )
      .orderBy(desc(amlDueDiligenceRecords.createdAt));
  }

  /**
   * Update PEP status (e.g., when they leave office)
   */
  static async updatePEPStatus(
    pepId: string,
    positionEndDate: Date,
    exitInterviewCompleted: boolean
  ): Promise<void> {
    const coolingOffPeriodEnd = new Date(
      positionEndDate.getTime() + 365 * 24 * 60 * 60 * 1000
    );

    await db
      .update(amlPepDatabase)
      .set({
        positionEndDate: this.toDateString(positionEndDate),
        exitInterviewCompleted,
        coolingOffPeriodEnd: this.toDateString(coolingOffPeriodEnd),
        isActive: false, // Mark as inactive but keep for cooling-off tracking
        updatedAt: new Date(),
      })
      .where(eq(amlPepDatabase.id, pepId));
  }

  /**
   * Search PEP database
   */
  static async searchPEPs(
    tenantId: string,
    searchTerm: string,
    limit = 20
  ) {
    return await db
      .select()
      .from(amlPepDatabase)
      .where(
        and(
          eq(amlPepDatabase.tenantId, tenantId),
          or(
            like(amlPepDatabase.fullName, `%${searchTerm}%`),
            like(amlPepDatabase.organization, `%${searchTerm}%`),
            like(amlPepDatabase.positionTitle, `%${searchTerm}%`)
          )
        )
      )
      .orderBy(desc(amlPepDatabase.createdAt))
      .limit(limit);
  }
}
