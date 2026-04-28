/**
 * KYC / KYB LangGraph workflows
 *
 * Purpose: State-machine style validation aligned with tiered KYC (lite/full) and
 * individual vs business evidence checks; queues manual review by default.
 * Location: /lib/workflows/kycKybGraph.ts
 *
 * Pattern follows LangGraph StateGraph + Annotation (cyclical graphs, explicit nodes/edges).
 * Human decisions run in a separate small graph so serverless deployments do not rely on
 * an in-memory checkpointer across requests — case state is persisted in Postgres.
 */

import { Annotation, StateGraph } from '@langchain/langgraph';
import { strListReducer } from '@/lib/workflows/graphReducers';

/** External shape for documents attached to a case */
export type KycDocumentInput = { documentType: string; fileUrl: string };

export type KycCaseStatus =
  | 'draft'
  | 'needs_info'
  | 'pending_manual_review'
  | 'approved'
  | 'rejected';

/** Graph state — serialized to compliance_verification_cases.workflow_snapshot */
export const KycWorkflowState = Annotation.Root({
  tenantId: Annotation<string>,
  caseId: Annotation<string>,
  subjectType: Annotation<string>,
  subjectParty: Annotation<'individual' | 'business'>,
  kycTier: Annotation<'lite' | 'full'>,
  profile: Annotation<Record<string, unknown>>,
  documents: Annotation<KycDocumentInput[]>,
  validationErrors: Annotation<string[]>({
    reducer: strListReducer,
    default: () => [],
  }),
  missingDocumentTypes: Annotation<string[]>({
    reducer: strListReducer,
    default: () => [],
  }),
  caseStatus: Annotation<KycCaseStatus | undefined>,
  workflowStage: Annotation<string | undefined>,
  /** When true and tier is lite + validation clean, graph can auto-approve (off by default) */
  allowAutoApproveLite: Annotation<boolean | undefined>,
});

export type KycWorkflowStateType = typeof KycWorkflowState.State;

function str(p: Record<string, unknown>, key: string): string | undefined {
  const v = p[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function requiredDocsFor(
  party: 'individual' | 'business',
  tier: 'lite' | 'full'
): string[] {
  const baseIndividual =
    tier === 'lite'
      ? ['national_id_or_passport']
      : ['national_id_or_passport', 'proof_of_address'];
  const baseBusiness =
    tier === 'lite'
      ? ['company_registration', 'national_id_or_passport']
      : [
          'company_registration',
          'national_id_or_passport',
          'proof_of_address',
          'proof_of_business_activity',
        ];
  return party === 'business' ? baseBusiness : baseIndividual;
}

function intakeNode(state: KycWorkflowStateType): Partial<KycWorkflowStateType> {
  return {
    workflowStage: 'intake_complete',
    validationErrors: [],
    missingDocumentTypes: [],
  };
}

function validateNode(state: KycWorkflowStateType): Partial<KycWorkflowStateType> {
  const errors: string[] = [];
  const missingDocs: string[] = [];
  const profile = state.profile || {};
  const party = state.subjectParty;
  const tier = state.kycTier;

  const fullName = str(profile, 'fullName');
  const nationality = str(profile, 'nationality');
  const idNumber = str(profile, 'nationalIdOrPassport');
  if (!fullName) errors.push('Missing full name');
  if (!nationality) errors.push('Missing nationality');
  if (!idNumber) errors.push('Missing national ID or passport number');

  if (tier === 'full') {
    if (!str(profile, 'residentialAddress')) errors.push('Missing residential address (full tier)');
    const phone = str(profile, 'phone');
    const email = str(profile, 'email');
    if (!phone && !email) errors.push('Missing contact information (phone or email)');
  }

  if (party === 'business') {
    if (!str(profile, 'companyRegistration')) {
      errors.push('Missing company registration (business)');
    }
    if (tier === 'full') {
      if (!str(profile, 'natureOfBusiness') && !str(profile, 'businessLocation')) {
        errors.push('Missing nature or location of business activity (full business tier)');
      }
    }
  }

  const presentTypes = new Set(
    (state.documents || []).map((d: KycDocumentInput) =>
      d.documentType.toLowerCase().trim()
    )
  );
  for (const req of requiredDocsFor(party, tier)) {
    if (!presentTypes.has(req)) missingDocs.push(req);
  }

  return {
    validationErrors: errors,
    missingDocumentTypes: missingDocs,
    workflowStage: 'validated',
  };
}

function routeAfterValidate(state: KycWorkflowStateType): string {
  if (state.validationErrors.length > 0 || state.missingDocumentTypes.length > 0) {
    return 'needs_info';
  }
  if (state.allowAutoApproveLite === true && state.kycTier === 'lite') {
    return 'auto_approve';
  }
  return 'manual_review';
}

function finalizeNeedsInfo(state: KycWorkflowStateType): Partial<KycWorkflowStateType> {
  return {
    caseStatus: 'needs_info',
    workflowStage: 'closed_needs_info',
  };
}

function queueManual(state: KycWorkflowStateType): Partial<KycWorkflowStateType> {
  return {
    caseStatus: 'pending_manual_review',
    workflowStage: 'awaiting_reviewer',
  };
}

function autoApprove(state: KycWorkflowStateType): Partial<KycWorkflowStateType> {
  return {
    caseStatus: 'approved',
    workflowStage: 'auto_approved_lite',
  };
}

export function compileKycValidationGraph() {
  const graph = new StateGraph(KycWorkflowState)
    .addNode('intake', intakeNode)
    .addNode('validate', validateNode)
    .addNode('finalize_needs_info', finalizeNeedsInfo)
    .addNode('queue_manual', queueManual)
    .addNode('auto_approve', autoApprove)
    .addEdge('__start__', 'intake')
    .addEdge('intake', 'validate')
    .addConditionalEdges('validate', routeAfterValidate, {
      needs_info: 'finalize_needs_info',
      manual_review: 'queue_manual',
      auto_approve: 'auto_approve',
    })
    .addEdge('finalize_needs_info', '__end__')
    .addEdge('queue_manual', '__end__')
    .addEdge('auto_approve', '__end__');

  return graph.compile();
}

// --- Reviewer decision graph (single shot; loads snapshot from DB in service) ---

export const KycDecisionState = Annotation.Root({
  caseId: Annotation<string>,
  tenantId: Annotation<string>,
  subjectType: Annotation<string>,
  reviewerUserId: Annotation<string>,
  decision: Annotation<'approve' | 'reject' | 'needs_info'>,
  notes: Annotation<string | undefined>,
  caseStatus: Annotation<KycCaseStatus | undefined>,
  workflowStage: Annotation<string | undefined>,
});

export type KycDecisionStateType = typeof KycDecisionState.State;

function applyReviewerDecision(
  state: KycDecisionStateType
): Partial<KycDecisionStateType> {
  const map: Record<string, KycCaseStatus> = {
    approve: 'approved',
    reject: 'rejected',
    needs_info: 'needs_info',
  };
  return {
    caseStatus: map[state.decision],
    workflowStage: 'reviewer_decision_applied',
  };
}

export function compileKycDecisionGraph() {
  const graph = new StateGraph(KycDecisionState)
    .addNode('apply_decision', applyReviewerDecision)
    .addEdge('__start__', 'apply_decision')
    .addEdge('apply_decision', '__end__');
  return graph.compile();
}
