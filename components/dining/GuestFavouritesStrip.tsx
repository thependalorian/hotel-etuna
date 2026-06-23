/**
 * Guest Favourites Strip - Client-side component
 * Location: components/dining/GuestFavouritesStrip.tsx
 * Purpose: Displays a horizontal scrollable strip of guest's favorite menu items
 * Fetches favourites client-side to avoid build-time blocking
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PublicMenuItem } from '@/lib/dining/menu-display';
import { Card } from '@/components/ui/Card';
import { ETUNA_PROPERTY_IMAGES } from '@/lib/rooms/property-images';

export function GuestFavouritesStrip() {
  const [items, setItems] = useState<PublicMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const res = await fetch('/api/dining/favourites');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {
        // Reason: favourites are non-critical; fail silently and render nothing.
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  if (isLoading) {
    return null; // Or a skeleton loader if desired
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-nude-100" aria-label="Guest Favourites">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl font-bold text-ci-secondary-chocolate mb-6 text-center">
          Your Favourites
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {items.map((item) => (
            <Card key={item.id} variant="listing" className="w-[min(80vw,280px)] shrink-0 snap-center overflow-hidden border border-nude-200">
              <div className="etuna-card-media aspect-video">
                <Image
                  src={item.imageUrl || ETUNA_PROPERTY_IMAGES.outdoorDining}
                  alt={item.name}
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-ci-secondary-chocolate">{item.name}</h3>
                <p className="text-sm text-ink-600 line-clamp-2">{item.description}</p>
                <p className="text-md font-bold text-ci-secondary-chocolate mt-2">N${item.price.toFixed(2)}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
