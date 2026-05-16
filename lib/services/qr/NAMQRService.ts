/**
 * NAMQRService - NamQR code generation and room_qr_codes management using Drizzle
 * Purpose: Generate hospitality QR codes and manage room_qr_codes table
 * Location: lib/services/qr/NAMQRService.ts
 */

import { db } from '@/lib/db';
import { properties, rooms, roomQrCodes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  buildNamQrPayeePresentedPayload,
  generateNref,
  validateNamQrPayload,
} from '@/lib/compliance/namqr/nrtc-payload';
import { NAMQR_STANDARDS } from '@/lib/compliance/namqr/standards';

export class NamQrService {
  async generateHospitalityQr(data: {
    propertyId: string;
    amount?: number;
    reference: string;
    type: 'ROOM_SERVICE' | 'RESTAURANT' | 'CHECKOUT';
    tableNumber?: string;
    roomNumber?: string;
  }) {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, data.propertyId))
      .limit(1);

    if (!property) throw new Error('Property not found');

    const mcc =
      property.type?.toLowerCase() === 'hotel'
        ? NAMQR_STANDARDS.mccHotel
        : NAMQR_STANDARDS.mccRestaurant;
    const nref = generateNref();
    const qrString = buildNamQrPayeePresentedPayload({
      dynamic: data.amount != null && data.amount > 0,
      merchantName: property.name.slice(0, 25),
      merchantCity: (property.city ?? 'Ongwediva').slice(0, 15),
      merchantCategoryCode: mcc,
      amount: data.amount,
      nref,
      purposeLabel: `${data.type} ${data.reference}`.slice(0, 25),
    });
    const validation = validateNamQrPayload(qrString);
    if (!validation.valid) {
      throw new Error(`NamQR validation failed: ${validation.errors.join('; ')}`);
    }
    const qrCodeUrl = `https://buffr.host/qr/${uuidv4()}`;

    if (!data.roomNumber) {
      throw new Error('roomNumber is required to create QR code');
    }

    const [room] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(
        and(
          eq(rooms.propertyId, data.propertyId),
          eq(rooms.roomNumber, data.roomNumber)
        )
      )
      .limit(1);

    if (!room) {
      throw new Error(`Room not found: ${data.roomNumber} for property ${data.propertyId}`);
    }

    const [qrRecord] = await db
      .insert(roomQrCodes)
      .values({
        propertyId: data.propertyId,
        roomId: room.id,
        qrCode: qrString,
        qrCodeUrl,
        isActive: true,
      })
      .returning();

    if (!qrRecord) throw new Error('Failed to create QR code record');

    return {
      qrCode: qrString,
      url: qrRecord.qrCodeUrl,
      nref,
      validation,
    };
  }

  /**
   * Deep links and image URL for restaurant table QR (stored on restaurant_tables).
   * Encodes `qr` so dashboard /guest flows can resolve via TableService.getTableByQrCode.
   */
  /**
   * Guest room-service entry: scan → /guest/room?code=… → public API resolves stay.
   */
  buildRoomServiceQrUrls(qrLookupCode: string): { qrCodeUrl: string; qrCodeImageUrl: string } {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://hoteletuna.com').replace(
      /\/$/,
      ''
    );
    const qrCodeUrl = `${appUrl}/guest/room?code=${encodeURIComponent(qrLookupCode)}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
    return { qrCodeUrl, qrCodeImageUrl };
  }

  buildRestaurantTableQrUrls(qrLookupCode: string): { qrCodeUrl: string; qrCodeImageUrl: string } {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://hoteletuna.com').replace(
      /\/$/,
      ''
    );
    const qrCodeUrl = `${appUrl}/restaurant/tables?qr=${encodeURIComponent(qrLookupCode)}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
    return { qrCodeUrl, qrCodeImageUrl };
  }

  private async getRoomId(propertyId: string, roomNumber: string): Promise<string | undefined> {
    const [room] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.propertyId, propertyId), eq(rooms.roomNumber, roomNumber)))
      .limit(1);
    return room?.id;
  }

  async generateQRCode(data: {
    tenantId: string;
    propertyId: string;
    entityType: 'room' | 'table';
    entityId: string;
    qrType?: string;
  }) {
    return this.generateHospitalityQr({
      propertyId: data.propertyId,
      reference: `QR-${Date.now()}`,
      type:
        data.qrType === 'ROOM_SERVICE'
          ? 'ROOM_SERVICE'
          : data.qrType === 'CHECKOUT'
            ? 'CHECKOUT'
            : 'RESTAURANT',
      roomNumber: data.entityType === 'room' ? data.entityId : undefined,
      tableNumber: data.entityType === 'table' ? data.entityId : undefined,
    });
  }

  async generateBulkQRCodes(
    tenantId: string,
    propertyId: string,
    entityType: 'room' | 'table',
    entityIds: string[],
    qrType?: string
  ) {
    const results: Array<{ entityId: string; qrCode?: string; url?: string; nref?: string; error?: string }> = [];
    for (const entityId of entityIds) {
      try {
        const qr = await this.generateQRCode({
          tenantId,
          propertyId,
          entityType,
          entityId,
          qrType,
        });
        results.push({ entityId, ...qr });
      } catch (error) {
        results.push({ entityId, error: (error as Error).message });
      }
    }
    return results;
  }

  async getQRCodesByProperty(
    propertyId: string,
    tenantId: string,
    filters?: { entityType?: 'room' | 'table'; qrType?: string; isActive?: boolean }
  ) {
    const conditions = [
      eq(roomQrCodes.propertyId, propertyId),
      eq(properties.tenantId, tenantId),
    ];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(roomQrCodes.isActive, filters.isActive));
    }
    const rows = await db
      .select({
        rqc: roomQrCodes,
        roomId: rooms.id,
        roomNumber: rooms.roomNumber,
        roomType: rooms.roomType,
        propertyId: properties.id,
        propertyName: properties.name,
      })
      .from(roomQrCodes)
      .leftJoin(rooms, eq(roomQrCodes.roomId, rooms.id))
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(and(...conditions));

    return rows.map((r) => ({
      ...r.rqc,
      room_id: r.roomId,
      room_number: r.roomNumber,
      room_type: r.roomType,
      property_id: r.propertyId,
      property_name: r.propertyName,
    }));
  }

  async getQRCodeById(id: string, tenantId: string) {
    const [row] = await db
      .select({
        rqc: roomQrCodes,
        roomId: rooms.id,
        roomNumber: rooms.roomNumber,
        roomType: rooms.roomType,
        propertyId: properties.id,
        propertyName: properties.name,
      })
      .from(roomQrCodes)
      .leftJoin(rooms, eq(roomQrCodes.roomId, rooms.id))
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(and(eq(roomQrCodes.id, id), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!row) return null;
    return {
      ...row.rqc,
      room_id: row.roomId,
      room_number: row.roomNumber,
      room_type: row.roomType,
      property_id: row.propertyId,
      property_name: row.propertyName,
    };
  }

  async updateQRCode(
    id: string,
    tenantId: string,
    data: { is_active?: boolean; qr_code?: string }
  ) {
    const [exists] = await db
      .select({ id: roomQrCodes.id })
      .from(roomQrCodes)
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(and(eq(roomQrCodes.id, id), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!exists) return null;

    const [updated] = await db
      .update(roomQrCodes)
      .set({
        ...(data.is_active !== undefined && { isActive: data.is_active }),
        ...(data.qr_code != null && { qrCode: data.qr_code }),
        updatedAt: new Date(),
      })
      .where(eq(roomQrCodes.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteQRCode(id: string, tenantId: string) {
    const [exists] = await db
      .select({ id: roomQrCodes.id })
      .from(roomQrCodes)
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(and(eq(roomQrCodes.id, id), eq(properties.tenantId, tenantId)))
      .limit(1);

    if (!exists) return { success: false, message: 'QR code not found' };

    await db.delete(roomQrCodes).where(eq(roomQrCodes.id, id));
    return { success: true, message: 'QR code deleted' };
  }

  async getQRStats(tenantId: string) {
    const rows = await db
      .select({
        total: roomQrCodes.id,
        isActive: roomQrCodes.isActive,
      })
      .from(roomQrCodes)
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(eq(properties.tenantId, tenantId));

    const total = rows.length;
    const active = rows.filter((r) => r.isActive).length;
    return { total, active, inactive: total - active };
  }

  async scanQRCode(
    qrCodeId: string,
    scanData: { scannedAt?: Date; scannedBy?: string; deviceInfo?: string }
  ) {
    const [row] = await db
      .select({
        rqc: roomQrCodes,
        roomId: rooms.id,
        roomNumber: rooms.roomNumber,
        roomType: rooms.roomType,
        propertyId: properties.id,
        propertyName: properties.name,
      })
      .from(roomQrCodes)
      .leftJoin(rooms, eq(roomQrCodes.roomId, rooms.id))
      .innerJoin(properties, eq(roomQrCodes.propertyId, properties.id))
      .where(eq(roomQrCodes.id, qrCodeId))
      .limit(1);

    if (!row) throw new Error('QR code not found');
    if (!row.rqc.isActive) throw new Error('QR code is not active');

    return {
      qrCode: row.rqc,
      scannedAt: scanData.scannedAt ?? new Date(),
      property: { id: row.propertyId, name: row.propertyName },
      room: row.roomId
        ? { id: row.roomId, room_number: row.roomNumber, room_type: row.roomType }
        : null,
    };
  }
}
