/**
 * @fileoverview FolioService — domain service module.
 * FolioService — per-stay charges (room, F&B, settlement)
 *
 * Purpose: Folio ledger for checked-in guests; separate from guest_profiles loyalty.
 * Location: /lib/services/folio/FolioService.ts
 */

import {
  db,
  bookingCharges,
  bookings,
  bookingRooms,
  cmsMenuItems,
  guests,
  guestProfiles,
  restaurantOrderItems,
  restaurantOrders,
  restaurants,
  roomQrCodes,
  rooms,
  transactions,
} from '@/lib/db';
import type { Booking, RestaurantOrder } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import type { FolioSummary, RoomServiceOrderItemInput } from '@/lib/types/folio';
import { buildFolioVatSummary } from '@/lib/services/tax/PropertyVatService';
import { assertCheckedIn, loadBookingWithGuest } from '@/lib/services/folio/guestStayAccess';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { scheduleInvoicePdfEmail } from '@/lib/services/documents/documentLifecycleHooks';
import { toNumber } from '@/lib/utils/money';

const CHARGE_TYPES = ['room', 'fnb', 'tax', 'adjustment'] as const;
const STAFF_SETTLE_ROLES = new Set(['owner', 'manager', 'admin', 'staff']);

export class FolioService {
  /**
   * Void a folio transaction (immutable pattern).
   * Creates a reversal line instead of deleting or modifying the original.
   * Requires reason code for PSD-12 audit trail.
   * 
   * @param chargeId - ID of the charge to void
   * @param input - Void transaction input
   * @returns The reversal charge record
   */
  async voidTransaction(
    chargeId: string,
    input: {
      userId: string;
      reasonCode: string;
      remark?: string;
    }
  ): Promise<{
    originalCharge: typeof bookingCharges.$inferSelect;
    reversalCharge: typeof bookingCharges.$inferSelect;
  }> {
    try {
      const [originalCharge] = await db
        .select()
        .from(bookingCharges)
        .where(eq(bookingCharges.id, chargeId))
        .limit(1);

      if (!originalCharge) {
        throw new AppError(404, 'Charge not found');
      }

      if (originalCharge.status === 'voided') {
        throw new AppError(400, 'Charge is already voided');
      }

      // Check if booking folio is closed
      const [booking] = await db
        .select({ folioClosedAt: bookings.folioClosedAt })
        .from(bookings)
        .where(eq(bookings.id, originalCharge.bookingId))
        .limit(1);

      if (booking?.folioClosedAt) {
        throw new AppError(400, 'Cannot void charges on a closed folio');
      }

      const amount = toNumber(originalCharge.amount);
      const reversalAmount = -amount;

      const result = await db.transaction(async (tx) => {
        // Mark original as voided
        await tx
          .update(bookingCharges)
          .set({ status: 'voided' })
          .where(eq(bookingCharges.id, chargeId));

        // Create reversal line
        const [reversal] = await tx
          .insert(bookingCharges)
          .values({
            tenantId: originalCharge.tenantId,
            bookingId: originalCharge.bookingId,
            chargeType: 'adjustment',
            description: `VOID: ${originalCharge.description} [Reason: ${input.reasonCode}]${input.remark ? ` - ${input.remark}` : ''}`,
            amount: reversalAmount.toFixed(2),
            currency: originalCharge.currency,
            status: 'open',
            referenceId: chargeId,
            createdBy: input.userId,
          })
          .returning();

        if (!reversal) {
          throw new AppError(500, 'Failed to create reversal charge');
        }

        return { reversal };
      });

      const updatedOriginal = {
        ...originalCharge,
        status: 'voided' as const,
      };

      return {
        originalCharge: updatedOriginal,
        reversalCharge: result.reversal,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error voiding transaction');
    }
  }

  async getFolio(bookingId: string): Promise<FolioSummary> {
    try {
      const { booking } = await loadBookingWithGuest(bookingId);
      const lines = await db
        .select()
        .from(bookingCharges)
        .where(eq(bookingCharges.bookingId, bookingId))
        .orderBy(bookingCharges.createdAt);

      let openChargesTotal = 0;
      let settledTotal = 0;
      let paymentLinesTotal = 0;
      const mapped = lines.map((line) => {
        const amount = toNumber(line.amount);
        const type = line.chargeType;
        if (line.status === 'open' && CHARGE_TYPES.includes(type as (typeof CHARGE_TYPES)[number])) {
          openChargesTotal += amount;
        }
        if (type === 'payment') {
          paymentLinesTotal += amount;
          if (line.status === 'settled') {
            settledTotal += Math.abs(amount);
          }
        }
        return {
          id: line.id,
          chargeType: line.chargeType,
          description: line.description,
          amount,
          currency: line.currency ?? 'NAD',
          status: line.status,
          referenceId: line.referenceId,
          createdAt: line.createdAt,
          settledAt: line.settledAt,
        };
      });

      const balanceDue = Math.max(0, Math.round((openChargesTotal + paymentLinesTotal) * 100) / 100);
      const currency = booking.currency ?? 'NAD';
      const vat = buildFolioVatSummary(mapped, currency);

      return {
        bookingId,
        currency,
        lines: mapped,
        openChargesTotal,
        settledTotal,
        balanceDue,
        vat,
        folioClosedAt: booking.folioClosedAt,
        bookingStatus: booking.status ?? 'pending',
        roomPaymentStatus: booking.paymentStatus,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error loading folio');
    }
  }

  /** Idempotent primary charge when booking has a total (accommodation, conference, campsite). */
  async ensureBookingChargeForBooking(booking: Booking): Promise<void> {
    const total = toNumber(booking.totalAmount);
    if (total <= 0) return;

    const kind = booking.bookingKind ?? 'accommodation';
    const chargeType =
      kind === 'conference' || kind === 'campsite' ? 'adjustment' : 'room';
    const description =
      kind === 'conference'
        ? `Conference hall — ${booking.bookingReference}`
        : kind === 'campsite'
          ? `Campsite hire — ${booking.bookingReference}`
          : `Room stay ${booking.bookingReference}`;

    const existing = await db
      .select({ id: bookingCharges.id })
      .from(bookingCharges)
      .where(
        and(
          eq(bookingCharges.bookingId, booking.id),
          eq(bookingCharges.chargeType, chargeType)
        )
      )
      .limit(1);

    if (existing.length > 0) return;

    const settled = booking.paymentStatus === 'paid';
    await db.insert(bookingCharges).values({
      tenantId: booking.tenantId!,
      bookingId: booking.id,
      chargeType,
      description,
      amount: total.toFixed(2),
      currency: booking.currency ?? 'NAD',
      status: settled ? 'settled' : 'open',
      settledAt: settled ? new Date() : null,
    });
  }

  /** @deprecated Use ensureBookingChargeForBooking */
  async ensureRoomChargeForBooking(booking: Booking): Promise<void> {
    return this.ensureBookingChargeForBooking(booking);
  }

  async createRoomServiceOrder(
    bookingId: string,
    items: RoomServiceOrderItemInput[],
    options?: { roomNumber?: string; specialInstructions?: string; createdByUserId?: string }
  ): Promise<{ order: RestaurantOrder; orderTotal: number; folioLineId: string }> {
    try {
      const { booking, guest } = await loadBookingWithGuest(bookingId);
      assertCheckedIn(booking);

      if (!booking.propertyId || !booking.tenantId) {
        throw new AppError(400, 'Booking is missing property context');
      }

      if (options?.roomNumber) {
        await this.assertRoomOnBooking(bookingId, options.roomNumber);
      }

      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.propertyId, booking.propertyId))
        .limit(1);

      if (!restaurant) {
        throw new AppError(404, 'No restaurant configured for this property');
      }

      const menuIds = items.map((i) => i.menuItemId);
      const menuRows = await db
        .select()
        .from(cmsMenuItems)
        .where(inArray(cmsMenuItems.id, menuIds));

      if (menuRows.length !== menuIds.length) {
        throw new AppError(400, 'One or more menu items were not found');
      }

      const menuById = new Map(menuRows.map((m) => [m.id, m]));
      let orderTotal = 0;
      const lineItems: Array<{
        menuItemId: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
        customizations: Record<string, unknown>;
        specialInstructions?: string;
      }> = [];

      for (const item of items) {
        const menuItem = menuById.get(item.menuItemId);
        if (!menuItem?.isAvailable) {
          throw new AppError(400, `Menu item ${item.menuItemId} is not available`);
        }
        const unitPrice = toNumber(menuItem.price);
        const totalPrice = unitPrice * item.quantity;
        orderTotal += totalPrice;
        lineItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          customizations: item.customizations ?? {},
          specialInstructions: item.specialInstructions,
        });
      }

      const orderNumber = `RS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(restaurantOrders)
          .values({
            tenantId: booking.tenantId!,
            restaurantId: restaurant.id,
            propertyId: booking.propertyId!,
            guestId: guest.id,
            bookingId: booking.id,
            orderNumber,
            orderType: 'room_service',
            roomNumber: options?.roomNumber,
            status: 'pending',
            specialInstructions: options?.specialInstructions,
          })
          .returning();

        if (!order) {
          throw new AppError(500, 'Failed to create room service order');
        }

        await tx.insert(restaurantOrderItems).values(
          lineItems.map((li) => ({
            orderId: order.id,
            menuItemId: li.menuItemId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            totalPrice: li.totalPrice,
            customizations: li.customizations,
            specialInstructions: li.specialInstructions,
          }))
        );

        const [folioLine] = await tx
          .insert(bookingCharges)
          .values({
            tenantId: booking.tenantId!,
            bookingId: booking.id,
            chargeType: 'fnb',
            description: `Room service ${orderNumber}`,
            amount: orderTotal.toFixed(2),
            currency: booking.currency ?? 'NAD',
            status: 'open',
            referenceId: order.id,
            createdBy: options?.createdByUserId ?? null,
          })
          .returning();

        if (!folioLine) {
          throw new AppError(500, 'Failed to create folio charge');
        }

        return { order, folioLineId: folioLine.id };
      });

      const { inventoryService } = await import('@/lib/services/inventory/InventoryService');
      await inventoryService.deductForOrder(result.order.id, options?.createdByUserId);

      return {
        order: result.order,
        orderTotal,
        folioLineId: result.folioLineId,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error creating room service order');
    }
  }

  /**
   * Card folio settlement uses Adumo Virtual (`purpose: folio_settle`) in Namibia — not Stripe.
   * In-stay restaurant deposits linked via `dining_reservations.metadata.stay_booking_id` post a folio payment line on confirm.
   */
  async settleFolio(
    bookingId: string,
    input: {
      paymentMethod:
        | 'cash'
        | 'card'
        | 'namqr'
        | 'eft'
        | 'ewallet'
        | 'bank_deposit';
      amountPaid?: number;
      userId?: string;
      gatewayTransactionId?: string;
      /** Buffr commercial / settlement tags (from Adumo Virtual confirm) */
      paymentMetadata?: Record<string, unknown>;
    }
  ): Promise<{
    amountSettled: number;
    balanceRemaining: number;
    transactionReference: string;
    transactionId?: string;
    pointsEarned: number;
    folioClosed: boolean;
  }> {
    try {
      const { booking, guest } = await loadBookingWithGuest(bookingId);
      assertCheckedIn(booking);

      if (booking.folioClosedAt) {
        throw new AppError(400, 'Folio is already closed for this stay');
      }

      const folioBefore = await this.getFolio(bookingId);
      const balanceDue = folioBefore.balanceDue;

      if (balanceDue <= 0) {
        throw new AppError(400, 'No folio balance due');
      }

      const amountSettled = Math.min(
        input.amountPaid ?? balanceDue,
        balanceDue
      );

      if (amountSettled <= 0) {
        throw new AppError(400, 'Payment amount must be positive');
      }

      if (input.paymentMethod === 'cash' && input.amountPaid != null && input.amountPaid < balanceDue) {
        // Partial cash is allowed
      }

      const transactionReference =
        input.gatewayTransactionId ?? `FOLIO-${Date.now()}`;
      const now = new Date();
      const pointsEarned = Math.floor(amountSettled / 10);
      const balanceRemaining = Math.round((balanceDue - amountSettled) * 100) / 100;
      const folioClosed = balanceRemaining <= 0;

      let transactionId: string | undefined;

      await db.transaction(async (tx) => {
        const [txn] = await tx
          .insert(transactions)
          .values({
            tenantId: booking.tenantId!,
            bookingId: booking.id,
            guestId: guest.id,
            transactionReference: `TX-${transactionReference}`,
            type: 'folio_settlement',
            amount: amountSettled.toFixed(2),
            currency: booking.currency ?? 'NAD',
            status: 'completed',
            paymentGateway: resolveFolioPaymentGateway(
              input.paymentMethod,
              input.paymentMetadata
            ),
            gatewayTransactionId: transactionReference,
            description: `Folio payment for ${booking.bookingReference}`,
            metadata: input.paymentMetadata ?? null,
            processedAt: now,
          })
          .returning({ id: transactions.id });

        transactionId = txn?.id;

        await tx.insert(bookingCharges).values({
          tenantId: booking.tenantId!,
          bookingId: booking.id,
          chargeType: 'payment',
          description: `Folio payment (${input.paymentMethod})`,
          amount: (-amountSettled).toFixed(2),
          currency: booking.currency ?? 'NAD',
          status: 'settled',
          settledAt: now,
          createdBy: input.userId ?? null,
        });

        if (folioClosed) {
          await tx
            .update(bookingCharges)
            .set({ status: 'settled', settledAt: now })
            .where(
              and(
                eq(bookingCharges.bookingId, bookingId),
                eq(bookingCharges.status, 'open')
              )
            );

          await tx
            .update(bookings)
            .set({
              folioClosedAt: now,
              updatedAt: now,
            })
            .where(eq(bookings.id, bookingId));
        }

        if (pointsEarned > 0) {
          await this.applyLoyaltyInTx(tx, booking.tenantId!, guest.id, pointsEarned, amountSettled);
        }
      });

      if (folioClosed && booking.guestId && booking.tenantId) {
        scheduleInvoicePdfEmail({
          tenantId: booking.tenantId,
          bookingId: booking.id,
          guestId: booking.guestId,
          propertyId: booking.propertyId,
        });
      }

      return {
        amountSettled,
        balanceRemaining: folioClosed ? 0 : balanceRemaining,
        transactionReference,
        transactionId,
        pointsEarned,
        folioClosed,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error settling folio');
    }
  }

  async applyLoyaltyAdjustment(
    bookingId: string,
    input: { pointsRedeemed: number; discountAmount: number; description: string }
  ): Promise<void> {
    const { booking } = await loadBookingWithGuest(bookingId);
    assertCheckedIn(booking);

    await db.insert(bookingCharges).values({
      tenantId: booking.tenantId!,
      bookingId: booking.id,
      chargeType: 'adjustment',
      description: input.description,
      amount: (-Math.abs(input.discountAmount)).toFixed(2),
      currency: booking.currency ?? 'NAD',
      status: 'open',
    });
  }

  private async applyLoyaltyInTx(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    tenantId: string,
    guestId: string,
    pointsEarned: number,
    amountSpent: number
  ): Promise<void> {
    const [profile] = await tx
      .select()
      .from(guestProfiles)
      .where(and(eq(guestProfiles.guestId, guestId), eq(guestProfiles.tenantId, tenantId)))
      .limit(1);

    if (profile) {
      await tx
        .update(guestProfiles)
        .set({
          loyaltyPoints: (profile.loyaltyPoints ?? 0) + pointsEarned,
          totalSpent: (toNumber(profile.totalSpent) + amountSpent).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(guestProfiles.id, profile.id));
    } else {
      await tx.insert(guestProfiles).values({
        tenantId,
        guestId,
        loyaltyTier: 'bronze',
        loyaltyPoints: pointsEarned,
        totalSpent: amountSpent.toFixed(2),
        bookingCount: 1,
      });
    }
  }

  async resolveActiveBookingForRoomQr(qrCode: string): Promise<{
    bookingId: string;
    roomNumber: string;
    propertyId: string;
    guestFirstName: string | null;
    guestLastName: string | null;
  }> {
    try {
      const [qr] = await db
        .select({
          qr: roomQrCodes,
          roomNumber: rooms.roomNumber,
          propertyId: roomQrCodes.propertyId,
        })
        .from(roomQrCodes)
        .innerJoin(rooms, eq(roomQrCodes.roomId, rooms.id))
        .where(and(eq(roomQrCodes.qrCode, qrCode), eq(roomQrCodes.isActive, true)))
        .limit(1);

      if (!qr?.qr.roomId || !qr.propertyId) {
        throw new AppError(404, 'Invalid or inactive room QR code');
      }

      const today = new Date().toISOString().slice(0, 10);

      const rows = await db
        .select({
          bookingId: bookings.id,
          guestFirstName: guests.firstName,
          guestLastName: guests.lastName,
          propertyId: bookings.propertyId,
        })
        .from(bookings)
        .innerJoin(bookingRooms, eq(bookingRooms.bookingId, bookings.id))
        .innerJoin(guests, eq(bookings.guestId, guests.id))
        .where(
          and(
            eq(bookingRooms.roomId, qr.qr.roomId),
            eq(bookings.status, 'checked_in'),
            lte(bookings.checkInDate, today),
            gte(bookings.checkOutDate, today)
          )
        )
        .limit(1);

      const active = rows[0];
      if (!active?.bookingId) {
        throw new AppError(404, 'No active checked-in stay for this room');
      }

      return {
        bookingId: active.bookingId,
        roomNumber: qr.roomNumber,
        propertyId: active.propertyId ?? qr.propertyId,
        guestFirstName: active.guestFirstName,
        guestLastName: active.guestLastName,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error resolving room QR');
    }
  }

  private async assertRoomOnBooking(bookingId: string, roomNumber: string): Promise<void> {
    const links = await db
      .select({ roomNumber: rooms.roomNumber })
      .from(bookingRooms)
      .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
      .where(eq(bookingRooms.bookingId, bookingId));

    const match = links.some((r) => r.roomNumber === roomNumber);
    if (!match) {
      throw new AppError(400, 'Room number does not match this booking');
    }
  }
}

export function canStaffSettleFolio(role?: string | null): boolean {
  return STAFF_SETTLE_ROLES.has((role || '').toLowerCase());
}

export function resolveFolioPaymentGateway(
  paymentMethod:
    | 'cash'
    | 'card'
    | 'namqr'
    | 'eft'
    | 'ewallet'
    | 'bank_deposit',
  paymentMetadata?: Record<string, unknown>
): string {
  switch (paymentMethod) {
    case 'cash':
      return 'cash';
    case 'namqr':
      return 'namqr';
    case 'eft':
    case 'bank_deposit':
      return 'bank_eft';
    case 'ewallet':
      return 'ewallet_aggregator';
    case 'card':
      return paymentMetadata ? 'adumo_virtual' : 'card';
    default:
      return 'card';
  }
}
