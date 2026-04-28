/**
 * Compliance verification service — KYC/KYB cases, documents, LangGraph runs
 *
 * Purpose: Persist cases, attach documents, invoke kycKybGraph workflows, sync staff status
 * Location: /lib/services/compliance/ComplianceVerificationService.ts
 */

import { db } from '@/lib/db';
import {
  complianceVerificationCases,
  complianceVerificationDocuments,
  staff,
  type NewComplianceVerificationCaseRow,
  type NewComplianceVerificationDocumentRow,
} from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { handleServiceError } from '@/lib/utils/errors';
import {
  compileKycDecisionGraph,
  compileKycValidationGraph,
  type KycDocumentInput,
  type KycWorkflowStateType,
} from '@/lib/workflows/kycKybGraph';

export class ComplianceVerificationService {
  async listCases(tenantId: string, status?: string) {
    try {
      const rows = await db
        .select()
        .from(complianceVerificationCases)
        .where(
          status
            ? and(
                eq(complianceVerificationCases.tenantId, tenantId),
                eq(complianceVerificationCases.status, status)
              )
            : eq(complianceVerificationCases.tenantId, tenantId)
        )
        .orderBy(desc(complianceVerificationCases.updatedAt));
      return rows;
    } catch (e) {
      throw handleServiceError(e, 'list compliance cases');
    }
  }

  async getCase(tenantId: string, caseId: string) {
    try {
      const [row] = await db
        .select()
        .from(complianceVerificationCases)
        .where(
          and(
            eq(complianceVerificationCases.id, caseId),
            eq(complianceVerificationCases.tenantId, tenantId)
          )
        )
        .limit(1);
      return row ?? null;
    } catch (e) {
      throw handleServiceError(e, 'get compliance case');
    }
  }

  async listDocuments(tenantId: string, caseId: string) {
    try {
      return await db
        .select()
        .from(complianceVerificationDocuments)
        .where(
          and(
            eq(complianceVerificationDocuments.caseId, caseId),
            eq(complianceVerificationDocuments.tenantId, tenantId)
          )
        )
        .orderBy(desc(complianceVerificationDocuments.createdAt));
    } catch (e) {
      throw handleServiceError(e, 'list compliance documents');
    }
  }

  async createCase(
    tenantId: string,
    input: {
      subjectType: string;
      subjectId?: string | null;
      subjectParty: 'individual' | 'business';
      kycTier: 'lite' | 'full';
      profile: Record<string, unknown>;
      status?: string;
    }
  ) {
    try {
      const row: NewComplianceVerificationCaseRow = {
        tenantId,
        subjectType: input.subjectType,
        subjectId: input.subjectId ?? null,
        subjectParty: input.subjectParty,
        kycTier: input.kycTier,
        profile: input.profile,
        status: input.status ?? 'draft',
      };
      const [created] = await db
        .insert(complianceVerificationCases)
        .values(row)
        .returning();
      return created;
    } catch (e) {
      throw handleServiceError(e, 'create compliance case');
    }
  }

  async addDocument(
    tenantId: string,
    input: {
      caseId: string;
      documentType: string;
      fileUrl: string;
      fileName?: string;
      uploadedByUserId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    try {
      const row: NewComplianceVerificationDocumentRow = {
        tenantId,
        caseId: input.caseId,
        documentType: input.documentType,
        fileUrl: input.fileUrl,
        fileName: input.fileName ?? null,
        uploadedByUserId: input.uploadedByUserId ?? null,
        metadata: input.metadata ?? null,
      };
      const [doc] = await db
        .insert(complianceVerificationDocuments)
        .values(row)
        .returning();
      return doc;
    } catch (e) {
      throw handleServiceError(e, 'add compliance document');
    }
  }

  /** Load documents and run LangGraph validation → updates case status + snapshot */
  async runValidationWorkflow(
    tenantId: string,
    caseId: string,
    options?: { allowAutoApproveLite?: boolean }
  ) {
    try {
      const caseRow = await this.getCase(tenantId, caseId);
      if (!caseRow) throw new Error('Case not found');

      const docs = await this.listDocuments(tenantId, caseId);
      const documents: KycDocumentInput[] = docs.map((d) => ({
        documentType: d.documentType,
        fileUrl: d.fileUrl,
      }));

      const graph = compileKycValidationGraph();
      const initial: Partial<KycWorkflowStateType> = {
        tenantId,
        caseId,
        subjectType: caseRow.subjectType,
        subjectParty: caseRow.subjectParty as 'individual' | 'business',
        kycTier: caseRow.kycTier as 'lite' | 'full',
        profile: (caseRow.profile || {}) as Record<string, unknown>,
        documents,
        allowAutoApproveLite: options?.allowAutoApproveLite === true,
      };

      const result = await graph.invoke(initial as KycWorkflowStateType);
      const status = result.caseStatus ?? 'draft';

      await db
        .update(complianceVerificationCases)
        .set({
          status,
          workflowStage: result.workflowStage ?? null,
          workflowSnapshot: result as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(complianceVerificationCases.id, caseId),
            eq(complianceVerificationCases.tenantId, tenantId)
          )
        );

      if (
        caseRow.subjectType === 'staff' &&
        caseRow.subjectId &&
        status === 'approved'
      ) {
        await db
          .update(staff)
          .set({ status: 'active', updatedAt: new Date() })
          .where(
            and(eq(staff.id, caseRow.subjectId), eq(staff.tenantId, tenantId))
          );
      }

      return { result, status };
    } catch (e) {
      throw handleServiceError(e, 'run validation workflow');
    }
  }

  async applyReviewerDecision(
    tenantId: string,
    caseId: string,
    reviewerUserId: string,
    decision: 'approve' | 'reject' | 'needs_info',
    notes?: string
  ) {
    try {
      const caseRow = await this.getCase(tenantId, caseId);
      if (!caseRow) throw new Error('Case not found');

      const graph = compileKycDecisionGraph();
      const graphDecision =
        decision === 'approve'
          ? 'approve'
          : decision === 'reject'
            ? 'reject'
            : 'needs_info';
      const out = await graph.invoke({
        caseId,
        tenantId,
        subjectType: caseRow.subjectType,
        reviewerUserId,
        decision: graphDecision,
        notes,
      });

      const status = out.caseStatus ?? caseRow.status;

      await db
        .update(complianceVerificationCases)
        .set({
          status,
          workflowStage: out.workflowStage ?? null,
          workflowSnapshot: out as unknown as Record<string, unknown>,
          reviewerUserId,
          reviewerNotes: notes ?? null,
          decidedAt: ['approved', 'rejected'].includes(status) ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(complianceVerificationCases.id, caseId),
            eq(complianceVerificationCases.tenantId, tenantId)
          )
        );

      if (
        caseRow.subjectType === 'staff' &&
        caseRow.subjectId &&
        status === 'approved'
      ) {
        await db
          .update(staff)
          .set({ status: 'active', updatedAt: new Date() })
          .where(
            and(eq(staff.id, caseRow.subjectId), eq(staff.tenantId, tenantId))
          );
      } else if (
        caseRow.subjectType === 'staff' &&
        caseRow.subjectId &&
        status === 'rejected'
      ) {
        await db
          .update(staff)
          .set({ status: 'inactive', updatedAt: new Date() })
          .where(
            and(eq(staff.id, caseRow.subjectId), eq(staff.tenantId, tenantId))
          );
      }

      return { result: out, status };
    } catch (e) {
      throw handleServiceError(e, 'apply reviewer decision');
    }
  }
}
