/**
 * Food & Beverage Section Component
 * 
 * Purpose: Landing page section displaying F&B management solutions
 * Location: /components/sections/landing/FoodBeverageSection.tsx
 * 
 * Features:
 * - Grid layout (1 column mobile, 2 columns desktop)
 * - 2 F&B type cards
 * - Centered heading and description
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Gradient background: from-base-200 to-base-100
 * - Grid: grid-cols-1 md:grid-cols-2
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * 
 * @module FoodBeverageSection
 */

import { Utensils, Wine } from 'lucide-react';
import FBCard from './cards/FBCard';

const fbTypes = [
  {
    icon: Utensils,
    title: 'Standalone Restaurants',
    subtitle: 'Complete F&B system for restaurants without accommodation',
    features: ['Menu Management', 'Table Booking', 'Order Management', 'Staff Scheduling'],
    image: '/images/hospitality/restaurant_dining.jpeg',
  },
  {
    icon: Wine,
    title: 'Bars & Lounges',
    subtitle: 'Specialized for beverage-focused establishments',
    features: ['Bar Management', 'Bottle Service', 'Order Tracking', 'Staff Scheduling'],
    image: '/images/hospitality/restaurant_bar.jpeg',
  },
];

export default function FoodBeverageSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-base-200 to-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Food & Beverage
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Complete F&B management solutions for restaurants and bars of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {fbTypes.map((type, index) => (
            <FBCard key={index} {...type} />
          ))}
        </div>
      </div>
    </section>
  );
}
