/**
 * VerificationTimer - "Resend code in 0:59" countdown timer
 * Location: fintech/smartpay/components/auth/specialty/VerificationTimer.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinkButton } from '../buttons/LinkButton';
import { designSystem } from '@/constants/designSystem';

export interface VerificationTimerProps {
  initialSeconds?: number;
  onResend: () => void | Promise<void>;
  message?: string;
  resendText?: string;
  testID?: string;
}

export function VerificationTimer({
  initialSeconds = 60,
  onResend,
  message = 'Resend code in',
  resendText = 'Resend code',
  testID = 'verification-timer',
}: VerificationTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setSeconds(initialSeconds);
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canResend = seconds === 0 && !isResending;

  return (
    <View style={styles.container} testID={testID}>
      {canResend ? (
        <LinkButton
          title={isResending ? 'Sending...' : resendText}
          onPress={handleResend}
          disabled={isResending}
        />
      ) : (
        <Text style={styles.timerText}>
          {message} <Text style={styles.time}>{formatTime(seconds)}</Text>
        </Text>
      )}
    </View>
  );
}

const ds = designSystem;
const { colors } = ds;
const { neutral } = colors;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    color: neutral.textSecondary,
  },
  time: {
    fontWeight: '600',
    color: neutral.text,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * <VerificationTimer
 *   onResend={handleResendCode}
 * />
 * 
 * // Custom duration
 * <VerificationTimer
 *   initialSeconds={120}
 *   onResend={handleResendCode}
 * />
 * 
 * // Custom messages
 * <VerificationTimer
 *   message="Didn't receive code?"
 *   resendText="Send again"
 *   onResend={handleResendCode}
 * />
 * 
 * COMPLETE VERIFICATION SCREEN:
 * 
 * function VerificationScreen() {
 *   const [code, setCode] = useState('');
 *   const [error, setError] = useState('');
 *   const { signIn } = useSignIn();
 *   
 *   const handleResend = async () => {
 *     try {
 *       await signIn.mfa.sendEmailCode();
 *     } catch (err) {
 *       setError('Failed to resend code');
 *     }
 *   };
 *   
 *   const handleComplete = async (code: string) => {
 *     try {
 *       await signIn.mfa.verifyEmailCode({ code });
 *       
 *       if (signIn.status === 'complete') {
 *         router.replace('/dashboard');
 *       }
 *     } catch (err) {
 *       setError('Invalid code');
 *     }
 *   };
 *   
 *   return (
 *     <AuthContainer>
 *       <AuthHeader
 *         title="Verify your email"
 *         subtitle="Enter the 6-digit code sent to your email"
 *       />
 *       
 *       <OTPInput
 *         value={code}
 *         onChangeText={setCode}
 *         onComplete={handleComplete}
 *         error={error}
 *       />
 *       
 *       <VerificationTimer onResend={handleResend} />
 *     </AuthContainer>
 *   );
 * }
 */
