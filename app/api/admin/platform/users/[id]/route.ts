/**
 * Platform User API Route (Dynamic)
 * 
 * Purpose: API endpoint for individual user operations
 * Location: app/api/admin/platform/users/[id]/route.ts
 * 
 * Features:
 * - PATCH: Update user status
 * - DELETE: Delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isSuperAdmin } from '@/lib/auth/platform-admin';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentPlatformAdmin();
    
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, role } = body;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        status: status || existingUser.status,
        role: role || existingUser.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    securityLogger.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentPlatformAdmin();
    
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await db
      .delete(users)
      .where(eq(users.id, id));

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    securityLogger.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
