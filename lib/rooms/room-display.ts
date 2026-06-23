/**
 * Public room copy and photo-tour stops (single source for /rooms UI).
 * Location: lib/rooms/room-display.ts
 */

import type { HubRoom } from '@/lib/data/rooms';
import {
  ETUNA_PROPERTY_IMAGES,
} from '@/lib/rooms/property-images';

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

const FALLBACK_IMAGE = ETUNA_PROPERTY_IMAGES.roomDoubleRondavel;

const DEFAULT_HERO: Record<string, string> = {
  'standard-room-type-a': ETUNA_PROPERTY_IMAGES.roomDoubleRondavel,
  'standard-room-type-b': ETUNA_PROPERTY_IMAGES.roomTwin,
  'standard-room-type-c': ETUNA_PROPERTY_IMAGES.roomTwin,
  'executive-room': ETUNA_PROPERTY_IMAGES.roomTwin,
  'premiere-room': ETUNA_PROPERTY_IMAGES.roomPremiere,
};

type TourStopTemplate = {
  id: string;
  label: string;
  caption: string;
  image?: string;
  imageIndex?: number;
};

const ROOM_TOUR_TEMPLATES: Record<string, TourStopTemplate[]> = {
  'standard-room-type-a': [
    {
      id: 'bed',
      label: 'Double bed',
      caption: 'Type A — one double bed, air conditioning, mosquito net, and satellite TV.',
      imageIndex: 0,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Private en-suite bathroom with shower and daily housekeeping.',
      image: ETUNA_PROPERTY_IMAGES.bathroomModern,
    },
    {
      id: 'desk',
      label: 'Work space',
      caption: 'Desk area with free WiFi throughout the room.',
      image: ETUNA_PROPERTY_IMAGES.hallway,
    },
  ],
  'standard-room-type-b': [
    {
      id: 'beds',
      label: 'Twin singles',
      caption: 'Type B — two single beds, ideal for friends or colleagues sharing.',
      imageIndex: 0,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Private bathroom with shower and essentials.',
      image: ETUNA_PROPERTY_IMAGES.bathroomModern,
    },
    {
      id: 'desk',
      label: 'Work space',
      caption: 'Desk and WiFi for light work during your stay.',
      image: ETUNA_PROPERTY_IMAGES.hallway,
    },
  ],
  'standard-room-type-c': [
    {
      id: 'beds',
      label: 'Double + single',
      caption: 'Type C — double bed and single bed for a small group or family of three.',
      imageIndex: 0,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Practical bathroom layout for up to three guests.',
      image: ETUNA_PROPERTY_IMAGES.bathroomModern,
    },
    {
      id: 'desk',
      label: 'Work space',
      caption: 'Desk area and free WiFi.',
      image: ETUNA_PROPERTY_IMAGES.hallway,
    },
  ],
  'executive-room': [
    {
      id: 'desk',
      label: 'Work zone',
      caption: 'Executive Room with desk and quiet layout for business travellers.',
      imageIndex: 0,
    },
    {
      id: 'bed',
      label: 'Bedroom',
      caption: 'Comfortable sleeping area with premium bedding.',
      imageIndex: 1,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'VIP toiletries and a refreshed private bathroom.',
      image: ETUNA_PROPERTY_IMAGES.bathroomModern,
    },
    {
      id: 'lounge',
      label: 'Lounge access',
      caption: 'Executive guests enjoy lounge access on property.',
      image: ETUNA_PROPERTY_IMAGES.restaurantBar,
    },
  ],
  'premiere-room': [
    {
      id: 'overview',
      label: 'Overview',
      caption:
        'Premiere Room — our flagship stay with private lounge, master bedroom, and twin room. Sleeps up to 4 guests.',
      image: ETUNA_PROPERTY_IMAGES.roomPremiere,
    },
    {
      id: 'lounge',
      label: 'Lounge',
      caption: 'Private lounge with seating between the bedrooms.',
      image: ETUNA_PROPERTY_IMAGES.outdoorDining,
    },
    {
      id: 'master',
      label: 'Master bedroom',
      caption: 'Master bedroom with en-suite comfort and premium bedding.',
      image: ETUNA_PROPERTY_IMAGES.roomPremiere,
    },
    {
      id: 'twins',
      label: 'Twin room',
      caption: 'Second bedroom with twin beds for children or colleagues.',
      image: ETUNA_PROPERTY_IMAGES.roomTwin,
    },
    {
      id: 'bath',
      label: 'Bathroom',
      caption: 'Private bathroom facilities for your group.',
      image: ETUNA_PROPERTY_IMAGES.bathroomRustic,
    },
    {
      id: 'balcony',
      label: 'Balcony',
      caption: 'Step outside from the premiere level when you want fresh air.',
      image: ETUNA_PROPERTY_IMAGES.exteriorRondavels,
    },
  ],
};

const ROOM_SUMMARIES: Record<string, string> = {
  'standard-room-type-a':
    'Standard Room Type A — double bed, air conditioning, mosquito net, satellite TV, and mini fridge.',
  'standard-room-type-b':
    'Standard Room Type B — two single beds for flexible sleeping arrangements.',
  'standard-room-type-c':
    'Standard Room Type C — double bed plus single bed for up to three guests.',
  'executive-room':
    'Executive Room with work desk, VIP toiletries, and lounge access.',
  'premiere-room':
    'Premiere Room with private lounge, master bedroom, and twin room — up to 4 guests.',
};

const ROOM_HIGHLIGHTS: Record<string, string[]> = {
  'standard-room-type-a': ['Double bed', 'Mini fridge', 'Free WiFi'],
  'standard-room-type-b': ['Two single beds', 'Mini fridge', 'Free WiFi'],
  'standard-room-type-c': ['Double + single bed', 'Sleeps 3', 'Mini fridge'],
  'executive-room': ['Mini fridge', 'Work desk', 'Lounge access'],
  'premiere-room': ['Mini fridge', 'Private lounge', 'Master + twin bedrooms'],
};

const OCCUPANCY_OVERRIDE: Record<string, number> = {
  'standard-room-type-c': 3,
  'premiere-room': 4,
};

function resolveImageList(slug: string, dbImages: string[]): string[] {
  if (dbImages.length > 0) return dbImages;
  const hero = DEFAULT_HERO[slug];
  return hero ? [hero, FALLBACK_IMAGE] : [FALLBACK_IMAGE];
}

function resolveTourStops(slug: string, dbImages: string[]): RoomTourStop[] {
  const templates = ROOM_TOUR_TEMPLATES[slug] ?? ROOM_TOUR_TEMPLATES['standard-room-type-a'];
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
