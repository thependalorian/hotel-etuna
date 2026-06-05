import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Hotel Etuna guest account.',
};

import React from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { authCopy } from '@/lib/copy/auth';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 lg:px-8 bg-nude-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <HotelEtunaLogo size="lg" href="/" showTagline />
        </div>

        <h2 className="text-center text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight text-terracotta-900 mb-3">
          {authCopy.register.title}
        </h2>
        <p className="text-center text-base md:text-lg text-nude-700 leading-relaxed mb-2">
          {authCopy.register.subtitle}
        </p>
        <p className="text-center text-sm md:text-base text-nude-600">
          {authCopy.register.hint}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" padding="lg">
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm md:text-base text-nude-600">
          {authCopy.register.hasAccount}{' '}
          <Link
            href="/login"
            className="font-semibold text-khaki-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600 rounded-sm"
          >
            {authCopy.register.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
