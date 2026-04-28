/**
 * Accommodation Types Section Component
 * 
 * Purpose: Landing page section displaying different accommodation types
 * Location: /components/sections/landing/AccommodationTypes.tsx
 * 
 * Features:
 * - Grid layout (1 column mobile, 3 columns desktop)
 * - 3 property type cards
 * - Centered heading and description
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Grid: grid-cols-1 md:grid-cols-3
 * - Section padding: py-20 md:py-32
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * 
 * @module AccommodationTypes
 */

import { Home, Hotel, Building } from 'lucide-react';
import PropertyTypeCard from './cards/PropertyTypeCard';

const accommodationTypes = [
  {
    icon: Home,
    title: 'Vacation Rentals',
    subtitle: 'Airbnb, holiday homes, and short-term rentals',
    features: ['Self Check-in', 'Cleaning Management', 'Guest Communication', 'Dynamic Pricing'],
    image: '/images/hospitality/hotel_room.jpeg',
  },
  {
    icon: Hotel,
    title: 'AirBnB & Lodges',
    subtitle: 'Large properties with multiple amenities',
    features: ['Multiple Restaurants', 'Activities Management', 'Spa Services', 'Tour Bookings'],
    image: '/images/hospitality/resort_exterior.jpeg',
  },
  {
    icon: Building,
    title: 'Guest Houses',
    subtitle: 'Smaller properties with intimate service',
    features: ['Breakfast Management', 'Housekeeping', 'Local Tours', 'Personal Service'],
    image: '/images/hospitality/guest_house.jpeg',
  },
];

export default function AccommodationTypes() {
  return (
    <section className="py-20 md:py-32 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Accommodation Management
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Comprehensive property management for every type of accommodation business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {accommodationTypes.map((type, index) => (
            <PropertyTypeCard key={index} {...type} />
          ))}
        </div>
      </div>
    </section>
  );
}
