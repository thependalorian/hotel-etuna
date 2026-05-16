/**
 * SOC 2 control catalog — NayaOne Type II themes + Hotel Etuna scope (Security-first).
 * Location: lib/compliance/soc2/nayaone-tsc-framework.ts
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

/** Minimum viable scope: Security + Availability + Confidentiality (NayaOne-aligned). */
export const HOTEL_ETUNA_SOC2_CONTROLS: Soc2ControlDefinition[] = [
  {
    controlId: 'CC1.1',
    tscReference: 'CC1',
    category: 'security',
    title: 'Control environment — documented security program',
    nayaoneControlRef: 'Control Environment',
    agentId: 'access_control',
    hotelEtunaMapping: 'PRD §6, PLANNING, BUFFR SLA, regulatory-context',
  },
  {
    controlId: 'CC2.1',
    tscReference: 'CC2',
    category: 'security',
    title: 'Communication — system description and change communication',
    nayaoneControlRef: 'Information and Communication (11–17)',
    agentId: 'change_management',
    hotelEtunaMapping: 'PRD changelog, PLANNING architecture sections',
  },
  {
    controlId: 'CC6.1',
    tscReference: 'CC6.1',
    category: 'security',
    title: 'Logical access — RBAC and least privilege',
    nayaoneControlRef: 'Access Control (26–27)',
    agentId: 'access_control',
    hotelEtunaMapping: 'proxy.ts, withApiAuth requireRole, tenant context',
  },
  {
    controlId: 'CC6.2',
    tscReference: 'CC6.2',
    category: 'security',
    title: 'Authentication — MFA / 2FA for sensitive operations',
    nayaoneControlRef: 'MFA (31–35)',
    agentId: 'access_control',
    hotelEtunaMapping: 'require2FA on payments, user_2fa_settings',
  },
  {
    controlId: 'CC6.3',
    tscReference: 'CC6.3',
    category: 'security',
    title: 'Access revocation on termination',
    nayaoneControlRef: 'Revocation (38–40)',
    agentId: 'access_control',
    hotelEtunaMapping: 'Staff deactivation SOP — manual attestation',
  },
  {
    controlId: 'CC6.6',
    tscReference: 'CC6.6',
    category: 'security',
    title: 'API security — rate limiting and validation',
    nayaoneControlRef: 'Network (42)',
    agentId: 'access_control',
    hotelEtunaMapping: 'lib/utils/rate-limit.ts, Zod validation',
  },
  {
    controlId: 'CC6.7',
    tscReference: 'CC6.7',
    category: 'confidentiality',
    title: 'Encryption in transit and for sensitive fields',
    nayaoneControlRef: 'Data Encryption',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'TLS (Vercel), EncryptionService, Neon SSL',
  },
  {
    controlId: 'CC7.2',
    tscReference: 'CC7.2',
    category: 'security',
    title: 'Monitoring — audit trail and security logging',
    nayaoneControlRef: 'Audit trail (51–52)',
    agentId: 'monitoring_incidents',
    hotelEtunaMapping: 'audit_trail, record-audit.ts, security-logger',
  },
  {
    controlId: 'CC7.3',
    tscReference: 'CC7.3',
    category: 'security',
    title: 'Incident response — detect, log, escalate',
    nayaoneControlRef: 'Incident Management (54–57)',
    agentId: 'monitoring_incidents',
    hotelEtunaMapping: 'cybersecurity_incidents, support_tickets, bon_incident_reports',
  },
  {
    controlId: 'CC8.1',
    tscReference: 'CC8.1',
    category: 'security',
    title: 'Change management — reviewed changes and migrations',
    nayaoneControlRef: 'SDLC (58–65)',
    agentId: 'change_management',
    hotelEtunaMapping: 'Git, database/drizzle migrations, Vercel deploy',
  },
  {
    controlId: 'CC9.2',
    tscReference: 'CC9.2',
    category: 'security',
    title: 'Vendor risk — subservice organization controls',
    nayaoneControlRef: 'AWS carved-out (68)',
    agentId: 'vendor_subservice',
    hotelEtunaMapping: 'Vercel, Neon, Adumo SOC reports annually',
  },
  {
    controlId: 'A1.1',
    tscReference: 'A1.1',
    category: 'availability',
    title: 'Availability commitments (SLA)',
    nayaoneControlRef: 'SLA (18–20)',
    agentId: 'availability',
    hotelEtunaMapping: 'BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md',
  },
  {
    controlId: 'A1.2',
    tscReference: 'A1.2',
    category: 'availability',
    title: 'Backup and recovery',
    nayaoneControlRef: 'Database Backup (73)',
    agentId: 'availability',
    hotelEtunaMapping: 'Neon PITR — inherited CUEC',
  },
  {
    controlId: 'A1.3',
    tscReference: 'A1.3',
    category: 'availability',
    title: 'Disaster recovery testing',
    nayaoneControlRef: 'DR (74–75)',
    agentId: 'availability',
    hotelEtunaMapping: 'Annual DR tabletop — manual',
  },
  {
    controlId: 'C1.1',
    tscReference: 'C1.1',
    category: 'confidentiality',
    title: 'Tenant isolation and guest PII protection',
    nayaoneControlRef: 'Segregation (66)',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'RLS booking_charges, hub vs partner tenants',
  },
  {
    controlId: 'C1.2',
    tscReference: 'C1.2',
    category: 'confidentiality',
    title: 'Environment segregation (dev / prod)',
    nayaoneControlRef: 'Production segregation (66)',
    agentId: 'confidentiality',
    hotelEtunaMapping: 'Separate Vercel + Neon projects',
  },
  {
    controlId: 'PI1.1',
    tscReference: 'PI1.1',
    category: 'security',
    title: 'Processing integrity — folio and payment accuracy',
    nayaoneControlRef: null,
    agentId: 'monitoring_incidents',
    hotelEtunaMapping: 'booking_charges ledger, transactions, cash_reconciliations',
  },
];

export const SOC2_AUDITOR_INTERVIEW_PROMPTS: Record<string, string> = {
  access:
    'How do you control employee access to sensitive systems? → 2FA on payments, RBAC (owner/manager/admin/staff), PostgreSQL RLS for tenant isolation.',
  change:
    'What is your process for system changes? → Git PRs, forward-only Drizzle migrations, PLANNING/TASK governance.',
  incident:
    'How do you respond to security incidents? → cybersecurity_incidents, audit_trail, BoN PSD-12 reporting paths.',
  vendor:
    'How do you vet third-party vendors? → Partner KYC/KYB, tenant isolation; annual Vercel/Neon SOC 2 review.',
};
