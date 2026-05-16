/**
 * Auth surfaces — guest stay vs hotel team sign-in.
 * Location: lib/copy/auth.ts
 */

import { brand } from '@/lib/copy/brand';

export const authCopy = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to manage your stay, bookings, and guest account at Hotel Etuna.',
    sessionInactivity: 'You were signed out due to inactivity. Please sign in again.',
    sessionExpired: 'Your session expired. Please sign in again.',
    noAccount: "Don't have an account?",
    createAccount: 'Create a guest account',
    trust: [
      { label: 'Secure sign-in' },
      { label: brand.proofPoints.checkIn },
    ],
  },
  register: {
    title: 'Create your account',
    subtitle: 'Book stays, view your folio, and manage reservations at Hotel Etuna.',
    hint: 'Use the email on your reservation so we can link your stay.',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in here',
  },
} as const;
