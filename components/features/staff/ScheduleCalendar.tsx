/**
 * ScheduleCalendar Component
 * 
 * Purpose: Display a calendar view for staff shift scheduling with date/time support
 * Location: /components/features/staff/ScheduleCalendar.tsx
 * 
 * Features:
 * - Monthly calendar view using CalendarService
 * - Time slot display for shifts
 * - Shift assignment and management
 * - Business hours validation
 * - Conflict detection
 * - Responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { calendarService, CalendarMonth, TimeSlot } from '@/lib/services/calendar/CalendarService';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  position?: string;
}

interface ScheduleCalendarProps {
  staffId?: string;
  propertyId: string;
  onShiftSelect?: (shift: Shift) => void;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  businessHours?: { start: string; end: string }; // e.g., "09:00" to "22:00"
  className?: string;
}

export default function ScheduleCalendar({
  staffId,
  propertyId,
  onShiftSelect,
  onDateSelect,
  selectedDate,
  businessHours = { start: '09:00', end: '22:00' },
  className = '',
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(calendarService.startOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Map<string, Shift[]>>(new Map());
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    selectedDate ? calendarService.startOfDay(selectedDate) : null
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Fetch shifts for the current month
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = calendarService.startOfDay(new Date(year, month, 1));
        const dateStr = calendarService.formatDate(firstDayOfMonth);
        
        // Fetch shifts for this month
        const url = staffId
          ? `/api/staff/${staffId}/shifts?startDate=${dateStr}`
          : `/api/staff/shifts?propertyId=${propertyId}&startDate=${dateStr}`;
        
        const response = await fetch(apiUrl(url));
        
        if (response.ok) {
          const data = await response.json();
          const shiftsMap = new Map<string, Shift[]>();
          
          if (Array.isArray(data)) {
            data.forEach((shift: any) => {
              // Use CalendarService to parse and format dates
              const shiftStart = new Date(shift.startDate || shift.start);
              const shiftEnd = new Date(shift.endDate || shift.end);
              const dateStr = calendarService.formatDate(shiftStart);
              
              if (!shiftsMap.has(dateStr)) {
                shiftsMap.set(dateStr, []);
              }
              shiftsMap.get(dateStr)!.push({
                id: shift.id,
                staffId: shift.staffId,
                staffName: shift.staffName || `${shift.firstName} ${shift.lastName}`,
                start: shiftStart,
                end: shiftEnd,
                position: shift.position,
              });
            });
          }
          
          setShifts(shiftsMap);
        }
      } catch (error) {
        console.error('Error fetching shifts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchShifts();
    }
  }, [propertyId, staffId, currentDate]);

  // Generate calendar month view
  useEffect(() => {
    if (!loading) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthView = calendarService.generateMonthView(year, month);
      setCalendarMonth(monthView);
    }
  }, [currentDate, loading]);

  // Generate time slots for selected day
  useEffect(() => {
    if (selectedDay) {
      const selectedDayStr = calendarService.formatDate(selectedDay);
      const bookedSlots = shifts.get(selectedDayStr)?.map(s => ({
        start: s.start,
        end: s.end,
      })) || [];
      
      // Ensure selectedDay is normalized to start of day for time slot generation
      const normalizedDay = calendarService.startOfDay(selectedDay);
      const slots = calendarService.generateTimeSlots(normalizedDay, {
        startTime: businessHours.start,
        endTime: businessHours.end,
        slotDuration: 60, // 1 hour slots
      }, bookedSlots);
      
      setTimeSlots(slots);
    }
  }, [selectedDay, shifts, businessHours]);

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

  const handleDateClick = (date: Date) => {
    const normalizedDate = calendarService.startOfDay(date);
    if (calendarService.isPast(normalizedDate)) return;
    setSelectedDay(normalizedDate);
    onDateSelect?.(normalizedDate);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-64', className)}>
        <LoadingSpinner size="lg" text="Loading schedule..." />
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
  const selectedDayShifts = selectedDay 
    ? shifts.get(calendarService.formatDate(selectedDay)) || [] 
    : [];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Calendar */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {monthName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="btn btn-ghost btn-sm min-h-[44px]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="btn btn-ghost btn-sm min-h-[44px]"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full">
              <thead>
                <tr>
                  {weekDays.map((day) => (
                    <th key={day} className="text-center p-2 text-sm font-semibold text-base-content/70">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarMonth.weeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      const isSelected = selectedDay && calendarService.formatDate(selectedDay) === calendarService.formatDate(day.date);
                      const isClickable = !day.isPast;
                      const dayShifts = shifts.get(calendarService.formatDate(day.date)) || [];
                      
                      return (
                        <td
                          key={dayIndex}
                          className={cn(
                            'text-center p-2 border border-base-200',
                            day.isToday && 'bg-primary/10 font-bold',
                            isSelected && 'bg-primary text-primary-content',
                            !isClickable && 'opacity-50 cursor-not-allowed',
                            isClickable && 'cursor-pointer hover:bg-base-200 transition-colors',
                            day.isWeekend && 'bg-base-200/50'
                          )}
                          onClick={() => handleDateClick(day.date)}
                          aria-label={`${calendarService.formatDate(day.date)} - ${dayShifts.length} shifts`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{day.date.getDate()}</span>
                            {dayShifts.length > 0 && (
                              <span className="text-xs badge badge-sm badge-primary">
                                {dayShifts.length}
                              </span>
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
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h4 className="text-lg font-bold font-display mb-4">
              {calendarService.formatDate(selectedDay)} - Schedule
            </h4>
            
            {/* Existing Shifts */}
            {selectedDayShifts.length > 0 && (
              <div className="space-y-2 mb-4">
                <h5 className="text-sm font-semibold text-base-content/70">Scheduled Shifts</h5>
                {selectedDayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                    onClick={() => onShiftSelect?.(shift)}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-base-content/60" />
                      <div>
                        <p className="font-medium">{shift.staffName}</p>
                        {shift.position && (
                          <p className="text-xs text-base-content/60">{shift.position}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {calendarService.formatTime(shift.start)} - {calendarService.formatTime(shift.end)}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {calendarService.minutesBetween(shift.start, shift.end)} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Available Time Slots */}
            {timeSlots.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-base-content/70 mb-2">Available Time Slots</h5>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={cn(
                        'btn btn-sm min-h-[44px]',
                        slot.isAvailable ? 'btn-outline' : 'btn-disabled',
                        slot.isBooked && 'btn-warning'
                      )}
                      disabled={!slot.isAvailable}
                      aria-label={`Time slot ${calendarService.formatTime(slot.start)} - ${calendarService.formatTime(slot.end)}`}
                    >
                      {calendarService.formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
