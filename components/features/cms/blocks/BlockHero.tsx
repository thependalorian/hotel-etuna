/**
 * Hero Block Component
 * 
 * Block type for hero sections with heading, subheading, button, and background
 */

'use client';

import React from 'react';

interface Props {
  content: {
    heading?: string;
    subheading?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: string;
  };
  onUpdate: (content: Record<string, any>) => void;
}

export default function BlockHero({ content, onUpdate }: Props) {
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
          <span className="label-text">Subheading</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.subheading || ''}
          onChange={(e) => update('subheading', e.target.value)}
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

      <div className="form-control">
        <label className="label">
          <span className="label-text">Background Image URL</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="https://example.com/image.jpg"
          value={content.backgroundImage || ''}
          onChange={(e) => update('backgroundImage', e.target.value)}
        />
      </div>

      {/* Preview */}
      <div className="divider">Preview</div>
      <div
        className="hero min-h-[300px] rounded-lg"
        style={{
          backgroundImage: content.backgroundImage
            ? `url(${content.backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hero-overlay bg-opacity-60 rounded-lg"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-4xl font-bold">
              {content.heading || 'Heading'}
            </h1>
            <p className="mb-5">{content.subheading || 'Subheading'}</p>
            <button className="btn btn-primary">
              {content.buttonText || 'Button'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
