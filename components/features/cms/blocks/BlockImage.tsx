/**
 * Image Block Component
 * 
 * Block type for images with caption and alt text
 */

'use client';

import React from 'react';
import Image from 'next/image';

interface Props {
  content: {
    src?: string;
    alt?: string;
    caption?: string;
  };
  onUpdate: (content: Record<string, any>) => void;
}

export default function BlockImage({ content, onUpdate }: Props) {
  const update = (field: string, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Image URL</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="https://example.com/image.jpg"
          value={content.src || ''}
          onChange={(e) => update('src', e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Alt Text</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="Description of the image"
          value={content.alt || ''}
          onChange={(e) => update('alt', e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Caption (optional)</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.caption || ''}
          onChange={(e) => update('caption', e.target.value)}
        />
      </div>

      {/* Preview */}
      <div className="divider">Preview</div>
      {content.src ? (
        <div className="text-center">
          <div className="relative inline-block">
            <img
              src={content.src}
              alt={content.alt || 'Image'}
              className="rounded-lg max-h-[400px] object-cover"
            />
          </div>
          {content.caption && (
            <p className="mt-2 text-sm text-base-content/70">{content.caption}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-base-300 rounded-lg">
          <p className="text-base-content/50">No image URL provided</p>
        </div>
      )}
    </div>
  );
}
