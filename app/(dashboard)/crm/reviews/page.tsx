'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { Card } from '@/components/ui/Card';
import ReviewsTable from '@/components/features/crm/ReviewsTable';
import { apiUrl } from '@/lib/utils/api-url';

interface ApiReview {
  id: string;
  guestId?: string | null;
  propertyId?: string | null;
  rating: number | null;
  reviewText: string | null;
  createdAt: string;
  isPublic: boolean | null;
  guest?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    country?: string | null;
  };
  property?: {
    id?: string | null;
    name?: string | null;
  };
}

interface ApiProperty {
  id: string;
  name: string;
}

interface ApiGuest {
  id: string;
  first_name?: string;
  last_name?: string;
}

type VisibilityFilter = 'all' | 'approved' | 'pending';
type SortOrder = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';

export default function CrmReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [guests, setGuests] = useState<ApiGuest[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTogglingReviewId, setIsTogglingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const role = session?.user?.role?.toLowerCase();
    if (role !== 'owner' && role !== 'manager' && role !== 'admin') {
      router.replace('/unauthorized');
    }
  }, [router, session?.user?.role, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        const [propertiesRes, reviewsRes, guestsRes] = await Promise.all([
          fetch(apiUrl('/api/properties')),
          fetch(apiUrl('/api/crm/reviews')),
          fetch(apiUrl('/api/crm/guests')),
        ]);

        if (!propertiesRes.ok || !reviewsRes.ok || !guestsRes.ok) {
          throw new Error('Failed to load review moderation data');
        }

        const propertiesData = (await propertiesRes.json()) as ApiProperty[];
        const reviewsPayload = (await reviewsRes.json()) as { reviews?: ApiReview[] };
        const reviewsData = reviewsPayload.reviews ?? [];
        const guestsData = (await guestsRes.json()) as ApiGuest[];

        setProperties(propertiesData);
        setReviews(reviewsData);
        setGuests(guestsData);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, [status]);

  const tableProperties = useMemo(
    () => [{ id: '', name: 'All Properties' }, ...properties],
    [properties]
  );

  const guestNameMap = useMemo(() => {
    return guests.reduce<Record<string, string>>((acc, guest) => {
      const fullName = `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim();
      acc[guest.id] = fullName || 'Anonymous';
      return acc;
    }, {});
  }, [guests]);

  const propertyNameMap = useMemo(() => {
    return properties.reduce<Record<string, string>>((acc, property) => {
      acc[property.id] = property.name;
      return acc;
    }, {});
  }, [properties]);

  const filteredReviews = useMemo(() => {
    const selected = selectedPropertyId || '';
    let result = reviews.filter((review) => {
      const reviewPropertyId = review.property?.id ?? review.propertyId ?? '';
      if (selected && reviewPropertyId !== selected) {
        return false;
      }

      if (visibilityFilter === 'approved') {
        return Boolean(review.isPublic);
      }

      if (visibilityFilter === 'pending') {
        return !review.isPublic;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === 'rating_desc') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return (a.rating ?? 0) - (b.rating ?? 0);
    });

    return result;
  }, [reviews, selectedPropertyId, sortOrder, visibilityFilter]);

  async function handleTogglePublic(reviewId: string, isPublic: boolean) {
    try {
      setIsTogglingReviewId(reviewId);
      const response = await fetch(apiUrl(`/api/crm/reviews/${reviewId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review visibility');
      }

      setReviews((current) =>
        current.map((review) => (review.id === reviewId ? { ...review, isPublic } : review))
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unknown error');
    } finally {
      setIsTogglingReviewId(null);
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" text="Loading reviews..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay error={error} title="Review moderation error" variant="full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6">
        <PageHeader title="Review Moderation" description="Approve or hide guest reviews for the public site." />

        <Card variant="elevated">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <label className="form-control">
              <span className="label-text text-sm mb-1">Visibility</span>
              <select
                className="select select-bordered select-sm min-h-11"
                value={visibilityFilter}
                onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-sm mb-1">Sort By</span>
              <select
                className="select select-bordered select-sm min-h-11"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="rating_desc">Rating high to low</option>
                <option value="rating_asc">Rating low to high</option>
              </select>
            </label>
          </div>

          <ReviewsTable
            reviews={filteredReviews.map((review) => ({
              id: review.id,
              guest_id: review.guest?.id ?? review.guestId ?? 'anonymous',
              property_id: review.property?.id ?? review.propertyId ?? '',
              rating: review.rating ?? 0,
              review_text: review.reviewText ?? '',
              created_at: review.createdAt,
              is_public: Boolean(review.isPublic),
              guest_name: review.guest?.firstName
                ? `${review.guest.firstName} ${review.guest.lastName ?? ''}`.trim()
                : review.guestId
                  ? guestNameMap[review.guestId] ?? 'Anonymous'
                  : 'Anonymous',
              property_name: review.property?.name
                ? review.property.name
                : review.propertyId
                  ? propertyNameMap[review.propertyId] ?? 'Unknown Property'
                  : 'Unknown Property',
            }))}
            properties={tableProperties}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
            onTogglePublic={handleTogglePublic}
            isTogglingReviewId={isTogglingReviewId}
            showPublicToggle
          />
        </Card>
      </div>
    </div>
  );
}
