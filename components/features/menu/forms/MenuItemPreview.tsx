/**
 * Menu Item Preview Component
 * 
 * Purpose: Sidebar preview of menu item as it will appear
 * Location: /components/features/menu/forms/MenuItemPreview.tsx
 * 
 * Features:
 * - Live preview of menu item
 * - Shows name, description, price, category
 * - Availability badge
 * - Allergens display
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Badge colors: badge-success for available
 * 
 * Accessibility:
 * - Semantic HTML structure
 * 
 * @param {Object} formData - Form data object
 * 
 * @module MenuItemPreview
 */

interface MenuItemPreviewProps {
  formData: {
    name: string;
    description: string;
    price: string;
    category: string;
    isAvailable: boolean;
    allergens: string[];
  };
}

export default function MenuItemPreview({ formData }: MenuItemPreviewProps) {
  return (
    <div className="card bg-base-100">
      <div className="card-header">
        <h2 className="card-title">Preview</h2>
      </div>
      <div className="card-body">
        <div className="border rounded-etuna-input p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">
              {formData.name || 'Item Name'}
            </h3>
            <span className={`badge ${formData.isAvailable ? 'badge-success' : 'badge-ghost'}`}>
              {formData.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          
          {formData.description && (
            <p className="text-sm text-base-content/70 mb-2">
              {formData.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              {formData.price ? `N$${parseFloat(formData.price).toFixed(2)}` : 'N$0.00'}
            </span>
            {formData.category && (
              <span className="badge badge-outline">{formData.category}</span>
            )}
          </div>

          {formData.allergens.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {formData.allergens.map(allergen => (
                  <span key={allergen} className="badge badge-error badge-sm">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
