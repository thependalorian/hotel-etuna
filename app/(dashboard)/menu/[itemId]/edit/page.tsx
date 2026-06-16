/**
 * Edit menu item — CMS fields for public menu (name, price, description, image).
 * Location: app/(dashboard)/menu/[itemId]/edit/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BasicInfoForm, {
  type MenuBasicInfoFormData,
} from '@/components/features/menu/forms/BasicInfoForm';
import { apiUrl } from '@/lib/utils/api-url';
import { Button } from '@/components/ui/Button';

type MenuItemRecord = {
  name: string;
  description?: string | null;
  price: string | number;
  image_url?: string | null;
  imageUrl?: string | null;
  is_available?: boolean;
  isAvailable?: boolean;
};

const emptyForm: MenuBasicInfoFormData = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
  propertyId: '',
  dietary: '',
  isAvailable: true,
};

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = typeof params.itemId === 'string' ? params.itemId : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<MenuBasicInfoFormData>(emptyForm);

  useEffect(() => {
    if (!itemId) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl(`/api/menu/${itemId}`));
        if (!response.ok) throw new Error('Menu item not found');
        const json = (await response.json()) as { data?: MenuItemRecord };
        const data = json.data ?? (json as MenuItemRecord);
        setFormData({
          ...emptyForm,
          name: data.name ?? '',
          description: data.description ?? '',
          price: String(data.price ?? ''),
          imageUrl: data.image_url ?? data.imageUrl ?? '',
          isAvailable: data.is_available ?? data.isAvailable ?? true,
        });
      } catch {
        setError('Could not load this menu item.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [itemId]);

  const handleChange = (field: keyof MenuBasicInfoFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/menu/${itemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl.trim() || null,
          isAvailable: formData.isAvailable,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to save menu item');
      }

      router.push('/menu');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading menu item…" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/menu" className="btn btn-ghost btn-sm min-h-11 gap-2">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to menu
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold text-terracotta-900">Edit menu item</h1>
        <p className="mt-1 text-sm text-terracotta-700">
          Updates appear on /dining. Guests sign in to place orders.
        </p>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoForm
          formData={formData}
          onChange={handleChange}
          categories={[]}
          variant="edit"
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="gap-2" isLoading={saving}>
            <Save className="h-4 w-4" aria-hidden />
            Save changes
          </Button>
          <Link href="/menu" className="btn btn-ghost min-h-11">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
