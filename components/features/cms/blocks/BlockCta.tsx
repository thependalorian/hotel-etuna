/**
 * CTA Block Component
 * 
 * Block type for call-to-action sections
 */

'use client';

import React from 'react';

interface Props {
  content: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  onUpdate: (content: Record<string, any>) => void;
}

export default function BlockCta({ content, onUpdate }: Props) {
  const update = (field: string, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Heading</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.heading || ''}
          onChange={(e) => update('heading', e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={3}
          value={content.description || ''}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Button Text</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.buttonText || ''}
          onChange={(e) => update('buttonText', e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Button Link</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.buttonLink || ''}
          onChange={(e) => update('buttonLink', e.target.value)}
        />
      </div>

      {/* Preview */}
      <div className="divider">Preview</div>
      <div className="card bg-primary text-primary-content">
        <div className="card-body text-center">
          <h2 className="card-title justify-center text-2xl">
            {content.heading || 'CTA Heading'}
          </h2>
          <p>{content.description || 'CTA description text'}</p>
          <div className="card-actions justify-center mt-4">
            <button className="btn btn-secondary">
              {content.buttonText || 'Button Text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
