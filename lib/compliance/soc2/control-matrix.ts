/**
 * SOC 2 control catalog — Hotel Etuna vs NayaOne Type II baseline (Security, Availability, Confidentiality).
 * Location: lib/compliance/soc2/control-matrix.ts
 */

import type { Soc2ControlResult, Soc2TrustCategory, Soc2AgentId } from './types';

type ControlSeed = Omit<Soc2ControlResult, 'status' | 'evidence' | 'gaps' | 'remediation'>;

export const SOC2_FRAMEWORK_REFERENCE =
  'NayaOne Limited SOC 2 Type II (Feb 2023–Feb 2024); AICPA TSC 2017';

export const HOTEL_ETUNA_SOC2_SCOPE = {
  organization:
    'Buffr Financial Services CC (platform operator) / Etuna Guesthouse and Tours CC (property)',
  system:
    'Hotel Etuna PMS — hoteletuna.com (Next.js 14 on Vercel, Neon PostgreSQL, Qdrant RAG, Adumo Virtual)',
  inScope: [
    'Production Vercel deployment',
    'Neon PostgreSQL (tenant data)',
    'Hub staff dashboard & guest portal',
    'Guest/staff auth, RBAC, RLS',
    'Payment sessions & webhooks (Adumo Virtual)',
    'Audit trail & compliance APIs',
    'Sofia AI concierge (when processing guest PII)',
  ],
  outOfScope: [
    'Local developer machines (unless processing production data)',
    'Adumo/AWS carved-out subservice controls (CUECs reviewed separately)',
    'NamRA ITAS filing workflows (tax, not TSC)',
    'Buffr Bank Windhoek back-office (non-system)',
  ],
} as const;

const SEEDS: ControlSeed[] = [
  {
    controlId: 'CC1.1',
    tscReference: 'CC1',
    category: 'security',
    title: 'Control environment — security policies documented',
    nayaoneControlRef: 'CC1 / policy annual review',
    automated: false,
    agentId: 'access_control',
  },
  {
    controlId: 'CC6.1',
    tscReference: 'CC6.1',
    category: 'security',
    title: 'Logical access — RBAC and least privilege',
    nayaoneControlRef: '26–27',
    automated: true,
    agentId: 'access_control',
  },
  {
    controlId: 'CC6.2',
    tscReference: 'CC6.2',
    category: 'security',
    title: 'Authentication — MFA on sensitive operations',
    nayaoneControlRef: '31–35',
    automated: true,
    agentId: 'access_control',
  },
  {
    controlId: 'CC6.3',
    tscReference: 'CC6.3',
    category: 'security',
    title: 'Access revocation — terminated users disabled',
    nayaoneControlRef: '38',
    automated: true,
    agentId: 'access_control',
  },
  {
    controlId: 'CC6.6',
    tscReference: 'CC6.6',
    category: 'security',
    title: 'Tenant isolation — multi-tenant data segregation',
    nayaoneControlRef: '66 segregation',
    automated: true,
    agentId: 'access_control',
  },
  {
    controlId: 'CC7.1',
    tscReference: 'CC7.1',
    category: 'security',
    title: 'Security monitoring — audit logs retained',
    nayaoneControlRef: '51–52',
    automated: true,
    agentId: 'monitoring_incidents',
  },
  {
    controlId: 'CC7.2',
    tscReference: 'CC7.2',
    category: 'security',
    title: 'Incident management — documented response',
    nayaoneControlRef: '54–56',
    automated: true,
    agentId: 'monitoring_incidents',
  },
  {
    controlId: 'CC8.1',
    tscReference: 'CC8.1',
    category: 'security',
    title: 'Change management — reviewed deployments',
    nayaoneControlRef: '58–65',
    automated: true,
    agentId: 'change_management',
  },
  {
    controlId: 'CC9.2',
    tscReference: 'CC9.2',
    category: 'security',
    title: 'Vendor risk — subservice organizations',
    nayaoneControlRef: '67–69 AWS CUEC',
    automated: false,
    agentId: 'vendor_subservice',
  },
  {
    controlId: 'A1.1',
    tscReference: 'A1.1',
    category: 'availability',
    title: 'Availability commitments — SLA documented',
    nayaoneControlRef: '18–20 SLA',
    automated: true,
    agentId: 'availability',
  },
  {
    controlId: 'A1.2',
    tscReference: 'A1.2',
    category: 'availability',
    title: 'Backup and recovery — database backups',
    nayaoneControlRef: '15 database backup',
    automated: false,
    agentId: 'availability',
  },
  {
    controlId: 'A1.3',
    tscReference: 'A1.3',
    category: 'availability',
    title: 'Operational reconciliation — cash and payments',
    nayaoneControlRef: 'monitoring 70',
    automated: true,
    agentId: 'availability',
  },
  {
    controlId: 'C1.1',
    tscReference: 'C1.1',
    category: 'confidentiality',
    title: 'Encryption in transit — TLS for all sessions',
    nayaoneControlRef: '16 data encryption',
    automated: true,
    agentId: 'confidentiality',
  },
  {
    controlId: 'C1.2',
    tscReference: 'C1.2',
    category: 'confidentiality',
    title: 'Encryption at rest — cloud provider controls',
    nayaoneControlRef: 'AWS carved-out',
    automated: false,
    agentId: 'confidentiality',
  },
  {
    controlId: 'C1.3',
    tscReference: 'C1.3',
    category: 'confidentiality',
    title: 'Confidential data access — payment security audit',
    nayaoneControlRef: 'PSD-12 overlap',
    automated: true,
    agentId: 'confidentiality',
  },
];

export function seedControls(): Soc2ControlResult[] {
  return SEEDS.map((s) => ({
    ...s,
    status: 'manual',
    evidence: [],
    gaps: [],
    remediation: [],
  }));
}

export function scoreControls(controls: Soc2ControlResult[]): number {
  if (controls.length === 0) return 0;
  const weights: Record<Soc2ControlResult['status'], number> = {
    compliant: 1,
    partial: 0.6,
    inherited: 0.85,
    manual: 0.5,
    gap: 0,
  };
  const sum = controls.reduce((acc, c) => acc + weights[c.status], 0);
  return Math.round((sum / controls.length) * 100);
}

export function summarizeControls(controls: Soc2ControlResult[]) {
  return controls.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { compliant: 0, partial: 0, gap: 0, manual: 0, inherited: 0 }
  );
}
