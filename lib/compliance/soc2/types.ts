/**
 * SOC 2 Type II audit types (Trust Services: Security, Availability, Confidentiality).
 * Reference framework: NayaOne Limited SOC 2 report (Feb 2023–Feb 2024).
 * Location: lib/compliance/soc2/types.ts
 */

export type Soc2TrustCategory = 'security' | 'availability' | 'confidentiality';

export type Soc2ControlStatus =
  | 'compliant'
  | 'partial'
  | 'gap'
  | 'manual'
  | 'inherited';

export type Soc2AgentId =
  | 'access_control'
  | 'monitoring_incidents'
  | 'change_management'
  | 'availability'
  | 'confidentiality'
  | 'vendor_subservice';

export interface Soc2ControlResult {
  controlId: string;
  tscReference: string;
  category: Soc2TrustCategory;
  title: string;
  nayaoneControlRef: string | null;
  status: Soc2ControlStatus;
  automated: boolean;
  evidence: string[];
  gaps: string[];
  remediation: string[];
  agentId: Soc2AgentId;
}

export interface Soc2AgentRunResult {
  agentId: Soc2AgentId;
  agentName: string;
  controls: Soc2ControlResult[];
  scorePercent: number;
  ranAt: string;
}

export interface Soc2AuditReport {
  organization: string;
  system: string;
  frameworkReference: string;
  trustCategories: Soc2TrustCategory[];
  period: { from: string; to: string };
  subserviceOrganizations: Array<{ name: string; role: string; cuecNote: string }>;
  overallScorePercent: number;
  summary: {
    compliant: number;
    partial: number;
    gap: number;
    manual: number;
    inherited: number;
  };
  agents: Soc2AgentRunResult[];
  controls: Soc2ControlResult[];
  executiveBullets?: string[];
  auditorPrompts?: Record<string, string>;
  disclaimer: string;
}
