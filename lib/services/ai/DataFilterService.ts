/**
 * Data Filter Service
 * 
 * Purpose: Filter sensitive data based on user role and access level
 * Location: /lib/services/ai/DataFilterService.ts
 * 
 * Features:
 * - Role-based data filtering (public, guest, admin)
 * - Remove sensitive admin-only information
 * - Ensure data privacy and security
 * 
 * Usage:
 * ```ts
 * const filter = new DataFilterService();
 * const publicData = filter.filterPublicData(propertyData, 'public');
 * ```
 */

export type UserRole = 'public' | 'guest' | 'admin';

export interface PropertyData {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string;
  city: string | null;
  // Admin-only fields
  tenant_id?: string;
  owner_id?: string;
  revenue?: number;
  costs?: number;
  internal_notes?: string;
  // Public fields
  amenities?: string[];
  images?: string[];
  policies?: Record<string, any>;
}

export class DataFilterService {
  /**
   * Filter property data based on user role
   */
  filterPropertyData(data: PropertyData, role: UserRole): Partial<PropertyData> {
    const filtered: Partial<PropertyData> = {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      address: data.address,
      city: data.city,
    };

    // Public and guest can see amenities, images, policies
    if (role === 'public' || role === 'guest' || role === 'admin') {
      if (data.amenities) filtered.amenities = data.amenities;
      if (data.images) filtered.images = data.images;
      if (data.policies) filtered.policies = data.policies;
    }

    // Only admin can see sensitive data
    if (role === 'admin') {
      if (data.tenant_id) filtered.tenant_id = data.tenant_id;
      if (data.owner_id) filtered.owner_id = data.owner_id;
      if (data.revenue !== undefined) filtered.revenue = data.revenue;
      if (data.costs !== undefined) filtered.costs = data.costs;
      if (data.internal_notes) filtered.internal_notes = data.internal_notes;
    }

    return filtered;
  }

  /**
   * Filter guest data based on user role
   */
  filterGuestData(data: any, role: UserRole): any {
    const filtered: any = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
    };

    // Public users cannot see guest data
    if (role === 'public') {
      return null; // No guest data for public
    }

    // Guests and admins can see basic info
    if (role === 'guest' || role === 'admin') {
      if (data.email) filtered.email = data.email;
      if (data.phone) filtered.phone = data.phone;
    }

    // Only admin can see sensitive guest data
    if (role === 'admin') {
      if (data.payment_info) filtered.payment_info = data.payment_info;
      if (data.internal_notes) filtered.internal_notes = data.internal_notes;
      if (data.preferences) filtered.preferences = data.preferences;
    }

    return filtered;
  }

  /**
   * Filter booking data based on user role
   */
  filterBookingData(data: any, role: UserRole): any {
    const filtered: any = {
      id: data.id,
      status: data.status,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
    };

    // Public users cannot see booking data
    if (role === 'public') {
      return null;
    }

    // Guests can see their own bookings
    if (role === 'guest' || role === 'admin') {
      if (data.property) filtered.property = this.filterPropertyData(data.property, role);
      if (data.total_amount) filtered.total_amount = data.total_amount;
    }

    // Only admin can see sensitive booking data
    if (role === 'admin') {
      if (data.payment_status) filtered.payment_status = data.payment_status;
      if (data.internal_notes) filtered.internal_notes = data.internal_notes;
      if (data.guest) filtered.guest = data.guest;
    }

    return filtered;
  }

  /**
   * Check if user role can access specific data type
   */
  canAccess(role: UserRole, dataType: 'property' | 'guest' | 'booking' | 'financial' | 'staff'): boolean {
    const accessMatrix: Record<UserRole, Record<string, boolean>> = {
      public: {
        property: true,
        guest: false,
        booking: false,
        financial: false,
        staff: false,
      },
      guest: {
        property: true,
        guest: true, // Own guest data
        booking: true, // Own bookings
        financial: false,
        staff: false,
      },
      admin: {
        property: true,
        guest: true,
        booking: true,
        financial: true,
        staff: true,
      },
    };

    return accessMatrix[role]?.[dataType] || false;
  }
}
