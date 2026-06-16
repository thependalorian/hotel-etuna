/**
 * Restaurant Tables Management Page
 * 
 * Purpose: Manage restaurant tables and QR codes
 * Location: /app/(dashboard)/restaurant/tables/page.tsx
 * 
 * Features:
 * - Property selection
 * - Add table form
 * - Table cards with QR codes
 * - Table management actions
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Form labels and ARIA attributes
 * 
 * @module RestaurantTablesPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PropertySelector from '@/components/features/restaurant/PropertySelector';
import TableForm from '@/components/features/restaurant/TableForm';
import TableCard from '@/components/features/restaurant/TableCard';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

interface Property {
  id: string;
  name: string;
  type: string;
  has_restaurant_features: boolean;
}

interface RestaurantTable {
  id: string;
  table_number: string;
  table_name?: string;
  capacity: number;
  location?: string;
  qr_code: string;
  qr_code_url: string;
}

export default function RestaurantTablesPage() {
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTableForm, setShowAddTableForm] = useState(false);

  const [newTableData, setNewTableData] = useState({
    tableNumber: '',
    tableName: '',
    capacity: 1,
    location: '',
  });
  const [addTableLoading, setAddTableLoading] = useState(false);
  const [addTableError, setAddTableError] = useState('');

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
      const fetchTables = async () => {
        try {
          const response = await fetch(apiUrl(`/api/restaurant/tables?restaurantId=${restaurantId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch tables');
          }
          const data: RestaurantTable[] = await response.json();
          setTables(data);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchTables();
    }
  }, [restaurantId]);

  const handleAddTableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTableData((prev) => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }));
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !selectedPropertyId) {
      setAddTableError('Restaurant not selected.');
      return;
    }
    setAddTableLoading(true);
    setAddTableError('');

    try {
      const response = await fetch(apiUrl('/api/restaurant/tables'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTableData,
          restaurantId,
          propertyId: selectedPropertyId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTables((prev) => [...prev, data]);
        setNewTableData({ tableNumber: '', tableName: '', capacity: 1, location: '' });
        setShowAddTableForm(false);
      } else {
        setAddTableError(data.message || 'Failed to add table.');
      }
    } catch (err) {
      securityLogger.error('Error adding table:', err);
      setAddTableError('An unexpected error occurred.');
    } finally {
      setAddTableLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading table management..." />
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Properties"
        variant="full"
      />
    );
  }

  if (!session) {
    return (
      <div className="card bg-warning/10 border border-warning shadow-lg">
        <div className="card-body">
          <p className="text-warning font-medium">Please log in to manage your tables.</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No Restaurant Properties Found"
        description="Please add a property with restaurant features to manage tables."
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
        <h1 className="etuna-page-title mb-2">Table Management</h1>
        <p className="text-base-content/70">
          Manage restaurant tables and QR codes
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
            <h3 className="text-xl font-semibold font-display">Current Tables</h3>
            <Button
              type="button"
              onClick={() => setShowAddTableForm(!showAddTableForm)}
              className="gentle-lift"
            >
              {showAddTableForm ? 'Hide Form' : 'Add New Table'}
            </Button>
          </div>

          {showAddTableForm && (
            <TableForm
              formData={newTableData}
              onChange={handleAddTableChange}
              onSubmit={handleAddTableSubmit}
              loading={addTableLoading}
              error={addTableError}
              onCancel={() => setShowAddTableForm(false)}
            />
          )}

          {tables.length === 0 ? (
            <EmptyState
              title="No tables found"
              description="Add some tables above to get started!"
              size="md"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table, index) => (
                <TableCard key={table.id} table={table} index={index} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-12">
            <p className="text-base-content/70">Select a property to manage its tables.</p>
          </div>
        </div>
      )}
    </div>
  );
}
