/**
 * Image Block Render Component
 * 
 * Renders image block for public pages
 */

import React from 'react';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  content: {
    src?: string;
    alt?: string;
    caption?: string;
  };
}

export default function BlockImageRender({ content }: Props) {
  if (!content.src) {
    return null;
  }

  const sanitizedAlt = content.alt
    ? DOMPurify.sanitize(content.alt, { ALLOWED_TAGS: [] })
    : 'Image';
  const sanitizedCaption = content.caption
    ? DOMPurify.sanitize(content.caption, { ALLOWED_TAGS: [] })
    : '';

  return (
    <figure className="text-center">
      <img
        src={content.src}
        alt={sanitizedAlt}
        className="mx-auto rounded-lg max-h-[600px] object-cover"
      />
      {sanitizedCaption && (
        <figcaption className="mt-4 text-sm text-base-content/70">
          {sanitizedCaption}
        </figcaption>
      )}
    </figure>
  );
}
