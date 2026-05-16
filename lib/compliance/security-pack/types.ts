/**
 * Security Prompt Pack — pre-flight check result types.
 * Location: lib/compliance/security-pack/types.ts
 */

export type PreflightStatus = 'pass' | 'warn' | 'fail';

export type PreflightCheck = {
  id: string;
  section: number;
  title: string;
  status: PreflightStatus;
  detail: string;
  remediation?: string;
};

export type SecurityPreflightReport = {
  generatedAt: string;
  framework: 'Hotel Etuna Security Prompt Pack';
  deploymentPreflight: boolean;
  scorePercent: number;
  summary: { pass: number; warn: number; fail: number };
  checks: PreflightCheck[];
};
