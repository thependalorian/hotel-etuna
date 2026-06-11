/**
 * AuditHashService — tamper-evident SHA-256 hash chain for `audit_trail`
 *
 * Purpose: Port trailkit MIT hash-chain concepts without runtime dependency.
 * Location: lib/compliance/AuditHashService.ts
 */

import { createHash } from 'node:crypto';
import { db, auditTrail } from '@/lib/db';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import type * as schema from '@/lib/db/schema';

/** Well-known genesis previous-hash (64 zero hex chars). */
export const ZERO_HASH = '0'.repeat(64);

export type AuditHashPayload = {
  id: string;
  timestamp: Date | string;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

export type ChainTamperReason = 'previous_hash_mismatch' | 'event_hash_mismatch';

export type ChainVerificationResult = {
  valid: boolean;
  eventsChecked: number;
  hashedEventsChecked: number;
  unhashedEventsSkipped: number;
  tamperedEventId: string | null;
  tamperedReason: ChainTamperReason | null;
  tenantId: string;
  fromId: string | null;
  toId: string | null;
};

type DbClient =
  | typeof db
  | PgTransaction<
      NeonQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

/**
 * Deterministic JSON with sorted keys at every depth (trailkit-compatible).
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .map((key) => {
      const val = (obj as Record<string, unknown>)[key];
      return JSON.stringify(key) + ':' + canonicalJson(val);
    });
  return '{' + sorted.join(',') + '}';
}

function toIsoTimestamp(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

/**
 * Computes SHA-256 event hash chained to `previousHash`.
 */
export function computeEventHash(
  payload: AuditHashPayload,
  previousHash: string
): string {
  const body = canonicalJson({
    id: payload.id,
    timestamp: toIsoTimestamp(payload.timestamp),
    tenantId: payload.tenantId,
    userId: payload.userId,
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    oldValues: payload.oldValues ?? null,
    newValues: payload.newValues ?? null,
    previousHash,
  });
  return createHash('sha256').update(body).digest('hex');
}

type ChainRecord = AuditHashPayload & {
  previousHash: string | null;
  eventHash: string | null;
};

/**
 * Pure verification over ordered audit rows (used by unit tests and DB loader).
 */
export function verifyChainRecords(
  records: ChainRecord[],
  initialPreviousHash: string = ZERO_HASH
): Pick<
  ChainVerificationResult,
  | 'valid'
  | 'eventsChecked'
  | 'hashedEventsChecked'
  | 'unhashedEventsSkipped'
  | 'tamperedEventId'
  | 'tamperedReason'
> {
  let runningPrevious = initialPreviousHash;
  let hashedEventsChecked = 0;
  let unhashedEventsSkipped = 0;

  for (const record of records) {
    if (!record.eventHash) {
      unhashedEventsSkipped += 1;
      continue;
    }

    hashedEventsChecked += 1;
    const storedPrevious = record.previousHash ?? ZERO_HASH;

    if (storedPrevious !== runningPrevious) {
      return {
        valid: false,
        eventsChecked: records.length,
        hashedEventsChecked,
        unhashedEventsSkipped,
        tamperedEventId: record.id,
        tamperedReason: 'previous_hash_mismatch',
      };
    }

    const expected = computeEventHash(record, storedPrevious);
    if (record.eventHash !== expected) {
      return {
        valid: false,
        eventsChecked: records.length,
        hashedEventsChecked,
        unhashedEventsSkipped,
        tamperedEventId: record.id,
        tamperedReason: 'event_hash_mismatch',
      };
    }

    runningPrevious = record.eventHash;
  }

  return {
    valid: true,
    eventsChecked: records.length,
    hashedEventsChecked,
    unhashedEventsSkipped,
    tamperedEventId: null,
    tamperedReason: null,
  };
}

function sliceByIdRange<T extends { id: string }>(
  rows: T[],
  fromId?: string | null,
  toId?: string | null
): T[] {
  if (!fromId && !toId) return rows;

  const fromIndex = fromId ? rows.findIndex((r) => r.id === fromId) : 0;
  if (fromId && fromIndex < 0) return [];

  const toIndex = toId ? rows.findIndex((r) => r.id === toId) : rows.length - 1;
  if (toId && toIndex < 0) return [];

  const start = fromId ? fromIndex : 0;
  const end = toId ? toIndex + 1 : rows.length;
  if (start > end) return [];
  return rows.slice(start, end);
}

export class AuditHashService {
  /**
   * Latest `event_hash` for a tenant, or genesis hash when none exist.
   */
  async getLatestEventHash(tenantId: string, client: DbClient = db): Promise<string> {
    const [latest] = await client
      .select({ eventHash: auditTrail.eventHash })
      .from(auditTrail)
      .where(and(eq(auditTrail.tenantId, tenantId), isNotNull(auditTrail.eventHash)))
      .orderBy(desc(auditTrail.timestamp), desc(auditTrail.id))
      .limit(1);

    return latest?.eventHash ?? ZERO_HASH;
  }

  /**
   * Resolves `previous_hash` + `event_hash` for a new audit row.
   */
  async resolveHashesForInsert(
    payload: AuditHashPayload,
    client: DbClient = db
  ): Promise<{ previousHash: string; eventHash: string }> {
    const previousHash = await this.getLatestEventHash(payload.tenantId, client);
    const eventHash = computeEventHash(payload, previousHash);
    return { previousHash, eventHash };
  }

  /**
   * Verifies tenant audit chain integrity, optionally scoped by record IDs.
   */
  async verifyChain(
    tenantId: string,
    fromId?: string | null,
    toId?: string | null
  ): Promise<ChainVerificationResult> {
    const rows = await db
      .select({
        id: auditTrail.id,
        timestamp: auditTrail.timestamp,
        tenantId: auditTrail.tenantId,
        userId: auditTrail.userId,
        action: auditTrail.action,
        resourceType: auditTrail.resourceType,
        resourceId: auditTrail.resourceId,
        oldValues: auditTrail.oldValues,
        newValues: auditTrail.newValues,
        previousHash: auditTrail.previousHash,
        eventHash: auditTrail.eventHash,
      })
      .from(auditTrail)
      .where(eq(auditTrail.tenantId, tenantId))
      .orderBy(asc(auditTrail.timestamp), asc(auditTrail.id));

    const scoped = sliceByIdRange(rows, fromId, toId);
    const chainRecords: ChainRecord[] = scoped.map((row) => ({
      id: row.id,
      timestamp: row.timestamp ?? new Date(0),
      tenantId: row.tenantId ?? tenantId,
      userId: row.userId ?? null,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId ?? null,
      oldValues: (row.oldValues as Record<string, unknown> | null) ?? null,
      newValues: (row.newValues as Record<string, unknown> | null) ?? null,
      previousHash: row.previousHash ?? null,
      eventHash: row.eventHash ?? null,
    }));

    let initialPreviousHash = ZERO_HASH;
    if (fromId) {
      const anchorIndex = rows.findIndex((r) => r.id === fromId);
      if (anchorIndex > 0) {
        const priorHashed = [...rows.slice(0, anchorIndex)]
          .reverse()
          .find((r) => r.eventHash);
        initialPreviousHash = priorHashed?.eventHash ?? ZERO_HASH;
      }
    }

    const result = verifyChainRecords(chainRecords, initialPreviousHash);

    return {
      ...result,
      tenantId,
      fromId: fromId ?? null,
      toId: toId ?? null,
    };
  }
}

export const auditHashService = new AuditHashService();
