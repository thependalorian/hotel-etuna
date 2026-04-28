import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/Form';
import { apiUrl } from '@/lib/utils/api-url';

const formSchema = z.object({
  room_number: z.string().min(1, { message: 'Room number is required.' }),
  room_type: z.string().min(3, { message: 'Room type is required.' }),
  max_occupancy: z.number().min(1, { message: 'Max occupancy must be at least 1.' }),
});

interface CreateRoomFormProps {
  propertyId: string;
  onRoomCreated: () => void;
}

export function CreateRoomForm({ propertyId, onRoomCreated }: CreateRoomFormProps) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_number: '',
      room_type: '',
      max_occupancy: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/properties/${propertyId}/rooms`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'An error occurred while creating the room.');
        return;
      }

      // Reset the form and notify the parent component
      form.reset();
      onRoomCreated();
      
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-medium">Add a New Room</h3>
        {error && (
          <div className="alert alert-error animate-slide-down">
            <span>{error}</span>
          </div>
        )}
        <FormField
          control={form.control}
          name="room_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="room_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Deluxe Queen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="max_occupancy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Occupancy</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding Room...' : 'Add Room'}
        </Button>
      </form>
    </Form>
  );
}
