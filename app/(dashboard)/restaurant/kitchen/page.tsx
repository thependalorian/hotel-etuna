/**
 * Kitchen Board Page
 *
 * Purpose: Staff kitchen ticket board for F&B print dispatch.
 * Location: /app/(dashboard)/restaurant/kitchen/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import PageHeader from '@/components/shared/PageHeader';
import PropertySelector from '@/components/features/restaurant/PropertySelector';
import KitchenTicketBoard from '@/components/features/fnb/kitchen-ticket-board';
import { apiUrl } from '@/lib/utils/api-url';

interface Property {
  id: string;
  name: string;
  type: string;
  has_restaurant_features: boolean;
}

function unwrapData<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as { data?: unknown }).data as T) ?? fallback;
  }
  return (payload as T) ?? fallback;
}

export default function KitchenBoardPage() {
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.tenantId) return;

    const fetchProperties = async () => {
      try {
        const response = await fetch(apiUrl('/api/properties'));
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const payload = await response.json();
        const data = unwrapData<Property[]>(payload, []);
        const restaurantProperties = data.filter(
          (p) => p.type === 'restaurant' || p.has_restaurant_features
        );
        setProperties(restaurantProperties);
        if (restaurantProperties.length > 0) {
          setSelectedPropertyId(restaurantProperties[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    void fetchProperties();
  }, [status, session?.user?.tenantId]);

  if (loading || status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner size="lg" text="Loading kitchen board..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorDisplay error={error} title="Kitchen board unavailable" variant="full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="alert alert-warning">
          <span>Please log in to view the kitchen board.</span>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="No restaurant properties"
          description="Add a property with restaurant features to use the kitchen board."
          action={{ label: 'Add property', href: '/properties/new' }}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="F&B operations"
        title="Kitchen ticket board"
        description="Track print dispatch jobs by station — queued, printing, done, or failed."
      />

      <PropertySelector
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />

      {selectedPropertyId ? (
        <KitchenTicketBoard propertyId={selectedPropertyId} station="kitchen" />
      ) : (
        <p className="text-base-content/70">Select a property to view kitchen tickets.</p>
      )}
    </div>
  );
}
