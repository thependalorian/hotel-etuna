'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/Form';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'An error occurred during registration.');
        return;
      }

      const data = await response.json();
      
      // If verification is required, redirect to verification page
      if (data.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      } else {
        // Fallback: auto-login if verification not required
        const loginResponse = await fetch(apiUrl('/api/auth/callback/credentials'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            redirect: false,
          }),
        });

        if (loginResponse.ok) {
          router.push('/properties');
        } else {
          router.push('/login?registered=true');
        }
      }

    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert (Von Restorff - standout) */}
        {error && (
          <div className="alert alert-error animate-slide-down shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="John Doe" 
                  autoComplete="name"
                  {...field} 
                />
              </FormControl>
              <FormDescription>Enter your full name as it appears on official documents</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="your@email.com" 
                  autoComplete="email"
                  {...field} 
                />
              </FormControl>
              <FormDescription>We'll never share your email with anyone</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Create a strong password" 
                  autoComplete="new-password"
                  {...field} 
                />
              </FormControl>
              <FormDescription>Minimum 6 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* CTA Button (Von Restorff - standout, Fitt's Law - proper sizing) */}
        <Button 
          type="submit" 
          variant="primary"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="w-full min-h-[56px] text-lg font-semibold shadow-nude-primary hover:shadow-nude-strong"
        >
          {form.formState.isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              Creating Account...
            </>
          ) : (
            'Create Free Account'
          )}
        </Button>
      </form>
    </Form>
  );
}