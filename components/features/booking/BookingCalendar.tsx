/**
 * BookingCalendar Component
 * 
 * Purpose: Display a calendar view for booking management with availability indicators
 * Location: /components/features/booking/BookingCalendar.tsx
 * 
 * Features:
 * - Monthly calendar view using CalendarService
 * - Booking availability indicators
 * - Occupancy percentage display
 * - Date selection for bookings
 * - Blackout date support
 * - Responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { calendarService, CalendarMonth, CalendarDay } from '@/lib/services/calendar/CalendarService';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { expandBookingDateStrings } from '@/lib/bookings/booking-kind';

interface BookingCalendarProps {
  propertyId: string;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  minStay?: number;
  maxStay?: number;
  blackoutDates?: Date[];
  className?: string;
}

export default function BookingCalendar({
  propertyId,
  onDateSelect,
  selectedDate,
  minStay = 1,
  maxStay = 30,
  blackoutDates = [],
  className = '',
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(calendarService.startOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Map<string, number>>(new Map());
  const [stayBookings, setStayBookings] = useState<Map<string, number>>(new Map());
  const [occupancy, setOccupancy] = useState<Map<string, number>>(new Map());
  const GUEST_ROOM_DENOMINATOR = 35;

  // Fetch bookings for the current month
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = calendarService.startOfDay(new Date(year, month, 1));
        const dateStr = calendarService.formatDate(firstDayOfMonth);
        
        // Fetch bookings for this month
        const response = await fetch(
          apiUrl(`/api/bookings?propertyId=${propertyId}&startDate=${dateStr}`),
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const json = await response.json();
          const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
          const bookingsMap = new Map<string, number>();
          const staysMap = new Map<string, number>();
          const occupancyMap = new Map<string, number>();
          
          if (list.length > 0) {
            list.forEach((booking: Record<string, unknown>) => {
              const kind = String(booking.bookingKind ?? 'accommodation');
              const checkInRaw = booking.checkInDate ?? booking.startDate;
              const checkOutRaw = booking.checkOutDate ?? booking.endDate ?? checkInRaw;
              const dateKeys = expandBookingDateStrings(
                String(checkInRaw),
                checkOutRaw ? String(checkOutRaw) : String(checkInRaw),
                kind
              );
              for (const dayKey of dateKeys) {
                bookingsMap.set(dayKey, (bookingsMap.get(dayKey) || 0) + 1);
                if (kind === 'accommodation') {
                  staysMap.set(dayKey, (staysMap.get(dayKey) || 0) + 1);
                  const pct = Math.min(100, ((staysMap.get(dayKey) || 0) / GUEST_ROOM_DENOMINATOR) * 100);
                  occupancyMap.set(dayKey, pct);
                }
              }
            });
          }
          
          setBookings(bookingsMap);
          setStayBookings(staysMap);
          setOccupancy(occupancyMap);
        }
      } catch (error) {
        securityLogger.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchBookings();
    }
  }, [propertyId, currentDate]);

  // Generate calendar month view
  useEffect(() => {
    if (!loading) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthView = calendarService.generateMonthView(year, month, {
        blackoutDates,
        bookings,
        occupancy,
      });
      setCalendarMonth(monthView);
    }
  }, [currentDate, blackoutDates, bookings, occupancy, loading]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      
      if (direction === 'prev') {
        // Go to previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        return calendarService.startOfDay(new Date(prevYear, prevMonth, 1));
      } else {
        // Go to next month
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        return calendarService.startOfDay(new Date(nextYear, nextMonth, 1));
      }
    });
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isAvailable || day.isPast) return;
    onDateSelect?.(day.date);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-64', className)}>
        <LoadingSpinner size="lg" text="Loading calendar..." />
      </div>
    );
  }

  if (!calendarMonth) {
    return null;
  }

  // Use CalendarService for month name formatting
  const monthName = calendarService.formatDateReadable(
    calendarService.startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
  ).replace(/\d+,/, '').trim(); // Remove day number, keep month and year
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-medium min-w-0', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 min-w-0">
          <h3 className="text-xl font-bold font-display text-nude-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-nude-600" />
            {monthName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-nude-700 hover:bg-nude-100 transition-colors duration-200 min-h-[44px]"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-nude-700 hover:bg-nude-100 transition-colors duration-200 min-h-[44px]"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[640px] sm:min-w-0">
            <thead>
              <tr>
                {weekDays.map((day) => (
                  <th key={day} className="text-center p-3 text-sm font-semibold text-nude-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarMonth.weeks.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const isSelected = selectedDate && calendarService.formatDate(selectedDate) === calendarService.formatDate(day.date);
                    const isClickable = day.isAvailable && !day.isPast;
                    
                    return (
                      <td
                        key={dayIndex}
                        className={cn(
                          'text-center p-3 border border-nude-200 transition-all duration-200',
                          day.isToday && 'border-2 border-nude-400 font-bold',
                          isSelected && 'bg-nude-500 text-white font-semibold',
                          !isClickable && 'opacity-40 cursor-not-allowed',
                          isClickable && 'cursor-pointer hover:bg-nude-50 hover:border-nude-300',
                          day.isWeekend && !isSelected && 'bg-nude-50/50',
                          day.isBlackedOut && 'bg-semantic-error-light border-semantic-error/30',
                          day.bookings && day.bookings > 0 && !isSelected && 'bg-semantic-warning-light'
                        )}
                        onClick={() => handleDateClick(day)}
                        aria-label={`${calendarService.formatDate(day.date)} - ${day.isAvailable ? 'Available' : 'Unavailable'}`}
                      >
                        <div className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                          <span className="text-sm">{day.date.getDate()}</span>
                          {day.bookings !== undefined && day.bookings > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-semantic-warning text-semantic-warning-dark">
                              {day.bookings}
                            </span>
                          )}
                          {day.occupancy !== undefined && day.occupancy > 0 && (
                            <div className="w-full h-1 bg-nude-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-nude-500 transition-all"
                                style={{ width: `${day.occupancy}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-nude-600 mt-4">
          Guest room occupancy uses {GUEST_ROOM_DENOMINATOR} keys; conference and campsite events count in the day total but not in the occupancy bar.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-nude-200 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-nude-400 rounded bg-white" />
            <span className="text-nude-700">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-nude-500 rounded" />
            <span className="text-nude-700">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-semantic-warning-light rounded border border-semantic-warning/30" />
            <span className="text-nude-700">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-semantic-error-light rounded border border-semantic-error/30" />
            <span className="text-nude-700">Blacked Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
