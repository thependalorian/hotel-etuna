'use client';

import { useState, useEffect } from 'react';
import type { Room } from '@/lib/db/schema';
import { CreateRoomForm } from './CreateRoomForm';
import { Card, CardContent } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui';
import Link from 'next/link';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { apiUrl } from '@/lib/utils/api-url';

interface RoomManagementProps {
  propertyId: string;
  initialRooms: Room[];
}

export function RoomManagement({ propertyId, initialRooms }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [roomMedia, setRoomMedia] = useState<Record<string, string>>({});

  const fetchRooms = async () => {
    const response = await fetch(apiUrl(`/api/rooms?propertyId=${encodeURIComponent(propertyId)}`));
    if (!response.ok) {
      console.error('Error fetching rooms:', response.statusText);
      return;
    }

    const payload = await response.json();
    const updatedRooms = Array.isArray(payload) ? payload : payload.data;
    setRooms(Array.isArray(updatedRooms) ? updatedRooms : []);
  };

  // Fetch room images from CMS
  useEffect(() => {
    const fetchRoomMedia = async () => {
      try {
        const mediaResponse = await fetch(apiUrl(`/api/cms/media?propertyId=${propertyId}&fileType=image`));
        if (mediaResponse.ok) {
          const media = await mediaResponse.json();
          const mediaMap: Record<string, string> = {};
          media.forEach((item: any) => {
            const roomId = item.metadata?.roomId || item.metadata?.room_id;
            if (roomId && !mediaMap[roomId]) {
              mediaMap[roomId] = item.file_path || item.filePath;
            }
          });
          setRoomMedia(mediaMap);
        }
      } catch (error) {
        console.error('Error fetching room media:', error);
      }
    };
    fetchRoomMedia();
  }, [propertyId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Room Management</h2>
        <Link 
          href="/cms" 
          className="btn btn-primary btn-sm min-h-[44px]"
          aria-label="Manage room content and images in CMS"
        >
          <FileText className="w-4 h-4 mr-2" />
          Manage Room Content
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Existing Rooms</h3>
          {rooms.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-base-content/70">No rooms created yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <figure className="relative h-32 w-full overflow-hidden bg-base-200">
                    <ImagePlaceholder
                      src={roomMedia[room.id]}
                      alt={`${room.roomType} - Room ${room.roomNumber}`}
                      fill
                      className="object-cover"
                    />
                  </figure>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{room.roomType} - Room {room.roomNumber}</p>
                        <p className="text-sm text-base-content/70">Max Occupancy: {room.maxOccupancy ?? 0}</p>
                      </div>
                      <Link 
                        href="/cms" 
                        className="btn btn-ghost btn-sm min-h-[44px]"
                        title="Manage room content and images"
                        aria-label={`Manage content and images for ${room.roomType} - Room ${room.roomNumber}`}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <CreateRoomForm propertyId={propertyId} onRoomCreated={fetchRooms} />
        </div>
      </div>
    </div>
  );
}
