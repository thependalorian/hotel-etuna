/**
 * CTA Block Render Component
 * 
 * Renders CTA block for public pages
 */

import React from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  content: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };
}

export default function BlockCtaRender({ content }: Props) {
  const sanitizedHeading = content.heading
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedDescription = content.description
    ? DOMPurify.sanitize(content.description, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedButtonText = content.buttonText
    ? DOMPurify.sanitize(content.buttonText, { ALLOWED_TAGS: [] })
    : '';

  return (
    <div className="card bg-primary text-primary-content shadow-xl">
      <div className="card-body text-center">
        {sanitizedHeading && (
          <h2 className="card-title justify-center text-3xl">
            {sanitizedHeading}
          </h2>
        )}
        {sanitizedDescription && <p className="text-lg">{sanitizedDescription}</p>}
        {content.buttonLink && sanitizedButtonText && (
          <div className="card-actions justify-center mt-4">
            <Link href={content.buttonLink} className="btn btn-secondary btn-lg">
              {sanitizedButtonText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
