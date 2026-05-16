/**
 * GuestRoomQrClient
 *
 * Purpose: Client handler for in-room QR redirect to stay folio.
 * Location: /app/guest/room/GuestRoomQrClient.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function GuestRoomQrClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code')?.trim() ?? '';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(code));

  useEffect(() => {
    if (!code) {
      setError('Missing room code. Scan the QR code in your room.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/public/room-qr/${encodeURIComponent(code)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Invalid or inactive room code');
        }
        const bookingId = json.data?.bookingId as string | undefined;
        if (!bookingId) {
          throw new Error('No active stay for this room');
        }
        if (!cancelled) {
          router.replace(`/guest/stays/${bookingId}`);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not open room service');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (loading) {
    return (
      <Card variant="elevated" className="p-8 text-center">
        <div className="skeleton h-8 w-48 mx-auto mb-4 rounded" aria-hidden />
        <p className="text-nude-600">Opening your stay folio…</p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-8 text-center">
      <h1 className="font-display text-xl font-bold text-nude-900 mb-2">Room service</h1>
      <p className="text-error mb-6">{error ?? 'Something went wrong.'}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/login?redirect=${encodeURIComponent(`/guest/room?code=${code}`)}`}>
          <Button>Sign in</Button>
        </Link>
        <Link href="/guest">
          <Button variant="outline">My stays</Button>
        </Link>
      </div>
    </Card>
  );
}
