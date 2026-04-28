import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Clock } from 'lucide-react';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-nude-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold font-display text-nude-800">Buffr Host</div>
              <div className="text-xs text-semantic-success font-medium">Free Forever</div>
            </div>
          </Link>
        </div>
        
        <Card variant="elevated">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your hospitality management platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-nude-600">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-nude-700 hover:underline">
              Create one for free
            </Link>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-nude-600">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4"/>
                <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-end">
                <Clock className="w-4 h-4"/>
                <span>Setup in 5 minutes</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
