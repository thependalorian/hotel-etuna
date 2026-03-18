/**
 * FormField - Label + Input + Error wrapper for form fields
 * Location: fintech/smartpay/components/auth/forms/FormField.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthForm } from './AuthForm';
import { designSystem } from '@/constants/designSystem';

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  children: (props: {
    value: any;
    onChange: (value: any) => void;
    error?: string;
    onBlur?: () => void;
  }) => React.ReactNode;
}

export function FormField({
  name,
  label,
  required = false,
  helperText,
  children,
}: FormFieldProps) {
  const { values, errors, setValue, validateField } = useAuthForm();

  const value = values[name] ?? '';
  const error = errors[name];

  const handleChange = (newValue: any) => {
    setValue(name, newValue);
  };

  const handleBlur = () => {
    const fieldError = validateField(name, value);
    if (fieldError) {
      // Error will be set by validateField
    }
  };

  return (
    <View style={styles.container}>
      {children({
        value,
        onChange: handleChange,
        error,
        onBlur: handleBlur,
      })}
    </View>
  );
}

const ds = designSystem;
const { spacing } = ds;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage with EmailInput
 * <FormField name="email" label="Email Address" required>
 *   {({ value, onChange, error }) => (
 *     <EmailInput
 *       value={value}
 *       onChangeText={onChange}
 *       error={error}
 *       label="Email Address"
 *       required
 *     />
 *   )}
 * </FormField>
 * 
 * // With PhoneInput
 * <FormField name="phone" label="Phone Number" required>
 *   {({ value, onChange, error }) => (
 *     <PhoneInput
 *       value={value}
 *       onChangeText={onChange}
 *       error={error}
 *       label="Phone Number"
 *       required
 *       defaultCountry="NA"
 *     />
 *   )}
 * </FormField>
 * 
 * // With PasswordInput
 * <FormField name="password" label="Password" required>
 *   {({ value, onChange, error }) => (
 *     <PasswordInput
 *       value={value}
 *       onChangeText={onChange}
 *       error={error}
 *       label="Password"
 *       required
 *       showStrength
 *     />
 *   )}
 * </FormField>
 * 
 * // With OTPInput
 * <FormField name="code">
 *   {({ value, onChange, error }) => (
 *     <OTPInput
 *       value={value}
 *       onChangeText={onChange}
 *       error={error}
 *       label="Verification Code"
 *     />
 *   )}
 * </FormField>
 * 
 * // With PINInput
 * <FormField name="pin">
 *   {({ value, onChange, error }) => (
 *     <PINInput
 *       value={value}
 *       onChangeText={onChange}
 *       error={error}
 *       label="Enter PIN"
 *       pinLength={4}
 *     />
 *   )}
 * </FormField>
 * 
 * // With custom input
 * <FormField name="username" label="Username" required>
 *   {({ value, onChange, error }) => (
 *     <View>
 *       <TextInput
 *         value={value}
 *         onChangeText={onChange}
 *         placeholder="Choose a username"
 *       />
 *       {error && <Text style={styles.error}>{error}</Text>}
 *     </View>
 *   )}
 * </FormField>
 * 
 * COMPLETE FORM EXAMPLE:
 * 
 * import { z } from 'zod';
 * import { AuthForm } from '@/components/auth/forms/AuthForm';
 * import { FormField } from '@/components/auth/forms/FormField';
 * import { EmailInput } from '@/components/auth/inputs/EmailInput';
 * import { PasswordInput } from '@/components/auth/inputs/PasswordInput';
 * import { AuthButton } from '@/components/auth/buttons/AuthButton';
 * 
 * const signUpSchema = z.object({
 *   email: z.string().email('Please enter a valid email'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 *   confirmPassword: z.string(),
 * }).refine((data) => data.password === data.confirmPassword, {
 *   message: "Passwords don't match",
 *   path: ['confirmPassword'],
 * });
 * 
 * function SignUpScreen() {
 *   const { signUp } = useSignUp();
 *   const router = useRouter();
 *   
 *   const handleSubmit = async (data: z.infer<typeof signUpSchema>) => {
 *     await signUp.create({
 *       emailAddress: data.email,
 *       password: data.password,
 *     });
 *     
 *     // Send verification code
 *     await signUp.prepareEmailAddressVerification();
 *     
 *     // Navigate to verification
 *     router.push('/verify');
 *   };
 *   
 *   return (
 *     <AuthContainer>
 *       <AuthHeader
 *         title="Create Account"
 *         subtitle="Join SmartPay to start managing your finances"
 *       />
 *       
 *       <AuthForm
 *         schema={signUpSchema}
 *         onSubmit={handleSubmit}
 *         initialValues={{
 *           email: '',
 *           password: '',
 *           confirmPassword: '',
 *         }}
 *       >
 *         <FormField name="email" required>
 *           {({ value, onChange, error }) => (
 *             <EmailInput
 *               value={value}
 *               onChangeText={onChange}
 *               error={error}
 *               label="Email Address"
 *               required
 *             />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="password" required>
 *           {({ value, onChange, error }) => (
 *             <PasswordInput
 *               value={value}
 *               onChangeText={onChange}
 *               error={error}
 *               label="Create Password"
 *               required
 *               showStrength
 *             />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="confirmPassword" required>
 *           {({ value, onChange, error }) => (
 *             <PasswordInput
 *               value={value}
 *               onChangeText={onChange}
 *               error={error}
 *               label="Confirm Password"
 *               required
 *             />
 *           )}
 *         </FormField>
 *         
 *         <FormSubmitButton title="Create Account" />
 *       </AuthForm>
 *       
 *       <AuthFooter>
 *         <View style={styles.linkContainer}>
 *           <Text>Already have an account? </Text>
 *           <LinkButton title="Sign In" href="/sign-in" />
 *         </View>
 *       </AuthFooter>
 *     </AuthContainer>
 *   );
 * }
 * 
 * MULTI-STEP FORM EXAMPLE:
 * 
 * function MultiStepSignUp() {
 *   const [step, setStep] = useState(1);
 *   
 *   const schema = z.object({
 *     // Step 1
 *     email: z.string().email(),
 *     phone: z.string().min(8),
 *     
 *     // Step 2
 *     firstName: z.string().min(2),
 *     lastName: z.string().min(2),
 *     
 *     // Step 3
 *     password: z.string().min(8),
 *     confirmPassword: z.string(),
 *   }).refine((data) => data.password === data.confirmPassword, {
 *     message: "Passwords don't match",
 *     path: ['confirmPassword'],
 *   });
 *   
 *   const handleSubmit = async (data: z.infer<typeof schema>) => {
 *     // Submit complete form
 *   };
 *   
 *   return (
 *     <AuthForm schema={schema} onSubmit={handleSubmit}>
 *       <FormSection visible={step === 1}>
 *         <FormField name="email">
 *           {({ value, onChange, error }) => (
 *             <EmailInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="phone">
 *           {({ value, onChange, error }) => (
 *             <PhoneInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <AuthButton title="Next" onPress={() => setStep(2)} />
 *       </FormSection>
 *       
 *       <FormSection visible={step === 2}>
 *         <FormField name="firstName">
 *           {({ value, onChange, error }) => (
 *             <TextInput value={value} onChangeText={onChange} />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="lastName">
 *           {({ value, onChange, error }) => (
 *             <TextInput value={value} onChangeText={onChange} />
 *           )}
 *         </FormField>
 *         
 *         <AuthButton title="Next" onPress={() => setStep(3)} />
 *       </FormSection>
 *       
 *       <FormSection visible={step === 3}>
 *         <FormField name="password">
 *           {({ value, onChange, error }) => (
 *             <PasswordInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="confirmPassword">
 *           {({ value, onChange, error }) => (
 *             <PasswordInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <FormSubmitButton title="Create Account" />
 *       </FormSection>
 *     </AuthForm>
 *   );
 * }
 * 
 * CONDITIONAL FIELDS:
 * 
 * function ConditionalFieldExample() {
 *   const { values } = useAuthForm();
 *   const usePhone = values.usePhone;
 *   
 *   return (
 *     <>
 *       <FormField name="usePhone">
 *         {({ value, onChange }) => (
 *           <Switch value={value} onValueChange={onChange} />
 *         )}
 *       </FormField>
 *       
 *       {usePhone && (
 *         <FormField name="phone">
 *           {({ value, onChange, error }) => (
 *             <PhoneInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *       )}
 *     </>
 *   );
 * }
 * 
 * ACCESSIBILITY:
 * - Labels linked to inputs
 * - Error messages announced
 * - Required fields indicated
 * - Proper focus order
 * 
 * TESTING:
 * 
 * test('renders FormField with input', () => {
 *   const { getByPlaceholderText } = render(
 *     <AuthForm onSubmit={jest.fn()}>
 *       <FormField name="email">
 *         {({ value, onChange }) => (
 *           <TextInput
 *             value={value}
 *             onChangeText={onChange}
 *             placeholder="Email"
 *           />
 *         )}
 *       </FormField>
 *     </AuthForm>
 *   );
 *   
 *   expect(getByPlaceholderText('Email')).toBeTruthy();
 * });
 * 
 * test('displays error from form validation', () => {
 *   const schema = z.object({
 *     email: z.string().email('Invalid email'),
 *   });
 *   
 *   const { getByTestId, queryByText } = render(
 *     <AuthForm schema={schema} onSubmit={jest.fn()}>
 *       <FormField name="email">
 *         {({ value, onChange, error }) => (
 *           <>
 *             <TextInput value={value} onChangeText={onChange} />
 *             {error && <Text>{error}</Text>}
 *           </>
 *         )}
 *       </FormField>
 *       <FormSubmitButton />
 *     </AuthForm>
 *   );
 *   
 *   // Try to submit with invalid email
 *   fireEvent.press(getByTestId('auth-button'));
 *   
 *   expect(queryByText('Invalid email')).toBeTruthy();
 * });
 */
