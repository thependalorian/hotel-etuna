/**
 * Menu item fields for CMS create/edit (name, price, description, image, availability).
 * Location: components/features/menu/forms/BasicInfoForm.tsx
 */

'use client';

import Image from 'next/image';

export type MenuBasicInfoFormData = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  propertyId: string;
  dietary: string;
  isAvailable: boolean;
};

type BasicInfoFormProps = {
  formData: MenuBasicInfoFormData;
  onChange: (field: keyof MenuBasicInfoFormData, value: string | boolean) => void;
  categories: string[];
  variant?: 'create' | 'edit';
};

export default function BasicInfoForm({
  formData,
  onChange,
  categories,
  variant = 'create',
}: BasicInfoFormProps) {
  const isEdit = variant === 'edit';

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-header">
        <h2 className="card-title">Basic Information</h2>
      </div>
      <div className="card-body space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="menu-item-name">
              <span className="label-text">Item name *</span>
            </label>
            <input
              id="menu-item-name"
              type="text"
              className="input input-bordered min-h-11"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="menu-item-price">
              <span className="label-text">Price (NAD) *</span>
            </label>
            <input
              id="menu-item-price"
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered min-h-11"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="menu-item-description">
            <span className="label-text">Description</span>
          </label>
          <textarea
            id="menu-item-description"
            className="textarea textarea-bordered min-h-28"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="menu-item-image">
            <span className="label-text">Image URL</span>
          </label>
          <input
            id="menu-item-image"
            type="url"
            className="input input-bordered min-h-11"
            value={formData.imageUrl}
            onChange={(e) => onChange('imageUrl', e.target.value)}
            placeholder="https://images.unsplash.com/…"
          />
          <label className="label">
            <span className="label-text-alt">
              Food: 2×2 grid on /dining. Drinks: list without photos.
            </span>
          </label>
          {formData.imageUrl ? (
            <div className="relative mt-2 aspect-4/3 max-w-xs overflow-hidden rounded-lg border border-nude-200">
              <Image src={formData.imageUrl} alt="" fill className="object-cover" sizes="320px" />
            </div>
          ) : null}
        </div>

        {!isEdit ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category *</span>
                </label>
                <select
                  className="select select-bordered min-h-11"
                  value={formData.category}
                  onChange={(e) => onChange('category', e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Property *</span>
                </label>
                <select
                  className="select select-bordered min-h-11"
                  value={formData.propertyId}
                  onChange={(e) => onChange('propertyId', e.target.value)}
                  required
                >
                  <option value="">Select property</option>
                </select>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Dietary information</span>
              </label>
              <input
                type="text"
                className="input input-bordered min-h-11"
                value={formData.dietary}
                onChange={(e) => onChange('dietary', e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="form-control">
          <label className="label cursor-pointer min-h-11 justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.isAvailable}
              onChange={(e) => onChange('isAvailable', e.target.checked)}
            />
            <span className="label-text">Available on public menu and for ordering</span>
          </label>
        </div>
      </div>
    </div>
  );
}
