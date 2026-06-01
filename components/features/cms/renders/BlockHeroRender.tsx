import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';

interface BlockHeroRenderProps {
  content: {
    heading?: string;
    subheading?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: string;
  };
}

export function BlockHeroRender({ content }: BlockHeroRenderProps) {
  const sanitizedHeading = content.heading 
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedSubheading = content.subheading 
    ? DOMPurify.sanitize(content.subheading, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedButtonText = content.buttonText 
    ? DOMPurify.sanitize(content.buttonText, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedButtonLink = content.buttonLink 
    ? DOMPurify.sanitize(content.buttonLink, { ALLOWED_TAGS: [] })
    : '';
  const sanitizedBackgroundImage = content.backgroundImage 
    ? DOMPurify.sanitize(content.backgroundImage, { ALLOWED_TAGS: [] })
    : '';

  return (
    <div 
      className="hero min-h-[500px] rounded-lg" 
      style={{
        backgroundImage: sanitizedBackgroundImage 
          ? `url(${sanitizedBackgroundImage})` 
          : 'linear-gradient(135deg, #e8d5c7 0%, #f5f0eb 100%)'
      }}
    >
      <div className="hero-overlay bg-opacity-40 rounded-lg"></div>
      <div className="hero-content text-center text-neutral-content">
        <div className="max-w-2xl">
          {sanitizedHeading && (
            <h1 className="mb-5 text-5xl font-bold text-white drop-shadow-lg">
              {sanitizedHeading}
            </h1>
          )}
          {sanitizedSubheading && (
            <p className="mb-5 text-xl text-white drop-shadow-lg">
              {sanitizedSubheading}
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
      </div>
    </div>
  );
}
