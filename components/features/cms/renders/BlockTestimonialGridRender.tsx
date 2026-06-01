/**
 * Testimonial Grid Block Render Component
 * 
 * Renders testimonial grid block for public pages
 */

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface Props {
  content: {
    heading?: string;
    testimonials?: Testimonial[];
  };
}

export default function BlockTestimonialGridRender({ content }: Props) {
  const sanitizedHeading = content.heading
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';

  if (!content.testimonials || content.testimonials.length === 0) {
    return null;
  }

  return (
    <div>
      {sanitizedHeading && (
        <h2 className="text-3xl font-bold mb-8 text-center">{sanitizedHeading}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.testimonials.map((testimonial, index) => {
          const sanitizedName = DOMPurify.sanitize(testimonial.name, { ALLOWED_TAGS: [] });
          const sanitizedRole = DOMPurify.sanitize(testimonial.role, { ALLOWED_TAGS: [] });
          const sanitizedContent = DOMPurify.sanitize(testimonial.content, { ALLOWED_TAGS: [] });

          return (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="rating rating-sm mb-4">
                  {[...Array(5)].map((_, i) => (
                    <input
                      key={i}
                      type="radio"
                      className="mask mask-star-2 bg-orange-400"
                      checked={i < testimonial.rating}
                      readOnly
                    />
                  ))}
                </div>
                <p className="text-base">{sanitizedContent}</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="font-semibold">{sanitizedName}</div>
                  <div className="text-sm opacity-70">{sanitizedRole}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
