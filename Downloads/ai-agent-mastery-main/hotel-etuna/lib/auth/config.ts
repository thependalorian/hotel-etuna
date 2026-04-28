import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { db, users, tenants, properties } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('[AUTH] Authorize called for email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.error('[AUTH] Missing credentials');
          return null;
        }

        try {
          console.log('[AUTH] Step 1: Finding user...');
          const rows = await db
            .select({
              user: users,
              tenant: tenants,
            })
            .from(users)
            .leftJoin(tenants, eq(users.tenantId, tenants.id))
            .where(eq(users.email, credentials.email))
            .limit(1);

          const row = rows[0];
          const user = row?.user;

          if (!user) {
            console.error('[AUTH] User not found for email:', credentials.email);
            return null;
          }

          const tenant = row?.tenant ?? null;

          console.log('[AUTH] Step 2: User found:', {
            id: user.id,
            email: user.email,
            hasTenant: !!tenant,
            tenantId: user.tenantId,
          });

          if (!tenant) {
            console.error('[AUTH] User has no tenant:', user.id);
            return null;
          }

          console.log('[AUTH] Step 3: Comparing password...');
          const passwordMatch = await bcryptjs.compare(
            credentials.password,
            user.passwordHash
          );

          if (!passwordMatch) {
            console.error('[AUTH] Password mismatch for email:', credentials.email);
            return null;
          }

          console.log('[AUTH] Step 4: Password matched!');

          console.log('[AUTH] Step 5: Updating last login timestamp...');
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));
          console.log('[AUTH] Last login timestamp updated');

          if (!user.emailVerified && !user.emailVerificationOtp) {
            console.log('[AUTH] Step 6: Auto-verifying old account...');
            await db
              .update(users)
              .set({ emailVerified: true })
              .where(eq(users.id, user.id));
            console.log('[AUTH] Old account verified');
          }

          let propertyId: string | undefined = undefined;
          if (user.role === 'owner' && user.tenantId) {
            console.log('[AUTH] Step 7: Finding property for owner...');
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
            console.log('[AUTH] Property found:', !!propRows[0]);
          }

          const authUser = {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            role: user.role ?? 'user',
            tenantId: user.tenantId ?? '',
            propertyId,
          };

          console.log('[AUTH] ✅ Authentication successful! Returning user:', {
            id: authUser.id,
            email: authUser.email,
            role: authUser.role,
          });

          return authUser;
        } catch (error: unknown) {
          const err = error as Error;
          console.error('[AUTH] ❌ Authentication error:', error);
          console.error('[AUTH] Error details:', {
            message: err?.message,
            stack: err?.stack,
            email: credentials?.email,
            name: err?.name,
          });
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
        console.log('[AUTH] JWT callback - adding user to token:', {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.propertyId = user.propertyId;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[AUTH] Session callback - creating session:', {
        hasToken: !!token,
        tokenId: token?.id,
        tokenEmail: token?.email,
      });
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
