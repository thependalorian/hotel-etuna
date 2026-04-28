/**
 * Rooms Management Page
 *
 * Purpose: Manage hotel rooms with filtering, stats, and room cards
 * Location: /app/(dashboard)/dashboard/rooms/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Bed } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import RoomStatsCards from '@/components/features/rooms/RoomStatsCards';
import RoomFilters from '@/components/features/rooms/RoomFilters';
import RoomCard from '@/components/features/rooms/RoomCard';
import RoomTypeBreakdown from '@/components/features/rooms/RoomTypeBreakdown';
import { apiUrl } from '@/lib/utils/api-url';

interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  description?: string;
  amenities: string[];
  images: string[];
  size?: number;
  bedType?: string;
  isAvailable: boolean;
  isActive: boolean;
  property: {
    name: string;
    type: string;
  };
  bookingCount: number;
}

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  typeBreakdown: Array<{
    type: string;
    count: number;
  }>;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    propertyId: '',
    type: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    capacity: '',
  });

  useEffect(() => {
    fetchRooms();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.search || filters.type || filters.capacity) {
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchRooms() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.search || filters.type || filters.minPrice || filters.maxPrice || filters.capacity) {
        params.append('query', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.capacity) params.append('capacity', filters.capacity);
      }

      const response = await fetch(apiUrl(`/api/rooms?${params}`));
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();

      if (data.totalRooms !== undefined) {
        setStats(data);
        setRooms([]);
      } else {
        setRooms(data);
      }
    } catch (err: unknown) {
      const fetchError = err as Error;
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(apiUrl('/api/rooms'));
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      if (data.totalRooms !== undefined) {
        setStats(data);
      }
    } catch (err: unknown) {
      const statsError = err as Error;
      console.error('Error fetching stats:', statsError.message);
    }
  }

  const handleClearFilters = () => {
    setFilters({ propertyId: '', type: '', search: '', minPrice: '', maxPrice: '', capacity: '' });
    fetchRooms();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading rooms..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-error">
          <p className="text-semantic-error font-medium">Error: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Room Management"
          description="Manage your hotel rooms and availability"
          actions={
            <Link href="/properties" className="btn btn-primary gentle-lift min-h-[44px] shadow-nude-soft hover:shadow-nude-medium">
              <Plus className="w-5 h-5 mr-2" />
              Add Room
            </Link>
          }
        />

        {stats && <RoomStatsCards stats={stats} />}

        <RoomFilters
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {rooms.length === 0 ? (
          <EmptyState
            icon={<Bed className="w-10 h-10 text-nude-400" />}
            title="No Rooms Found"
            description={
              filters.search || filters.type || filters.capacity
                ? 'Try adjusting your filters or search terms.'
                : 'Start by adding your first room.'
            }
            action={{
              label: 'Add First Room',
              href: '/rooms/new',
            }}
            size="md"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {rooms.map((room, index) => (
              <RoomCard key={room.id} room={room} index={index} />
            ))}
          </div>
        )}

        {stats && stats.typeBreakdown.length > 0 && (
          <RoomTypeBreakdown typeBreakdown={stats.typeBreakdown} />
        )}
      </div>
    </div>
  );
}
