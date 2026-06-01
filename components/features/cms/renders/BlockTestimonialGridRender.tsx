import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

interface BlockTestimonialGridRenderProps {
  content: {
    heading?: string;
    testimonials?: Testimonial[];
  };
}

export function BlockTestimonialGridRender({ content }: BlockTestimonialGridRenderProps) {
  const sanitizedHeading = content.heading 
    ? DOMPurify.sanitize(content.heading, { ALLOWED_TAGS: [] })
    : '';
  
  const testimonials = content.testimonials || [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div>
      {sanitizedHeading && (
        <h2 className="text-4xl font-bold text-center mb-12">
          {sanitizedHeading}
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => {
          const sanitizedName = DOMPurify.sanitize(testimonial.name, { ALLOWED_TAGS: [] });
          const sanitizedRole = DOMPurify.sanitize(testimonial.role, { ALLOWED_TAGS: [] });
          const sanitizedContent = DOMPurify.sanitize(testimonial.content, { ALLOWED_TAGS: [] });
          const sanitizedAvatar = testimonial.avatar 
            ? DOMPurify.sanitize(testimonial.avatar, { ALLOWED_TAGS: [] })
            : '';

          return (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {sanitizedAvatar && (
                  <div className="avatar mb-4">
                    <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={sanitizedAvatar} alt={sanitizedName} />
                    </div>
                  </div>
                )}
                <p className="text-base mb-4 italic">&ldquo;{sanitizedContent}&rdquo;</p>
                <div className="mt-auto">
                  <p className="font-semibold text-lg">{sanitizedName}</p>
                  {sanitizedRole && (
                    <p className="text-sm text-nude-600">{sanitizedRole}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
