/**
 * Menu Management Page
 * 
 * Purpose: Manage restaurant menu items and categories
 * Location: /app/(dashboard)/menu/page.tsx
 * 
 * Features:
 * - Menu statistics display
 * - Filter menu items by search, property, category
 * - Menu item cards grid
 * - Toggle availability
 * - Delete menu items
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Form labels and ARIA attributes
 * 
 * @module MenuPage
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import MenuStatsCards from '@/components/features/menu/MenuStatsCards';
import MenuFilters from '@/components/features/menu/MenuFilters';
import MenuItemCard from '@/components/features/menu/MenuItemCard';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  dietary?: string;
  allergens: string[];
  createdAt: string;
  updatedAt: string;
}

interface MenuStats {
  totalItems: number;
  availableItems: number;
  categories: number;
  averagePrice: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  useEffect(() => {
    fetchMenuData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedProperty]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      let menuUrl = '/api/menu';
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedProperty !== 'all') params.append('propertyId', selectedProperty);
      
      if (params.toString()) {
        menuUrl += `?${params.toString()}`;
      }

      const [menuResponse, statsResponse] = await Promise.all([
        fetch(apiUrl(menuUrl)),
        fetch(apiUrl('/api/menu')),
      ]);

      if (menuResponse.ok) {
        const items = await menuResponse.json();
        setMenuItems(Array.isArray(items) ? items : []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      securityLogger.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(apiUrl(`/api/menu/${itemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        fetchMenuData();
      }
    } catch (error) {
      securityLogger.error('Error updating menu item:', error);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(apiUrl(`/api/menu/${itemId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMenuData();
      }
    } catch (error) {
      securityLogger.error('Error deleting menu item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading menu..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="etuna-page-title mb-2">Menu Management</h1>
          <p className="text-base-content/70">
            Manage your restaurant menu items and categories
          </p>
        </div>
        <Link href="/menu/new">
          <button className="btn btn-primary gentle-lift min-h-[44px]">
            <Plus className="w-5 h-5 mr-2" />
            Add Menu Item
          </button>
        </Link>
      </div>

      {stats && <MenuStatsCards stats={stats} />}

      <MenuFilters
        searchQuery={searchQuery}
        selectedProperty={selectedProperty}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchQuery}
        onPropertyChange={setSelectedProperty}
        onCategoryChange={setSelectedCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <MenuItemCard
            key={item.id}
            item={item}
            index={index}
            onToggleAvailability={toggleAvailability}
            onDelete={deleteMenuItem}
          />
        ))}
      </div>

      {menuItems.length === 0 && !loading && (
        <EmptyState
          icon={<Eye className="w-10 h-10 text-base-content/40" />}
          title="No Menu Items Found"
          description="Get started by adding your first menu item."
          action={{
            label: "Add Menu Item",
            href: "/menu/new"
          }}
          size="md"
        />
      )}
    </div>
  );
}
