import { db, guestProfiles as guestProfilesSchema, guestReviews as guestReviewsSchema } from '@/lib/db';
import { GuestProfileData, GuestReviewData } from '@/lib/types/crm';
import { GuestProfile, GuestReview, NewGuestProfile, NewGuestReview } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, desc } from 'drizzle-orm';

export class CustomerService {
  async createGuestProfile(tenantId: string, data: GuestProfileData): Promise<GuestProfile> {
    try {
      const newProfileData: NewGuestProfile = {
        tenantId,
        guestId: data.guestId,
        loyaltyTier: data.loyaltyTier || 'bronze',
        loyaltyPoints: data.loyaltyPoints || 0,
        bookingCount: data.bookingCount || 0,
        averageRating: data.averageRating?.toString(),
        preferredRoomType: data.preferredRoomType,
        dietaryRestrictions: data.dietaryRestrictions || [],
        accessibilityNeeds: data.accessibilityNeeds || [],
        communicationPreferences: data.communicationPreferences || {},
        marketingConsent: data.marketingConsent || false,
      };
      const newProfiles = await db.insert(guestProfilesSchema).values(newProfileData).returning();
      return newProfiles[0];
    } catch (error) {
      return handleServiceError(error, 'Error creating guest profile');
    }
  }

  async getGuestProfile(guestId: string, tenantId: string): Promise<GuestProfile> {
    try {
      const result = await db
        .select()
        .from(guestProfilesSchema)
        .where(and(eq(guestProfilesSchema.guestId, guestId), eq(guestProfilesSchema.tenantId, tenantId)))
        .limit(1);

      if (result.length === 0) {
        throw new AppError(404, 'Guest profile not found');
      }

      return result[0];
    } catch (error) {
      return handleServiceError(error, 'Error fetching guest profile');
    }
  }

  async updateGuestProfile(guestId: string, tenantId: string, data: Partial<GuestProfileData>): Promise<GuestProfile> {
    try {
      const existingProfile = await this.getGuestProfile(guestId, tenantId);

      const updatedProfiles = await db
        .update(guestProfilesSchema)
        .set({
          loyaltyTier: data.loyaltyTier,
          loyaltyPoints: data.loyaltyPoints,
          bookingCount: data.bookingCount,
          averageRating: data.averageRating?.toString(),
          preferredRoomType: data.preferredRoomType,
          dietaryRestrictions: data.dietaryRestrictions,
          accessibilityNeeds: data.accessibilityNeeds,
          communicationPreferences: data.communicationPreferences,
          marketingConsent: data.marketingConsent,
        })
        .where(eq(guestProfilesSchema.id, existingProfile.id))
        .returning();
      
      return updatedProfiles[0];
    } catch (error) {
      return handleServiceError(error, 'Error updating guest profile');
    }
  }

  async createGuestReview(tenantId: string, data: GuestReviewData): Promise<GuestReview> {
    try {
      const newReviewData: NewGuestReview = {
        tenantId,
        bookingId: data.bookingId,
        guestId: data.guestId,
        propertyId: data.propertyId,
        rating: data.rating,
        reviewText: data.reviewText,
        reviewCategory: data.reviewCategory,
        isPublic: data.isPublic || true,
      };
      const newReviews = await db.insert(guestReviewsSchema).values(newReviewData).returning();
      return newReviews[0];
    } catch (error) {
      return handleServiceError(error, 'Error creating guest review');
    }
  }

  async getGuestReviewsByProperty(propertyId: string, tenantId: string): Promise<GuestReview[]> {
    try {
      const reviews = await db
        .select()
        .from(guestReviewsSchema)
        .where(and(eq(guestReviewsSchema.propertyId, propertyId), eq(guestReviewsSchema.tenantId, tenantId)))
        .orderBy(desc(guestReviewsSchema.createdAt));
      return reviews;
    } catch (error) {
      handleServiceError(error, 'Error fetching guest reviews by property');
      return [];
    }
  }

  async getGuestReviewsByGuest(guestId: string, tenantId: string): Promise<GuestReview[]> {
    try {
      const reviews = await db
        .select()
        .from(guestReviewsSchema)
        .where(and(eq(guestReviewsSchema.guestId, guestId), eq(guestReviewsSchema.tenantId, tenantId)))
        .orderBy(desc(guestReviewsSchema.createdAt));
      return reviews;
    } catch (error) {
      handleServiceError(error, 'Error fetching guest reviews by guest');
      return [];
    }
  }

  /** 100 points = NAD 50 folio discount (Playing to Win / ops brief). */
  async redeemLoyaltyPoints(
    guestId: string,
    tenantId: string,
    pointsToRedeem: number
  ): Promise<{ pointsRedeemed: number; discountAmount: number; remainingPoints: number }> {
    if (pointsToRedeem < 100) {
      throw new AppError(400, 'Minimum redemption is 100 points');
    }

    const profile = await this.getGuestProfile(guestId, tenantId);
    const available = profile.loyaltyPoints ?? 0;
    if (pointsToRedeem > available) {
      throw new AppError(400, 'Insufficient loyalty points');
    }

    const discountAmount = Math.round((pointsToRedeem / 100) * 50 * 100) / 100;
    const remainingPoints = available - pointsToRedeem;

    await db
      .update(guestProfilesSchema)
      .set({
        loyaltyPoints: remainingPoints,
        updatedAt: new Date(),
      })
      .where(eq(guestProfilesSchema.id, profile.id));

    return { pointsRedeemed: pointsToRedeem, discountAmount, remainingPoints };
  }

  async getAllGuestReviews(tenantId: string): Promise<GuestReview[]> {
    try {
      const reviews = await db
        .select()
        .from(guestReviewsSchema)
        .where(eq(guestReviewsSchema.tenantId, tenantId))
        .orderBy(desc(guestReviewsSchema.createdAt));
      return reviews;
    } catch (error) {
      handleServiceError(error, 'Error fetching all guest reviews');
      return [];
    }
  }
}
