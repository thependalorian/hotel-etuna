import { NextResponse, NextRequest } from 'next/server';
import { CustomerService } from '@/lib/services/crm/CustomerService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { createGuestReviewSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';

const customerService = new CustomerService();

async function getSessionUser(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id || !user.tenantId) {
    throw new AppError(401, 'Unauthorized');
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user.tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const guestId = searchParams.get('guestId');

    let reviews;
    if (propertyId) {
      reviews = await customerService.getGuestReviewsByProperty(propertyId, user.tenantId);
    } else if (guestId) {
      reviews = await customerService.getGuestReviewsByGuest(guestId, user.tenantId);
    } else {
      return NextResponse.json({ message: 'Missing propertyId or guestId parameter' }, { status: 400 });
    }

    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user.tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }
    const body = await request.json();

    const validatedData = createGuestReviewSchema.parse(body);

    const newReview = await customerService.createGuestReview(user.tenantId, validatedData);
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    // Handle Zod validation errors
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as { issues: unknown[] };
      return NextResponse.json({ message: 'Invalid input', errors: zodError.issues }, { status: 400 });
    }
    console.error('Error in CRM reviews route:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}