import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { db, users, tenants, properties } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { isGuestConsumerRole } from '@/lib/auth/roles';
import { normalizeAccountEmail } from '@/lib/services/booking/linkGuestAccount';
import { devError, devLog } from '@/lib/utils/dev-log';

function isBuffrPlatformOperator(
  email: string,
  role: string | null | undefined,
  isPlatformAdminFlag: boolean | null | undefined,
): boolean {
  if (isPlatformAdminFlag) return true;
  if (!email.endsWith('@buffr.ai')) return false;
  const r = role ?? '';
  return r === 'admin' || r === 'super-admin';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          devError('[AUTH] Missing credentials');
          return null;
        }

        const email = normalizeAccountEmail(credentials.email);

        try {
          const rows = await db
            .select({
              user: users,
              tenant: tenants,
            })
            .from(users)
            .leftJoin(tenants, eq(users.tenantId, tenants.id))
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);

          const row = rows[0];
          const user = row?.user;

          if (!user) {
            devError('[AUTH] User not found');
            return null;
          }

          const tenant = row?.tenant ?? null;

          const isPlatformOperator = isBuffrPlatformOperator(
            user.email,
            user.role,
            user.isPlatformAdmin,
          );

          const isGuestConsumer = isGuestConsumerRole(user.role);

          if (!tenant && !isPlatformOperator && !isGuestConsumer) {
            devError('[AUTH] User has no tenant');
            return null;
          }

          const passwordMatch = await bcryptjs.compare(
            credentials.password,
            user.passwordHash
          );

          if (!passwordMatch) {
            devError('[AUTH] Password mismatch');
            return null;
          }

          if (!user.emailVerified && user.emailVerificationOtp) {
            devError('[AUTH] Email not verified');
            return null;
          }

          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));
          if (!user.emailVerified && !user.emailVerificationOtp) {
            await db
              .update(users)
              .set({ emailVerified: true })
              .where(eq(users.id, user.id));
          }

          let propertyId: string | undefined = undefined;
          if (user.tenantId && !isGuestConsumer) {
            if (user.role === 'owner') {
              const propRows = await db
                .select({ id: properties.id })
                .from(properties)
                .where(
                  and(
                    eq(properties.ownerId, user.id),
                    eq(properties.tenantId, user.tenantId)
                  )
                )
                .limit(1);
              propertyId = propRows[0]?.id ?? undefined;
            } else if (isPlatformOperator) {
              const propRows = await db
                .select({ id: properties.id })
                .from(properties)
                .where(eq(properties.tenantId, user.tenantId))
                .limit(1);
              propertyId = propRows[0]?.id ?? undefined;
            }
          }

          const authUser = {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            role: user.role ?? 'user',
            tenantId: user.tenantId ?? '',
            propertyId,
          };

          devLog('[AUTH] Authentication successful', { role: authUser.role });
          return authUser;
        } catch (error: unknown) {
          devError('[AUTH] Authentication error', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours absolute max
    updateAge: 30 * 60, // refresh every 30 minutes while active
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.propertyId = user.propertyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.propertyId = token.propertyId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
