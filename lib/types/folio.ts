export type BookingChargeType = 'room' | 'fnb' | 'tax' | 'adjustment' | 'payment';

export type FolioLineItem = {
  id: string;
  chargeType: BookingChargeType;
  description: string;
  amount: number;
  currency: string;
  status: string;
  referenceId: string | null;
  createdAt: Date | null;
  settledAt: Date | null;
};

/** VAT on open hospitality lines (Hotel Etuna / property — not Buffr platform fees). */
export type FolioVatSummary = {
  taxableGross: number;
  amountExVat: number;
  vatAmount: number;
  totalInclVat: number;
  vatRatePercent: number;
  pricingMode: 'inclusive' | 'exclusive';
  vatRegistered: boolean;
  supplierLegalName: string;
  supplierCcNumber: string | null;
  supplierVatNumber: string | null;
  currency: string;
};

export type FolioSummary = {
  bookingId: string;
  currency: string;
  lines: FolioLineItem[];
  /** Sum of open room/fnb/tax/adjustment lines */
  openChargesTotal: number;
  /** Sum of settled payment lines (absolute value) */
  settledTotal: number;
  /** openChargesTotal + sum(payment line amounts); zero when paid in full */
  balanceDue: number;
  /** Present when property is VAT-registered and open hospitality charges exist */
  vat?: FolioVatSummary | null;
  folioClosedAt: Date | null;
  bookingStatus: string;
  roomPaymentStatus: string | null;
};

export type GuestStaySummary = {
  bookingId: string;
  bookingReference: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  propertyId: string;
  propertyName: string;
  propertySlug: string | null;
  roomNumbers: string[];
  balanceDue: number;
  currency: string;
  paymentStatus?: string | null;
  totalAmount?: number;
};

/** Confirmed booking with outstanding room deposit (before or during stay window). */
export type GuestPaymentDueSummary = {
  bookingId: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  propertyName: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
};

export type GuestStaysHubPayload = {
  activeStays: GuestStaySummary[];
  paymentDue: GuestPaymentDueSummary[];
};

export type RoomServiceOrderItemInput = {
  menuItemId: string;
  quantity: number;
  customizations?: Record<string, unknown>;
  specialInstructions?: string;
};
