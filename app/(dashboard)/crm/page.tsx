/**
 * CRM Dashboard Page
 * 
 * Purpose: Manage guest relationships and reviews
 * Location: /app/(dashboard)/crm/page.tsx
 * 
 * Features:
 * - Guests table
 * - Reviews table with property filter
 * - Two-column layout
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Semantic HTML structure
 * 
 * @module CrmDashboardPage
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import GuestsTable from '@/components/features/crm/GuestsTable';
import ReviewsTable from '@/components/features/crm/ReviewsTable';
import { apiUrl } from '@/lib/utils/api-url';

interface Guest {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
}

interface GuestReview {
  id: string;
  guest_id: string;
  property_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
}

export default function CrmDashboardPage() {
  const { data: session, status } = useSession();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      const fetchProperties = async () => {
        try {
          const response = await fetch(apiUrl('/api/properties'));
          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }
          const data: Property[] = await response.json();
          setProperties(data);
          if (data.length > 0) {
            setSelectedPropertyId(data[0].id);
          }
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchProperties();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      const fetchGuests = async () => {
        try {
          const response = await fetch(apiUrl('/api/crm/guests'));
          if (!response.ok) {
            throw new Error('Failed to fetch guests');
          }
          const data: Guest[] = await response.json();
          setGuests(data);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchGuests();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (selectedPropertyId) {
      const fetchReviews = async () => {
        try {
          const response = await fetch(apiUrl(`/api/crm/reviews?propertyId=${selectedPropertyId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch reviews');
          }
          const data: GuestReview[] = await response.json();
          setReviews(data);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchReviews();
    }
  }, [selectedPropertyId]);

  if (loading || status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading CRM dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay 
          error={error} 
          title="Error Loading CRM Dashboard"
          variant="full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-warning">
          <p className="text-semantic-warning font-medium">Please log in to view CRM.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="CRM Dashboard"
          description="Manage guest relationships and reviews"
          actions={
            <Link href="/crm/knowledge" className="btn btn-outline btn-primary min-h-[44px] shadow-nude-soft ">
              Knowledge (RAG)
            </Link>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" className="animate-slide-up">
            <h3 className="font-display text-xl font-semibold mb-4 text-ink-900">Guests</h3>
            {guests.length === 0 ? (
              <EmptyState
                title="No Guests Found"
                description="Start building your guest database by adding bookings or importing guest information."
                size="sm"
              />
            ) : (
              <GuestsTable guests={guests} />
            )}
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <ReviewsTable
              reviews={reviews}
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={setSelectedPropertyId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
