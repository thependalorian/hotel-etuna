/**
 * SOC 2 control catalog — Hotel Etuna mapped to AICPA TSC + NayaOne Type II reference controls.
 * Location: lib/compliance/soc2/control-catalog.ts
 *
 * Minimum viable scope: Security (mandatory) + Availability + Confidentiality (Buffr/enterprise buyers).
 */

import type { Soc2AgentId, Soc2TrustCategory } from '@/lib/compliance/soc2/types';

export interface Soc2ControlDefinition {
  controlId: string;
  tscReference: string;
  category: Soc2TrustCategory;
  title: string;
  nayaoneControlRef: string | null;
  agentId: Soc2AgentId;
  hotelEtunaMapping: string;
}

export const SOC2_FRAMEWORK_REFERENCE =
  'AICPA TSC (2017); benchmark: NayaOne Limited SOC 2 Type II (Feb 2023–Feb 2024)';

export const HOTEL_ETUNA_SOC2_SCOPE = {
  organization: 'Buffr Financial Services CC (platform operator) / Etuna Guesthouse and Tours CC (property)',
  system: 'Hotel Etuna PMS — Next.js 14 on Vercel, Neon PostgreSQL, Qdrant (RAG), Adumo Virtual payments',
  inScope: [
    'Production Vercel deployment',
    'Neon PostgreSQL (tenant data)',
    'Hub staff dashboard & guest portal',
    'Payment sessions & webhooks',
    'Audit trail & compliance modules',
  ],
  outOfScope: [
    'Local developer machines (unless processing production data)',
    'Adumo/AWS carved-out subservice controls (CUECs reviewed separately)',
    'NamRA ITAS filing workflows (tax, not TSC)',
  ],
} as const;

export const SOC2_CONTROL_CATALOG: Soc2ControlDefinition[] = [
  {
    controlId: 'HE-SOC2-CC1-01',
    tscReference: 'CC1.1',
    category: 'security',
    title: 'Control environment — security policies documented',
    nayaoneControlRef: 'CC1',
    agentId: 'access_control',
    hotelEtunaMapping: 'PLANNING.md security architecture; formal policy pack pending',
  },
  {
    controlId: 'HE-SOC2-CC6-01',
    tscReference: 'CC6.1',
    category: 'security',
    title: 'Logical access — RBAC on API routes',
    nayaoneControlRef: '26-27',
    agentId: 'access_control',
    hotelEtunaMapping: 'withApiAuth, requireRole, proxy.ts hub routes',
  },
  {
    controlId: 'HE-SOC2-CC6-02',
    tscReference: 'CC6.1',
    category: 'security',
    title: 'Multi-factor authentication for sensitive operations',
    nayaoneControlRef: '31-35',
    agentId: 'access_control',
    hotelEtunaMapping: '2FA on payments (x-2fa-verified), TwoFactorAuthService',
  },
  {
    controlId: 'HE-SOC2-CC6-03',
    tscReference: 'CC6.1',
    category: 'security',
    title: 'Tenant isolation (RLS)',
    nayaoneControlRef: '26',
    agentId: 'access_control',
    hotelEtunaMapping: 'PostgreSQL RLS migrations, runWithTenantContext',
  },
  {
    controlId: 'HE-SOC2-CC6-04',
    tscReference: 'CC6.6',
    category: 'security',
    title: 'Rate limiting on APIs',
    nayaoneControlRef: '42',
    agentId: 'access_control',
    hotelEtunaMapping: 'lib/utils/rate-limit.ts, proxy.ts',
  },
  {
    controlId: 'HE-SOC2-CC6-05',
    tscReference: 'CC6.7',
    category: 'confidentiality',
    title: 'Encryption in transit & security headers',
    nayaoneControlRef: '36',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'HTTPS (Vercel), CSP, X-Frame-Options in proxy.ts',
  },
  {
    controlId: 'HE-SOC2-CC7-01',
    tscReference: 'CC7.2',
    category: 'security',
    title: 'Security monitoring & audit logging',
    nayaoneControlRef: '49',
    agentId: 'monitoring_incidents',
    hotelEtunaMapping: 'audit_trail, system_logs, security-logger',
  },
  {
    controlId: 'HE-SOC2-CC7-02',
    tscReference: 'CC7.3',
    category: 'security',
    title: 'Incident response capability',
    nayaoneControlRef: '56',
    agentId: 'monitoring_incidents',
    hotelEtunaMapping: 'cybersecurity_incidents, bon_incident_reports (PSD-12)',
  },
  {
    controlId: 'HE-SOC2-CC8-01',
    tscReference: 'CC8.1',
    category: 'security',
    title: 'Change management — code review & migrations',
    nayaoneControlRef: '58-65',
    agentId: 'change_management',
    hotelEtunaMapping: 'Git PR workflow, database/drizzle forward migrations',
  },
  {
    controlId: 'HE-SOC2-A1-01',
    tscReference: 'A1.2',
    category: 'availability',
    title: 'Database backup & recovery',
    nayaoneControlRef: 'DB backup',
    agentId: 'availability',
    hotelEtunaMapping: 'Neon PITR (per plan); restore test documentation pending',
  },
  {
    controlId: 'HE-SOC2-A1-02',
    tscReference: 'A1.3',
    category: 'availability',
    title: 'Disaster recovery & SLA communication',
    nayaoneControlRef: 'DR',
    agentId: 'availability',
    hotelEtunaMapping: 'Vercel SLA; formal DR playbook pending',
  },
  {
    controlId: 'HE-SOC2-C1-01',
    tscReference: 'C1.1',
    category: 'confidentiality',
    title: 'Guest PII handling & consent',
    nayaoneControlRef: '16',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'CRM consent API, KYC cases, POPIA/GDPR backlog in PRD',
  },
  {
    controlId: 'HE-SOC2-C1-02',
    tscReference: 'C1.2',
    category: 'confidentiality',
    title: 'Processing integrity — folio & payment audit trail',
    nayaoneControlRef: 'PI overlap',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'booking_charges, transactions, payment_security_audit',
  },
  {
    controlId: 'HE-SOC2-VEN-01',
    tscReference: 'CC9.2',
    category: 'security',
    title: 'Subservice organization — Vercel, Neon, Adumo CUECs',
    nayaoneControlRef: '68-69',
    agentId: 'vendor_subservice',
    hotelEtunaMapping: 'Carved-out: review Vercel/Neon/Adumo SOC reports annually',
  },
];
