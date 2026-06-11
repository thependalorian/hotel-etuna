import { NextResponse, NextRequest } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics/AnalyticsService';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { createCustomReportSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const analyticsService = new AnalyticsService();

export async function POST(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const body = await req.json();

      const validatedData = createCustomReportSchema.parse(body);

      const report = await analyticsService.getCustomReport(user.tenantId, {
        ...validatedData,
        filters: {
          ...validatedData.filters,
          tenantId: user.tenantId,
        },
      });
      return NextResponse.json(report, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      // Handle Zod validation errors
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as { issues: unknown[] };
        return NextResponse.json({ message: 'Invalid input', errors: zodError.issues }, { status: 400 });
      }
      securityLogger.error('Error in analytics route:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');
      const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
      const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
      const metric = searchParams.get('metric');

      if (searchParams.has('dashboard')) {
        try {
          const summary = await analyticsService.getDashboardSummary(user.tenantId, propertyId || undefined);
          if (!summary) {
            // Return default empty summary if service returns null
            return NextResponse.json({
              revenue: { totalRevenue: 0, bookingRevenue: 0, restaurantRevenue: 0, otherRevenue: 0, growthRate: 0, averageOrderValue: 0, revenueByProperty: [], revenueByCategory: [] },
              bookings: { totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, occupancyRate: 0, averageLengthOfStay: 0, bookingByProperty: [], bookingTrends: [] },
              guests: { totalGuests: 0, newGuests: 0, returningGuests: 0, guestRetentionRate: 0, guestsByProperty: [] },
              performance: { bookingConversionRate: 0, averageBookingValue: 0, revenuePerAvailableRoom: 0, costPerAcquisition: 0, customerLifetimeValue: 0, staffProductivity: 0 },
              period: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
            }, { status: 200 });
          }
          return NextResponse.json(summary, { status: 200 });
        } catch (summaryError: any) {
          securityLogger.error('Error in getDashboardSummary:', summaryError);
          // Return default summary on error instead of 500
          return NextResponse.json({
            revenue: { totalRevenue: 0, bookingRevenue: 0, restaurantRevenue: 0, otherRevenue: 0, growthRate: 0, averageOrderValue: 0, revenueByProperty: [], revenueByCategory: [] },
            bookings: { totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, occupancyRate: 0, averageLengthOfStay: 0, bookingByProperty: [], bookingTrends: [] },
            guests: { totalGuests: 0, newGuests: 0, returningGuests: 0, guestRetentionRate: 0, guestsByProperty: [] },
            performance: { bookingConversionRate: 0, averageBookingValue: 0, revenuePerAvailableRoom: 0, costPerAcquisition: 0, customerLifetimeValue: 0, staffProductivity: 0 },
            period: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
          }, { status: 200 });
        }
      } else if (metric) {
        const filters = {
          tenantId: user.tenantId,
          propertyId: propertyId || undefined,
          dateFrom,
          dateTo,
        };

        switch (metric) {
          case 'revenue':
            const revenue = await analyticsService.getRevenueMetrics(filters);
            return NextResponse.json(revenue, { status: 200 });
          case 'bookings':
            const bookings = await analyticsService.getBookingMetrics(filters);
            return NextResponse.json(bookings, { status: 200 });
          case 'guests':
            const guests = await analyticsService.getGuestMetrics(filters);
            return NextResponse.json(guests, { status: 200 });
          case 'performance':
            const performance = await analyticsService.getPerformanceMetrics(filters);
            return NextResponse.json(performance, { status: 200 });
          default:
            return NextResponse.json({ message: 'Invalid metric type' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
      }
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}
