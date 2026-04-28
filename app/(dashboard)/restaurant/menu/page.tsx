/**
 * Restaurant Menu Management Page
 * 
 * Purpose: Manage restaurant menu with categories and items
 * Location: /app/(dashboard)/restaurant/menu/page.tsx
 * 
 * Features:
 * - Property selection
 * - Menu categories display
 * - Menu items with images
 * - Add category/item buttons
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Form labels and ARIA attributes
 * 
 * @module RestaurantMenuPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PropertySelector from '@/components/features/restaurant/PropertySelector';
import MenuCategoryCard from '@/components/features/restaurant/menu/MenuCategoryCard';
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

interface Property {
  id: string;
  name: string;
  type: string;
  has_restaurant_features: boolean;
}

export default function RestaurantMenuPage() {
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [menuItemImages, setMenuItemImages] = useState<Record<string, string>>({});
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
          const restaurantProperties = data.filter(p => p.type === 'restaurant' || p.has_restaurant_features);
          setProperties(restaurantProperties);
          if (restaurantProperties.length > 0) {
            setSelectedPropertyId(restaurantProperties[0].id);
          }
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProperties();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (selectedPropertyId) {
      const fetchRestaurantId = async () => {
        try {
          const response = await fetch(apiUrl(`/api/restaurant/details?propertyId=${selectedPropertyId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch restaurant details');
          }
          const data = await response.json();
          setRestaurantId(data.id);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchRestaurantId();
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (restaurantId) {
      const fetchMenu = async () => {
        try {
          const response = await fetch(apiUrl(`/api/restaurant/menu?restaurantId=${restaurantId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch menu');
          }
          const data: MenuCategory[] = await response.json();
          setMenu(data);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchMenu();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (selectedPropertyId) {
      const fetchMenuItemImages = async () => {
        try {
          const mediaResponse = await fetch(apiUrl(`/api/cms/media?propertyId=${selectedPropertyId}&fileType=image`));
          if (mediaResponse.ok) {
            const media = await mediaResponse.json();
            const imageMap: Record<string, string> = {};
            media.forEach((item: any) => {
              const menuItemId = item.metadata?.menuItemId || item.metadata?.menu_item_id;
              if (menuItemId) {
                imageMap[menuItemId] = item.file_path || item.filePath;
              }
            });
            setMenuItemImages(imageMap);
          }
        } catch (error) {
          console.error('Error fetching menu item images:', error);
        }
      };
      fetchMenuItemImages();
    }
  }, [selectedPropertyId]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading menu management..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Menu"
        variant="full"
      />
    );
  }

  if (!session) {
    return (
      <div className="card bg-warning/10 border border-warning shadow-lg">
        <div className="card-body">
          <p className="text-warning font-medium">Please log in to manage your menu.</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No restaurant properties found"
        description="Please add a property with restaurant features."
        action={{
          label: "Add New Property",
          href: "/properties/new"
        }}
        size="md"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="buffr-page-title mb-2">Menu Management</h1>
        <p className="text-base-content/70">
          Manage your restaurant menu items and categories
        </p>
      </div>

      <PropertySelector 
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />

      {restaurantId ? (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold font-display">Current Menu</h3>
            <div className="flex gap-2">
              <Link 
                href="/cms" 
                className="btn btn-ghost gentle-lift min-h-[44px]"
                title="Manage menu item images and content"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Images
              </Link>
              <button className="btn btn-secondary gentle-lift min-h-[44px]">Add Category</button>
              <button className="btn btn-primary gentle-lift min-h-[44px]">Add Menu Item</button>
            </div>
          </div>

          {menu.length === 0 ? (
            <EmptyState
              title="No menu items yet"
              description="Start by adding menu categories and items!"
              size="md"
            />
          ) : (
            <div className="space-y-8">
              {menu.map((category, catIndex) => (
                <MenuCategoryCard
                  key={category.id}
                  category={category}
                  catIndex={catIndex}
                  menuItemImages={menuItemImages}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-12">
            <p className="text-base-content/70">Select a property to manage its menu.</p>
          </div>
        </div>
      )}
    </div>
  );
}
