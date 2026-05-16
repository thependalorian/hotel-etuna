/**
 * Knowledge Base Service - Drizzle
 * Purpose: Centralized knowledge management for Sofia AI Concierge
 * Location: /lib/services/ai/KnowledgeBaseService.ts
 */

import { db } from '@/lib/db';
import {
  properties,
  cmsContent,
  cmsMedia,
  rooms,
  restaurants,
  menuCategories,
  cmsMenuItems,
  guests,
  bookings,
} from '@/lib/db/schema';
import { and, eq, desc, asc } from 'drizzle-orm';
import { handleServiceError } from '@/lib/utils/errors';

export interface PlatformKnowledge {
  name: string;
  description: string;
  features: string[];
  pricing: string;
  support: { email: string; responseTime: string };
  location: string;
  currency: string;
}

export interface PropertyKnowledge {
  basicInfo: {
    name: string;
    type: string;
    description: string | null;
    address: string | null;
    city: string | null;
    checkInTime?: string;
    checkOutTime?: string;
  };
  rooms?: Array<{
    id: string;
    type: string;
    description: string | null;
    capacity: number;
    pricePerNight: number | null;
    status: string;
  }>;
  amenities?: string[];
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy?: string;
    petPolicy?: string;
    smokingPolicy?: string;
  };
  restaurant?: {
    name?: string;
    cuisine?: string;
    hours?: unknown;
    menuCategories?: string[];
    dietaryOptions?: string[];
  };
  cmsContent?: {
    descriptions: string[];
    images: Array<{ url: string; caption: string | null }>;
  };
}

export interface GuestKnowledge {
  name: string;
  email: string | null;
  preferences?: {
    roomType?: string;
    dietaryRestrictions?: string[];
    specialRequests?: string;
  };
  bookingHistory?: Array<{
    id: string;
    property: string;
    dates: string;
    status: string;
  }>;
}

export class KnowledgeBaseService {
  getPlatformKnowledge(): PlatformKnowledge {
    return {
      name: 'Hotel Etuna',
      description:
        'Hotel Etuna is a premium luxury guesthouse in Ongwediva, Namibia, offering refined stays, warm Oshiwambo hospitality, and concierge-supported guest experiences.',
      features: [
        'Property Management System (PMS)',
        'AI-Powered Concierge (Sofia)',
        'Content Management System (CMS)',
        'Booking Engine',
        'Restaurant Management',
        'Guest Relationship Management (CRM)',
        'Business Intelligence & Analytics',
      ],
      pricing:
        'Room tiers include Standard, Luxury, Family, Executive Suite, and Premier. Rates start from N$850 per night, with fair seasonal packages and direct booking support through our team.',
      support: { email: 'concierge@hoteletuna.com', responseTime: '24/7 via Sofia AI' },
      location: 'Ongwediva, Namibia',
      currency: 'NAD (Namibian Dollar)',
    };
  }

  async getPropertyKnowledge(propertyId: string, tenantId: string): Promise<PropertyKnowledge | null> {
    try {
      const [property] = await db
        .select()
        .from(properties)
        .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
        .limit(1);

      if (!property) return null;

      const [cmsContentRows, cmsMediaRows] = await Promise.all([
        db
          .select({ content: cmsContent.content, contentType: cmsContent.contentType })
          .from(cmsContent)
          .where(and(eq(cmsContent.propertyId, propertyId), eq(cmsContent.status, 'published')))
          .orderBy(desc(cmsContent.updatedAt))
          .limit(10),
        db
          .select({ filePath: cmsMedia.filePath, caption: cmsMedia.caption })
          .from(cmsMedia)
          .where(and(eq(cmsMedia.propertyId, propertyId), eq(cmsMedia.fileType, 'image')))
          .orderBy(asc(cmsMedia.displayOrder))
          .limit(12),
      ]);

      let roomsWithPricing: PropertyKnowledge['rooms'] = [];
      const propType = property.type ?? '';

      if (propType === 'HOTEL' || propType === 'BOTH') {
        const roomRows = await db
          .select({
            id: rooms.id,
            roomType: rooms.roomType,
            maxOccupancy: rooms.maxOccupancy,
            status: rooms.status,
            baseRate: rooms.baseRate,
            amenities: rooms.amenities,
          })
          .from(rooms)
          .where(eq(rooms.propertyId, propertyId))
          .orderBy(asc(rooms.roomNumber));
        roomsWithPricing = roomRows.map((r) => ({
          id: r.id,
          type: r.roomType,
          description: Array.isArray(r.amenities) ? r.amenities.join(', ') : null,
          capacity: r.maxOccupancy ?? 2,
          pricePerNight: r.baseRate != null ? Number(r.baseRate) : null,
          status: r.status ?? 'available',
        }));
      }

      let restaurantInfo: PropertyKnowledge['restaurant'];
      if (propType === 'RESTAURANT' || propType === 'BOTH') {
        const [rest] = await db
          .select({
            name: restaurants.name,
            cuisineType: restaurants.cuisineType,
            openingHours: restaurants.openingHours,
          })
          .from(restaurants)
          .where(eq(restaurants.propertyId, propertyId))
          .limit(1);
        if (rest) {
          restaurantInfo = {
            name: rest.name,
            cuisine: rest.cuisineType ?? undefined,
            hours: rest.openingHours ?? undefined,
          };
        }
      }

      let menuCategoriesList: string[] = [];
      if (propType === 'RESTAURANT' || propType === 'BOTH') {
        const [rest] = await db
          .select({ id: restaurants.id })
          .from(restaurants)
          .where(eq(restaurants.propertyId, propertyId))
          .limit(1);
        if (rest) {
          const cats = await db
            .select({ name: menuCategories.name })
            .from(menuCategories)
            .where(eq(menuCategories.restaurantId, rest.id));
          menuCategoriesList = [...new Set(cats.map((c) => c.name))];
        }
      }

      const cmsDescriptions = cmsContentRows
        .filter((c) => c.contentType === 'property' && c.content)
        .map((c) => c.content as string);
      const cmsImages = cmsMediaRows.map((m) => ({
        url: m.filePath,
        caption: m.caption,
      }));

      const checkInTime =
        property.checkInTime != null ? String(property.checkInTime) : '14:00';
      const checkOutTime =
        property.checkOutTime != null ? String(property.checkOutTime) : '11:00';

      return {
        basicInfo: {
          name: property.name,
          type: propType,
          description: property.description,
          address: property.address,
          city: property.city,
          checkInTime,
          checkOutTime,
        },
        rooms: roomsWithPricing.length > 0 ? roomsWithPricing : undefined,
        amenities: property.amenities ?? undefined,
        policies: {
          checkInTime,
          checkOutTime,
          cancellationPolicy: undefined,
          petPolicy: undefined,
          smokingPolicy: undefined,
        },
        restaurant: restaurantInfo
          ? {
              ...restaurantInfo,
              menuCategories: menuCategoriesList.length > 0 ? menuCategoriesList : undefined,
              dietaryOptions: undefined,
            }
          : undefined,
        cmsContent:
          cmsDescriptions.length > 0 || cmsImages.length > 0
            ? { descriptions: cmsDescriptions, images: cmsImages }
            : undefined,
      };
    } catch (error) {
      handleServiceError(error, 'Error fetching property knowledge');
      return null;
    }
  }

  async getGuestKnowledge(guestId: string, tenantId: string): Promise<GuestKnowledge | null> {
    try {
      const [guest] = await db
        .select()
        .from(guests)
        .where(and(eq(guests.id, guestId), eq(guests.tenantId, tenantId)))
        .limit(1);

      if (!guest) return null;

      const bookingRows = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          propertyName: properties.name,
        })
        .from(bookings)
        .innerJoin(properties, eq(bookings.propertyId, properties.id))
        .where(eq(bookings.guestId, guestId))
        .orderBy(desc(bookings.createdAt))
        .limit(5);

      const prefs = (guest.preferences as Record<string, unknown>) ?? {};
      return {
        name: [guest.firstName, guest.lastName].filter(Boolean).join(' ') || 'Guest',
        email: guest.email,
        preferences: {
          roomType: prefs.room_type as string | undefined,
          dietaryRestrictions: (prefs.dietary_restrictions as string[]) ?? [],
          specialRequests: prefs.special_requests as string | undefined,
        },
        bookingHistory: bookingRows.map((b) => ({
          id: b.id,
          property: b.propertyName ?? 'Unknown',
          dates: `${b.checkInDate} to ${b.checkOutDate}`,
          status: b.status ?? 'unknown',
        })),
      };
    } catch (error) {
      handleServiceError(error, 'Error fetching guest knowledge');
      return null;
    }
  }

  formatPropertyKnowledge(knowledge: PropertyKnowledge): string {
    let context = `Property: ${knowledge.basicInfo.name} (${knowledge.basicInfo.type})\n`;
    context += `Description: ${knowledge.basicInfo.description ?? 'No description available'}\n`;
    const location = [knowledge.basicInfo.address, knowledge.basicInfo.city].filter(Boolean).join(', ');
    context += `Location: ${location || 'Location not specified'}\n`;
    if (knowledge.basicInfo.checkInTime && knowledge.basicInfo.checkOutTime) {
      context += `Check-in: ${knowledge.basicInfo.checkInTime}, Check-out: ${knowledge.basicInfo.checkOutTime}\n`;
    }
    if (knowledge.rooms && knowledge.rooms.length > 0) {
      context += `\nRooms Available (${knowledge.rooms.length}):\n`;
      knowledge.rooms.forEach((room) => {
        context += `- ${room.type}: Capacity ${room.capacity}, Status: ${room.status}`;
        if (room.pricePerNight) context += `, Price: N$${room.pricePerNight}/night`;
        if (room.description) context += `\n  ${room.description}`;
        context += '\n';
      });
    }
    if (knowledge.amenities && knowledge.amenities.length > 0) {
      context += `\nAmenities: ${knowledge.amenities.join(', ')}\n`;
    }
    if (knowledge.policies) {
      context += `\nPolicies:\n`;
      context += `- Check-in: ${knowledge.policies.checkInTime}\n`;
      context += `- Check-out: ${knowledge.policies.checkOutTime}\n`;
      if (knowledge.policies.cancellationPolicy) {
        context += `- Cancellation: ${knowledge.policies.cancellationPolicy}\n`;
      }
    }
    if (knowledge.restaurant) {
      context += `\nRestaurant: ${knowledge.restaurant.name ?? 'Available'}\n`;
      if (knowledge.restaurant.cuisine) context += `Cuisine: ${knowledge.restaurant.cuisine}\n`;
      if (knowledge.restaurant.menuCategories && knowledge.restaurant.menuCategories.length > 0) {
        context += `Menu Categories: ${knowledge.restaurant.menuCategories.join(', ')}\n`;
      }
    }
    if (knowledge.cmsContent && knowledge.cmsContent.descriptions.length > 0) {
      context += `\nAdditional Information:\n${knowledge.cmsContent.descriptions.join('\n')}\n`;
    }
    return context;
  }

  formatGuestKnowledge(knowledge: GuestKnowledge): string {
    let context = `Guest: ${knowledge.name}\n`;
    if (knowledge.email) context += `Email: ${knowledge.email}\n`;
    if (knowledge.preferences) {
      context += '\nPreferences:\n';
      if (knowledge.preferences.roomType) context += `- Preferred room type: ${knowledge.preferences.roomType}\n`;
      if (knowledge.preferences.dietaryRestrictions?.length) {
        context += `- Dietary restrictions: ${knowledge.preferences.dietaryRestrictions.join(', ')}\n`;
      }
      if (knowledge.preferences.specialRequests) context += `- Special requests: ${knowledge.preferences.specialRequests}\n`;
    }
    if (knowledge.bookingHistory && knowledge.bookingHistory.length > 0) {
      context += '\nPrevious Bookings:\n';
      knowledge.bookingHistory.forEach((b) => {
        context += `- ${b.property} (${b.dates}) - ${b.status}\n`;
      });
    }
    return context;
  }
}
