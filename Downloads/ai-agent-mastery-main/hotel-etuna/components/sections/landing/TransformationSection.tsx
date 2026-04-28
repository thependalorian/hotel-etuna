/**
 * Transformation Section Component
 * 
 * Purpose: Landing page section showing before/after transformation
 * Location: /components/sections/landing/TransformationSection.tsx
 * 
 * Features:
 * - Before/after comparison
 * - Visual transformation diagram
 * - Key benefits highlighted
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Grid: grid-cols-1 lg:grid-cols-2
 * - Section padding: py-20 md:py-32
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * - Alt text for visual elements
 * 
 * @module TransformationSection
 */

import { ArrowRight, X, CheckCircle2 } from 'lucide-react';

const beforeItems = [
  '30-40% of inquiries go unanswered during peak times',
  'Manual booking entry creates errors and delays',
  'Guest data trapped in spreadsheets and notebooks',
  'No visibility into booking patterns or revenue trends',
  'Staff spends hours on repetitive data entry',
  'Competitors capture bookings you miss',
];

const afterItems = [
  'Every inquiry answered instantly, 24/7',
  'Inquiries convert to bookings automatically in real-time',
  'Complete guest history and preferences in one system',
  'Real-time revenue dashboards show exactly what\'s working',
  'Staff focuses on guest experience, not data entry',
  'You capture every booking opportunity before competitors',
];

export default function TransformationSection() {
  return (
    <section className="py-20 md:py-32 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            The Transformation: From Revenue Loss to Revenue Growth
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            See the operational and financial impact when every inquiry is captured, every booking is automated, and every guest interaction is optimized.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Before */}
          <div className="card bg-error/5 border-2 border-error/20 shadow-lg">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                  <X className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-2xl font-bold font-display text-error">The Problem</h3>
              </div>
              <ul className="space-y-4">
                {beforeItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <span className="text-base-content/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* After */}
          <div className="card bg-success/5 border-2 border-success/20 shadow-lg lg:col-start-3">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-2xl font-bold font-display text-success">The Solution</h3>
              </div>
              <ul className="space-y-4">
                {afterItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-base-content/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Arrow */}
        <div className="flex justify-center my-8 lg:hidden">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center rotate-90">
            <ArrowRight className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
