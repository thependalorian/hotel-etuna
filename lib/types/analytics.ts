/**
 * @fileoverview Analytics domain DTOs (filters, KPI aggregates).
 * Location: lib/types/analytics.ts
 */
export interface AnalyticsFilters {
  tenantId: string;
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface RevenueMetrics {
  totalRevenue: number;
  bookingRevenue: number;
  restaurantRevenue: number;
  otherRevenue: number;
  growthRate: number;
  averageOrderValue: number;
  revenueByProperty: Array<{
    propertyId: string;
    propertyName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

export interface BookingMetrics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  occupancyRate: number;
  averageLengthOfStay: number;
  bookingByProperty: Array<{
    propertyId: string;
    propertyName: string;
    bookings: number;
    occupancyRate: number;
  }>;
  bookingTrends: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface GuestMetrics {
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  averageGuestRating: number;
  guestSatisfactionScore: number;
  guestsByProperty: Array<{
    propertyId: string;
    propertyName: string;
    totalGuests: number;
    newGuests: number;
    returningGuests: number;
  }>;
  guestDemographics: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export interface PerformanceMetrics {
  bookingConversionRate: number;
  averageBookingValue: number;
  revenuePerAvailableRoom: number;
  costPerAcquisition: number;
  customerLifetimeValue: number;
  staffProductivity: number;
}
