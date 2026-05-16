/**
 * F&B inventory — stock levels, sale deductions, low-stock alerts.
 * Location: lib/services/inventory/InventoryService.ts
 *
 * Patterns aligned with POS-linked inventory (R365, StockCount, Supy):
 * - One SKU per sellable unit where possible
 * - Automatic deduction on restaurant orders
 * - Reorder-point alerts (open until acknowledged)
 */

import {
  db,
  inventoryItems,
  menuItemInventoryLinks,
  restaurantOrderItems,
  stockAlerts,
  stockMovements,
} from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

export type InventoryListItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string | null;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

export type StockAlertRow = {
  id: string;
  alertType: string;
  status: string;
  quantityAtAlert: number;
  createdAt: Date | null;
  sku: string;
  name: string;
  quantityOnHand: number;
  reorderPoint: number;
};

function toQty(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
}

export class InventoryService {
  async listByRestaurant(tenantId: string, restaurantId: string): Promise<InventoryListItem[]> {
    try {
      const rows = await db
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.tenantId, tenantId),
            eq(inventoryItems.restaurantId, restaurantId),
            eq(inventoryItems.isActive, true),
          ),
        )
        .orderBy(asc(inventoryItems.category), asc(inventoryItems.name));

      return rows.map((row) => {
        const onHand = toQty(row.quantityOnHand);
        const reorder = toQty(row.reorderPoint);
        return {
          id: row.id,
          sku: row.sku,
          name: row.name,
          unit: row.unit,
          category: row.category,
          quantityOnHand: onHand,
          reorderPoint: reorder,
          reorderQuantity: row.reorderQuantity != null ? toQty(row.reorderQuantity) : null,
          isLowStock: onHand > 0 && onHand <= reorder,
          isOutOfStock: onHand <= 0,
        };
      });
    } catch (error) {
      throw handleServiceError(error, 'Error listing inventory');
    }
  }

  async listOpenAlerts(tenantId: string, restaurantId: string): Promise<StockAlertRow[]> {
    try {
      const rows = await db
        .select({
          id: stockAlerts.id,
          alertType: stockAlerts.alertType,
          status: stockAlerts.status,
          quantityAtAlert: stockAlerts.quantityAtAlert,
          createdAt: stockAlerts.createdAt,
          sku: inventoryItems.sku,
          name: inventoryItems.name,
          quantityOnHand: inventoryItems.quantityOnHand,
          reorderPoint: inventoryItems.reorderPoint,
        })
        .from(stockAlerts)
        .innerJoin(inventoryItems, eq(stockAlerts.inventoryItemId, inventoryItems.id))
        .where(
          and(
            eq(inventoryItems.tenantId, tenantId),
            eq(inventoryItems.restaurantId, restaurantId),
            eq(stockAlerts.status, 'open'),
          ),
        )
        .orderBy(desc(stockAlerts.createdAt));

      return rows.map((row) => ({
        id: row.id,
        alertType: row.alertType,
        status: row.status,
        quantityAtAlert: toQty(row.quantityAtAlert),
        createdAt: row.createdAt,
        sku: row.sku,
        name: row.name,
        quantityOnHand: toQty(row.quantityOnHand),
        reorderPoint: toQty(row.reorderPoint),
      }));
    } catch (error) {
      throw handleServiceError(error, 'Error listing stock alerts');
    }
  }

  /**
   * Deduct stock for all line items on a restaurant order (idempotent per order line).
   */
  async deductForOrder(orderId: string, createdBy?: string): Promise<void> {
    try {
      const lines = await db
        .select({
          lineId: restaurantOrderItems.id,
          menuItemId: restaurantOrderItems.menuItemId,
          quantity: restaurantOrderItems.quantity,
        })
        .from(restaurantOrderItems)
        .where(eq(restaurantOrderItems.orderId, orderId));

      const menuIds = lines.map((l) => l.menuItemId).filter((id): id is string => Boolean(id));
      if (menuIds.length === 0) return;

      const links = await db
        .select({
          menuItemId: menuItemInventoryLinks.menuItemId,
          inventoryItemId: menuItemInventoryLinks.inventoryItemId,
          quantityPerSale: menuItemInventoryLinks.quantityPerSale,
        })
        .from(menuItemInventoryLinks)
        .where(inArray(menuItemInventoryLinks.menuItemId, menuIds));

      const linkByMenu = new Map(links.map((l) => [l.menuItemId, l]));

      for (const line of lines) {
        if (!line.menuItemId) continue;
        const link = linkByMenu.get(line.menuItemId);
        if (!link) continue;

        const already = await db
          .select({ id: stockMovements.id })
          .from(stockMovements)
          .where(
            and(
              eq(stockMovements.referenceType, 'restaurant_order_item'),
              eq(stockMovements.referenceId, line.lineId),
            ),
          )
          .limit(1);

        if (already.length > 0) continue;

        const deductQty = toQty(link.quantityPerSale) * line.quantity;
        await this.applyMovement({
          inventoryItemId: link.inventoryItemId,
          movementType: 'sale',
          quantityDelta: -deductQty,
          referenceType: 'restaurant_order_item',
          referenceId: line.lineId,
          notes: `Order ${orderId}`,
          createdBy,
        });
      }
    } catch (error) {
      console.error('[InventoryService] deductForOrder failed:', error);
    }
  }

  async adjustStock(input: {
    inventoryItemId: string;
    quantityDelta: number;
    notes?: string;
    createdBy?: string;
  }): Promise<{ quantityOnHand: number }> {
    if (!Number.isFinite(input.quantityDelta) || input.quantityDelta === 0) {
      throw new AppError(400, 'Adjustment quantity must be non-zero');
    }
    return this.applyMovement({
      inventoryItemId: input.inventoryItemId,
      movementType: 'adjustment',
      quantityDelta: input.quantityDelta,
      referenceType: 'manual',
      notes: input.notes,
      createdBy: input.createdBy,
    });
  }

  private async applyMovement(input: {
    inventoryItemId: string;
    movementType: string;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<{ quantityOnHand: number }> {
    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, input.inventoryItemId))
        .limit(1);

      if (!item) {
        throw new AppError(404, 'Inventory item not found');
      }

      const before = toQty(item.quantityOnHand);
      const after = Math.max(0, before + input.quantityDelta);

      await tx
        .update(inventoryItems)
        .set({
          quantityOnHand: after.toFixed(3),
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, item.id));

      await tx.insert(stockMovements).values({
        inventoryItemId: item.id,
        movementType: input.movementType,
        quantityDelta: input.quantityDelta.toFixed(3),
        quantityAfter: after.toFixed(3),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
        createdBy: input.createdBy ?? null,
      });

      await this.syncAlertsTx(tx, item.id, after, toQty(item.reorderPoint));

      return { quantityOnHand: after };
    });
  }

  private async syncAlertsTx(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    inventoryItemId: string,
    onHand: number,
    reorderPoint: number,
  ): Promise<void> {
    const openAlerts = await tx
      .select()
      .from(stockAlerts)
      .where(and(eq(stockAlerts.inventoryItemId, inventoryItemId), eq(stockAlerts.status, 'open')));

    const shouldAlert = onHand <= reorderPoint;
    const alertType = onHand <= 0 ? 'out_of_stock' : 'low_stock';

    if (shouldAlert) {
      const hasSameType = openAlerts.some((a) => a.alertType === alertType);
      if (!hasSameType) {
        await tx.insert(stockAlerts).values({
          inventoryItemId,
          alertType,
          status: 'open',
          quantityAtAlert: onHand.toFixed(3),
        });
      }
      return;
    }

    if (openAlerts.length > 0) {
      await tx
        .update(stockAlerts)
        .set({ status: 'resolved', acknowledgedAt: new Date() })
        .where(
          and(eq(stockAlerts.inventoryItemId, inventoryItemId), eq(stockAlerts.status, 'open')),
        );
    }
  }
}

export const inventoryService = new InventoryService();
