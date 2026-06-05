import { NextResponse, NextRequest } from 'next/server';
import { OrderService } from '@/lib/services/restaurant/OrderService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { TableService } from '@/lib/services/restaurant/TableService';
import { db, properties, guests } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { securityLogger } from '@/lib/utils/security-logger.client';

const orderService = new OrderService();
const propertyService = new PropertyService();
const tableService = new TableService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, items, guestEmail, guestFirstName, guestLastName, specialInstructions } = body;

    if (!qrCode || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required fields for order' }, { status: 400 });
    }

    // 1. Validate QR Code and get associated table/room, restaurant, and property
    const table = await tableService.getTableByQrCode(qrCode);
    // For now, only supporting table QR codes. Room QR codes would be similar.
    if (!table) {
      return NextResponse.json({ message: 'Invalid QR Code or table not found' }, { status: 404 });
    }

    const restaurantId = table.restaurantId;
    const propertyId = table.propertyId;
    if (!restaurantId || !propertyId) {
      return NextResponse.json({ message: 'Table not linked to restaurant or property' }, { status: 404 });
    }

    // Get tenantId from property (public route - no tenant check)
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (!property) {
      return NextResponse.json({ message: 'Associated property not found' }, { status: 404 });
    }
    const tenantId = property.tenantId;
    if (!tenantId) {
      return NextResponse.json({ message: 'Property has no tenant' }, { status: 404 });
    }

    // 2. Handle Guest Identification
    let guestId: string;
    if (guestEmail) {
      const [existingGuest] = await db.select({ id: guests.id }).from(guests).where(and(eq(guests.email, guestEmail), eq(guests.tenantId, tenantId))).limit(1);

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const [newGuest] = await db.insert(guests).values({
          id: uuidv4(),
          tenantId,
          email: guestEmail,
          firstName: guestFirstName ?? null,
          lastName: guestLastName ?? null,
          isSignedUp: false,
        }).returning();
        if (!newGuest) {
          return NextResponse.json({ message: 'Failed to create guest' }, { status: 500 });
        }
        guestId = newGuest.id;
      }
    } else {
      // For anonymous orders, create a generic guest or use a placeholder
      // For MVP, we'll require an email for guest tracking.
      return NextResponse.json({ message: 'Guest email is required for ordering' }, { status: 400 });
    }

    // 3. Create the order
    const newOrder = await orderService.createOrder(tenantId, {
      restaurantId,
      propertyId,
      guestId,
      tableId: table.id,
      qrCode,
      orderType: 'dine_in', // Assuming dine_in for QR code orders
      tableNumber: table.tableNumber,
      specialInstructions,
      items,
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    securityLogger.error('Error creating public order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
