/**
 * Settings API Route
 *
 * Purpose: Fetch and update user/tenant settings
 * Location: /app/api/settings/route.ts
 *
 * GET: Fetch current settings
 * POST: Update settings
 */

import { NextResponse, NextRequest } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { db, tenants, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  siteName: z.string().optional(),
  siteEmail: z.string().email().optional(),
  defaultLanguage: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  bookingNotifications: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.number().optional(),
  passwordExpiry: z.number().optional(),
  theme: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  emailWeeklyReport: z.boolean().optional(),
});

function parseNotificationPrefs(raw: unknown): { emailWeeklyReport: boolean } {
  if (!raw || typeof raw !== 'object') {
    return { emailWeeklyReport: false };
  }
  const prefs = raw as Record<string, unknown>;
  return { emailWeeklyReport: prefs.email_weekly_report === true };
}

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (_req, user) => {
    try {
      const tenantId = user.tenantId as string;

      const [tenantRow] = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      const [userRow] = await db
        .select({ email: users.email, notificationPreferences: users.notificationPreferences })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const notif = parseNotificationPrefs(userRow?.notificationPreferences);

      return NextResponse.json({
        siteName: tenantRow?.name || 'Hotel Etuna',
        siteEmail: userRow?.email || '',
        emailWeeklyReport: notif.emailWeeklyReport,
        defaultLanguage: 'en',
        timezone: 'Africa/Windhoek',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        bookingNotifications: true,
        twoFactorAuth: false,
        sessionTimeout: 24,
        passwordExpiry: 90,
        theme: 'light',
        primaryColor: 'nude',
        accentColor: 'nude',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('Error fetching settings:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const tenantId = user.tenantId as string;
      const body = await req.json();

      const validatedData = settingsSchema.parse(body);

      if (validatedData.siteName) {
        await db.update(tenants).set({ name: validatedData.siteName }).where(eq(tenants.id, tenantId));
      }

      if (validatedData.emailWeeklyReport !== undefined) {
        const [existing] = await db
          .select({ notificationPreferences: users.notificationPreferences })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        const merged = {
          ...(typeof existing?.notificationPreferences === 'object' && existing.notificationPreferences !== null
            ? (existing.notificationPreferences as Record<string, unknown>)
            : {}),
          email_weekly_report: validatedData.emailWeeklyReport,
        };
        await db
          .update(users)
          .set({ notificationPreferences: merged, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      return NextResponse.json({
        message: 'Settings saved successfully',
        ...validatedData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid input', errors: error.issues }, { status: 400 });
      }
      securityLogger.error('Error saving settings:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}
