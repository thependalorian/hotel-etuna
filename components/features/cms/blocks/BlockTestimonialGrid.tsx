'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

interface BlockTestimonialGridProps {
  content: {
    heading?: string;
    testimonials?: Testimonial[];
  };
  onUpdate: (content: Record<string, any>) => void;
}

export function BlockTestimonialGrid({ content, onUpdate }: BlockTestimonialGridProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const testimonials = content.testimonials || [];

  const addTestimonial = () => {
    const newTestimonials = [
      ...testimonials,
      { name: '', role: '', content: '', avatar: '' }
    ];
    onUpdate({ ...content, testimonials: newTestimonials });
    setEditingIndex(newTestimonials.length - 1);
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    onUpdate({ ...content, testimonials: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    const newTestimonials = testimonials.filter((_, i) => i !== index);
    onUpdate({ ...content, testimonials: newTestimonials });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Section Heading (optional)</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm"
          value={content.heading || ''}
          onChange={(e) => onUpdate({ ...content, heading: e.target.value })}
          placeholder="What Our Guests Say"
        />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Testimonials ({testimonials.length})</p>
        <button
          onClick={addTestimonial}
          className="btn btn-sm btn-outline"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Testimonial
        </button>
      </div>

      {testimonials.length > 0 && (
        <div className="space-y-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="border border-nude-200 rounded p-4">
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div className="form-control">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={testimonial.name}
                      onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                      placeholder="Guest Name"
                    />
                  </div>
                  <div className="form-control">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={testimonial.role}
                      onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                      placeholder="Guest Title or Location"
                    />
                  </div>
                  <div className="form-control">
                    <textarea
                      className="textarea textarea-bordered h-24"
                      value={testimonial.content}
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      placeholder="Testimonial content"
                    />
                  </div>
                  <div className="form-control">
                    <input
                      type="url"
                      className="input input-bordered input-sm"
                      value={testimonial.avatar}
                      onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                      placeholder="Avatar URL (optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="btn btn-sm btn-ghost"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => removeTestimonial(index)}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-nude-50 p-2 rounded"
                  onClick={() => setEditingIndex(index)}
                >
                  <p className="font-medium">{testimonial.name || 'Unnamed'}</p>
                  <p className="text-sm text-nude-600 truncate">
                    {testimonial.content || 'No content'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="divider">Preview</div>

      <div>
        {content.heading && (
          <h2 className="text-3xl font-bold text-center mb-8">
            {content.heading}
          </h2>
        )}
        
        {testimonials.length === 0 ? (
          <p className="text-center text-nude-600">
            Add testimonials to see them here
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  {testimonial.avatar && (
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={testimonial.avatar} alt={testimonial.name} />
                      </div>
                    </div>
                  )}
                  <p className="text-sm mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-xs text-nude-600">{testimonial.role}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
