/**
 * Problems Grid Section Component
 * 
 * Purpose: Landing page section displaying problems that Buffr Host solves
 * Location: /components/sections/landing/ProblemsGrid.tsx
 * 
 * Features:
 * - Grid layout (1 column mobile, 2 columns desktop)
 * - 4 problem cards with icons
 * - Centered heading
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Grid: grid-cols-1 md:grid-cols-2
 * - Section padding: py-20
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * 
 * @module ProblemsGrid
 */

import { Users, Calendar, Zap, BarChart3 } from 'lucide-react';
import ProblemCard from './cards/ProblemCard';

const problems = [
  {
    title: 'Inquiries Go Unanswered, Revenue Walks Away',
    description: 'Calls during peak hours go to voicemail. Emails sit unread for hours. Weekend inquiries wait until Monday. By then, guests have booked with competitors who responded instantly. Every unanswered inquiry is a direct revenue loss.',
    icon: Calendar,
    color: 'error' as const,
  },
  {
    title: 'Your Team Is Spread Too Thin',
    description: 'Reception juggles phone calls, walk-ins, check-ins, restaurant reservations, and guest questions simultaneously. During busy periods, something always gets dropped—and it\'s usually a booking opportunity that becomes someone else\'s revenue.',
    icon: Users,
    color: 'primary' as const,
  },
  {
    title: 'Data Lives in Silos, Decisions Are Blind',
    description: 'Bookings tracked in one system, payments in another, guest preferences in spreadsheets, restaurant orders on paper. Without a unified view, you can\'t spot trends, optimize pricing, or personalize service. You\'re operating blind.',
    icon: Zap,
    color: 'warning' as const,
  },
  {
    title: 'Existing Tools Create More Problems Than They Solve',
    description: 'Enterprise platforms cost thousands monthly and take months to implement. Phone-only AI requires separate PMS integration. Generic booking systems don\'t handle restaurants or guest preferences. You need one platform that does everything.',
    icon: BarChart3,
    color: 'info' as const,
  },
];

export default function ProblemsGrid() {
  return (
    <section className="py-20 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            The Revenue Leaks Killing Your Business
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Every day, hospitality businesses lose bookings to competitors who respond faster. Here's what's costing you revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => (
            <ProblemCard key={index} {...problem} />
          ))}
        </div>
      </div>
    </section>
  );
}
