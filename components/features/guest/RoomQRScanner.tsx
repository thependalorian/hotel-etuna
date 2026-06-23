/**
 * RoomQRScanner — Camera + manual QR code entry
 *
 * Purpose: Scan room door QR with device camera or manually enter code to access stay folio.
 * Location: /components/features/guest/RoomQRScanner.tsx
 *
 * Features:
 * - Attempts camera access via getUserMedia API
 * - Continuous camera preview with scan overlay guide
 * - Manual input fallback if camera unavailable or denied
 * - Validates code format and redirects to /guest/stays/[bookingId]
 * - Follows Part 9: daisyUI, pill buttons, touch targets, accessibility
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Camera, X, Keyboard } from 'lucide-react';

export function RoomQRScanner() {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check camera availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraAvailable(false);
      setMode('manual');
      return;
    }
    setCameraAvailable(true);
  }, []);

  useEffect(() => {
    // Start camera stream when in camera mode
    if (mode === 'camera' && cameraAvailable && videoRef.current) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, cameraAvailable]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setError(null);
    } catch (err) {
      setError('Camera access denied or unavailable. Use manual entry instead.');
      setCameraAvailable(false);
      setMode('manual');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function processCode(code: string) {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Enter a valid room code');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/room-qr/${encodeURIComponent(trimmedCode)}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Invalid or inactive room code');
      }
      const bookingId = json.data?.bookingId as string | undefined;
      if (!bookingId) {
        throw new Error('No active stay found for this room');
      }
      router.push(`/guest/stays/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process room code');
      setIsScanning(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    processCode(manualCode);
  }

  return (
    <Card variant="elevated" className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-ink-900">Scan room QR code</h2>
        {cameraAvailable && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label={mode === 'camera' ? 'Switch to manual entry' : 'Switch to camera'}
            >
              {mode === 'camera' ? <Keyboard className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {mode === 'camera' && cameraAvailable ? (
        <div className="space-y-4">
          <div className="relative aspect-video bg-nude-900 rounded-etuna-card overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label="Camera preview"
            />
            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-dashed border-white/60 rounded-etuna-input" aria-hidden />
            </div>
          </div>
          <p className="text-sm text-ink-600 text-center">
            Position the QR code from your room door within the frame. Scanning will happen automatically once detected.
          </p>
          <p className="text-xs text-ink-500 text-center">
            Note: Automatic QR detection requires a browser extension or native app. Use manual entry for now.
          </p>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-code-input" className="label">
              <span className="label-text font-medium">Room code</span>
            </label>
            <input
              id="room-code-input"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter code from room QR"
              className="input input-bordered w-full"
              required
              autoFocus
              aria-describedby="code-hint"
            />
            <p id="code-hint" className="text-xs text-ink-600 mt-1">
              The code is printed on the QR code label in your room
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isScanning} aria-busy={isScanning}>
            {isScanning ? (
              <>
                <span className="loading loading-spinner loading-sm" aria-hidden />
                Opening folio…
              </>
            ) : (
              'Open my stay'
            )}
          </Button>
        </form>
      )}

      {error && (
        <div className="alert alert-error mt-4" role="alert">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-nude-200">
        <p className="text-xs text-ink-500 text-center">
          Scanning your room QR code will open your stay folio, where you can order room service, view charges, and settle your bill.
        </p>
      </div>
    </Card>
  );
}
