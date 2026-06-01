import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';

interface BlockCtaRenderProps {
  content: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
  };
}

export function BlockCtaRender({ content }: BlockCtaRenderProps) {
  const sanitizedHeading = content.heading 
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedDescription = content.description 
    ? DOMPurify.sanitize(content.description, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedButtonText = content.buttonText 
    ? DOMPurify.sanitize(content.buttonText, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedButtonLink = content.buttonLink 
    ? DOMPurify.sanitize(content.buttonLink, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedBackgroundColor = content.backgroundColor 
    ? DOMPurify.sanitize(content.backgroundColor, { ALLOWED_TAGS: [] })
    : '#e8d5c7';

  return (
    <div 
      className="card rounded-lg p-12 text-center shadow-xl"
      style={{ backgroundColor: sanitizedBackgroundColor }}
    >
      {sanitizedHeading && (
        <h2 className="text-4xl font-bold mb-4">
          {sanitizedHeading}
        </h2>
      )}
      {sanitizedDescription && (
        <p className="text-xl mb-8">
          {sanitizedDescription}
        </p>
      )}
      {sanitizedButtonText && sanitizedButtonLink && (
        <Link 
          href={sanitizedButtonLink}
          className="btn btn-primary btn-lg"
        >
          {sanitizedButtonText}
        </Link>
      )}
    </div>
  );
}
