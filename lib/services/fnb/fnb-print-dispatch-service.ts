/**
 * F&B Print Dispatch Service
 *
 * Purpose: Queue and process kitchen/bar print jobs by station with status transitions.
 * Location: /lib/services/fnb/fnb-print-dispatch-service.ts
 *
 * Status flow: pending → printing → printed | failed (failed may retry to pending)
 */

import { and, asc, eq, inArray } from 'drizzle-orm';
import { db, fnbPrintJobs, properties } from '@/lib/db';
import type { FnbPrintJob, NewFnbPrintJob } from '@/lib/db/schema';
import {
  createNetworkPrintAdapter,
  type NetworkPrintAdapter,
} from '@/lib/adapters/print/network-print-adapter';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

export type PrintJobStatus = 'pending' | 'printing' | 'printed' | 'failed' | 'cancelled';
export type PrintStation = 'kitchen' | 'bar' | 'pastry' | 'front_desk' | 'back_office';

const TERMINAL_STATUSES: PrintJobStatus[] = ['printed', 'cancelled'];

const STATUS_TRANSITIONS: Record<PrintJobStatus, PrintJobStatus[]> = {
  pending: ['printing', 'cancelled'],
  printing: ['printed', 'failed'],
  printed: [],
  failed: ['pending', 'cancelled'],
  cancelled: [],
};

export interface CreatePrintJobInput {
  propertyId: string;
  orderId?: string | null;
  bookingId?: string | null;
  station: PrintStation;
  ticketType?: string;
  ticketData: Record<string, unknown>;
  printerId?: string | null;
  createdBy?: string | null;
}

export interface PrintJobListFilters {
  station?: PrintStation;
  status?: PrintJobStatus | PrintJobStatus[];
}

export interface EnqueueOrderTicketInput {
  propertyId: string;
  orderId: string;
  bookingId?: string | null;
  orderNumber: string;
  tableNumber?: string | null;
  roomNumber?: string | null;
  specialInstructions?: string | null;
  items: Array<{
    menuItemName?: string | null;
    quantity: number;
    specialInstructions?: string | null;
    customizations?: Record<string, unknown> | null;
  }>;
  station?: PrintStation;
  createdBy?: string | null;
}

function assertTransition(current: PrintJobStatus, next: PrintJobStatus): void {
  if (!STATUS_TRANSITIONS[current].includes(next)) {
    throw new AppError(400, `Invalid print job transition: ${current} → ${next}`);
  }
}

export class FnbPrintDispatchService {
  constructor(private readonly adapter: NetworkPrintAdapter = createNetworkPrintAdapter()) {}

  /**
   * Verify property belongs to tenant before mutating print jobs.
   */
  async assertPropertyInTenant(propertyId: string, tenantId: string): Promise<void> {
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!row) {
      throw new AppError(404, 'Property not found');
    }
  }

  async createJob(input: CreatePrintJobInput): Promise<FnbPrintJob> {
    try {
      const payload: NewFnbPrintJob = {
        propertyId: input.propertyId,
        orderId: input.orderId ?? null,
        bookingId: input.bookingId ?? null,
        station: input.station,
        status: 'pending',
        ticketType: input.ticketType ?? 'order_ticket',
        ticketData: input.ticketData,
        printerId: input.printerId ?? null,
        createdBy: input.createdBy ?? null,
      };

      const [job] = await db.insert(fnbPrintJobs).values(payload).returning();
      if (!job) {
        throw new AppError(500, 'Failed to create print job');
      }
      return job;
    } catch (error) {
      throw handleServiceError(error, 'create print job');
    }
  }

  async listJobs(propertyId: string, filters: PrintJobListFilters = {}): Promise<FnbPrintJob[]> {
    try {
      const conditions = [eq(fnbPrintJobs.propertyId, propertyId)];

      if (filters.station) {
        conditions.push(eq(fnbPrintJobs.station, filters.station));
      }

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(fnbPrintJobs.status, statuses));
      }

      return db
        .select()
        .from(fnbPrintJobs)
        .where(and(...conditions))
        .orderBy(asc(fnbPrintJobs.createdAt));
    } catch (error) {
      throw handleServiceError(error, 'list print jobs');
    }
  }

  async getJobById(jobId: string, propertyId: string): Promise<FnbPrintJob> {
    const [job] = await db
      .select()
      .from(fnbPrintJobs)
      .where(and(eq(fnbPrintJobs.id, jobId), eq(fnbPrintJobs.propertyId, propertyId)))
      .limit(1);

    if (!job) {
      throw new AppError(404, 'Print job not found');
    }

    return job;
  }

  async updateStatus(
    jobId: string,
    propertyId: string,
    nextStatus: PrintJobStatus,
    errorMessage?: string
  ): Promise<FnbPrintJob> {
    try {
      const job = await this.getJobById(jobId, propertyId);
      const currentStatus = job.status as PrintJobStatus;
      assertTransition(currentStatus, nextStatus);

      const now = new Date();
      const patch: Partial<NewFnbPrintJob> = {
        status: nextStatus,
        updatedAt: now,
      };

      if (nextStatus === 'failed') {
        patch.errorMessage = errorMessage ?? 'Print failed';
        patch.attempts = (job.attempts ?? 0) + 1;
        patch.lastAttemptAt = now;
      }

      if (nextStatus === 'printing') {
        patch.lastAttemptAt = now;
      }

      if (nextStatus === 'printed') {
        patch.printedAt = now;
        patch.errorMessage = null;
      }

      if (nextStatus === 'pending' && currentStatus === 'failed') {
        patch.errorMessage = null;
      }

      const [updated] = await db
        .update(fnbPrintJobs)
        .set(patch)
        .where(and(eq(fnbPrintJobs.id, jobId), eq(fnbPrintJobs.propertyId, propertyId)))
        .returning();

      if (!updated) {
        throw new AppError(500, 'Failed to update print job');
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'update print job status');
    }
  }

  /**
   * Process pending jobs for a station: pending → printing → printed | failed.
   */
  async processPendingForStation(
    propertyId: string,
    station: PrintStation,
    limit = 10
  ): Promise<FnbPrintJob[]> {
    try {
      const pending = await db
        .select()
        .from(fnbPrintJobs)
        .where(
          and(
            eq(fnbPrintJobs.propertyId, propertyId),
            eq(fnbPrintJobs.station, station),
            eq(fnbPrintJobs.status, 'pending')
          )
        )
        .orderBy(asc(fnbPrintJobs.createdAt))
        .limit(limit);

      const results: FnbPrintJob[] = [];

      for (const job of pending) {
        const processed = await this.dispatchSingleJob(job);
        results.push(processed);
      }

      return results;
    } catch (error) {
      throw handleServiceError(error, 'process pending print jobs');
    }
  }

  private async dispatchSingleJob(job: FnbPrintJob): Promise<FnbPrintJob> {
    const printing = await this.updateStatus(job.id, job.propertyId, 'printing');

    const ticketData =
      printing.ticketData && typeof printing.ticketData === 'object'
        ? (printing.ticketData as Record<string, unknown>)
        : {};

    const result = await this.adapter.print({
      jobId: printing.id,
      station: printing.station,
      printerId: printing.printerId,
      ticketData,
    });

    if (result.success) {
      return this.updateStatus(printing.id, printing.propertyId, 'printed');
    }

    return this.updateStatus(
      printing.id,
      printing.propertyId,
      'failed',
      result.errorMessage ?? 'Print failed'
    );
  }

  /**
   * Queue a kitchen ticket when a restaurant order is placed.
   */
  async enqueueFromOrder(input: EnqueueOrderTicketInput): Promise<FnbPrintJob> {
    const ticketData: Record<string, unknown> = {
      orderNumber: input.orderNumber,
      tableNumber: input.tableNumber ?? undefined,
      roomNumber: input.roomNumber ?? undefined,
      specialInstructions: input.specialInstructions ?? undefined,
      items: input.items.map((item) => ({
        name: item.menuItemName ?? 'Item',
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? undefined,
        customizations: item.customizations ?? undefined,
      })),
      queuedAt: new Date().toISOString(),
    };

    return this.createJob({
      propertyId: input.propertyId,
      orderId: input.orderId,
      bookingId: input.bookingId ?? null,
      station: input.station ?? 'kitchen',
      ticketType: 'order_ticket',
      ticketData,
      createdBy: input.createdBy ?? null,
    });
  }

  isTerminalStatus(status: PrintJobStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }
}

export const fnbPrintDispatchService = new FnbPrintDispatchService();

/**
 * Fire-and-forget hook from OrderService — logs failures without blocking orders.
 */
export async function queuePrintJobForOrder(
  tenantId: string,
  input: EnqueueOrderTicketInput
): Promise<void> {
  try {
    await fnbPrintDispatchService.assertPropertyInTenant(input.propertyId, tenantId);
    const job = await fnbPrintDispatchService.enqueueFromOrder(input);
    await fnbPrintDispatchService.processPendingForStation(
      input.propertyId,
      input.station ?? 'kitchen',
      1
    );
    securityLogger.info('[F&B Print] Queued kitchen ticket', {
      jobId: job.id,
      orderId: input.orderId,
      propertyId: input.propertyId,
    });
  } catch (error) {
    securityLogger.error('[F&B Print] Failed to queue print job', {
      orderId: input.orderId,
      propertyId: input.propertyId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
