/**
 * Visual room tour — large hero image with clickable/swipeable stops (not menu book).
 * Location: components/features/rooms/RoomPhotoTour.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RoomTourStop } from '@/lib/rooms/room-display';
import { cn } from '@/lib/utils/cn';

type RoomPhotoTourProps = {
  roomName: string;
  stops: RoomTourStop[];
};

export default function RoomPhotoTour({ roomName, stops }: RoomPhotoTourProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeStops = stops.length > 0 ? stops : [];
  const active = safeStops[activeIndex];

  const go = useCallback(
    (delta: number) => {
      if (safeStops.length === 0) return;
      setActiveIndex((i) => (i + delta + safeStops.length) % safeStops.length);
    },
    [safeStops.length],
  );

  if (!active) {
    return null;
  }

  return (
    <section id="tour" className="space-y-4" aria-label={`${roomName} photo tour`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-etuna-card bg-nude-100 sm:aspect-[16/10]">
        <Image
          key={active.imageSrc}
          src={active.imageSrc}
          alt={`${roomName} — ${active.label}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 66vw"
          priority={activeIndex === 0}
        />
        <div className="absolute inset-0 bg-linear-to-t from-ci-secondary-chocolate/50 via-transparent to-transparent" />

        <button
          type="button"
          onClick={() => go(-1)}
          className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-0 bg-white/90 min-h-11 min-w-11 sm:left-3"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-white/90 min-h-11 min-w-11 sm:right-3"
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>

        <p className="absolute bottom-3 left-3 rounded-full bg-ci-secondary-chocolate/75 px-3 py-1 text-xs font-medium text-white">
          {activeIndex + 1} / {safeStops.length} · {active.label}
        </p>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
        role="tablist"
        aria-label="Room tour stops"
      >
        {safeStops.map((stop, index) => (
          <button
            key={stop.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'shrink-0 rounded-etuna-input border px-3 py-2 text-left text-sm transition-colors min-h-11',
              index === activeIndex
                ? 'border-ci-primary bg-ci-primary text-ci-cream'
                : 'border-nude-200 bg-white text-ci-accent-terracotta hover:border-ci-secondary-taupe',
            )}
          >
            {stop.label}
          </button>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-ink-700">{active.caption}</p>
    </section>
  );
}
