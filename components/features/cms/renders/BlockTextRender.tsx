import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface BlockTextRenderProps {
  content: {
    heading?: string;
    content?: string;
  };
}

export function BlockTextRender({ content }: BlockTextRenderProps) {
  const sanitizedHeading = content.heading 
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
    
  const sanitizedContent = content.content 
    ? DOMPurify.sanitize(content.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      })
    : '';

  return (
    <div className="prose max-w-none">
      {sanitizedHeading && <h2>{sanitizedHeading}</h2>}
      {sanitizedContent && (
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />
      )}
    </div>
  );
}
