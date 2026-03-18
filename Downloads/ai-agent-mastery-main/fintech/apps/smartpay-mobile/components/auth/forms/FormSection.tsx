/**
 * FormSection - Multi-step form section wrapper
 * Location: fintech/smartpay/components/auth/forms/FormSection.tsx
 */
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface FormSectionProps {
  children: React.ReactNode;
  visible: boolean;
  style?: any;
  animationType?: 'fade' | 'slide' | 'none';
}

export function FormSection({
  children,
  visible,
  style,
  animationType = 'fade',
}: FormSectionProps) {
  const fadeAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const slideAnim = React.useRef(new Animated.Value(visible ? 0 : 50)).current;

  React.useEffect(() => {
    if (animationType === 'fade') {
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (animationType === 'slide') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: visible ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: visible ? 0 : 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animationType]);

  if (!visible && animationType === 'none') {
    return null;
  }

  const animationStyle =
    animationType === 'slide'
      ? {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      : animationType === 'fade'
      ? { opacity: fadeAnim }
      : {};

  return (
    <Animated.View
      style={[
        styles.container,
        animationStyle,
        style,
        !visible && styles.hidden,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

const ds = designSystem;
const { spacing } = ds;

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic multi-step form
 * function MultiStepForm() {
 *   const [step, setStep] = useState(1);
 *   
 *   return (
 *     <AuthForm onSubmit={handleSubmit}>
 *       <FormSection visible={step === 1}>
 *         <FormField name="email">
 *           {({ value, onChange, error }) => (
 *             <EmailInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <AuthButton title="Next" onPress={() => setStep(2)} />
 *       </FormSection>
 *       
 *       <FormSection visible={step === 2}>
 *         <FormField name="password">
 *           {({ value, onChange, error }) => (
 *             <PasswordInput value={value} onChangeText={onChange} error={error} />
 *           )}
 *         </FormField>
 *         
 *         <FormSubmitButton title="Sign Up" />
 *       </FormSection>
 *     </AuthForm>
 *   );
 * }
 * 
 * // With slide animation
 * <FormSection visible={step === 2} animationType="slide">
 *   // Form fields here
 * </FormSection>
 * 
 * // Without animation
 * <FormSection visible={step === 3} animationType="none">
 *   // Form fields here
 * </FormSection>
 * 
 * COMPLETE MULTI-STEP ONBOARDING:
 * 
 * import { z } from 'zod';
 * import { ProgressIndicator } from '@/components/auth/feedback/ProgressIndicator';
 * 
 * const steps = ['Account', 'Personal', 'Security', 'Verify'];
 * 
 * const onboardingSchema = z.object({
 *   // Step 1: Account
 *   email: z.string().email('Please enter a valid email'),
 *   phone: z.string().min(8, 'Please enter a valid phone number'),
 *   
 *   // Step 2: Personal Info
 *   firstName: z.string().min(2, 'First name is required'),
 *   lastName: z.string().min(2, 'Last name is required'),
 *   dateOfBirth: z.string().min(1, 'Date of birth is required'),
 *   
 *   // Step 3: Security
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 *   confirmPassword: z.string(),
 *   pin: z.string().length(4, 'PIN must be 4 digits'),
 *   
 *   // Step 4: Verification
 *   emailCode: z.string().length(6, 'Code must be 6 digits'),
 *   smsCode: z.string().length(6, 'Code must be 6 digits'),
 * }).refine((data) => data.password === data.confirmPassword, {
 *   message: "Passwords don't match",
 *   path: ['confirmPassword'],
 * });
 * 
 * function OnboardingFlow() {
 *   const [currentStep, setCurrentStep] = useState(0);
 *   const [completedSteps, setCompletedSteps] = useState<number[]>([]);
 *   const { signUp } = useSignUp();
 *   const router = useRouter();
 *   
 *   const handleNext = async () => {
 *     // Validate current step before proceeding
 *     const isValid = await validateCurrentStep();
 *     
 *     if (isValid) {
 *       setCompletedSteps([...completedSteps, currentStep]);
 *       setCurrentStep(currentStep + 1);
 *     }
 *   };
 *   
 *   const handleBack = () => {
 *     setCurrentStep(Math.max(0, currentStep - 1));
 *   };
 *   
 *   const handleSubmit = async (data: z.infer<typeof onboardingSchema>) => {
 *     // Create account
 *     await signUp.create({
 *       emailAddress: data.email,
 *       password: data.password,
 *     });
 *     
 *     // Verify email
 *     await signUp.attemptEmailAddressVerification({
 *       code: data.emailCode,
 *     });
 *     
 *     // Complete registration
 *     if (signUp.status === 'complete') {
 *       await signUp.finalize({ navigate: () => router.replace('/dashboard') });
 *     }
 *   };
 *   
 *   return (
 *     <AuthContainer>
 *       <AuthHeader
 *         title="Create Your Account"
 *         subtitle={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
 *       />
 *       
 *       <ProgressIndicator
 *         currentStep={currentStep}
 *         totalSteps={steps.length}
 *         completedSteps={completedSteps}
 *         labels={steps}
 *       />
 *       
 *       <AuthForm
 *         schema={onboardingSchema}
 *         onSubmit={handleSubmit}
 *       >
 *         {/* Step 1: Account *\/}
 *         <FormSection visible={currentStep === 0} animationType="slide">
 *           <FormField name="email" required>
 *             {({ value, onChange, error }) => (
 *               <EmailInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Email Address"
 *                 required
 *               />
 *             )}
 *           </FormField>
 *           
 *           <FormField name="phone" required>
 *             {({ value, onChange, error }) => (
 *               <PhoneInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Phone Number"
 *                 required
 *                 defaultCountry="NA"
 *               />
 *             )}
 *           </FormField>
 *           
 *           <AuthButton title="Next" onPress={handleNext} />
 *         </FormSection>
 *         
 *         {/* Step 2: Personal Info *\/}
 *         <FormSection visible={currentStep === 1} animationType="slide">
 *           <FormField name="firstName" required>
 *             {({ value, onChange, error }) => (
 *               <TextInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 placeholder="First Name"
 *               />
 *             )}
 *           </FormField>
 *           
 *           <FormField name="lastName" required>
 *             {({ value, onChange, error }) => (
 *               <TextInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 placeholder="Last Name"
 *               />
 *             )}
 *           </FormField>
 *           
 *           <View style={styles.buttonRow}>
 *             <AuthButton
 *               title="Back"
 *               onPress={handleBack}
 *               variant="outline"
 *               fullWidth={false}
 *             />
 *             <AuthButton
 *               title="Next"
 *               onPress={handleNext}
 *               fullWidth={false}
 *             />
 *           </View>
 *         </FormSection>
 *         
 *         {/* Step 3: Security *\/}
 *         <FormSection visible={currentStep === 2} animationType="slide">
 *           <FormField name="password" required>
 *             {({ value, onChange, error }) => (
 *               <PasswordInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Create Password"
 *                 required
 *                 showStrength
 *               />
 *             )}
 *           </FormField>
 *           
 *           <FormField name="confirmPassword" required>
 *             {({ value, onChange, error }) => (
 *               <PasswordInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Confirm Password"
 *                 required
 *               />
 *             )}
 *           </FormField>
 *           
 *           <FormField name="pin" required>
 *             {({ value, onChange, error }) => (
 *               <PINInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Create 4-Digit PIN"
 *                 helperText="Use this PIN for quick access"
 *               />
 *             )}
 *           </FormField>
 *           
 *           <View style={styles.buttonRow}>
 *             <AuthButton
 *               title="Back"
 *               onPress={handleBack}
 *               variant="outline"
 *               fullWidth={false}
 *             />
 *             <AuthButton
 *               title="Next"
 *               onPress={handleNext}
 *               fullWidth={false}
 *             />
 *           </View>
 *         </FormSection>
 *         
 *         {/* Step 4: Verification *\/}
 *         <FormSection visible={currentStep === 3} animationType="slide">
 *           <FormField name="emailCode" required>
 *             {({ value, onChange, error }) => (
 *               <OTPInput
 *                 value={value}
 *                 onChangeText={onChange}
 *                 error={error}
 *                 label="Email Verification Code"
 *                 helperText="Check your email for the code"
 *               />
 *             )}
 *           </FormField>
 *           
 *           <FormSubmitButton title="Complete Registration" />
 *         </FormSection>
 *       </AuthForm>
 *     </AuthContainer>
 *   );
 * }
 * 
 * CONDITIONAL SECTIONS:
 * 
 * function ConditionalSectionExample() {
 *   const { values } = useAuthForm();
 *   const accountType = values.accountType;
 *   
 *   return (
 *     <>
 *       <FormSection visible={true}>
 *         <FormField name="accountType">
 *           {({ value, onChange }) => (
 *             <Picker
 *               selectedValue={value}
 *               onValueChange={onChange}
 *             >
 *               <Picker.Item label="Personal" value="personal" />
 *               <Picker.Item label="Business" value="business" />
 *             </Picker>
 *           )}
 *         </FormField>
 *       </FormSection>
 *       
 *       <FormSection visible={accountType === 'business'}>
 *         <FormField name="companyName">
 *           {({ value, onChange, error }) => (
 *             <TextInput
 *               value={value}
 *               onChangeText={onChange}
 *               placeholder="Company Name"
 *             />
 *           )}
 *         </FormField>
 *         
 *         <FormField name="taxId">
 *           {({ value, onChange, error }) => (
 *             <TextInput
 *               value={value}
 *               onChangeText={onChange}
 *               placeholder="Tax ID"
 *             />
 *           )}
 *         </FormField>
 *       </FormSection>
 *     </>
 *   );
 * }
 * 
 * STEP VALIDATION:
 * 
 * function useStepValidation(schema: z.ZodType, step: number) {
 *   const { values } = useAuthForm();
 *   
 *   const stepFields = {
 *     0: ['email', 'phone'],
 *     1: ['firstName', 'lastName'],
 *     2: ['password', 'confirmPassword', 'pin'],
 *     3: ['emailCode'],
 *   };
 *   
 *   const validateStep = async (): Promise<boolean> => {
 *     const fieldsToValidate = stepFields[step];
 *     const stepData = {};
 *     
 *     fieldsToValidate.forEach(field => {
 *       stepData[field] = values[field];
 *     });
 *     
 *     try {
 *       // Validate only current step fields
 *       const stepSchema = schema.pick(
 *         Object.fromEntries(fieldsToValidate.map(f => [f, true]))
 *       );
 *       await stepSchema.parseAsync(stepData);
 *       return true;
 *     } catch (error) {
 *       return false;
 *     }
 *   };
 *   
 *   return { validateStep };
 * }
 * 
 * ACCESSIBILITY:
 * - Proper focus management between steps
 * - Screen reader announcements for step changes
 * - Clear progress indicators
 * - Keyboard navigation
 * 
 * TESTING:
 * 
 * test('shows correct section based on step', () => {
 *   const { getByText, queryByText, rerender } = render(
 *     <>
 *       <FormSection visible={true}>
 *         <Text>Step 1</Text>
 *       </FormSection>
 *       <FormSection visible={false}>
 *         <Text>Step 2</Text>
 *       </FormSection>
 *     </>
 *   );
 *   
 *   expect(getByText('Step 1')).toBeTruthy();
 *   expect(queryByText('Step 2')).toBeNull();
 * });
 * 
 * test('animates between sections', async () => {
 *   const { rerender } = render(
 *     <FormSection visible={false} animationType="fade">
 *       <Text>Content</Text>
 *     </FormSection>
 *   );
 *   
 *   rerender(
 *     <FormSection visible={true} animationType="fade">
 *       <Text>Content</Text>
 *     </FormSection>
 *   );
 *   
 *   // Verify animation occurs
 *   // This would require testing animation values
 * });
 */
