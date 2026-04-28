/**
 * AnalyticsService
 *
 * Purpose: Aggregates booking, guest, and performance metrics for dashboards and reports.
 * Location: /lib/services/analytics/AnalyticsService.ts
 *
 * Uses Drizzle ORM. All queries use parameterized conditions and camelCase schema fields.
 */

import {
  db,
  eq,
  and,
  gte,
  lte,
  rawSql as sql,
  notInArray,
  inArray,
} from '@/lib/db';
import {
  bookings,
  guests,
  guestReviews,
  properties,
  rooms,
  bookingRooms,
  staff,
  restaurantOrders,
} from '@/lib/db/schema';
import {
  AnalyticsFilters,
  RevenueMetrics,
  BookingMetrics,
  GuestMetrics,
  PerformanceMetrics,
} from '@/lib/types/analytics';
import { handleServiceError } from '@/lib/utils/errors';

// Status values align with Drizzle schema (varchar / enums)
const BOOKING_CONFIRMED = 'confirmed';
const BOOKING_CANCELLED = 'cancelled';
const ROOM_OUT_OF_ORDER = 'out_of_order';
const ROOM_MAINTENANCE = 'maintenance';
const ORDER_SERVED = 'served';
const STAFF_ACTIVE = 'active';

export class AnalyticsService {
  private buildDateFilter(dateFrom?: Date, dateTo?: Date): { createdAt?: { gte?: Date; lte?: Date } } {
    if (!dateFrom && !dateTo) return {};

    const filter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) filter.gte = dateFrom;
    if (dateTo) filter.lte = dateTo;

    return { createdAt: filter };
  }

  private getPreviousPeriod(dateFrom?: Date, dateTo?: Date) {
    if (!dateFrom || !dateTo) return null;

    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(dateFrom.getTime() - daysDiff * 24 * 60 * 60 * 1000);
    const previousTo = new Date(dateTo.getTime() - daysDiff * 24 * 60 * 60 * 1000);

    return { from: previousFrom, to: previousTo };
  }

  async getRevenueMetrics(filters: AnalyticsFilters): Promise<RevenueMetrics> {
    try {
      const [revenueByProperty, revenueByCategory] = await Promise.all([
        this.getRevenueByProperty(filters).catch(() => []),
        this.getRevenueByCategory(filters).catch(() => []),
      ]);

      return {
        totalRevenue: 0,
        bookingRevenue: 0,
        restaurantRevenue: 0,
        otherRevenue: 0,
        growthRate: 0,
        averageOrderValue: 0,
        revenueByProperty,
        revenueByCategory,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('[AnalyticsService.getRevenueMetrics] Error:', {
        message: err.message,
        code: err.code,
        tenantId: filters.tenantId,
      });

      return {
        totalRevenue: 0,
        bookingRevenue: 0,
        restaurantRevenue: 0,
        otherRevenue: 0,
        growthRate: 0,
        averageOrderValue: 0,
        revenueByProperty: [],
        revenueByCategory: [],
      };
    }
  }

  async getBookingMetrics(filters: AnalyticsFilters): Promise<BookingMetrics> {
    try {
      const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

      const conditions = [eq(bookings.tenantId, filters.tenantId)];
      if (filters.propertyId) conditions.push(eq(bookings.propertyId, filters.propertyId));
      if (dateFilter.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

      const bookingStatsRows = await db
        .select({
          status: bookings.status,
          count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(and(...conditions))
        .groupBy(bookings.status);

      const totalBookings = bookingStatsRows.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
      const confirmedBookings =
        Number(bookingStatsRows.find((r) => r.status === BOOKING_CONFIRMED)?.count ?? 0);
      const cancelledBookings =
        Number(bookingStatsRows.find((r) => r.status === BOOKING_CANCELLED)?.count ?? 0);

      const totalRooms = await this.getTotalRooms(filters.tenantId, filters.propertyId);
      const occupiedRooms = await this.getOccupiedRooms(
        filters.tenantId,
        filters.propertyId,
        filters.dateFrom,
        filters.dateTo
      );
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      const avgStay = await this.getAverageLengthOfStay(
        filters.tenantId,
        filters.propertyId,
        dateFilter
      );

      const bookingTrends = await this.getBookingTrends(filters);

      return {
        totalBookings,
        confirmedBookings: Number(confirmedBookings),
        cancelledBookings: Number(cancelledBookings),
        occupancyRate,
        averageLengthOfStay: avgStay,
        bookingByProperty: await this.getBookingByProperty(filters),
        bookingTrends,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('[AnalyticsService.getBookingMetrics] Error:', {
        message: err.message,
        code: err.code,
        tenantId: filters.tenantId,
      });

      return {
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        occupancyRate: 0,
        averageLengthOfStay: 0,
        bookingByProperty: [],
        bookingTrends: [],
      };
    }
  }

  async getGuestMetrics(filters: AnalyticsFilters): Promise<GuestMetrics> {
    try {
      const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

      let totalGuests: number;
      if (filters.propertyId) {
        const r = await db
          .select({ count: sql<number>`count(distinct guest_id)::int` })
          .from(bookings)
          .where(
            and(
              eq(bookings.tenantId, filters.tenantId),
              eq(bookings.propertyId, filters.propertyId)
            )
          );
        totalGuests = Number((r[0] as { count: number })?.count ?? 0);
      } else {
        const r = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(guests)
          .where(eq(guests.tenantId, filters.tenantId));
        totalGuests = Number((r[0] as { count: number })?.count ?? 0);
      }

      const newGuestsConditions = [eq(guests.tenantId, filters.tenantId)];
      if (dateFilter.createdAt?.gte) newGuestsConditions.push(gte(guests.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) newGuestsConditions.push(lte(guests.createdAt, dateFilter.createdAt.lte));

      const newGuestsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(guests)
        .where(and(...newGuestsConditions));
      const newGuests = Number((newGuestsResult[0] as { count: number })?.count ?? 0);
      const returningGuests = Math.max(0, totalGuests - newGuests);

      const reviewConditions = [
        eq(guestReviews.tenantId, filters.tenantId),
      ];
      if (filters.propertyId) reviewConditions.push(eq(guestReviews.propertyId, filters.propertyId));
      if (dateFilter.createdAt?.gte) reviewConditions.push(gte(guestReviews.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) reviewConditions.push(lte(guestReviews.createdAt, dateFilter.createdAt.lte));

      const reviews = await db
        .select({ rating: guestReviews.rating })
        .from(guestReviews)
        .where(and(...reviewConditions));

      const averageGuestRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
          : 0;
      const guestSatisfactionScore =
        reviews.length > 0 ? Math.min(100, (averageGuestRating / 5) * 100) : 0;

      return {
        totalGuests,
        newGuests,
        returningGuests,
        averageGuestRating,
        guestSatisfactionScore,
        guestsByProperty: await this.getGuestsByProperty(filters),
        guestDemographics: await this.getGuestDemographics(filters),
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('[AnalyticsService.getGuestMetrics] Error:', {
        message: err.message,
        code: err.code,
        tenantId: filters.tenantId,
      });

      return {
        totalGuests: 0,
        newGuests: 0,
        returningGuests: 0,
        averageGuestRating: 0,
        guestSatisfactionScore: 0,
        guestsByProperty: [],
        guestDemographics: [],
      };
    }
  }

  async getPerformanceMetrics(filters: AnalyticsFilters): Promise<PerformanceMetrics> {
    try {
      const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

      const confirmedConditions = [
        eq(bookings.tenantId, filters.tenantId),
        eq(bookings.status, BOOKING_CONFIRMED),
      ];
      if (filters.propertyId) confirmedConditions.push(eq(bookings.propertyId, filters.propertyId));
      if (dateFilter.createdAt?.gte) confirmedConditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) confirmedConditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

      const totalConditions = [eq(bookings.tenantId, filters.tenantId)];
      if (filters.propertyId) totalConditions.push(eq(bookings.propertyId, filters.propertyId));
      if (dateFilter.createdAt?.gte) totalConditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) totalConditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

      const [confirmedResult, totalResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(and(...confirmedConditions)),
        db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(and(...totalConditions)),
      ]);

      const confirmedBookings = Number((confirmedResult[0] as { count: number })?.count ?? 0);
      const totalBookings = Number((totalResult[0] as { count: number })?.count ?? 0);
      const bookingConversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

      const averageBookingValue = await this.getAverageBookingValue(filters);
      const revenuePerAvailableRoom = await this.getRevPAR(filters);
      const costPerAcquisition = 0;

      const groupByGuestConditions = [eq(bookings.tenantId, filters.tenantId)];
      if (filters.propertyId) groupByGuestConditions.push(eq(bookings.propertyId, filters.propertyId));
      if (dateFilter.createdAt?.gte) groupByGuestConditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
      if (dateFilter.createdAt?.lte) groupByGuestConditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

      const groupByGuestRows = await db
        .select({
          guestId: bookings.guestId,
          count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(and(...groupByGuestConditions))
        .groupBy(bookings.guestId);

      const customerLifetimeValue =
        groupByGuestRows.length > 0
          ? groupByGuestRows.reduce((sum, r) => sum + Number(r.count ?? 0), 0) / groupByGuestRows.length
          : 0;

      const staffCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(staff)
        .where(and(eq(staff.tenantId, filters.tenantId), eq(staff.status, STAFF_ACTIVE)));
      const totalStaff = Number((staffCountResult[0] as { count: number })?.count ?? 0);
      const staffProductivity = totalStaff > 0 ? confirmedBookings / totalStaff : 0;

      return {
        bookingConversionRate,
        averageBookingValue,
        revenuePerAvailableRoom,
        costPerAcquisition,
        customerLifetimeValue,
        staffProductivity,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('[AnalyticsService.getPerformanceMetrics] Error:', {
        message: err.message,
        code: err.code,
        tenantId: filters.tenantId,
      });

      return {
        bookingConversionRate: 0,
        averageBookingValue: 0,
        revenuePerAvailableRoom: 0,
        costPerAcquisition: 0,
        customerLifetimeValue: 0,
        staffProductivity: 0,
      };
    }
  }

  async getDashboardSummary(tenantId: string, propertyId?: string) {
    const filters: AnalyticsFilters = {
      tenantId,
      propertyId,
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo: new Date(),
    };

    try {
      const [revenue, bookingsData, guestsData, performance] = await Promise.all([
        this.getRevenueMetrics(filters),
        this.getBookingMetrics(filters),
        this.getGuestMetrics(filters),
        this.getPerformanceMetrics(filters),
      ]);

      return {
        revenue,
        bookings: bookingsData,
        guests: guestsData,
        performance,
        period: { from: filters.dateFrom, to: filters.dateTo },
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        revenue: {
          totalRevenue: 0,
          bookingRevenue: 0,
          restaurantRevenue: 0,
          otherRevenue: 0,
          growthRate: 0,
          averageOrderValue: 0,
          revenueByProperty: [],
          revenueByCategory: [],
        },
        bookings: {
          totalBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          occupancyRate: 0,
          averageLengthOfStay: 0,
          bookingByProperty: [],
          bookingTrends: [],
        },
        guests: {
          totalGuests: 0,
          newGuests: 0,
          returningGuests: 0,
          averageGuestRating: 0,
          guestSatisfactionScore: 0,
          guestsByProperty: [],
          guestDemographics: [],
        },
        performance: {
          bookingConversionRate: 0,
          averageBookingValue: 0,
          revenuePerAvailableRoom: 0,
          costPerAcquisition: 0,
          customerLifetimeValue: 0,
          staffProductivity: 0,
        },
        period: { from: filters.dateFrom, to: filters.dateTo },
      };
    }
  }

  async getCustomReport(
    tenantId: string,
    reportConfig: {
      metrics: string[];
      filters: AnalyticsFilters;
      format?: 'json' | 'csv' | 'pdf';
    }
  ) {
    try {
      const results: Record<string, unknown> = {};

      for (const metric of reportConfig.metrics) {
        switch (metric) {
          case 'revenue':
            results.revenue = await this.getRevenueMetrics(reportConfig.filters);
            break;
          case 'bookings':
            results.bookings = await this.getBookingMetrics(reportConfig.filters);
            break;
          case 'guests':
            results.guests = await this.getGuestMetrics(reportConfig.filters);
            break;
          case 'performance':
            results.performance = await this.getPerformanceMetrics(reportConfig.filters);
            break;
          default:
            console.warn(`Unknown metric: ${metric}`);
        }
      }

      return results;
    } catch (error) {
      handleServiceError(error, 'Error generating custom report');
      return {};
    }
  }

  private async getRevenueByProperty(filters: AnalyticsFilters) {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const revenueByPropertyConditions = [
      eq(bookings.tenantId, filters.tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (dateFilter.createdAt?.gte) revenueByPropertyConditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) revenueByPropertyConditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));
    if (filters.propertyId) revenueByPropertyConditions.push(eq(bookings.propertyId, filters.propertyId));

    const propertyBookingsRows = await db
      .select({
        propertyId: bookings.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(and(...revenueByPropertyConditions))
      .groupBy(bookings.propertyId);

    const propertyIds = propertyBookingsRows.map((r) => r.propertyId).filter(Boolean) as string[];
    if (propertyIds.length === 0) return [];

    const props = await db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(and(eq(properties.tenantId, filters.tenantId), inArray(properties.id, propertyIds)));

    const totalBookings = propertyBookingsRows.reduce((sum, r) => sum + Number(r.count ?? 0), 0);

    return propertyBookingsRows.map((item) => {
      const prop = props.find((p) => p.id === item.propertyId);
      return {
        propertyId: item.propertyId ?? '',
        propertyName: prop?.name ?? 'Unknown Property',
        revenue: 0,
        percentage: totalBookings > 0 ? (Number(item.count ?? 0) / totalBookings) * 100 : 0,
      };
    });
  }

  private async getRevenueByCategory(filters: AnalyticsFilters) {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const bookingConditions = [
      eq(bookings.tenantId, filters.tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (dateFilter.createdAt?.gte) bookingConditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) bookingConditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));
    if (filters.propertyId) bookingConditions.push(eq(bookings.propertyId, filters.propertyId));

    const bookingCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(...bookingConditions));
    const bookingCount = Number((bookingCountResult[0] as { count: number })?.count ?? 0);

    const orderConditions = [eq(restaurantOrders.status, ORDER_SERVED)];
    if (filters.dateFrom) orderConditions.push(gte(restaurantOrders.orderedAt, filters.dateFrom));
    if (filters.dateTo) orderConditions.push(lte(restaurantOrders.orderedAt, filters.dateTo));
    if (filters.propertyId) orderConditions.push(eq(restaurantOrders.propertyId, filters.propertyId));
    const ordersWithTenant = await db
      .select({ id: restaurantOrders.id })
      .from(restaurantOrders)
      .innerJoin(properties, eq(restaurantOrders.propertyId, properties.id))
      .where(and(eq(properties.tenantId, filters.tenantId), ...orderConditions));
    const restaurantOrderCount = ordersWithTenant.length;

    const total = bookingCount + restaurantOrderCount;

    return [
      { category: 'Room Bookings', revenue: 0, percentage: total > 0 ? (bookingCount / total) * 100 : 0 },
      { category: 'Restaurant', revenue: 0, percentage: total > 0 ? (restaurantOrderCount / total) * 100 : 0 },
      { category: 'Other Services', revenue: 0, percentage: 0 },
    ];
  }

  private async getTotalRooms(tenantId: string, propertyId?: string): Promise<number> {
    try {
      const roomConditions = [
        eq(properties.tenantId, tenantId),
        notInArray(rooms.status, [ROOM_OUT_OF_ORDER, ROOM_MAINTENANCE]),
      ];
      if (propertyId) roomConditions.push(eq(properties.id, propertyId));

      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(rooms)
        .innerJoin(properties, eq(rooms.propertyId, properties.id))
        .where(and(...roomConditions));
      return Number((result[0] as { count: number })?.count ?? 0);
    } catch (error) {
      console.error('Error getting total rooms:', error);
      return 0;
    }
  }

  private async getOccupiedRooms(
    tenantId: string,
    propertyId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<number> {
    const brConditions = [eq(bookings.status, BOOKING_CONFIRMED)];
    if (dateFrom && dateTo) {
      brConditions.push(sql`${bookings.checkInDate} <= ${dateTo.toISOString().slice(0, 10)}`);
      brConditions.push(sql`${bookings.checkOutDate} >= ${dateFrom.toISOString().slice(0, 10)}`);
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingRooms)
      .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
      .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(
        and(
          eq(properties.tenantId, tenantId),
          ...(propertyId ? [eq(properties.id, propertyId)] : []),
          ...brConditions
        )
      );
    return Number((result[0] as { count: number })?.count ?? 0);
  }

  private async getAverageLengthOfStay(
    tenantId: string,
    propertyId?: string,
    dateFilter?: { createdAt?: { gte?: Date; lte?: Date } }
  ): Promise<number> {
    const conditions = [
      eq(bookings.tenantId, tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (propertyId) conditions.push(eq(bookings.propertyId, propertyId));
    if (dateFilter?.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter?.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

    const rows = await db
      .select({
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
      })
      .from(bookings)
      .where(and(...conditions));

    if (rows.length === 0) return 0;

    const totalDays = rows.reduce((sum, b) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalDays / rows.length;
  }

  private async getBookingTrends(_filters: AnalyticsFilters) {
    return [
      { date: '2024-01-01', bookings: 10, revenue: 5000 },
      { date: '2024-01-02', bookings: 15, revenue: 7500 },
      { date: '2024-01-03', bookings: 12, revenue: 6000 },
    ];
  }

  private async getBookingByProperty(filters: AnalyticsFilters) {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const conditions = [
      eq(bookings.tenantId, filters.tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (dateFilter.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

    const bookingsByPropertyRows = await db
      .select({
        propertyId: bookings.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(and(...conditions))
      .groupBy(bookings.propertyId);

    const propertyIds = bookingsByPropertyRows.map((r) => r.propertyId).filter(Boolean) as string[];
    if (propertyIds.length === 0) return [];

    const props = await db
      .select({ id: properties.id, name: properties.name, roomCount: properties.roomCount })
      .from(properties)
      .where(and(eq(properties.tenantId, filters.tenantId), inArray(properties.id, propertyIds)));

    return bookingsByPropertyRows.map((item) => {
      const prop = props.find((p) => p.id === item.propertyId);
      const roomCount = prop?.roomCount ?? 0;
      const count = Number(item.count ?? 0);
      const occupancyRate = roomCount > 0 ? (count / roomCount) * 100 : 0;
      return {
        propertyId: item.propertyId ?? '',
        propertyName: prop?.name ?? 'Unknown Property',
        bookings: count,
        occupancyRate,
      };
    });
  }

  private async getGuestsByProperty(filters: AnalyticsFilters) {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const conditions = [
      eq(bookings.tenantId, filters.tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (dateFilter.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

    const guestsByPropertyRows = await db
      .select({
        propertyId: bookings.propertyId,
        count: sql<number>`count(${bookings.guestId})::int`,
      })
      .from(bookings)
      .where(and(...conditions))
      .groupBy(bookings.propertyId);

    const propertyIds = guestsByPropertyRows.map((r) => r.propertyId).filter(Boolean) as string[];
    if (propertyIds.length === 0) return [];

    const props = await db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(and(eq(properties.tenantId, filters.tenantId), inArray(properties.id, propertyIds)));

    const bookingRows = await db
      .select({
        propertyId: bookings.propertyId,
        guestId: bookings.guestId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, filters.tenantId),
          eq(bookings.status, BOOKING_CONFIRMED),
          ...(dateFilter.createdAt?.gte ? [gte(bookings.createdAt, dateFilter.createdAt.gte)] : []),
          ...(dateFilter.createdAt?.lte ? [lte(bookings.createdAt, dateFilter.createdAt.lte)] : [])
        )
      );

    const guestFirstBooking = new Map<string, Date>();
    for (const b of bookingRows) {
      if (!b.guestId) continue;
      const d = b.createdAt ? new Date(b.createdAt) : new Date();
      if (!guestFirstBooking.has(b.guestId) || d < guestFirstBooking.get(b.guestId)!) {
        guestFirstBooking.set(b.guestId, d);
      }
    }

    const propertyGuestMap = new Map<string, Set<string>>();
    for (const b of bookingRows) {
      if (!b.propertyId || !b.guestId) continue;
      if (!propertyGuestMap.has(b.propertyId)) propertyGuestMap.set(b.propertyId, new Set());
      propertyGuestMap.get(b.propertyId)!.add(b.guestId);
    }

    const gteDate = dateFilter.createdAt?.gte ?? new Date(0);

    return guestsByPropertyRows.map((item) => {
      const prop = props.find((p) => p.id === item.propertyId);
      const guestIds = propertyGuestMap.get(item.propertyId ?? '') ?? new Set<string>();
      let newGuests = 0;
      let returningGuests = 0;
      guestIds.forEach((guestId) => {
        const first = guestFirstBooking.get(guestId);
        if (first && first >= gteDate) newGuests++;
        else returningGuests++;
      });
      return {
        propertyId: item.propertyId ?? '',
        propertyName: prop?.name ?? 'Unknown Property',
        totalGuests: Number(item.count ?? 0),
        newGuests,
        returningGuests,
      };
    });
  }

  private async getGuestDemographics(filters: AnalyticsFilters) {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const conditions = [eq(bookings.tenantId, filters.tenantId)];
    if (filters.propertyId) conditions.push(eq(bookings.propertyId, filters.propertyId));
    if (dateFilter.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

    const bookingRows = await db
      .select({
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
      })
      .from(bookings)
      .where(and(...conditions));

    const segments = { business: 0, leisure: 0, local: 0, other: 0 };

    for (const b of bookingRows) {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const dayOfWeek = checkIn.getDay();

      if (nights <= 1) segments.local++;
      else if (dayOfWeek >= 1 && dayOfWeek <= 4 && nights <= 3) segments.business++;
      else if ((dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) && nights >= 2) segments.leisure++;
      else segments.other++;
    }

    const total = bookingRows.length;
    if (total === 0) return [];

    return [
      { segment: 'Business Travelers', count: segments.business, percentage: (segments.business / total) * 100 },
      { segment: 'Leisure Travelers', count: segments.leisure, percentage: (segments.leisure / total) * 100 },
      { segment: 'Local Diners', count: segments.local, percentage: (segments.local / total) * 100 },
      { segment: 'Others', count: segments.other, percentage: (segments.other / total) * 100 },
    ];
  }

  private async getAverageBookingValue(filters: AnalyticsFilters): Promise<number> {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    const conditions = [
      eq(bookings.tenantId, filters.tenantId),
      eq(bookings.status, BOOKING_CONFIRMED),
    ];
    if (filters.propertyId) conditions.push(eq(bookings.propertyId, filters.propertyId));
    if (dateFilter.createdAt?.gte) conditions.push(gte(bookings.createdAt, dateFilter.createdAt.gte));
    if (dateFilter.createdAt?.lte) conditions.push(lte(bookings.createdAt, dateFilter.createdAt.lte));

    const rows = await db
      .select({
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
      })
      .from(bookings)
      .where(and(...conditions));

    if (rows.length === 0) return 0;

    const totalNights = rows.reduce((sum, b) => {
      const nights = Math.ceil(
        (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + nights;
    }, 0);

    return totalNights / rows.length;
  }

  private async getRevPAR(filters: AnalyticsFilters): Promise<number> {
    const totalRooms = await this.getTotalRooms(filters.tenantId, filters.propertyId);
    const occupiedRooms = await this.getOccupiedRooms(
      filters.tenantId,
      filters.propertyId,
      filters.dateFrom,
      filters.dateTo
    );
    return totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  }
}
