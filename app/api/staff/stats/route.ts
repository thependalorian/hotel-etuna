import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request: NextRequest
) {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Mock stats data
    const stats = {
      totalStaff: 2,
      activeStaff: 2,
      departments: 2,
      newHiresThisMonth: 0
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
