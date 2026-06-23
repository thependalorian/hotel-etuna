'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface LoyaltyRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStayId: string | null;
  loyaltyPointsBalance: number;
}

export function LoyaltyRedeemModal({ isOpen, onClose, activeStayId, loyaltyPointsBalance }: LoyaltyRedeemModalProps) {
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const conversionRate = 0.5; // Example: 1 point = N$0.50
  const equivalentNaira = pointsToRedeem * conversionRate;

  const handleRedeem = async () => {
    if (!activeStayId) {
      setError('No active stay selected for redemption.');
      return;
    }
    if (pointsToRedeem <= 0 || pointsToRedeem > loyaltyPointsBalance) {
      setError('Please enter a valid amount of points to redeem.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guest/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: activeStayId, points: pointsToRedeem }),
      });

      if (res.ok) {
        router.refresh(); // Refresh page to show updated balance
        onClose();
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Failed to redeem points.');
      }
    } catch {
      // Reason: surfaced to the guest via setError; no console noise in production.
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Redeem Loyalty Points</ModalTitle>
        </ModalHeader>
        <div className="p-4">
          <p className="mb-4">Your current loyalty balance: <strong>{loyaltyPointsBalance} points</strong></p>
          <p className="mb-4">Enter points to redeem for your active stay (ID: {activeStayId || 'N/A'}):</p>
          <input
            type="number"
            className="input input-bordered w-full mb-4"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(Math.max(0, Math.min(parseInt(e.target.value) || 0, loyaltyPointsBalance)))}
            min="0"
            max={loyaltyPointsBalance}
            placeholder="Points to redeem"
          />
          {pointsToRedeem > 0 && (
            <p className="mb-4 text-sm text-info">
              Equivalent value: N${equivalentNaira.toFixed(2)}
            </p>
          )}
          {error && <p className="text-error mb-4">{error}</p>}
        </div>
        <ModalFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleRedeem} disabled={isSubmitting || pointsToRedeem <= 0}>
            {isSubmitting ? 'Redeeming...' : 'Redeem Points'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
