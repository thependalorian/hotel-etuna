#!/usr/bin/env npx tsx
/**
 * Add missing POLICY_TEMPLATE sections to compliance policy markdown files.
 * Location: scripts/compliance/conform-policies.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const POLICIES_DIR = join(process.cwd(), 'docs/compliance/policies');
const MATRIX_LINK =
  '[`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)';
const REG_LINK = '[`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)';
const INFOSEC_LINK = '[`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)';

const SKIP = new Set(['POLICY_TEMPLATE.md', 'DATA_PROTECTION_POLICY.md']);

const STANDARD_EXCEPTIONS = `## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.`;

const STANDARD_ENFORCEMENT = `## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.`;

const STANDARD_DEFINITIONS = `## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |`;

function hasSection(content: string, name: string): boolean {
  const re = new RegExp(`^##\\s+.*${name}`, 'im');
  return re.test(content);
}

function hasApprovedBy(content: string): boolean {
  return /Approved by:|Policy Approved By:/i.test(content);
}

function ensureMatrixInRelated(content: string): string {
  if (content.includes('POLICY_IMPLEMENTATION_MATRIX')) return content;
  if (hasSection(content, 'Related')) {
    return content.replace(
      /(##\s+.*Related[^\n]*\n)/i,
      `$1\n- ${MATRIX_LINK}\n`
    );
  }
  return content;
}

function insertBeforeRevision(content: string, block: string): string {
  const revMatch = content.match(/^##\s+.*Revision/im);
  if (!revMatch || revMatch.index === undefined) {
    return `${content.trimEnd()}\n\n${block}\n`;
  }
  const idx = revMatch.index;
  return `${content.slice(0, idx).trimEnd()}\n\n${block}\n\n${content.slice(idx)}`;
}

function addRevisionRow(content: string): string {
  if (content.includes('2026-06-10') && content.includes('Template conformance')) {
    return content;
  }
  const row =
    '| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |';
  if (/\| Version \| Date \|/i.test(content)) {
    return content.replace(
      /(\| Version \| Date \| Author \| Changes \|\n\|[-| ]+\|\n)/i,
      `$1${row}\n`
    );
  }
  return content;
}

function addApprovedBy(content: string): string {
  if (hasApprovedBy(content)) return content;
  return `${content.trimEnd()}\n\n**Approved by:** _________________________ Date: _________\n`;
}

function processFile(filename: string): void {
  const path = join(POLICIES_DIR, filename);
  let content = readFileSync(path, 'utf-8');
  let changed = false;

  if (!hasSection(content, 'Definitions')) {
    const scopeEnd = content.search(/^##\s+.*Scope/im);
    if (scopeEnd >= 0) {
      const afterScope = content.indexOf('\n## ', scopeEnd + 1);
      const insertAt = afterScope > 0 ? afterScope : content.length;
      content =
        content.slice(0, insertAt) +
        `\n\n${STANDARD_DEFINITIONS}\n` +
        content.slice(insertAt);
      changed = true;
    }
  }

  if (!hasSection(content, 'Exceptions')) {
    content = insertBeforeRevision(content, STANDARD_EXCEPTIONS);
    changed = true;
  }

  if (!hasSection(content, 'Enforcement') && !hasSection(content, 'Violations') && !hasSection(content, 'Consequences')) {
    content = insertBeforeRevision(content, STANDARD_ENFORCEMENT);
    changed = true;
  }

  const beforeRelated = content;
  content = ensureMatrixInRelated(content);
  if (content !== beforeRelated) changed = true;

  if (!content.includes('NAMIBIA_REGULATORY_FRAMEWORK') && hasSection(content, 'Related')) {
    content = content.replace(
      /(##\s+.*Related[^\n]*\n)/i,
      `$1\n- ${REG_LINK}\n`
    );
    changed = true;
  }

  if (!content.includes('INFORMATION_SECURITY_POLICY') && hasSection(content, 'Related') && filename !== 'INFORMATION_SECURITY_POLICY.md') {
    content = content.replace(
      /(##\s+.*Related[^\n]*\n)/i,
      `$1- ${INFOSEC_LINK}\n`
    );
    changed = true;
  }

  const beforeRev = content;
  content = addRevisionRow(content);
  if (content !== beforeRev) changed = true;

  const beforeAppr = content;
  content = addApprovedBy(content);
  if (content !== beforeAppr) changed = true;

  if (changed) {
    writeFileSync(path, content, 'utf-8');
    console.log(`Updated: ${filename}`);
  } else {
    console.log(`Skipped (no changes): ${filename}`);
  }
}

for (const f of readdirSync(POLICIES_DIR).filter((x) => x.endsWith('.md') && !SKIP.has(x))) {
  processFile(f);
}
