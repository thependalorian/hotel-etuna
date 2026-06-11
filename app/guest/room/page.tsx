import { RoomQRScanner } from '@/components/features/guest/RoomQRScanner';

export const metadata = {
  title: 'Scan Room QR | Hotel Etuna',
  description: 'Scan your room QR code to access your stay folio and order room service.',
};

export default function GuestRoomQrPage() {
  return (
    <div className="min-h-screen py-8 px-4">
      <RoomQRScanner />
    </div>
  );
}