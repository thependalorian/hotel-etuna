/**
 * Public Property Detail Page
 * 
 * Purpose: Public-facing property detail page with professional presentation
 * Location: /app/public-properties/[slug]/page.tsx
 * 
 * Features:
 * - Professional hero section with property information
 * - CMS content and media gallery
 * - Room listings (for hotels) with booking CTAs
 * - Menu link (for restaurants)
 * - Sofia AI chat widget for guest inquiries
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Professional typography with font-display
 * - Responsive grid layouts
 * 
 * Accessibility:
 * - Proper heading hierarchy
 * - Semantic HTML structure
 * - ARIA labels for interactive elements
 * 
 * @module PublicPropertyPage
 */

import { PropertyService } from '@/lib/services/property/PropertyService';
import { RoomService } from '@/lib/services/room/RoomService';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { db } from '@/lib/db';
import { cmsContent as cmsContentTable, cmsMedia as cmsMediaTable } from '@/lib/db/schema';
import { and, eq, desc, asc } from 'drizzle-orm';
import PropertyMediaGallery from '@/components/features/cms/PropertyMediaGallery';
import ContentDisplay from '@/components/features/cms/ContentDisplay';
import { PublicSofiaChat } from '@/components/features/sofia/PublicSofiaChat';

interface PropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const propertyService = new PropertyService();
  const property = await propertyService.getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const roomService = new RoomService();
  const rooms = property.type === 'HOTEL' ? await roomService.getRoomsForProperty(property.id) : [];

  const [cmsContentRows, cmsMediaRows] = await Promise.all([
    db
      .select()
      .from(cmsContentTable)
      .where(and(eq(cmsContentTable.propertyId, property.id), eq(cmsContentTable.status, 'published')))
      .orderBy(desc(cmsContentTable.updatedAt))
      .limit(10),
    db
      .select()
      .from(cmsMediaTable)
      .where(and(eq(cmsMediaTable.propertyId, property.id), eq(cmsMediaTable.fileType, 'image')))
      .orderBy(asc(cmsMediaTable.displayOrder))
      .limit(12),
  ]);
  const cmsContent = cmsContentRows;
  const cmsMedia = cmsMediaRows;

  const propertyDescription =
    cmsContent.find((c) => c.contentType === 'property')?.content ?? property.description ?? 'No description available.';

  return (
    <>
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="buffr-page-title--hero mb-4">{property.name}</h1>
        <p className="mb-6 text-lg leading-relaxed text-ink-600">{property.address}</p>
        {propertyDescription && (
          <div className="mt-6 max-w-prose">
            <p className="text-base leading-relaxed text-ink-700">{propertyDescription}</p>
          </div>
        )}
        {/* Professional CTA */}
        <div className="mt-8 flex flex-wrap gap-4">
          {property.type === 'HOTEL' && (
            <Link href={`/public-properties/${slug}/book`}>
              <Button variant="default" size="lg" className="min-h-[48px]">
                Book Your Stay
              </Button>
            </Link>
          )}
          {property.type === 'RESTAURANT' && (
            <Link href={`/public-properties/${slug}/menu`}>
              <Button variant="default" size="lg" className="min-h-[48px]">
                View Menu
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Property Image Gallery from CMS */}
      {cmsMedia.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-6">Property Gallery</h2>
          <PropertyMediaGallery 
            propertyId={property.id} 
            limit={12}
            showCaption={true}
          />
        </div>
      )}

      {/* Property Content from CMS */}
      {cmsContent.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-6">About This Property</h2>
          <ContentDisplay 
            propertyId={property.id}
            limit={10}
            showStatus={false}
          />
        </div>
      )}

      {property.type === 'HOTEL' && (
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-6">Our Rooms</h2>
          {rooms.length === 0 ? (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center py-12">
                <p className="text-base-content/70 text-lg">No rooms available at this time. Please check back later.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(async (room) => {
                const allRoomMedia = await db
                  .select()
                  .from(cmsMediaTable)
                  .where(
                    and(
                      eq(cmsMediaTable.propertyId, property.id),
                      eq(cmsMediaTable.fileType, 'image')
                    )
                  );
                const roomMedia = allRoomMedia.find(
                  (m) => (m.metadata as Record<string, unknown>)?.roomId === room.id
                );

                const allRoomContent = await db
                  .select()
                  .from(cmsContentTable)
                  .where(
                    and(
                      eq(cmsContentTable.propertyId, property.id),
                      eq(cmsContentTable.contentType, 'room'),
                      eq(cmsContentTable.status, 'published')
                    )
                  );
                const roomContent = allRoomContent.find(
                  (c) => (c.metadata as Record<string, unknown>)?.roomId === room.id
                );

                const roomImage = roomMedia?.filePath ?? null;
                const roomDescription = roomContent?.content ?? room.roomType ?? 'No description available.';

                return (
                  <Card key={room.id} className="overflow-hidden">
                    {roomImage && (
                      <figure className="relative h-48 w-full overflow-hidden bg-base-200">
                        <img
                          src={roomImage}
                          alt={`${room.roomType} - Room ${room.roomNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </figure>
                    )}
                    <CardHeader>
                      <CardTitle>{room.roomType} - Room {room.roomNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {roomDescription && (
                        <p className="text-sm text-base-content/70 mb-3 line-clamp-3">{roomDescription}</p>
                      )}
                      <p className="text-sm font-medium mb-4">Max Occupancy: {room.maxOccupancy}</p>
                      <div className="mt-4">
                        <Link href={`/public-properties/${property.slug}/book?roomId=${room.id}`}>
                          <Button variant="default" size="default" className="w-full min-h-[44px]">
                            Book Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

        {property.type === 'RESTAURANT' && (
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-6">Our Menu</h2>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body text-center py-12">
                <p className="text-base-content/70 text-lg mb-6">Explore our full menu and place your order.</p>
                <Link href={`/public-properties/${slug}/menu`}>
                  <Button variant="default" size="lg" className="min-h-[48px]">
                    View Full Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sofia Chat Widget */}
      <PublicSofiaChat propertySlug={slug} />
    </>
  );
}