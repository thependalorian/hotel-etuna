/**
 * LandingBookingWidget Component
 * 
 * Purpose: Quick booking form for landing page hero section
 * Location: /components/sections/landing/LandingBookingWidget.tsx
 * 
 * Features:
 * - Check-in/check-out date selection
 * - Guest count input
 * - Room type selector
 * - Immediate availability check
 * - Responsive design (mobile-first)
 * 
 * Design System:
 * - Card with nude-100 background
 * - Shadow: luxury-medium
 * - Rounded: 3xl
 * - Calls-to-action with khaki-600
 * 
 * User Flow:
 * 1. User enters dates and guest count
 * 2. System checks availability
 * 3. Redirects to booking page or shows results
 * 
 * Accessibility:
 * - Proper label associations
 * - Date picker keyboard support
 * - Error state announcements
 * 
 * @module LandingBookingWidget
 */

'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { publicCopy } from '@/lib/copy/public';

type AvailabilityRoom = {
  id: string;
  roomType: string;
  roomNumber: string;
  maxOccupancy: number;
  baseRate: string | number | null;
};

/**
 * Landing booking widget
 *
 * Purpose: Connect public booking CTA to /api/bookings/availability.
 * Location: /components/sections/landing/LandingBookingWidget.tsx
 */
export function LandingBookingWidget({ propertyId }: { propertyId: string }) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('1');
  const [roomType, setRoomType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AvailabilityRoom[]>([]);

  const filteredResults = useMemo(() => {
    if (!roomType) return results;
    return results.filter((room) => room.roomType.toLowerCase().includes(roomType.toLowerCase()));
  }, [results, roomType]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResults([]);

    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates.');
      return;
    }

    setIsLoading(true);
    const canViewRates = status === 'authenticated';
    try {
      const response = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          checkInDate,
          checkOutDate,
          guests: Number(guests),
          roomType: roomType || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to check availability');
      }

      const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
      setResults(
        canViewRates
          ? rows
          : rows.map((row: AvailabilityRoom) => {
              const { baseRate: _removed, ...rest } = row;
              return { ...rest, baseRate: null };
            }),
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to check availability');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-terracotta-900 mb-2">Check-in Date</label>
          <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-terracotta-900 mb-2">Check-out Date</label>
          <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-terracotta-900 mb-2">Guests</label>
          <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4+ Guests</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-terracotta-900 mb-2">Room Type</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
            <option value="">Any Room Type</option>
            <option value="standard-a">Standard Room (Type A)</option>
            <option value="standard-b">Standard Room (Type B)</option>
            <option value="standard-c">Standard Room (Type C)</option>
            <option value="executive">Executive Room</option>
            <option value="premiere">Premiere Room</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" size="xl" className="w-full bg-khaki-600 hover:bg-khaki-700" disabled={isLoading}>
            <Calendar className="w-5 h-5" />
            {isLoading ? 'Checking Availability...' : 'Check Availability'}
          </Button>
        </div>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!error && filteredResults.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-terracotta-900">Available Rooms</h3>
          {filteredResults.map((room) => (
            <div key={room.id} className="rounded-lg border border-nude-200 p-3 text-sm text-terracotta-800">
              {room.roomType} ({room.roomNumber}) · Max {room.maxOccupancy} guests
              {isAuthenticated && room.baseRate != null && room.baseRate !== ''
                ? ` · NAD ${room.baseRate}`
                : ` · ${publicCopy.gated.viewRates}`}
            </div>
          ))}
          {!isAuthenticated ? (
            <div className="rounded-lg border border-khaki-600/30 bg-khaki-50 p-4 text-center">
              <p className="mb-3 text-sm text-terracotta-900">
                {publicCopy.gated.roomsFoundSignIn}
              </p>
              <Button asChild size="sm" className="min-h-[44px]">
                <Link href="/login?redirect=/#booking">{publicCopy.gated.completeBooking}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

