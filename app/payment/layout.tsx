/**
 * Payment route layout — shared chrome for deposit and outcome pages.
 * Location: app/payment/layout.tsx
 */

import { PaymentChrome } from '@/components/payments/PaymentChrome';

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return <PaymentChrome>{children}</PaymentChrome>;
}
