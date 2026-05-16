/**
 * Public room copy and photo-tour stops (single source for /rooms UI).
 * Location: lib/rooms/room-display.ts
 */

import type { HubRoom } from '@/lib/data/rooms';

export type RoomTourStop = {
  id: string;
  label: string;
  imageSrc: string;
  caption: string;
};

export type PublicRoomDisplay = {
  summary: string;
  highlights: string[];
  tourStops: RoomTourStop[];
  displayOccupancy: number;
};

const FALLBACK_IMAGE = '/images/hospitality/hotel_room.jpeg';

const DEFAULT_HERO: Record<string, string> = {
  'standard-room': '/images/hospitality/hotel_room.jpeg',
  'luxury-room': '/images/hospitality/guest_house.jpeg',
  'family-room': '/images/hospitality/guest_house.jpeg',
  'executive-suite': '/images/hospitality/hero_hotel_lobby.jpeg',
  'premier-room': '/images/hospitality/guest_house.jpeg',
};

type TourStopTemplate = {
  id: string;
  label: string;
  caption: string;
  /** Index into resolved image list, or fixed path */
  image?: string;
  imageIndex?: number;
};

const ROOM_TOUR_TEMPLATES: Record<string, TourStopTemplate[]> = {
  'standard-room': [
    {
      id: 'bed',
      label: 'Bedroom',
      caption: 'Comfortable bed with mosquito net, air conditioning, and satellite TV.',
      imageIndex: 0,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Private en-suite bathroom with shower and daily housekeeping.',
      imageIndex: 1,
    },
    {
      id: 'desk',
      label: 'Work space',
      caption: 'Desk area for light work — free WiFi throughout the room.',
      image: '/images/hospitality/hero_hotel_lobby.jpeg',
    },
  ],
  'luxury-room': [
    {
      id: 'bed',
      label: 'Bedroom',
      caption: 'More space with elegant finishes and a restful sleeping area.',
      imageIndex: 0,
    },
    {
      id: 'lounge',
      label: 'Sitting area',
      caption: 'Dedicated sitting space to unwind after a day in Ongwediva.',
      imageIndex: 1,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Premium bathroom with quality toiletries.',
      image: '/images/hospitality/hotel_room.jpeg',
    },
    {
      id: 'view',
      label: 'Pool view',
      caption: 'Many luxury rooms overlook the pool and gardens.',
      image: '/images/hospitality/resort_exterior.jpeg',
    },
  ],
  'family-room': [
    {
      id: 'beds',
      label: 'Sleeping area',
      caption: 'Room for the whole family with flexible bedding.',
      imageIndex: 0,
    },
    {
      id: 'garden',
      label: 'Garden access',
      caption: 'Easy access to outdoor areas for children to stretch their legs.',
      image: '/images/hospitality/resort_exterior.jpeg',
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Practical bathroom layout for family stays.',
      imageIndex: 1,
    },
  ],
  'executive-suite': [
    {
      id: 'desk',
      label: 'Work zone',
      caption: 'Desk and quiet layout suited to business travellers.',
      imageIndex: 0,
    },
    {
      id: 'bed',
      label: 'Bedroom',
      caption: '26 m² suite with a comfortable king sleeping area.',
      imageIndex: 1,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'VIP toiletries and a refreshed private bathroom.',
      image: '/images/hospitality/guest_house.jpeg',
    },
    {
      id: 'lounge',
      label: 'Lounge access',
      caption: 'Executive guests enjoy lounge access on property.',
      image: '/images/hospitality/restaurant_bar.jpeg',
    },
  ],
  'premier-room': [
    {
      id: 'overview',
      label: 'Overview',
      caption:
        'Our most spacious stay — private lounge, master bedroom, and a second room with twin beds. Sleeps up to 4 guests.',
      image: '/images/hospitality/guest_house.jpeg',
    },
    {
      id: 'lounge',
      label: 'Lounge',
      caption: 'Private lounge with seating for your group between the two bedrooms.',
      image: '/images/hospitality/restaurant_dining.jpeg',
    },
    {
      id: 'master',
      label: 'Master bedroom',
      caption: 'Master bedroom with en-suite comfort and premium bedding.',
      image: '/images/hospitality/guest_house.jpeg',
    },
    {
      id: 'twins',
      label: 'Twin room',
      caption: 'Second bedroom with twin beds — ideal for children or colleagues travelling together.',
      image: '/images/hospitality/hotel_room.jpeg',
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Fresh, private bathroom facilities for your group.',
      image: '/images/hospitality/hero_hotel_lobby.jpeg',
    },
    {
      id: 'balcony',
      label: 'Balcony',
      caption: 'Step outside from the premier level when you want fresh air.',
      image: '/images/hospitality/resort_exterior.jpeg',
    },
  ],
};

const ROOM_SUMMARIES: Record<string, string> = {
  'standard-room':
    'Essential comfort with air conditioning, mosquito net, satellite TV, and a mini fridge.',
  'luxury-room':
    'Extra space, sitting area, premium bathroom, and pool-facing views where available.',
  'family-room':
    'Ample space for families with flexible bedding and garden access.',
  'executive-suite':
    'Business-friendly suite with work desk, VIP toiletries, and lounge access.',
  'premier-room':
    'Private lounge, master bedroom, and twin room — our flagship stay for up to 4 guests.',
};

const ROOM_HIGHLIGHTS: Record<string, string[]> = {
  'standard-room': ['Mini fridge', 'Free WiFi', 'Air conditioning'],
  'luxury-room': ['Mini fridge', 'Sitting area', 'Bathrobe'],
  'family-room': ['Mini fridge', 'Sleeps families', 'Garden access'],
  'executive-suite': ['Mini fridge', 'Work desk', 'Lounge access'],
  'premier-room': ['Mini fridge', 'Private lounge', 'Master + twin bedrooms'],
};

/** Product rule: Premier accommodates 4 (overrides stale DB values). */
const OCCUPANCY_OVERRIDE: Record<string, number> = {
  'premier-room': 4,
};

function resolveImageList(slug: string, dbImages: string[]): string[] {
  if (dbImages.length > 0) return dbImages;
  const hero = DEFAULT_HERO[slug];
  return hero ? [hero, FALLBACK_IMAGE] : [FALLBACK_IMAGE];
}

function resolveTourStops(slug: string, dbImages: string[]): RoomTourStop[] {
  const templates = ROOM_TOUR_TEMPLATES[slug] ?? ROOM_TOUR_TEMPLATES['standard-room'];
  const images = resolveImageList(slug, dbImages);

  return templates.map((stop) => {
    let imageSrc = stop.image;
    if (!imageSrc && stop.imageIndex !== undefined) {
      imageSrc = images[stop.imageIndex] ?? images[0] ?? FALLBACK_IMAGE;
    }
    if (!imageSrc) imageSrc = images[0] ?? FALLBACK_IMAGE;

    return {
      id: stop.id,
      label: stop.label,
      caption: stop.caption,
      imageSrc,
    };
  });
}

export function getPublicRoomDisplay(room: HubRoom): PublicRoomDisplay {
  const slug = room.slug;
  return {
    summary: ROOM_SUMMARIES[slug] ?? 'Comfortable accommodation with authentic Namibian hospitality.',
    highlights: ROOM_HIGHLIGHTS[slug] ?? ['Mini fridge', 'Free WiFi'],
    tourStops: resolveTourStops(slug, room.images ?? []),
    displayOccupancy: OCCUPANCY_OVERRIDE[slug] ?? room.maxOccupancy ?? 2,
  };
}

export function getAllRoomsIncludedAmenities(): { label: string }[] {
  return [
    { label: 'Mini fridge in every room' },
    { label: 'Free WiFi' },
    { label: 'Air conditioning' },
    { label: 'Daily housekeeping' },
    { label: 'Mosquito nets' },
  ];
}
