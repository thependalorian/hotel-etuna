/**
 * Hero Block Render Component
 * 
 * Renders hero block for public pages
 */

import React from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  content: {
    heading?: string;
    subheading?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: string;
  };
}

export default function BlockHeroRender({ content }: Props) {
  // Sanitize user-generated content
  const sanitizedHeading = content.heading 
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : 'Welcome';
  const sanitizedSubheading = content.subheading
    ? DOMPurify.sanitize(content.subheading, { ALLOWED_TAGS: [] })
    : '';

  return (
    <div
      className="hero min-h-[500px] rounded-lg"
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
        <div className="max-w-2xl">
          <h1 className="mb-5 text-5xl font-bold">{sanitizedHeading}</h1>
          {sanitizedSubheading && (
            <p className="mb-5 text-xl">{sanitizedSubheading}</p>
          )}
          {content.buttonText && content.buttonLink && (
            <Link href={content.buttonLink} className="btn btn-primary btn-lg">
              {DOMPurify.sanitize(content.buttonText, { ALLOWED_TAGS: [] })}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
