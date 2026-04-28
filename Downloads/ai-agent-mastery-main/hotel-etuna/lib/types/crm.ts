export interface GuestProfileData {
  guestId: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  bookingCount?: number;
  averageRating?: number;
  preferredRoomType?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  communicationPreferences?: Record<string, unknown>;
  marketingConsent?: boolean;
}

export interface GuestReviewData {
  bookingId: string;
  guestId: string;
  propertyId: string;
  rating: number;
  reviewText?: string;
  reviewCategory?: string;
  isPublic?: boolean;
}
