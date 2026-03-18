/**
 * SmartPay Authentication Component Library
 * Central export file for easy imports
 * 
 * Usage:
 * import { EmailInput, PasswordInput, AuthButton } from '@/components/auth';
 */

// Input Components
export { PhoneInput } from './inputs/PhoneInput';
export type { PhoneInputProps, Country } from './inputs/PhoneInput';

export { EmailInput } from './inputs/EmailInput';
export type { EmailInputProps } from './inputs/EmailInput';

export { OTPInput } from './inputs/OTPInput';
export type { OTPInputProps } from './inputs/OTPInput';

export { PasswordInput } from './inputs/PasswordInput';
export type { PasswordInputProps, PasswordStrength } from './inputs/PasswordInput';

export { PINInput } from './inputs/PINInput';
export type { PINInputProps } from './inputs/PINInput';

// Button Components
export { AuthButton } from './buttons/AuthButton';
export type { AuthButtonProps, AuthButtonVariant, AuthButtonSize } from './buttons/AuthButton';

export { SocialAuthButton } from './buttons/SocialAuthButton';
export type { SocialAuthButtonProps, SocialProvider } from './buttons/SocialAuthButton';

export { LinkButton } from './buttons/LinkButton';
export type { LinkButtonProps, LinkButtonVariant, LinkButtonSize } from './buttons/LinkButton';

// Form Components
export { AuthForm, useAuthForm } from './forms/AuthForm';
export type { AuthFormProps } from './forms/AuthForm';

export { FormField } from './forms/FormField';
export type { FormFieldProps } from './forms/FormField';

export { FormSection } from './forms/FormSection';
export type { FormSectionProps } from './forms/FormSection';

// Feedback Components
export { AuthError } from './feedback/AuthError';
export type { AuthErrorProps } from './feedback/AuthError';

export { AuthSuccess } from './feedback/AuthSuccess';
export type { AuthSuccessProps } from './feedback/AuthSuccess';

export { LoadingSpinner } from './feedback/LoadingSpinner';
export type { LoadingSpinnerProps } from './feedback/LoadingSpinner';

export { ProgressIndicator } from './feedback/ProgressIndicator';
export type { ProgressIndicatorProps } from './feedback/ProgressIndicator';

// Layout Components
export { AuthContainer } from './layout/AuthContainer';
export type { AuthContainerProps } from './layout/AuthContainer';

export { AuthHeader } from './layout/AuthHeader';
export type { AuthHeaderProps } from './layout/AuthHeader';

export { AuthFooter } from './layout/AuthFooter';
export type { AuthFooterProps } from './layout/AuthFooter';

// Specialty Components
export { BiometricPrompt } from './specialty/BiometricPrompt';
export type { BiometricPromptProps } from './specialty/BiometricPrompt';

export { CountryCodeSelector, COUNTRIES } from './specialty/CountryCodeSelector';
export type { CountryCodeSelectorProps } from './specialty/CountryCodeSelector';

export { VerificationTimer } from './specialty/VerificationTimer';
export type { VerificationTimerProps } from './specialty/VerificationTimer';

export { PasswordStrengthMeter, calculateStrength } from './specialty/PasswordStrengthMeter';
export type { PasswordStrengthMeterProps } from './specialty/PasswordStrengthMeter';
