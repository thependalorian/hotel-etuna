/**
 * Try It Section Component
 * 
 * Purpose: Landing page section with low-friction CTA for trying the platform
 * Location: /components/sections/landing/TryItSection.tsx
 * 
 * Features:
 * - Email input form
 * - Low-friction messaging
 * - Trust indicators
 * - Tip section
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-gradient
 * - Section padding: py-20 md:py-32
 * - Form styling with DaisyUI
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic form element
 * - ARIA labels for inputs
 * - Error handling
 * 
 * @module TryItSection
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Lightbulb, Mail, Clock, Phone, X } from 'lucide-react';
import Link from 'next/link';

export default function TryItSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // In a real implementation, this would call an API endpoint
    // For now, we'll simulate a submission
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirect to register with email pre-filled
      window.location.href = `/register?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Clock,
      title: 'No Waiting',
      description: 'Instant access after email verification',
    },
    {
      icon: Phone,
      title: 'No Meeting',
      description: 'Direct access, no calls required',
    },
    {
      icon: X,
      title: 'No Catch',
      description: 'Get started with no credit card required',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-nude-600/10 via-base-100 to-nude-500/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Try It Yourself—No Meeting Required
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto mb-8">
            No waiting. No meeting. No catch. After a quick email verification, you'll receive direct access to your account. Start managing your property in minutes.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="card bg-base-100 shadow-md">
              <div className="card-body p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold font-display mb-2">{feature.title}</h3>
                <p className="text-sm text-base-content/90">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Email Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-8">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-base-content mb-2">
                    Email Address
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="your@email.com"
                        className="input input-bordered w-full"
                        required
                        aria-label="Email address"
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? 'email-error' : undefined}
                      />
                      {error && (
                        <p id="email-error" className="mt-2 text-sm text-error" role="alert">
                          {error}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="min-h-[48px] px-8"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-md" />
                      ) : (
                        <>
                          Get Free Access
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-base-content/80 text-center">
                  We'll never share your email. Unsubscribe anytime.
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4 mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-display mb-2">Check Your Email</h3>
                <p className="text-base-content/90 mb-6">
                  We've sent you a verification link. Click it to get instant access to your account.
                </p>
                <Link href="/register">
                  <Button variant="outline" size="lg">
                    Or Register Directly
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tip Section */}
        <div className="mt-12 card bg-info/5 border-2 border-info/20">
          <div className="card-body p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center flex-shrink-0 mt-1">
                <Lightbulb className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h4 className="font-semibold font-display mb-2">Tip for Testing</h4>
                <p className="text-sm text-base-content/80">
                  Create a property, add rooms, and let Sofia AI answer guest inquiries. See how it works in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
