import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Hotel Etuna account.',
};

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin } from 'lucide-react';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { authCopy } from '@/lib/copy/auth';

const LoginPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string; redirect?: string }>;
}) => {
  const sp = (await searchParams) ?? {};
  const reason = sp.reason;
  const redirect = sp.redirect;
  const sessionMessage =
    reason === 'inactivity'
      ? authCopy.login.sessionInactivity
      : reason === 'expired'
        ? authCopy.login.sessionExpired
        : null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-nude-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <HotelEtunaLogo size="lg" href="/" showTagline />
        </div>

        <Card variant="elevated">
          <CardHeader className="text-center">
            <CardTitle>{authCopy.login.title}</CardTitle>
            <CardDescription>{authCopy.login.description}</CardDescription>
            {sessionMessage ? (
              <div className="mt-3 rounded-etuna-button border border-nude-200 bg-nude-100 p-3 text-sm text-ci-secondary-chocolate">
                {sessionMessage}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirect} />
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-ink-600">
          <p>
            {authCopy.login.noAccount}{' '}
            <Link
              href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
              className="font-semibold text-ink-700 hover:underline"
            >
              {authCopy.login.createAccount}
            </Link>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-ink-600">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <ShieldCheck className="w-4 h-4" />
            <span>{authCopy.login.trust[0].label}</span>
          </div>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <MapPin className="w-4 h-4" />
            <span className="text-right">{authCopy.login.trust[1].label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
