'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 lg:px-8 bg-gradient-to-br from-base-200 via-base-100 to-base-200">
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">Invalid Reset Link</h3>
              <div className="text-sm">This password reset link is invalid or has expired. Please request a new one.</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link 
              href="/forgot-password" 
              className="text-primary hover:text-primary-focus font-medium"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 lg:px-8 bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        {/* Logo/Brand (Halo Effect - Beauty = Trust) */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl font-bold text-white">H</span>
            </div>
          </div>
        </div>

        <h2 className="text-center text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight text-base-content mb-3">
          Reset Password
        </h2>
        <p className="text-center text-base md:text-lg text-base-content/70 leading-relaxed mb-8">
          Enter your new password below.
        </p>

        {success ? (
          <div className="alert alert-success shadow-lg animate-slide-down">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">Password Reset Successful!</h3>
              <div className="text-sm">Your password has been updated. Redirecting to login...</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="alert alert-error shadow-md animate-slide-down">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content mb-2">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full"
              />
              <p className="mt-1 text-xs text-base-content/60">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-base-content mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !password || !confirmPassword}
              className="w-full min-h-[56px] text-lg font-semibold shadow-nude-primary hover:shadow-nude-strong"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-primary hover:text-primary-focus font-medium transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
