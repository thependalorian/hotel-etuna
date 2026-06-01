/**
 * Text Block Render Component
 * 
 * Renders text block for public pages
 */

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  content: {
    heading?: string;
    content?: string;
  };
}

export default function BlockTextRender({ content }: Props) {
  // Sanitize user-generated content
  const sanitizedHeading = content.heading
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedContent = content.content
    ? DOMPurify.sanitize(content.content, { 
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      })
    : '';

  return (
    <div className="prose max-w-none">
      {sanitizedHeading && <h2>{sanitizedHeading}</h2>}
      {sanitizedContent && (
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      )}
    </div>
  );
}
