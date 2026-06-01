/**
 * CMS Page Form
 *
 * Purpose: Form for creating new CMS pages
 * Location: /components/features/cms/CmsPageForm.tsx
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CmsPageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaDescription: '',
  });

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }

      const data = await response.json();
      router.push(`/cms/pages/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="card bg-base-200">
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              <svg
                className="h-6 w-6 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Page Title</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="About Us"
              value={formData.title}
              onChange={handleTitleChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">URL Slug</span>
              <span className="label-text-alt">Auto-generated from title</span>
            </label>
            <input
              type="text"
              className="input input-bordered font-mono"
              placeholder="about-us"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
            />
            <label className="label">
              <span className="label-text-alt">
                Page will be available at: /{formData.slug}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Meta Description</span>
              <span className="label-text-alt">Optional - for SEO</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="A brief description of this page for search engines..."
              value={formData.metaDescription}
              onChange={(e) =>
                setFormData({ ...formData, metaDescription: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="card-actions justify-end mt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Page'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
