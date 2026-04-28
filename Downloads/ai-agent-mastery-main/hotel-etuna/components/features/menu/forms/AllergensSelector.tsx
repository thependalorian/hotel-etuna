/**
 * Allergens Selector Component
 * 
 * Purpose: Sidebar component for selecting allergens
 * Location: /components/features/menu/forms/AllergensSelector.tsx
 * 
 * Features:
 * - Grid of allergen checkboxes
 * - Selected allergens display
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Badge colors: badge-error for allergens
 * 
 * Accessibility:
 * - Proper labels for checkboxes
 * - Keyboard navigation support
 * 
 * @param {Array} allergens - Selected allergens array
 * @param {Array} commonAllergens - Available allergens array
 * @param {Function} onToggle - Toggle handler function
 * 
 * @module AllergensSelector
 */

interface AllergensSelectorProps {
  allergens: string[];
  commonAllergens: string[];
  onToggle: (allergen: string) => void;
}

export default function AllergensSelector({ allergens, commonAllergens, onToggle }: AllergensSelectorProps) {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-header">
        <h2 className="card-title">Allergens</h2>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          <p className="text-sm text-base-content/70">
            Select all allergens present in this dish
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commonAllergens.map(allergen => (
              <label key={allergen} className="cursor-pointer min-h-[44px] flex items-center">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mr-2"
                  checked={allergens.includes(allergen)}
                  onChange={() => onToggle(allergen)}
                />
                <span className="text-sm">{allergen}</span>
              </label>
            ))}
          </div>
          
          {allergens.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Selected allergens:</p>
              <div className="flex flex-wrap gap-1">
                {allergens.map(allergen => (
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
