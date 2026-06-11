/**
 * CalendarService
 * 
 * Purpose: Reusable calendar and date/time management service for booking management,
 *          staff scheduling, restaurant reservations, and analytics date ranges.
 * 
 * Location: /lib/services/calendar/CalendarService.ts
 * 
 * Features:
 * - Date AND time range validation
 * - Date/time formatting and parsing
 * - Business day calculations
 * - Calendar view data generation (monthly/weekly)
 * - Date/time conflict detection
 * - Timezone handling
 * - Minimum/maximum stay validation
 * - Blackout date/time management
 * - Time slot management (for reservations)
 * 
 * Used by:
 * - BookingService (check-in/check-out dates and times)
 * - RestaurantService (reservation dates and times)
 * - StaffService (shift scheduling with start/end times)
 * - AnalyticsService (date range queries)
 * - AvailabilityService (availability calendar)
 */

import { AppError, handleServiceError } from '@/lib/utils/errors';

export interface DateTimeRange {
  start: Date; // Includes both date and time
  end: Date;   // Includes both date and time
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  isBooked?: boolean;
  bookingId?: string;
}

export interface TimeSlotOptions {
  startTime: string;      // "09:00" (24-hour format)
  endTime: string;        // "22:00"
  slotDuration: number;   // Duration in minutes (e.g., 30, 60)
  breakSlots?: string[];  // ["12:00-13:00"] - lunch break, etc.
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isWeekend: boolean;
  isAvailable: boolean;
  isBlackedOut: boolean;
  bookings?: number; // Number of bookings on this day
  occupancy?: number; // Occupancy percentage
  timeSlots?: TimeSlot[]; // Available time slots for this day
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11 (JavaScript month index)
  days: CalendarDay[];
  weeks: CalendarDay[][]; // Days grouped by week
}

export interface CalendarViewOptions {
  startDate: Date;
  endDate?: Date; // If not provided, generates one month
  includeWeekends?: boolean;
  blackoutDates?: Date[];
  minStay?: number; // Minimum nights/stays
  maxStay?: number; // Maximum nights/stays
  timezone?: string; // IANA timezone string
}

export class CalendarService {
  /**
   * Validate a date range (date only, no time)
   */
  validateDateRange(start: Date, end: Date, options?: {
    minDays?: number;
    maxDays?: number;
    allowPast?: boolean;
    minDate?: Date;
    maxDate?: Date;
  }): { valid: boolean; error?: string } {
    try {
      // Normalize dates to start of day
      const startDate = this.startOfDay(start);
      const endDate = this.startOfDay(end);
      const today = this.startOfDay(new Date());

      // Check if end is after start
      if (endDate <= startDate) {
        return { valid: false, error: 'End date must be after start date' };
      }

      // Check if dates are in the past
      if (!options?.allowPast) {
        if (startDate < today) {
          return { valid: false, error: 'Start date cannot be in the past' };
        }
      }

      // Check minimum date
      if (options?.minDate && startDate < this.startOfDay(options.minDate)) {
        return { valid: false, error: `Start date must be after ${this.formatDate(options.minDate)}` };
      }

      // Check maximum date
      if (options?.maxDate && endDate > this.startOfDay(options.maxDate)) {
        return { valid: false, error: `End date must be before ${this.formatDate(options.maxDate)}` };
      }

      // Calculate number of days
      const days = this.daysBetween(startDate, endDate);

      // Check minimum days
      if (options?.minDays && days < options.minDays) {
        return { valid: false, error: `Minimum stay is ${options.minDays} ${options.minDays === 1 ? 'night' : 'nights'}` };
      }

      // Check maximum days
      if (options?.maxDays && days > options.maxDays) {
        return { valid: false, error: `Maximum stay is ${options.maxDays} ${options.maxDays === 1 ? 'night' : 'nights'}` };
      }

      return { valid: true };
    } catch (error) {
      throw handleServiceError(error, 'Error validating date range');
    }
  }

  /**
   * Validate a date/time range (includes both date and time)
   */
  validateDateTimeRange(start: Date, end: Date, options?: {
    minDuration?: number;      // Minimum duration in minutes
    maxDuration?: number;       // Maximum duration in minutes
    allowPast?: boolean;
    minDateTime?: Date;
    maxDateTime?: Date;
    requireBusinessHours?: boolean; // Only allow during business hours
    businessHours?: { start: string; end: string }; // e.g., { start: "09:00", end: "22:00" }
  }): { valid: boolean; error?: string } {
    try {
      const startDateTime = new Date(start);
      const endDateTime = new Date(end);
      const now = new Date();

      // Check if end is after start
      if (endDateTime <= startDateTime) {
        return { valid: false, error: 'End time must be after start time' };
      }

      // Check if datetime is in the past
      if (!options?.allowPast) {
        if (startDateTime < now) {
          return { valid: false, error: 'Start time cannot be in the past' };
        }
      }

      // Check minimum datetime
      if (options?.minDateTime && startDateTime < options.minDateTime) {
        return { valid: false, error: `Start time must be after ${this.formatDateTime(options.minDateTime)}` };
      }

      // Check maximum datetime
      if (options?.maxDateTime && endDateTime > options.maxDateTime) {
        return { valid: false, error: `End time must be before ${this.formatDateTime(options.maxDateTime)}` };
      }

      // Calculate duration in minutes
      const durationMinutes = this.minutesBetween(startDateTime, endDateTime);

      // Check minimum duration
      if (options?.minDuration && durationMinutes < options.minDuration) {
        return { valid: false, error: `Minimum duration is ${options.minDuration} minutes` };
      }

      // Check maximum duration
      if (options?.maxDuration && durationMinutes > options.maxDuration) {
        return { valid: false, error: `Maximum duration is ${options.maxDuration} minutes` };
      }

      // Check business hours
      if (options?.requireBusinessHours && options?.businessHours) {
        const startTime = this.getTimeString(startDateTime);
        const endTime = this.getTimeString(endDateTime);

        if (startTime < options.businessHours.start || endTime > options.businessHours.end) {
          return { valid: false, error: `Time must be within business hours (${options.businessHours.start} - ${options.businessHours.end})` };
        }
      }

      return { valid: true };
    } catch (error) {
      throw handleServiceError(error, 'Error validating date/time range');
    }
  }

  /**
   * Calculate number of nights/days between two dates
   */
  daysBetween(start: Date, end: Date): number {
    const startDate = this.startOfDay(start);
    const endDate = this.startOfDay(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate number of business days (excluding weekends)
   */
  businessDaysBetween(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(this.startOfDay(start));
    const endDate = this.startOfDay(end);

    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Check if a date is a weekend
   */
  isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Check if a date is in the past
   */
  isPast(date: Date): boolean {
    return this.startOfDay(date) < this.startOfDay(new Date());
  }

  /**
   * Check if a date is in the future
   */
  isFuture(date: Date): boolean {
    return this.startOfDay(date) > this.startOfDay(new Date());
  }

  /**
   * Check if a date range overlaps with another date range (date only)
   */
  dateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
    const start1 = this.startOfDay(range1.start);
    const end1 = this.startOfDay(range1.end);
    const start2 = this.startOfDay(range2.start);
    const end2 = this.startOfDay(range2.end);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Check if a date/time range overlaps with another date/time range (includes time)
   */
  dateTimeRangesOverlap(range1: DateTimeRange, range2: DateTimeRange): boolean {
    const start1 = new Date(range1.start);
    const end1 = new Date(range1.end);
    const start2 = new Date(range2.start);
    const end2 = new Date(range2.end);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Check if a date is in a list of blackout dates
   */
  isBlackedOut(date: Date, blackoutDates: Date[]): boolean {
    const normalizedDate = this.startOfDay(date);
    return blackoutDates.some(blackoutDate => 
      this.isSameDay(normalizedDate, this.startOfDay(blackoutDate))
    );
  }

  /**
   * Get start of day (normalize to 00:00:00)
   */
  startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day (normalize to 23:59:59)
   */
  endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Add days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from a date
   */
  subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Add minutes to a date
   */
  addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Subtract minutes from a date
   */
  subtractMinutes(date: Date, minutes: number): Date {
    return this.addMinutes(date, -minutes);
  }

  /**
   * Add hours to a date
   */
  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Subtract hours from a date
   */
  subtractHours(date: Date, hours: number): Date {
    return this.addHours(date, -hours);
  }

  /**
   * Format date to ISO string (YYYY-MM-DD)
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date to readable string (e.g., "January 15, 2024")
   */
  formatDateReadable(date: Date, locale: string = 'en-NA'): string {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format date and time to readable string (e.g., "January 15, 2024 at 2:30 PM")
   */
  formatDateTime(date: Date, locale: string = 'en-NA'): string {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format time only (e.g., "2:30 PM" or "14:30")
   */
  formatTime(date: Date, format24Hour: boolean = false): string {
    if (format24Hour) {
      return date.toLocaleTimeString('en-NA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    return date.toLocaleTimeString('en-NA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get time string in 24-hour format (e.g., "14:30")
   */
  getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Parse time string (e.g., "14:30" or "2:30 PM") to Date object
   */
  parseTime(timeString: string, baseDate?: Date): Date {
    const base = baseDate ? new Date(baseDate) : new Date();
    const timeRegex = /^(\d{1,2}):(\d{2})(?:\s?(AM|PM))?$/i;
    const match = timeString.match(timeRegex);

    if (!match) {
      throw new AppError(400, `Invalid time format: ${timeString}. Use HH:MM or HH:MM AM/PM`);
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    // Handle 12-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new AppError(400, `Invalid time: ${timeString}`);
    }

    const result = new Date(base);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Calculate minutes between two dates
   */
  minutesBetween(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60));
  }

  /**
   * Calculate hours between two dates
   */
  hoursBetween(start: Date, end: Date): number {
    return this.minutesBetween(start, end) / 60;
  }

  /**
   * Parse date from ISO string or date string
   */
  parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new AppError(400, `Invalid date string: ${dateString}`);
    }
    return date;
  }

  /**
   * Generate calendar month view
   */
  generateMonthView(year: number, month: number, options?: {
    blackoutDates?: Date[];
    bookings?: Map<string, number>; // Map of date strings to booking counts
    occupancy?: Map<string, number>; // Map of date strings to occupancy percentages
  }): CalendarMonth {
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days: CalendarDay[] = [];
      const weeks: CalendarDay[][] = [];
      let currentWeek: CalendarDay[] = [];

      // Add padding days from previous month (to fill first week)
      const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        currentWeek.push(this.createCalendarDay(date, options));
      }

      // Add days of current month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const calendarDay = this.createCalendarDay(date, options);
        days.push(calendarDay);
        currentWeek.push(calendarDay);

        // Start new week on Sunday
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Add padding days from next month (to fill last week)
      while (currentWeek.length < 7 && currentWeek.length > 0) {
        const nextMonthDay = lastDay.getDate() + (7 - currentWeek.length);
        const date = new Date(year, month + 1, nextMonthDay - lastDay.getDate());
        currentWeek.push(this.createCalendarDay(date, options));
      }

      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      return {
        year,
        month,
        days,
        weeks,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error generating month view');
    }
  }

  /**
   * Generate calendar view for a date range
   */
  generateCalendarView(options: CalendarViewOptions): CalendarDay[] {
    try {
      const startDate = this.startOfDay(options.startDate);
      const endDate = options.endDate 
        ? this.startOfDay(options.endDate)
        : this.addDays(startDate, 30); // Default to 30 days

      const days: CalendarDay[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        // Skip weekends if not included
        if (!options.includeWeekends && this.isWeekend(current)) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        days.push(this.createCalendarDay(current, {
          blackoutDates: options.blackoutDates,
        }));

        current.setDate(current.getDate() + 1);
      }

      return days;
    } catch (error) {
      throw handleServiceError(error, 'Error generating calendar view');
    }
  }

  /**
   * Create a calendar day object
   */
  private createCalendarDay(date: Date, options?: {
    blackoutDates?: Date[];
    bookings?: Map<string, number>;
    occupancy?: Map<string, number>;
  }): CalendarDay {
    const dateString = this.formatDate(date);
    const isBlackedOut = options?.blackoutDates 
      ? this.isBlackedOut(date, options.blackoutDates)
      : false;

    return {
      date: new Date(date),
      isToday: this.isToday(date),
      isPast: this.isPast(date),
      isFuture: this.isFuture(date),
      isWeekend: this.isWeekend(date),
      isAvailable: !isBlackedOut && !this.isPast(date),
      isBlackedOut,
      bookings: options?.bookings?.get(dateString),
      occupancy: options?.occupancy?.get(dateString),
    };
  }

  /**
   * Get available date ranges within a period (for booking availability)
   */
  getAvailableDateRanges(
    startDate: Date,
    endDate: Date,
    bookedRanges: DateRange[],
    minStay: number = 1
  ): DateRange[] {
    try {
      const available: DateRange[] = [];
      let current = new Date(this.startOfDay(startDate));
      const end = this.startOfDay(endDate);

      while (current < end) {
        // Find the next available start date
        const rangeStart = new Date(current);
        let rangeEnd = new Date(this.addDays(rangeStart, minStay - 1));

        // Check if this range conflicts with any booked ranges
        const hasConflict = bookedRanges.some(bookedRange => 
          this.dateRangesOverlap(
            { start: rangeStart, end: rangeEnd },
            bookedRange
          )
        );

        if (!hasConflict && rangeEnd <= end) {
          // Extend the range as far as possible
          while (rangeEnd < end) {
            const nextDay = this.addDays(rangeEnd, 1);
            const extendedRange = { start: rangeStart, end: nextDay };
            
            const wouldConflict = bookedRanges.some(bookedRange =>
              this.dateRangesOverlap(extendedRange, bookedRange)
            );

            if (wouldConflict) {
              break;
            }

            rangeEnd = nextDay;
          }

          available.push({ start: rangeStart, end: rangeEnd });
          current = this.addDays(rangeEnd, 1);
        } else {
          // Move to the day after the conflicting booking ends
          const conflictingRange = bookedRanges.find(bookedRange =>
            this.dateRangesOverlap(
              { start: rangeStart, end: rangeEnd },
              bookedRange
            )
          );

          if (conflictingRange) {
            current = this.addDays(this.startOfDay(conflictingRange.end), 1);
          } else {
            current = this.addDays(current, 1);
          }
        }
      }

      return available;
    } catch (error) {
      throw handleServiceError(error, 'Error calculating available date ranges');
    }
  }

  /**
   * Get next available check-in date (considering minimum advance booking)
   */
  getNextAvailableCheckIn(minAdvanceDays: number = 0): Date {
    const today = this.startOfDay(new Date());
    return this.addDays(today, minAdvanceDays);
  }

  /**
   * Get default check-out date (check-in + minimum stay)
   */
  getDefaultCheckOut(checkIn: Date, minStay: number = 1): Date {
    return this.addDays(this.startOfDay(checkIn), minStay);
  }

  /**
   * Generate time slots for a given date and options
   * Useful for restaurant reservations, appointment booking, etc.
   */
  generateTimeSlots(date: Date, options: TimeSlotOptions, bookedSlots?: DateTimeRange[]): TimeSlot[] {
    try {
      const slots: TimeSlot[] = [];
      const baseDate = this.startOfDay(date);
      
      // Parse start and end times
      const startTime = this.parseTime(options.startTime, baseDate);
      const endTime = this.parseTime(options.endTime, baseDate);
      
      let currentTime = new Date(startTime);

      // Parse break slots if provided
      const breakRanges: DateTimeRange[] = [];
      if (options.breakSlots) {
        for (const breakSlot of options.breakSlots) {
          const [breakStart, breakEnd] = breakSlot.split('-');
          breakRanges.push({
            start: this.parseTime(breakStart.trim(), baseDate),
            end: this.parseTime(breakEnd.trim(), baseDate),
          });
        }
      }

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + options.slotDuration * 60 * 1000);

        // Skip if slot extends beyond end time
        if (slotEnd > endTime) {
          break;
        }

        // Check if slot overlaps with break time
        const isInBreak = breakRanges.some(breakRange =>
          this.dateTimeRangesOverlap(
            { start: currentTime, end: slotEnd },
            breakRange
          )
        );

        // Check if slot is booked
        const isBooked = bookedSlots?.some(bookedSlot =>
          this.dateTimeRangesOverlap(
            { start: currentTime, end: slotEnd },
            bookedSlot
          )
        ) || false;

        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          isAvailable: !isInBreak && !isBooked,
          isBooked,
        });

        // Move to next slot
        currentTime = new Date(slotEnd);
      }

      return slots;
    } catch (error) {
      throw handleServiceError(error, 'Error generating time slots');
    }
  }

  /**
   * Check if a time slot is available
   */
  isTimeSlotAvailable(slot: TimeSlot, bookedSlots: DateTimeRange[]): boolean {
    return !bookedSlots.some(bookedSlot =>
      this.dateTimeRangesOverlap(
        { start: slot.start, end: slot.end },
        bookedSlot
      )
    );
  }

  /**
   * Combine date and time into a single Date object
   */
  combineDateAndTime(date: Date, time: string): Date {
    const baseDate = this.startOfDay(date);
    const timeDate = this.parseTime(time, baseDate);
    return timeDate;
  }

  /**
   * Round time to nearest interval (e.g., round to nearest 15 minutes)
   */
  roundToNearestInterval(date: Date, intervalMinutes: number): Date {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
    const result = new Date(date);
    result.setMinutes(roundedMinutes, 0, 0);
    return result;
  }

  /**
   * Get next available time slot
   */
  getNextAvailableSlot(
    date: Date,
    options: TimeSlotOptions,
    bookedSlots: DateTimeRange[],
    minAdvanceMinutes: number = 0
  ): TimeSlot | null {
    const slots = this.generateTimeSlots(date, options, bookedSlots);
    const now = new Date();
    const minTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);

    for (const slot of slots) {
      if (slot.isAvailable && slot.start >= minTime) {
        return slot;
      }
    }

    return null;
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
