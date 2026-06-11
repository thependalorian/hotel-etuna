/**
 * @fileoverview TableService — restaurant table CRUD and QR assignment (`restaurant_tables`).
 * Location: lib/services/restaurant/TableService.ts
 */
import { db, restaurantTables as restaurantTablesSchema } from '@/lib/db';
import { TableData } from '@/lib/types/restaurant';
import { RestaurantTable, NewRestaurantTable } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, asc } from 'drizzle-orm';
import { NamQrService } from '@/lib/services/qr/NAMQRService';

export class TableService {
  private namQr: NamQrService;

  constructor() {
    this.namQr = new NamQrService();
  }

  async createTable(tenantId: string, data: TableData): Promise<RestaurantTable> {
    try {
      const qrLookupCode = uuidv4();
      const { qrCodeUrl, qrCodeImageUrl } = this.namQr.buildRestaurantTableQrUrls(qrLookupCode);

      const newTableData: NewRestaurantTable = {
        restaurantId: data.restaurantId,
        propertyId: data.propertyId,
        tableNumber: data.tableNumber,
        tableName: data.tableName,
        capacity: data.capacity,
        location: data.location,
        qrCode: qrLookupCode,
        qrCodeUrl: qrCodeUrl,
        qrCodeImageUrl: qrCodeImageUrl,
        isActive: true,
      };

      const newTables = await db.insert(restaurantTablesSchema).values(newTableData).returning();
      
      return newTables[0];
    } catch (error) {
      throw handleServiceError(error, 'Error creating table');
    }
  }

  async getTablesByRestaurant(restaurantId: string): Promise<RestaurantTable[]> {
    try {
      const tables = await db
        .select()
        .from(restaurantTablesSchema)
        .where(and(eq(restaurantTablesSchema.restaurantId, restaurantId), eq(restaurantTablesSchema.isActive, true)))
        .orderBy(asc(restaurantTablesSchema.tableNumber));
      return tables;
    } catch (error) {
      handleServiceError(error, 'Error fetching tables by restaurant');
      return [];
    }
  }

  async getTableByQrCode(qrCode: string): Promise<RestaurantTable> {
    try {
      const result = await db
        .select()
        .from(restaurantTablesSchema)
        .where(and(eq(restaurantTablesSchema.qrCode, qrCode), eq(restaurantTablesSchema.isActive, true)))
        .limit(1);

      if (result.length === 0) {
        throw new AppError(404, 'Table not found');
      }

      return result[0];
    } catch (error) {
      throw handleServiceError(error, 'Error fetching table by QR code');
    }
  }
}
