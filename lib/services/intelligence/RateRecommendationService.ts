/**
 * @fileoverview RateRecommendationService — approval-gated nightly-rate suggestions.
 * Location: lib/services/intelligence/RateRecommendationService.ts
 *
 * Flow: ForecastingService → recommendRate() → write a `pending` row (with AI rationale).
 * Nothing changes `rooms.base_rate` until an admin/front-desk user calls approve(). reject()
 * dismisses a suggestion. Every decision is written to the audit trail. Re-generating supersedes
 * the prior pending suggestion for the same room type so the queue never shows stale numbers.
 */
import {
  db,
  rooms as roomsSchema,
  rateRecommendations,
  and,
  eq,
  desc,
} from '@/lib/db';
import type { RateRecommendation } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { forecastingService } from '@/lib/services/intelligence/ForecastingService';
import { recommendRate } from '@/lib/services/intelligence/rate-pricing';
import { rateRationale } from '@/lib/services/intelligence/recommendation-rationale';

export class RateRecommendationService {
  /** Generate fresh rate suggestions for every room type from the latest forecast. */
  async generate(input: {
    tenantId: string;
    propertyId?: string | null;
    horizonDays?: number;
  }): Promise<RateRecommendation[]> {
    try {
      const forecast = await forecastingService.getOccupancyForecast(input);
      const created: RateRecommendation[] = [];

      for (const rt of forecast.byRoomType) {
        if (rt.baseRate <= 0) continue; // can't price a room type with no base rate
        const suggestion = recommendRate(rt.baseRate, rt.forecastOccupancy);
        // Skip no-op suggestions (recommended == current) to keep the queue actionable.
        if (suggestion.recommendedRate === rt.baseRate) continue;

        // Supersede any prior pending suggestion for the same room type + property.
        await db
          .update(rateRecommendations)
          .set({ status: 'superseded', decidedAt: new Date() })
          .where(
            and(
              eq(rateRecommendations.tenantId, input.tenantId),
              eq(rateRecommendations.roomType, rt.roomType),
              eq(rateRecommendations.status, 'pending'),
            ),
          );

        const rationale = await rateRationale({
          roomType: rt.roomType,
          band: suggestion.band,
          forecastOccupancy: rt.forecastOccupancy,
          currentRate: rt.baseRate,
          recommendedRate: suggestion.recommendedRate,
          adjustmentPct: suggestion.adjustmentPct,
          horizonDays: forecast.horizonDays,
        });

        const [row] = await db
          .insert(rateRecommendations)
          .values({
            tenantId: input.tenantId,
            propertyId: input.propertyId ?? null,
            roomType: rt.roomType,
            currentRate: rt.baseRate.toFixed(2),
            recommendedRate: suggestion.recommendedRate.toFixed(2),
            forecastOccupancy: (rt.forecastOccupancy * 100).toFixed(2),
            horizonDays: forecast.horizonDays,
            signals: {
              band: suggestion.band,
              adjustmentPct: suggestion.adjustmentPct,
              bookedNights: rt.bookedNights,
              capacityNights: rt.capacityNights,
              adr: rt.adr,
              revpar: rt.revpar,
            },
            rationale,
            status: 'pending',
          })
          .returning();
        created.push(row);
      }

      return created;
    } catch (error) {
      throw handleServiceError(error, 'Error generating rate recommendations');
    }
  }

  /** List recommendations by status (default pending), newest first. */
  async listByStatus(tenantId: string, status = 'pending'): Promise<RateRecommendation[]> {
    return db
      .select()
      .from(rateRecommendations)
      .where(and(eq(rateRecommendations.tenantId, tenantId), eq(rateRecommendations.status, status)))
      .orderBy(desc(rateRecommendations.generatedAt));
  }

  /** Approve a suggestion: apply it to every matching room's base_rate, then audit. */
  async approve(input: {
    id: string;
    tenantId: string;
    actorUserId?: string | null;
    request?: import('next/server').NextRequest;
  }): Promise<{ id: string; roomType: string; appliedRate: number; roomsUpdated: number }> {
    try {
      const rec = await this.loadPending(input.id, input.tenantId);
      const recommended = Number(rec.recommendedRate);

      const roomMatch = rec.propertyId
        ? and(eq(roomsSchema.propertyId, rec.propertyId), eq(roomsSchema.roomType, rec.roomType))
        : eq(roomsSchema.roomType, rec.roomType);

      const updated = await db
        .update(roomsSchema)
        .set({ baseRate: recommended.toFixed(2), updatedAt: new Date() })
        .where(roomMatch)
        .returning({ id: roomsSchema.id });

      await db
        .update(rateRecommendations)
        .set({ status: 'approved', decidedAt: new Date(), decidedBy: input.actorUserId ?? null })
        .where(eq(rateRecommendations.id, rec.id));

      await recordAuditTrail({
        tenantId: rec.tenantId,
        userId: input.actorUserId ?? null,
        action: 'rate_recommendation.approve',
        resourceType: 'rate_recommendation',
        resourceId: rec.id,
        oldValues: { roomType: rec.roomType, currentRate: Number(rec.currentRate) },
        newValues: { appliedRate: recommended, roomsUpdated: updated.length },
        request: input.request,
      });

      return { id: rec.id, roomType: rec.roomType, appliedRate: recommended, roomsUpdated: updated.length };
    } catch (error) {
      throw handleServiceError(error, 'Error approving rate recommendation');
    }
  }

  /** Reject a suggestion without changing any rate. */
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
        .update(rateRecommendations)
        .set({
          status: 'rejected',
          decidedAt: new Date(),
          decidedBy: input.actorUserId ?? null,
          decisionNote: input.note ?? null,
        })
        .where(eq(rateRecommendations.id, rec.id));

      await recordAuditTrail({
        tenantId: rec.tenantId,
        userId: input.actorUserId ?? null,
        action: 'rate_recommendation.reject',
        resourceType: 'rate_recommendation',
        resourceId: rec.id,
        newValues: { note: input.note ?? null },
        request: input.request,
      });
      return { id: rec.id };
    } catch (error) {
      throw handleServiceError(error, 'Error rejecting rate recommendation');
    }
  }

  private async loadPending(id: string, tenantId: string): Promise<RateRecommendation> {
    const [rec] = await db
      .select()
      .from(rateRecommendations)
      .where(and(eq(rateRecommendations.id, id), eq(rateRecommendations.tenantId, tenantId)))
      .limit(1);
    if (!rec) throw new AppError(404, 'Rate recommendation not found.');
    if (rec.status !== 'pending') {
      throw new AppError(409, `Recommendation already ${rec.status}.`);
    }
    return rec;
  }
}

export const rateRecommendationService = new RateRecommendationService();
