/**
 * ProblemSolutionTabs Component - Simplified
 * 
 * Purpose: Display problems and solutions for hospitality businesses
 * Location: /components/ProblemSolutionTabs.tsx
 * 
 * Features:
 * - Problems and solutions sections only
 * - Unified content applicable to all hospitality businesses
 * - Clear visual flow and narrative
 * - Scannable layout with icons and visual hierarchy
 * - Mobile-first responsive design
 * 
 * Design Principles Applied:
 * - Miller's Law: Content chunked into digestible sections
 * - Gestalt Principles: Clear visual grouping and flow
 */

'use client';

import { AlertCircle, Check, CheckCircle2, X } from 'lucide-react';

const problems = [
  'Inquiries go unanswered during peak hours and weekends',
  'Manual booking entry creates errors and delays',
  'Guest data trapped in spreadsheets and notebooks',
  'No visibility into booking patterns or revenue trends',
  'Staff spends hours on repetitive data entry',
  'Competitors capture bookings you miss',
  'Guest requests and special needs fall through cracks',
  'Multiple disconnected systems require manual data entry',
  'Can\'t respond to inquiries fast enough to convert bookings',
  'Lost revenue from inefficient pricing and empty inventory'
];

const solutions = [
  'Every inquiry answered instantly, 24/7 by Sofia AI',
  'Inquiries convert to bookings automatically in real-time',
  'Complete guest history and preferences in one unified system',
  'Real-time revenue dashboards show exactly what\'s working',
  'Staff focuses on guest experience, not data entry',
  'You capture every booking opportunity before competitors',
  'Automated request routing ensures nothing gets missed',
  'All systems integrated—data syncs automatically',
  'AI handles inquiries instantly, even during peak hours',
  'AI-powered revenue optimization and dynamic pricing'
];

export default function ProblemSolutionTabs() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-base-100 to-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4 text-balance">
            See How Hotel Etuna Solves Your Challenges
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Common challenges hospitality businesses face—and how we solve them
          </p>
        </div>

        {/* Content Flow - Problems and Solutions */}
        <div className="space-y-12">
          {/* Problems Section */}
          <div className="card bg-warning/5 border-2 border-warning/20 shadow-lg">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-warning">The Problems</h3>
                  <p className="text-sm text-base-content/80">Challenges you face every day</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {problems.map((problem, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 bg-base-100 rounded-lg border border-warning/10 hover:border-warning/30 transition-all duration-200"
                  >
                    <div className="shrink-0 w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center mt-0.5">
                      <X className="w-3.5 h-3.5 text-warning" aria-hidden />
                    </div>
                    <p className="text-base-content/80 flex-1">{problem}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Solutions Section */}
          <div className="card bg-success/5 border-2 border-success/20 shadow-lg">
            <div className="card-body p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-success">The Solutions</h3>
                  <p className="text-sm text-base-content/80">How Hotel Etuna solves these challenges</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutions.map((solution, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 bg-base-100 rounded-lg border border-success/10 hover:border-success/30 transition-all duration-200"
                  >
                    <div className="shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-success" aria-hidden />
                    </div>
                    <p className="text-base-content/80 font-medium flex-1">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
