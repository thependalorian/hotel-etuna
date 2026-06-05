'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/Form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Property name must be at least 3 characters.' }),
  type: z.enum(['HOTEL', 'RESTAURANT', 'AIRBNB', 'LODGE', 'BOTH']),
  description: z.string().optional(),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
});

export function CreatePropertyForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'HOTEL',
      description: '',
      address: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      // Convert type to lowercase for API validation
      const payload = {
        name: values.name.trim(),
        type: values.type.toLowerCase() as 'hotel' | 'restaurant' | 'airbnb' | 'lodge' | 'both',
        description: values.description?.trim() || undefined,
        address: values.address.trim(),
      };

      securityLogger.info('Sending property creation request', { propertyName: payload.name, propertyType: payload.type });

      const response = await fetch(apiUrl('/api/properties'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        securityLogger.error('Property creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        
        // Handle API error response format: { error: { message, code, details } }
        const errorMessage = errorData?.error?.message || 
                           errorData?.message || 
                           `Failed to create property (${response.status})`;
        
        // Include validation errors if available
        const validationErrors = errorData?.error?.details;
        if (validationErrors) {
          const errorDetails = Object.entries(validationErrors)
            .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          setError(`${errorMessage}. ${errorDetails}`);
        } else {
          setError(errorMessage);
        }
        return;
      }

      const responseData = await response.json();
      const newProperty = responseData?.data || responseData;
      
      // Redirect to the new property's dashboard page
      if (newProperty?.id) {
        router.push(`/properties/${newProperty.id}`);
      } else {
        router.push('/properties');
      }

    } catch (err) {
      securityLogger.error('Property creation error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create a new property</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="alert alert-error animate-slide-down">
                <span className="font-medium">{error}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Grand Namibian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <FormControl>
                    <select {...field} className="select select-bordered w-full">
                      <option value="HOTEL">Hotel</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="AIRBNB">AirBnB</option>
                      <option value="LODGE">Lodge</option>
                      <option value="BOTH">Both (Hotel & Restaurant)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Independence Ave, Windhoek" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <textarea {...field} className="textarea textarea-bordered w-full" placeholder="A short description of your property..."></textarea>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
