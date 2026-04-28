'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send password reset email. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=email-sent');
      }, 3000);

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
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
          Forgot Password?
        </h2>
        <p className="text-center text-base md:text-lg text-base-content/70 leading-relaxed mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="alert alert-success shadow-lg animate-slide-down">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">Email Sent!</h3>
              <div className="text-sm">Check your email for password reset instructions. Redirecting to login...</div>
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
              <label htmlFor="email" className="block text-sm font-medium text-base-content mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !email}
              className="w-full min-h-[56px] text-lg font-semibold shadow-nude-primary hover:shadow-nude-strong"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
};

export default ForgotPasswordPage;
