import { NextResponse, NextRequest } from 'next/server';
import { GuestService } from '@/lib/services/booking/GuestService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { CrmConsentService } from '@/lib/services/crm/CrmConsentService';
import { securityLogger } from '@/lib/utils/security-logger.client';

const guestService = new GuestService();
const consentService = new CrmConsentService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const guest = await guestService.getGuestById(id, user.tenantId);
    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }
    return NextResponse.json(guest, { status: 200 });
  } catch (error) {
    securityLogger.error('Error fetching guest:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const currentGuest = await guestService.getGuestById(id, user.tenantId);
    const { marketingConsent, consentReason, consentSource, ...profilePatch } = body;

    let updatedGuest = currentGuest;
    if (Object.keys(profilePatch).length > 0) {
      updatedGuest = await guestService.updateGuest(id, user.tenantId, profilePatch);
    }

    if (
      typeof marketingConsent === 'boolean' &&
      currentGuest.marketingConsent !== marketingConsent
    ) {
      const event = await consentService.recordConsentChange({
        tenantId: user.tenantId,
        guestId: id,
        previousMarketingConsent: currentGuest.marketingConsent === true,
        newMarketingConsent: marketingConsent,
        source: typeof consentSource === 'string' ? consentSource : 'guest_profile_update',
        reason: typeof consentReason === 'string' ? consentReason : null,
        changedByUserId: user.id,
        metadata: { route: '/api/crm/guests/[id]' },
      });

      await recordAuditTrail({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'crm.guest.marketing_consent_changed',
        resourceType: 'guest',
        resourceId: id,
        oldValues: { marketingConsent: event.previousMarketingConsent },
        newValues: {
          marketingConsent: event.newMarketingConsent,
          consentEventId: event.id,
          source: event.source,
        },
        request,
      });

      updatedGuest = await guestService.getGuestById(id, user.tenantId);
    }

    if (!updatedGuest) {
      return NextResponse.json({ message: 'Guest not found or update failed' }, { status: 404 });
    }
    return NextResponse.json(updatedGuest, { status: 200 });
  } catch (error) {
    securityLogger.error('Error updating guest:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
