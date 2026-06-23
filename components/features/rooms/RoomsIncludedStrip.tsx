/**
 * Shared inclusions strip for all room types (mini fridge, WiFi, etc.).
 * Location: components/features/rooms/RoomsIncludedStrip.tsx
 */

import { Refrigerator, Wifi, Wind, Sparkles, BedDouble } from 'lucide-react';
import { getAllRoomsIncludedAmenities } from '@/lib/rooms/room-display';

const ICONS = [Refrigerator, Wifi, Wind, Sparkles, BedDouble];

export default function RoomsIncludedStrip() {
  const items = getAllRoomsIncludedAmenities();

  return (
    <section className="py-12 bg-nude-50" aria-label="Included in every room">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-ci-secondary-chocolate">
            Every room includes
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {items.map((item, index) => {
              const Icon = ICONS[index] ?? Sparkles;
              return (
                <div key={item.label} className="flex flex-col items-center text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-ci-accent-sage/20">
                    <Icon className="h-6 w-6 text-sage" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-ci-accent-terracotta">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
