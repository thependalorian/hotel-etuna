/**
 * GuestFolioPanel
 *
 * Purpose: In-stay folio, room service ordering, cash/card settlement, loyalty redeem.
 * Location: /components/features/guest/GuestFolioPanel.tsx
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { BookingDepositPayCard } from '@/components/payments/BookingDepositPayCard';
import { FolioVatBreakdown } from '@/components/features/folio/FolioVatBreakdown';
import type { FolioSummary } from '@/lib/types/folio';
import { guestCopy } from '@/lib/copy/guest';

type MenuItem = {
  id: string;
  name: string;
  price: string | number;
  currency?: string;
  description?: string | null;
  isAvailable?: boolean;
};

type MenuCategory = { id: string; name: string };

type MenuPayload = {
  restaurant: { name: string } | null;
  categories: MenuCategory[];
  itemsByCategory: Record<string, MenuItem[]>;
};

interface GuestFolioPanelProps {
  bookingId: string;
  bookingReference: string;
  bookingStatus: string;
  roomNumbers?: string[];
  /** When set, show Adumo deposit pay before check-in. */
  depositDue?: { amount: number; currency: string };
}

export function GuestFolioPanel({
  bookingId,
  bookingReference,
  bookingStatus,
  roomNumbers = [],
  depositDue,
}: GuestFolioPanelProps) {
  const [folio, setFolio] = useState<FolioSummary | null>(null);
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState('100');
  const [message, setMessage] = useState<string | null>(null);
  const [payWithCard, setPayWithCard] = useState(false);

  const canOrder = bookingStatus === 'checked_in';
  const isPastStay = bookingStatus === 'checked_out';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [folioRes, menuRes] = await Promise.all([
        fetch(`/api/guest/stays/${bookingId}/folio`),
        fetch(`/api/guest/stays/${bookingId}/menu`),
      ]);
      const folioJson = await folioRes.json();
      const menuJson = await menuRes.json();
      if (!folioRes.ok) {
        throw new Error(folioJson?.error?.message || 'Failed to load folio');
      }
      setFolio(folioJson.data);
      if (menuRes.ok) {
        setMenu(menuJson.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stay data');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cartItems = useMemo(() => {
    if (!menu) return [];
    const items: Array<{ menuItemId: string; name: string; quantity: number; unitPrice: number }> = [];
    for (const list of Object.values(menu.itemsByCategory)) {
      for (const item of list) {
        const qty = cart[item.id] ?? 0;
        if (qty > 0) {
          items.push({
            menuItemId: item.id,
            name: item.name,
            quantity: qty,
            unitPrice: Number(item.price),
          });
        }
      }
    }
    return items;
  }, [cart, menu]);

  const cartTotal = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
          })),
          roomNumber: roomNumbers[0],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Order failed');
      setCart({});
      setMessage(json.data?.message || 'Order placed');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setBusy(false);
    }
  };

  const settleCash = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const amountPaid = cashAmount ? Number.parseFloat(cashAmount) : undefined;
      const body = {
        paymentMethod: 'cash' as const,
        amountPaid,
      };
      const res = await fetch(`/api/guest/stays/${bookingId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Settlement failed');
      setMessage(json.data?.message || 'Payment recorded');
      setCashAmount('');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Settlement failed');
    } finally {
      setBusy(false);
    }
  };

  const redeemLoyalty = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/guest/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          pointsToRedeem: Number.parseInt(loyaltyPoints, 10),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Redemption failed');
      setMessage(json.data?.message || 'Points redeemed');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Redemption failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-48 w-full rounded-xl" aria-hidden />;
  }

  if (error) {
    return (
      <Card variant="elevated" className="p-6 text-center">
        <p className="text-semantic-error-dark mb-4">{error}</p>
        <Button onClick={() => void load()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isPastStay && (
        <div
          className="rounded-xl border border-khaki-300 bg-khaki-50 px-4 py-3 text-sm text-nude-800"
          role="status"
        >
          {guestCopy.folio.pastStayBanner}
        </div>
      )}
      <Card variant="elevated" className="p-6">
        <h2 className="font-display text-2xl font-bold text-nude-900 mb-2">
          Stay folio · {bookingReference}
        </h2>
        <p className="text-sm text-nude-600 mb-4">
          Status: <span className="badge badge-outline capitalize">{bookingStatus}</span>
          {roomNumbers.length > 0 && (
            <span className="ml-2">Room {roomNumbers.join(', ')}</span>
          )}
        </p>
        {folio && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-nude-50 p-4 border border-nude-200">
              <p className="text-xs uppercase text-nude-600">Balance due</p>
              <p className="text-2xl font-bold text-nude-900">
                {folio.currency} {folio.balanceDue.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-nude-50 p-4 border border-nude-200">
              <p className="text-xs uppercase text-nude-600">Open charges</p>
              <p className="text-2xl font-bold text-nude-900">
                {folio.currency} {folio.openChargesTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}
        {folio?.vat && <FolioVatBreakdown vat={folio.vat} className="mb-4" />}
        {folio?.lines && folio.lines.length > 0 && (
          <ul className="divide-y divide-nude-200 text-sm">
            {folio.lines.map((line) => (
              <li key={line.id} className="py-2 flex justify-between gap-4">
                <span>
                  {line.description}{' '}
                  <span className="text-nude-500">({line.chargeType})</span>
                </span>
                <span className="font-mono">
                  {line.currency} {line.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {depositDue && bookingStatus !== 'checked_in' && (
        <BookingDepositPayCard
          bookingId={bookingId}
          bookingReference={bookingReference}
          amount={depositDue.amount}
          currency={depositDue.currency}
        />
      )}

      {message && (
        <div className="alert alert-info">
          <span>{message}</span>
        </div>
      )}

      {canOrder && menu && (
        <Card variant="elevated" className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Room service</h3>
          {menu.categories.map((cat) => {
            const items = menu.itemsByCategory[cat.id] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className="mb-6">
                <h4 className="font-semibold text-terracotta-900 mb-2">{cat.name}</h4>
                <ul className="space-y-2">
                  {items
                    .filter((i) => i.isAvailable !== false)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 border border-nude-200 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-nude-600">{item.description}</p>
                          )}
                          <p className="text-sm font-semibold">
                            {item.currency ?? 'NAD'} {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setCart((c) => ({
                                ...c,
                                [item.id]: Math.max(0, (c[item.id] ?? 0) - 1),
                              }))
                            }
                          >
                            −
                          </Button>
                          <span className="w-6 text-center">{cart[item.id] ?? 0}</span>
                          <Button
                            size="sm"
                            onClick={() =>
                              setCart((c) => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }))
                            }
                          >
                            +
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
          <div className="flex justify-between items-center mt-4">
            <p className="font-semibold">Cart: NAD {cartTotal.toFixed(2)}</p>
            <Button disabled={busy || cartItems.length === 0} onClick={() => void placeOrder()}>
              Charge to room
            </Button>
          </div>
        </Card>
      )}

      {canOrder && folio && folio.balanceDue > 0 && !folio.folioClosedAt && (
        <Card variant="elevated" className="p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold">Pay folio</h3>
          <label className="form-control w-full">
            <span className="label-text">Amount (leave empty for full balance)</span>
            <input
              type="number"
              step="0.01"
              className="input input-bordered w-full"
              placeholder={folio.balanceDue.toFixed(2)}
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void settleCash()}>
              Pay cash
            </Button>
            <Button
              disabled={busy || payWithCard}
              variant="outline"
              onClick={() => {
                setPayWithCard(true);
                setMessage(null);
              }}
            >
              Pay card (secure)
            </Button>
          </div>
          {payWithCard && folio && (
            <AdumoVirtualPaymentForm
              bookingId={bookingId}
              amount={
                cashAmount
                  ? Math.min(Number.parseFloat(cashAmount) || folio.balanceDue, folio.balanceDue)
                  : folio.balanceDue
              }
              purpose="folio_settle"
              onError={(err) => {
                setPayWithCard(false);
                setMessage(err);
              }}
            />
          )}
        </Card>
      )}

      {canOrder && (
        <Card variant="elevated" className="p-6">
          <h3 className="font-display text-lg font-semibold mb-2">Loyalty</h3>
          <p className="text-sm text-nude-600 mb-3">
            Redeem points (min 100). 100 points = N$50 off this stay folio.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              className="input input-bordered flex-1"
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(e.target.value)}
            />
            <Button disabled={busy} variant="secondary" onClick={() => void redeemLoyalty()}>
              Redeem
            </Button>
          </div>
        </Card>
      )}

      {!canOrder && !isPastStay && (
        <p className="text-sm text-nude-600">
          Room service and folio payment are available once you are checked in.
        </p>
      )}
    </div>
  );
}
