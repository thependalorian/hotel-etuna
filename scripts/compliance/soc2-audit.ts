#!/usr/bin/env npx tsx
/**
 * @deprecated Use `npx tsx scripts/soc2/collect-evidence.ts` (writes JSON + CI/monthly export).
 * Thin forwarder kept for backward-compatible npm/script references (B2).
 */

import { spawnSync } from 'child_process';
import { join } from 'path';

const target = join(process.cwd(), 'scripts/soc2/collect-evidence.ts');
const args = ['tsx', target, ...process.argv.slice(2)];

console.error('[deprecated] scripts/compliance/soc2-audit.ts → scripts/soc2/collect-evidence.ts');

const result = spawnSync('npx', args, { stdio: 'inherit', cwd: process.cwd() });
process.exit(result.status ?? 1);
