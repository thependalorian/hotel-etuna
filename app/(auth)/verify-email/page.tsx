'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      router.replace('/login?verified=true');

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/resend-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to resend verification code.');
        setLoading(false);
        return;
      }

      setError(null);
      alert('Verification code has been resent to your email.');
      setLoading(false);
    } catch {
      setError('Failed to resend verification code. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center px-6 py-12 lg:px-8 bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl font-bold text-white">H</span>
            </div>
          </div>
        </div>
        
        <h2 className="text-center text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight text-base-content mb-3">
          Verify Your Email
        </h2>
        <p className="text-center text-base md:text-lg text-base-content/70 leading-relaxed mb-2">
          We've sent a verification code to
        </p>
        <p className="text-center text-base md:text-lg font-semibold text-primary mb-6">
          {email}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="card bg-base-100 shadow-xl card-hover">
          <div className="card-body p-8 md:p-10">
            {success ? (
              <div className="text-center space-y-4">
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Email verified successfully! Redirecting to login...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                {error && (
                  <div className="alert alert-error animate-slide-down shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-base-content mb-2">
                    Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl font-bold tracking-widest"
                    autoFocus
                    required
                  />
                  <p className="mt-2 text-sm text-base-content/60">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || otp.length !== 6}
                  className="w-full min-h-[56px] text-lg font-semibold"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm md:text-base text-base-content/70">
          <Link 
            href="/login" 
            className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors duration-200"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
};

export default VerifyEmailPage;
