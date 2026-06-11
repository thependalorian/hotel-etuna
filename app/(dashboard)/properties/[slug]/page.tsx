import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { RoomService } from '@/lib/services/room/RoomService';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { RoomManagement } from '@/components/features/property/RoomManagement';
import { BookingList } from '@/components/features/booking/BookingList';
import { UpdatePropertyForm } from '@/components/features/property/UpdatePropertyForm';
import { db, cmsContent, cmsMedia, eq, and, desc, asc } from '@/lib/db';
import Link from 'next/link';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface PropertyDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const session = await getSessionWithTenantContext();

  if (!session || !session.user) {
    notFound();
  }

  const { slug } = await params;
  const propertyService = new PropertyService();
  // For dashboard, slug is actually the property ID
  if (!slug || !session.user.tenantId) {
    notFound();
  }
  const property = await propertyService.getPropertyById(slug, session.user.tenantId);

  if (!property) {
    notFound();
  }

  const roomService = new RoomService();
  const initialRooms = await roomService.getRoomsForProperty(property.id);

  // Fetch CMS data for this property
  const [cmsContentRows, cmsMediaRows] = await Promise.all([
    db
      .select()
      .from(cmsContent)
      .where(and(eq(cmsContent.tenantId, session.user.tenantId), eq(cmsContent.propertyId, property.id)))
      .orderBy(desc(cmsContent.updatedAt))
      .limit(5),
    db
      .select()
      .from(cmsMedia)
      .where(
        and(
          eq(cmsMedia.tenantId, session.user.tenantId),
          eq(cmsMedia.propertyId, property.id),
          eq(cmsMedia.fileType, 'image')
        )
      )
      .orderBy(asc(cmsMedia.displayOrder))
      .limit(6),
  ]);

  const tabs = [
    {
      label: 'Rooms',
      content: <RoomManagement propertyId={property.id} initialRooms={initialRooms} />,
    },
    {
      label: 'Bookings',
      content: <BookingList propertyId={property.id} tenantId={session.user.tenantId} />,
    },
    {
      label: 'Content & Media',
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Content & Media Management</h3>
            <Link href="/cms" className="btn btn-primary">
              <FileText className="w-4 h-4 mr-2" />
              Manage in CMS
            </Link>
          </div>
          
          {/* Property Images Gallery */}
          {cmsMediaRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Property Images ({cmsMediaRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cmsMediaRows.map((media) => (
                    <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-base-200">
                      <img
                        src={media.filePath ?? ''}
                        alt={media.altText ?? media.fileName ?? 'Property image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CMS Content List */}
          {cmsContentRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Content Items ({cmsContentRows.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cmsContentRows.map((content) => (
                    <div key={content.id} className="p-4 bg-base-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{content.title}</h4>
                          <p className="text-sm text-base-content/70 mt-1">
                            Type: {content.contentType ?? ''}
                          </p>
                          <p className="text-sm text-base-content/70">
                            Status: <span className={`badge badge-sm ${content.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                              {content.status ?? 'draft'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cmsContentRows.length === 0 && cmsMediaRows.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-base-content/70 mb-4">No content or media found for this property.</p>
                <Link href="/cms" className="btn btn-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Content & Media
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      label: 'Settings',
      content: <UpdatePropertyForm property={property} />,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="etuna-page-title">{property.name}</h1>
        <p className="etuna-page-desc mt-2 text-lg">{property.address}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Type:</strong> {property.type}</p>
          <p><strong>Description:</strong> {property.description || 'N/A'}</p>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
