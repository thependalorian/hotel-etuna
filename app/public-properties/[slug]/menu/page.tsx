/**
 * Public Menu Page
 * 
 * Purpose: Public-facing restaurant menu page with professional presentation
 * Location: /app/public-properties/[slug]/menu/page.tsx
 * 
 * Features:
 * - Professional header with menu description
 * - Category-based menu organization
 * - Menu item cards with images, descriptions, pricing
 * - Dietary information badges
 * - Availability indicators
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Professional typography with font-display
 * - Responsive grid layouts
 * - Card-based item presentation
 * 
 * Accessibility:
 * - Proper heading hierarchy
 * - Semantic HTML structure
 * - Alt text for images
 * - Loading and error states
 * 
 * @module PublicMenuPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import { apiUrl } from '@/lib/utils/api-url';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  dietary_info?: string[];
  allergens?: string[];
  is_available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

export default function PublicMenuPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    async function fetchMenu() {
      try {
        const response = await fetch(apiUrl(`/api/public/restaurant/menu/${slug}`));
        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }
        const data: MenuCategory[] = await response.json();
        setMenu(data);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading menu..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorDisplay 
          error={error} 
          title="Error Loading Menu"
          variant="full"
        />
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          title="No Menu Available"
          description="This restaurant hasn't added their menu yet. Please check back later."
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="etuna-page-title mb-4">Our Menu</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Discover our carefully crafted selection of dishes, prepared with the finest ingredients.
          </p>
        </div>

        <div className="space-y-12">
          {menu.map(category => (
            <div key={category.id} className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">{category.name}</h2>
                {category.description && (
                  <p className="text-base-content/70 text-lg">{category.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map(item => (
                  <div key={item.id} className="card bg-base-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    {item.image_url && (
                      <figure className="relative h-48 w-full overflow-hidden bg-base-200">
                        <Image 
                          src={item.image_url} 
                          alt={item.name} 
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </figure>
                    )}
                    <div className="card-body p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="card-title text-lg font-semibold flex-1">{item.name}</h3>
                        {!item.is_available && (
                          <span className="badge badge-error badge-sm">Unavailable</span>
                        )}
                      </div>
                      <p className="text-base-content/70 mb-4 line-clamp-3">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <p className="font-bold text-xl text-primary">N${item.price.toFixed(2)}</p>
                        {item.dietary_info && item.dietary_info.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.dietary_info.map((info, idx) => (
                              <span key={idx} className="badge badge-outline badge-sm">{info}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
