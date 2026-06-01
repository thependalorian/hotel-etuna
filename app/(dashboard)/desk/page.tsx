/**
 * Front Desk Hub — Central dashboard for front desk operations
 * Location: app/(dashboard)/desk/page.tsx
 * 
 * Purpose: Unified interface for desk staff to:
 * - Search existing bookings/guests
 * - Create walk-in bookings
 * - Quick access to check-in/check-out
 * - View today's arrivals/departures
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function DeskPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/desk/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Front Desk</h1>
          <p className="text-sm text-base-content/70">
            Search guests, create walk-in bookings, and manage arrivals/departures
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/bookings" className="btn btn-ghost btn-sm">
            All Bookings
          </Link>
          <Link href="/payments/desk" className="btn btn-ghost btn-sm">
            Payments Desk
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/desk/walk-in">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Walk-In Booking</h3>
                <p className="text-sm text-base-content/70 mt-1">
                  Create new booking for guest at desk
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-success/10 p-3">
              <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Today's Arrivals</h3>
              <p className="text-2xl font-bold text-success mt-2">-</p>
              <p className="text-sm text-base-content/70">Expected check-ins</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-warning/10 p-3">
              <svg className="h-6 w-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Today's Departures</h3>
              <p className="text-2xl font-bold text-warning mt-2">-</p>
              <p className="text-sm text-base-content/70">Expected check-outs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Search Bookings & Guests</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Search by name, email, phone, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-base-content/70">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
            <div className="divide-y divide-base-300">
              {searchResults.map((result) => (
                <div key={result.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{result.guestName}</p>
                    <p className="text-sm text-base-content/70">
                      {result.email || result.phone}
                    </p>
                    <p className="text-xs text-base-content/60 mt-1">
                      {result.checkInDate} → {result.checkOutDate} • {result.status}
                    </p>
                  </div>
                  <Link
                    href={`/bookings/${result.id}`}
                    className="btn btn-sm btn-ghost"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="mt-6 text-center py-8 text-base-content/60">
            <p>No results found for "{searchQuery}"</p>
            <p className="text-sm mt-2">Try searching by guest name, email, phone, or booking ID</p>
          </div>
        )}
      </Card>
    </div>
  );
}
