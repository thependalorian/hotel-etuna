/**
 * Testimonial Grid Block Component
 * 
 * Block type for displaying testimonials in a grid
 */

'use client';

import React from 'react';

interface Props {
  content: {
    heading?: string;
    testimonials?: Array<{
      name: string;
      role: string;
      content: string;
      rating: number;
    }>;
  };
  onUpdate: (content: Record<string, any>) => void;
}

export default function BlockTestimonialGrid({ content, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...content, [field]: value });
  };

  const addTestimonial = () => {
    const testimonials = content.testimonials || [];
    update('testimonials', [
      ...testimonials,
      { name: 'Customer Name', role: 'Customer Role', content: 'Testimonial text...', rating: 5 },
    ]);
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const testimonials = [...(content.testimonials || [])];
    testimonials[index] = { ...testimonials[index], [field]: value };
    update('testimonials', testimonials);
  };

  const removeTestimonial = (index: number) => {
    const testimonials = content.testimonials?.filter((_, i) => i !== index) || [];
    update('testimonials', testimonials);
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Section Heading</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={content.heading || ''}
          onChange={(e) => update('heading', e.target.value)}
        />
      </div>

      <div className="divider">Testimonials</div>

      {(content.testimonials || []).map((testimonial, index) => (
        <div key={index} className="card bg-base-300">
          <div className="card-body">
            <div className="flex justify-between">
              <span className="badge">Testimonial {index + 1}</span>
              <button
                onClick={() => removeTestimonial(index)}
                className="btn btn-xs btn-error btn-ghost"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="input input-sm input-bordered"
                placeholder="Name"
                value={testimonial.name}
                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
              />
              <input
                type="text"
                className="input input-sm input-bordered"
                placeholder="Role"
                value={testimonial.role}
                onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
              />
            </div>
            <textarea
              className="textarea textarea-sm textarea-bordered"
              placeholder="Testimonial content"
              rows={2}
              value={testimonial.content}
              onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
            />
            <input
              type="number"
              min="1"
              max="5"
              className="input input-sm input-bordered w-24"
              placeholder="Rating"
              value={testimonial.rating}
              onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
            />
          </div>
        </div>
      ))}

      <button onClick={addTestimonial} className="btn btn-sm btn-outline w-full">
        + Add Testimonial
      </button>

      {/* Preview */}
      <div className="divider">Preview</div>
      <div>
        {content.heading && <h3 className="text-2xl font-bold mb-4">{content.heading}</h3>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(content.testimonials || []).map((testimonial, index) => (
            <div key={index} className="card bg-base-100">
              <div className="card-body">
                <div className="rating rating-sm">
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
                <p className="text-sm">{testimonial.content}</p>
                <div className="mt-4">
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-sm opacity-70">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
