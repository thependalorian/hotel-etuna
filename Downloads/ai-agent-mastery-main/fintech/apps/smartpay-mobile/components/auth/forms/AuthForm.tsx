/**
 * AuthForm - Form wrapper with validation and submission handling
 * Location: fintech/smartpay/components/auth/forms/AuthForm.tsx
 * Uses Zod for validation
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { z } from 'zod';
import { designSystem } from '@/constants/designSystem';

export interface AuthFormProps<T extends z.ZodType> {
  children: React.ReactNode;
  schema?: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  initialValues?: Partial<z.infer<T>>;
  style?: any;
}

export function AuthForm<T extends z.ZodType>({
  children,
  schema,
  onSubmit,
  initialValues = {},
  style,
}: AuthFormProps<T>) {
  const [values, setValues] = useState<any>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: string, value: any): string | undefined => {
    if (!schema) return undefined;

    try {
      // Validate single field
      const fieldSchema = (schema as any).shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message;
      }
      return 'Validation error';
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate all fields
    if (schema) {
      try {
        schema.parse(values);
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const field = err.path[0] as string;
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }
      }
    }

    // Submit form
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // Handle submission errors
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create form context
  const formContext = {
    values,
    errors,
    isSubmitting,
    setValue,
    validateField,
    handleSubmit,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthFormContext.Provider value={formContext}>
          {children}
        </AuthFormContext.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Create context for form state
export const AuthFormContext = React.createContext<{
  values: any;
  errors: Record<string, string>;
  isSubmitting: boolean;
  setValue: (field: string, value: any) => void;
  validateField: (field: string, value: any) => string | undefined;
  handleSubmit: () => void;
} | null>(null);

// Hook to use form context
export function useAuthForm() {
  const context = React.useContext(AuthFormContext);
  if (!context) {
    throw new Error('useAuthForm must be used within AuthForm');
  }
  return context;
}

const ds = designSystem;
const { spacing } = ds;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { z } from 'zod';
 * import { AuthForm } from '@/components/auth/forms/AuthForm';
 * import { FormField } from '@/components/auth/forms/FormField';
 * import { EmailInput } from '@/components/auth/inputs/EmailInput';
 * import { PasswordInput } from '@/components/auth/inputs/PasswordInput';
 * import { AuthButton } from '@/components/auth/buttons/AuthButton';
 * 
 * const signInSchema = z.object({
 *   email: z.string().email('Please enter a valid email'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 * });
 * 
 * function SignInScreen() {
 *   const router = useRouter();
 *   const { signIn } = useSignIn();
 *   
 *   const handleSubmit = async (data: z.infer<typeof signInSchema>) => {
 *     await signIn.password({
 *       emailAddress: data.email,
 *       password: data.password,
 *     });
 *     
 *     if (signIn.status === 'complete') {
 *       await signIn.finalize({ navigate: () => router.replace('/') });
 *     }
 *   };
 *   
 *   return (
 *     <AuthForm
 *       schema={signInSchema}
 *       onSubmit={handleSubmit}
 *       initialValues={{ email: '', password: '' }}
 *     >
 *       <FormField name="email" label="Email">
 *         {({ value, onChange, error }) => (
 *           <EmailInput
 *             value={value}
 *             onChangeText={onChange}
 *             error={error}
 *           />
 *         )}
 *       </FormField>
 *       
 *       <FormField name="password" label="Password">
 *         {({ value, onChange, error }) => (
 *           <PasswordInput
 *             value={value}
 *             onChangeText={onChange}
 *             error={error}
 *           />
 *         )}
 *       </FormField>
 *       
 *       <FormSubmitButton />
 *     </AuthForm>
 *   );
 * }
 * 
 * // Submit button that uses form context
 * function FormSubmitButton() {
 *   const { handleSubmit, isSubmitting } = useAuthForm();
 *   
 *   return (
 *     <AuthButton
 *       title="Sign In"
 *       onPress={handleSubmit}
 *       loading={isSubmitting}
 *     />
 *   );
 * }
 * 
 * VALIDATION SCHEMAS:
 * 
 * // Sign Up schema
 * const signUpSchema = z.object({
 *   firstName: z.string().min(2, 'First name is required'),
 *   lastName: z.string().min(2, 'Last name is required'),
 *   email: z.string().email('Please enter a valid email'),
 *   phone: z.string().min(8, 'Please enter a valid phone number'),
 *   password: z.string()
 *     .min(8, 'At least 8 characters')
 *     .regex(/[A-Z]/, 'At least one uppercase letter')
 *     .regex(/[a-z]/, 'At least one lowercase letter')
 *     .regex(/[0-9]/, 'At least one number'),
 *   confirmPassword: z.string(),
 * }).refine((data) => data.password === data.confirmPassword, {
 *   message: "Passwords don't match",
 *   path: ['confirmPassword'],
 * });
 * 
 * // Phone verification schema
 * const phoneVerificationSchema = z.object({
 *   phone: z.string().min(8, 'Phone number is required'),
 *   code: z.string().length(6, 'Code must be 6 digits'),
 * });
 * 
 * // Reset password schema
 * const resetPasswordSchema = z.object({
 *   code: z.string().length(6, 'Code must be 6 digits'),
 *   newPassword: z.string().min(8, 'Password must be at least 8 characters'),
 *   confirmPassword: z.string(),
 * }).refine((data) => data.newPassword === data.confirmPassword, {
 *   message: "Passwords don't match",
 *   path: ['confirmPassword'],
 * });
 * 
 * // PIN creation schema
 * const pinSchema = z.object({
 *   pin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d+$/, 'PIN must be numeric'),
 *   confirmPin: z.string(),
 * }).refine((data) => data.pin === data.confirmPin, {
 *   message: "PINs don't match",
 *   path: ['confirmPin'],
 * });
 * 
 * CUSTOM VALIDATION:
 * 
 * const customSchema = z.object({
 *   email: z.string().email().refine(
 *     async (email) => {
 *       // Check if email is already registered
 *       const exists = await checkEmailExists(email);
 *       return !exists;
 *     },
 *     { message: 'Email is already registered' }
 *   ),
 * });
 * 
 * NAMIBIAN PHONE VALIDATION:
 * 
 * const namibianPhoneSchema = z.object({
 *   phone: z.string()
 *     .refine(
 *       (phone) => {
 *         const cleaned = phone.replace(/\s/g, '');
 *         return /^(81|85|60|61)\d{7}$/.test(cleaned);
 *       },
 *       { message: 'Please enter a valid Namibian phone number' }
 *     ),
 * });
 * 
 * ACCESSIBILITY:
 * - Keyboard-aware scrolling
 * - Proper focus management
 * - Error announcements
 * - Touch-friendly tap targets
 * 
 * TESTING:
 * 
 * test('validates form with schema', async () => {
 *   const handleSubmit = jest.fn();
 *   const schema = z.object({
 *     email: z.string().email(),
 *   });
 *   
 *   const { getByTestId } = render(
 *     <AuthForm schema={schema} onSubmit={handleSubmit}>
 *       <FormField name="email">
 *         {({ value, onChange }) => (
 *           <EmailInput value={value} onChangeText={onChange} />
 *         )}
 *       </FormField>
 *       <FormSubmitButton />
 *     </AuthForm>
 *   );
 *   
 *   // Try to submit with invalid email
 *   fireEvent.press(getByTestId('auth-button'));
 *   expect(handleSubmit).not.toHaveBeenCalled();
 * });
 * 
 * test('submits form with valid data', async () => {
 *   const handleSubmit = jest.fn();
 *   const schema = z.object({
 *     email: z.string().email(),
 *   });
 *   
 *   const { getByTestId } = render(
 *     <AuthForm schema={schema} onSubmit={handleSubmit}>
 *       <FormField name="email">
 *         {({ value, onChange }) => (
 *           <EmailInput value={value} onChangeText={onChange} />
 *         )}
 *       </FormField>
 *       <FormSubmitButton />
 *     </AuthForm>
 *   );
 *   
 *   // Enter valid email
 *   fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
 *   
 *   // Submit form
 *   fireEvent.press(getByTestId('auth-button'));
 *   
 *   await waitFor(() => {
 *     expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
 *   });
 * });
 */
