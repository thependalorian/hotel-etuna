import type {
  GuestPreArrivalDto,
  GuestServiceRequestDto,
} from '@/lib/services/guest/guest-portal-types';

export type BookingChargeType = 'room' | 'fnb' | 'tax' | 'adjustment' | 'payment';

export type BookingChargeStatus = 'open' | 'settled' | 'refunded';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type FolioLineItem = {
  id: string;
  chargeType: BookingChargeType;
  description: string;
  amount: number;
  currency: string;
  status: BookingChargeStatus;
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
  bookingStatus: BookingStatus | string;
  roomPaymentStatus: string | null;
  billingParty?: string | null;
  corporateBillToName?: string | null;
  purchaseOrderRef?: string | null;
  propertyId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
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

export type GuestPastStaySummary = {
  bookingId: string;
  bookingReference: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  propertyId: string;
  propertyName: string;
  propertySlug: string | null;
  roomNumbers: string[];
  currency: string;
};

export type GuestLoyaltyHubSummary = {
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier | string;
  profileCount: number;
};

/** Discriminated access shapes from GuestStayService.findGuestBookingAccess */
export type GuestBookingAccess =
  | GuestStaySummary
  | GuestPaymentDueSummary
  | GuestPastStaySummary;

export type GuestStaysHubPayload = {
  activeStays: GuestStaySummary[];
  paymentDue: GuestPaymentDueSummary[];
  pastStays: GuestPastStaySummary[];
  loyalty: GuestLoyaltyHubSummary | null;
};

export type GuestPostStayMeta = {
  isPastStay: boolean;
  invoiceAvailable: boolean;
  invoiceDownloadPath: string | null;
  rebookUrl: string | null;
  reviewUrl: string;
};

export type GuestStayMenuItem = {
  id: string;
  name: string;
  price: string;
  currency?: string;
  description: string | null;
  isAvailable: boolean;
};

export type GuestStayMenuPayload = {
  restaurant: { name: string };
  categories: Array<{ id: string; name: string }>;
  itemsByCategory: Record<string, GuestStayMenuItem[]>;
};

export type GuestStayHubPayload = {
  booking: GuestBookingAccess;
  folio: FolioSummary;
  preArrival: GuestPreArrivalDto | null;
  serviceRequests: GuestServiceRequestDto[];
  openServiceRequests: GuestServiceRequestDto[];
  loyalty: GuestLoyaltyHubSummary | null;
  menu: GuestStayMenuPayload | null;
  postStay: GuestPostStayMeta;
};

export type RoomServiceOrderItemInput = {
  menuItemId: string;
  quantity: number;
  customizations?: Record<string, unknown>;
  specialInstructions?: string;
};
