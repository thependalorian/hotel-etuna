/**
 * New Menu Item Page
 * 
 * Purpose: Create new menu item with form and preview
 * Location: /app/(dashboard)/menu/new/page.tsx
 * 
 * Features:
 * - Basic information form
 * - Allergens selector
 * - Live preview
 * - Form submission
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Form labels and ARIA attributes
 * 
 * @module NewMenuItemPage
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MessageAlert from '@/components/shared/MessageAlert';
import BasicInfoForm from '@/components/features/menu/forms/BasicInfoForm';
import AllergensSelector from '@/components/features/menu/forms/AllergensSelector';
import MenuItemPreview from '@/components/features/menu/forms/MenuItemPreview';
import { apiUrl } from '@/lib/utils/api-url';

export default function NewMenuItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    isAvailable: true,
    dietary: '',
    allergens: [] as string[],
    propertyId: '',
  });

  const commonAllergens = [
    'Gluten', 'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 
    'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard'
  ];

  const categories = [
    'appetizers', 'mains', 'desserts', 'beverages', 'specials', 'sides'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        allergens: formData.allergens,
      };

      const response = await fetch(apiUrl('/api/menu'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/menu');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create menu item');
      }
    } catch {
      setError('An error occurred while creating the menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/menu">
          <button 
            className="btn btn-outline btn-sm min-h-[44px]"
            aria-label="Go back to menu management"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </button>
        </Link>
        <div>
          <h1 className="etuna-page-title mb-2">Add Menu Item</h1>
          <p className="text-base-content/70">
            Create a new menu item for your restaurant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <MessageAlert message={error} type="error" onDismiss={() => setError('')} />}
            
            <BasicInfoForm 
              formData={formData} 
              onChange={handleChange}
              categories={categories}
            />

            <div className="flex justify-end space-x-4">
              <Link href="/menu">
                <button 
                  type="button" 
                  className="btn btn-outline min-h-[44px]"
                  aria-label="Cancel and return to menu"
                >
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary min-h-[44px]" 
                disabled={loading}
                aria-label={loading ? 'Creating menu item...' : 'Create menu item'}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Menu Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <AllergensSelector
            allergens={formData.allergens}
            commonAllergens={commonAllergens}
            onToggle={handleAllergenToggle}
          />
          <MenuItemPreview formData={formData} />
        </div>
      </div>
    </div>
  );
}
