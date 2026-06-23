/**
 * @fileoverview ReorderRecommendationService — approval-gated stock reorder suggestions.
 * Location: lib/services/intelligence/ReorderRecommendationService.ts
 *
 * Flow: low-stock inventory items → a `pending` reorder suggestion (with AI rationale).
 * approve() AUTHORISES the purchase and audits it — it does NOT auto-order and does NOT change
 * stock (received goods are booked separately via InventoryService.adjustStock on delivery).
 * reject() dismisses the suggestion. One pending suggestion per item (DB partial unique index);
 * re-generation supersedes the prior pending row.
 */
import {
  db,
  inventoryItems,
  reorderRecommendations,
  and,
  eq,
  desc,
} from '@/lib/db';
import type { ReorderRecommendation } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { reorderRationale } from '@/lib/services/intelligence/recommendation-rationale';

function toQty(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
}

export class ReorderRecommendationService {
  /** Generate reorder suggestions for every active item at or below its reorder point. */
  async generate(tenantId: string): Promise<ReorderRecommendation[]> {
    try {
      const items = await db
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.tenantId, tenantId), eq(inventoryItems.isActive, true)));

      const created: ReorderRecommendation[] = [];
      for (const item of items) {
        const onHand = toQty(item.quantityOnHand);
        const reorderPoint = toQty(item.reorderPoint);
        if (onHand > reorderPoint) continue;

        // Suggested order qty: configured reorder quantity, else enough to clear 2× the point.
        const configured = item.reorderQuantity != null ? toQty(item.reorderQuantity) : 0;
        const recommendedQty = configured > 0 ? configured : Math.max(1, reorderPoint * 2 - onHand);

        await db
          .update(reorderRecommendations)
          .set({ status: 'superseded', decidedAt: new Date() })
          .where(
            and(
              eq(reorderRecommendations.inventoryItemId, item.id),
              eq(reorderRecommendations.status, 'pending'),
            ),
          );

        const rationale = await reorderRationale({
          name: item.name,
          unit: item.unit,
          quantityOnHand: onHand,
          reorderPoint,
          recommendedQuantity: recommendedQty,
        });

        const [row] = await db
          .insert(reorderRecommendations)
          .values({
            tenantId,
            inventoryItemId: item.id,
            restaurantId: item.restaurantId ?? null,
            quantityOnHand: onHand.toFixed(3),
            reorderPoint: reorderPoint.toFixed(3),
            recommendedQuantity: recommendedQty.toFixed(3),
            rationale,
            status: 'pending',
          })
          .returning();
        created.push(row);
      }
      return created;
    } catch (error) {
      throw handleServiceError(error, 'Error generating reorder recommendations');
    }
  }

  async listByStatus(tenantId: string, status = 'pending'): Promise<ReorderRecommendation[]> {
    return db
      .select()
      .from(reorderRecommendations)
      .where(
        and(eq(reorderRecommendations.tenantId, tenantId), eq(reorderRecommendations.status, status)),
      )
      .orderBy(desc(reorderRecommendations.generatedAt));
  }

  /** Approve = authorise the purchase + audit. Does not change stock or place an order. */
  async approve(input: {
    id: string;
    tenantId: string;
    actorUserId?: string | null;
    request?: import('next/server').NextRequest;
  }): Promise<{ id: string; inventoryItemId: string; approvedQuantity: number }> {
    try {
      const rec = await this.loadPending(input.id, input.tenantId);
      await db
        .update(reorderRecommendations)
        .set({ status: 'approved', decidedAt: new Date(), decidedBy: input.actorUserId ?? null })
        .where(eq(reorderRecommendations.id, rec.id));

      await recordAuditTrail({
        tenantId: rec.tenantId,
        userId: input.actorUserId ?? null,
        action: 'reorder_recommendation.approve',
        resourceType: 'reorder_recommendation',
        resourceId: rec.id,
        newValues: {
          inventoryItemId: rec.inventoryItemId,
          approvedQuantity: Number(rec.recommendedQuantity),
        },
        request: input.request,
      });
      return {
        id: rec.id,
        inventoryItemId: rec.inventoryItemId,
        approvedQuantity: Number(rec.recommendedQuantity),
      };
    } catch (error) {
      throw handleServiceError(error, 'Error approving reorder recommendation');
    }
  }

  async reject(input: {
    id: string;
    tenantId: string;
    actorUserId?: string | null;
    note?: string;
    request?: import('next/server').NextRequest;
  }): Promise<{ id: string }> {
    try {
      const rec = await this.loadPending(input.id, input.tenantId);
      await db
        .update(reorderRecommendations)
        .set({
          status: 'rejected',
          decidedAt: new Date(),
          decidedBy: input.actorUserId ?? null,
          decisionNote: input.note ?? null,
        })
        .where(eq(reorderRecommendations.id, rec.id));

      await recordAuditTrail({
        tenantId: rec.tenantId,
        userId: input.actorUserId ?? null,
        action: 'reorder_recommendation.reject',
        resourceType: 'reorder_recommendation',
        resourceId: rec.id,
        newValues: { note: input.note ?? null },
        request: input.request,
      });
      return { id: rec.id };
    } catch (error) {
      throw handleServiceError(error, 'Error rejecting reorder recommendation');
    }
  }

  private async loadPending(id: string, tenantId: string): Promise<ReorderRecommendation> {
    const [rec] = await db
      .select()
      .from(reorderRecommendations)
      .where(and(eq(reorderRecommendations.id, id), eq(reorderRecommendations.tenantId, tenantId)))
      .limit(1);
    if (!rec) throw new AppError(404, 'Reorder recommendation not found.');
    if (rec.status !== 'pending') {
      throw new AppError(409, `Recommendation already ${rec.status}.`);
    }
    return rec;
  }
}

export const reorderRecommendationService = new ReorderRecommendationService();
