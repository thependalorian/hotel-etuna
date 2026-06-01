import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface BlockImageRenderProps {
  content: {
    imageUrl?: string;
    altText?: string;
    caption?: string;
  };
}

export function BlockImageRender({ content }: BlockImageRenderProps) {
  const sanitizedImageUrl = content.imageUrl 
    ? DOMPurify.sanitize(content.imageUrl, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedAltText = content.altText 
    ? DOMPurify.sanitize(content.altText, { ALLOWED_TAGS: [] })
    : 'Image';
  const sanitizedCaption = content.caption 
    ? DOMPurify.sanitize(content.caption, { ALLOWED_TAGS: [] })
    : '';

  if (!sanitizedImageUrl) {
    return null;
  }

  return (
    <figure className="max-w-5xl mx-auto">
      <img 
        src={sanitizedImageUrl} 
        alt={sanitizedAltText} 
        className="w-full h-auto rounded-lg shadow-lg"
      />
      {sanitizedCaption && (
        <figcaption className="text-center mt-4 text-sm text-nude-600">
          {sanitizedCaption}
        </figcaption>
      )}
    </figure>
  );
}
