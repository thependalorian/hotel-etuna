/**
 * Reservation status state machine (ported from haip)
 *
 * Purpose: Enforce valid state transitions for booking lifecycle
 * Location: /lib/services/booking/ReservationStateMachine.ts
 *
 * States:
 * pending → confirmed → assigned → checked_in → stayover → due_out → checked_out
 * pending → cancelled (anytime before checked_in)
 * confirmed → no_show (after arrival date passes)
 * checked_in → stayover (multi-night stays)
 * stayover → due_out (departing next day)
 * due_out → checked_out (final checkout)
 *
 * Integration: Works with existing BookingService and BOOKING_STATUS_TRANSITIONS
 */

import { AppError } from '@/lib/utils/errors';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'checked_in'
  | 'stayover'
  | 'due_out'
  | 'checked_out'
  | 'no_show'
  | 'cancelled';

/**
 * Valid state transitions map.
 * Augments BOOKING_STATUS_TRANSITIONS with stayover/due_out states.
 */
const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['assigned', 'checked_in', 'cancelled', 'no_show'],
  assigned: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['stayover', 'checked_out'],
  stayover: ['due_out', 'checked_out'],
  due_out: ['checked_out'],
  checked_out: [],
  no_show: [],
  cancelled: [],
};

/**
 * Validates if a transition is allowed.
 * @param current - Current reservation status
 * @param target - Target status to transition to
 * @returns true if transition is valid, false otherwise
 */
export function validateTransition(
  current: ReservationStatus,
  target: ReservationStatus,
): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * Asserts a transition is valid, throwing AppError if not.
 * @param current - Current reservation status
 * @param target - Target status to transition to
 * @throws AppError with 400 status if transition is invalid
 */
export function assertTransition(
  current: ReservationStatus,
  target: ReservationStatus,
): void {
  if (!validateTransition(current, target)) {
    const validTargets = getValidTransitions(current);
    throw new AppError(
      400,
      `Invalid status transition: ${current} → ${target}. ` +
      `Valid transitions from '${current}': ${validTargets.length > 0 ? validTargets.join(', ') : 'none'}`,
    );
  }
}

/**
 * Gets all valid target states for the current state.
 * @param current - Current reservation status
 * @returns Array of valid target statuses
 */
export function getValidTransitions(
  current: ReservationStatus,
): ReservationStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

/**
 * Checks if a status is terminal (no further transitions possible).
 * @param status - Reservation status to check
 * @returns true if status is terminal
 */
export function isTerminalStatus(status: ReservationStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Gets the next logical status based on booking context.
 * @param current - Current reservation status
 * @param context - Booking context
 * @returns Recommended next status or null if none
 */
export function getNextStatus(
  current: ReservationStatus,
  context: {
    departureDate?: string;
    businessDate?: string;
    isMultiNight?: boolean;
  },
): ReservationStatus | null {
  switch (current) {
    case 'pending':
      return 'confirmed';
    
    case 'confirmed':
      return 'assigned';

    case 'assigned':
      return 'checked_in';
    
    case 'checked_in':
      if (context.isMultiNight) {
        return 'stayover';
      }
      return 'checked_out';
    
    case 'stayover':
      if (context.departureDate && context.businessDate) {
        const depDate = new Date(context.departureDate);
        const bizDate = new Date(context.businessDate);
        const nextDay = new Date(bizDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        if (depDate.toISOString().split('T')[0] === nextDay.toISOString().split('T')[0]) {
          return 'due_out';
        }
      }
      return null;
    
    case 'due_out':
      return 'checked_out';
    
    default:
      return null;
  }
}

/**
 * State machine transition executor.
 * Use this in BookingService for state changes.
 */
export class ReservationStateMachine {
  /**
   * Attempts to transition a booking to a new status.
   * @param bookingId - Booking identifier
   * @param currentStatus - Current booking status
   * @param targetStatus - Desired target status
   * @param context - Optional context for validation
   * @returns Target status if valid
   * @throws AppError if transition is invalid
   */
  static transition(
    bookingId: string,
    currentStatus: ReservationStatus,
    targetStatus: ReservationStatus,
    context?: Record<string, unknown>,
  ): ReservationStatus {
    assertTransition(currentStatus, targetStatus);
    
    // Additional business rule validations can go here
    if (targetStatus === 'no_show' && currentStatus !== 'confirmed') {
      throw new AppError(
        400,
        'No-show status can only be set from confirmed status'
      );
    }
    
    return targetStatus;
  }
  
  /**
   * Checks if a booking can be cancelled.
   * @param currentStatus - Current booking status
   * @returns true if cancellation is allowed
   */
  static canCancel(currentStatus: ReservationStatus): boolean {
    return validateTransition(currentStatus, 'cancelled');
  }
  
  /**
   * Checks if a booking can be marked as no-show.
   * @param currentStatus - Current booking status
   * @returns true if no-show marking is allowed
   */
  static canMarkNoShow(currentStatus: ReservationStatus): boolean {
    return validateTransition(currentStatus, 'no_show');
  }
}
