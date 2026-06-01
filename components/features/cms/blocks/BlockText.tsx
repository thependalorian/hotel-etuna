/**
 * Text Block Component
 * 
 * Block type for text content with heading and body
 */

'use client';

import React from 'react';

interface Props {
  content: {
    heading?: string;
    content?: string;
  };
  onUpdate: (content: Record<string, any>) => void;
}

export default function BlockText({ content, onUpdate }: Props) {
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
          <span className="label-text">Content</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={6}
          value={content.content || ''}
          onChange={(e) => update('content', e.target.value)}
        />
      </div>

      {/* Preview */}
      <div className="divider">Preview</div>
      <div className="prose max-w-none">
        {content.heading && <h2>{content.heading}</h2>}
        {content.content && <p>{content.content}</p>}
      </div>
    </div>
  );
}
