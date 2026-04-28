'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        // Successful login, redirect to dashboard
        router.push('/properties');
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription className="error-message">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email Address"
          placeholder="e.g., your.name@example.com"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.email}
          helperText={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        
        <div>
            <div className="flex items-center justify-between mb-1">
                <label htmlFor="password"
                    className="block text-sm font-medium text-nude-700">
                    Password
                </label>
                <div className="text-sm">
                    <Link href="/forgot-password"
                        className="font-medium text-nude-600 hover:text-nude-700">
                        Forgot password?
                    </Link>
                </div>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled={isLoading}
              aria-invalid={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
              {...form.register("password")}
            />
        </div>
      </div>
      
      <Button 
        type="submit" 
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full"
      >
        Sign In
      </Button>
    </form>
  );
}