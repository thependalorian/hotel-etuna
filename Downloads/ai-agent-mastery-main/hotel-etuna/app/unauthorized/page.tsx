'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

/**
 * Unauthorized Access Page
 * 
 * Purpose: Display unauthorized access message and provide navigation options
 * Location: /app/unauthorized/page.tsx
 * 
 * Shown when:
 * - User doesn't have required role for a route
 * - User tries to access admin-only features
 * - Access control middleware redirects here
 */

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You don't have permission to access this resource.
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/properties')}
              className="w-full"
              variant="default"
            >
              Go to Properties
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
            <Button
              onClick={() => router.back()}
              className="w-full"
              variant="ghost"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
