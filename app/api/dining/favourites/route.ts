/**
 * Dining favourites — optional-auth public endpoint.
 * Unauthenticated callers receive `{ items: [] }` (not 401).
 * Uses getAuthenticatedUser instead of withPlatformApiAuth to preserve that contract.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { getCachedPopularMenuItemIds } from '@/lib/services/menu/MenuPopularityService';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  try {
    const { hubTenant, property } = await resolvePublicHubProperty();
    const popularIds = await getCachedPopularMenuItemIds(
      hubTenant.id,
      property.id,
      undefined
    );
    return NextResponse.json({ items: popularIds });
  } catch (error) {
    securityLogger.error('Failed to fetch popular menu items:', error);
    return NextResponse.json({ message: 'Failed to fetch popular menu items' }, { status: 500 });
  }
}
