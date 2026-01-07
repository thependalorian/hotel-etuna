/**
 * Phone Verification Screen
 * 
 * Location: app/verify/[phone].tsx
 * Purpose: Verify phone number with 6-digit code sent via SMS
 * 
 * Customized for Buffr app design with brand colors and styling
 */

import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

const CELL_COUNT = 6;

const Page = () => {
  const { phone, signin } = useLocalSearchParams<{ phone: string; signin: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { signIn } = useSignIn();
  const { signUp, setActive } = useSignUp();

  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (code.length === 6 && !isVerifying) {
      if (signin === 'true') {
        verifySignIn();
      } else {
        verifyCode();
      }
    }
  }, [code]);

  const verifyCode = async () => {
    setIsVerifying(true);
    try {
      await signUp!.attemptPhoneNumberVerification({
        code,
      });
      await setActive!({ session: signUp!.createdSessionId });
      // Navigate to home screen after successful verification
      router.replace('/(tabs)');
    } catch (err) {
      console.log('error', JSON.stringify(err, null, 2));
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Verification Failed', err.errors[0].message);
        setCode(''); // Clear code on error
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const verifySignIn = async () => {
    setIsVerifying(true);
    try {
      await signIn!.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });
      await setActive!({ session: signIn!.createdSessionId });
      // Navigate to home screen after successful sign in
      router.replace('/(tabs)');
    } catch (err) {
      console.log('error', JSON.stringify(err, null, 2));
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Verification Failed', err.errors[0].message);
        setCode(''); // Clear code on error
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      if (signin === 'true' && signIn) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: signIn.supportedFirstFactors.find(
            (factor) => factor.strategy === 'phone_code'
          )?.phoneNumberId,
        });
      } else if (signUp) {
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      }
      setResendTimer(60); // 60 second cooldown
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone');
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert('Error', err.errors[0].message);
      }
    }
  };

  // Format phone number for display (handles various formats)
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    // Format based on length (US format: 10 digits)
    if (digits.length === 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    // For international numbers, show last 4 digits masked
    if (digits.length > 10) {
      const last4 = digits.slice(-4);
      return `•••• •••• ${last4}`;
    }
    return phoneNumber;
  };

  const formattedPhone = formatPhoneNumber(phone || '');

  return (
    <ScrollView 
      style={defaultStyles.containerFull}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <FontAwesome name="mobile-phone" size={40} color={Colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={defaultStyles.headerMedium}>Verify Your Phone</Text>
        <Text style={styles.description}>
          We sent a 6-digit verification code to
        </Text>
        <Text style={styles.phoneNumber}>{formattedPhone || phone}</Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          <CodeField
            ref={ref}
            {...props}
            value={code}
            onChangeText={setCode}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            editable={!isVerifying}
            renderCell={({ index, symbol, isFocused }) => (
              <Fragment key={index}>
                <View
                  onLayout={getCellOnLayoutHandler(index)}
                  key={index}
                  style={[
                    styles.cellRoot,
                    isFocused && styles.focusCell,
                    symbol && styles.cellFilled,
                  ]}
                >
                  <Text style={styles.cellText}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
                {index === 2 ? (
                  <View key={`separator-${index}`} style={styles.separator} />
                ) : null}
              </Fragment>
            )}
          />
        </View>

        {/* Loading Indicator */}
        {isVerifying && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.verifyingText}>Verifying code...</Text>
          </View>
        )}

        {/* Resend Code */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={resendTimer > 0 || isVerifying}
        >
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
            {resendTimer > 0
              ? `Resend code in ${resendTimer}s`
              : 'Resend verification code'}
          </Text>
        </TouchableOpacity>

        {/* Alternative Actions */}
        <View style={styles.footer}>
          {signin !== 'true' && (
            <Link href="/login" replace asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            </Link>
          )}
          <Link href="/" replace asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeFieldRoot: {
    marginVertical: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: 12,
  },
  cellRoot: {
    width: 50,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cellFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '20',
  },
  cellText: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  focusCell: {
    borderColor: Colors.primary,
    borderWidth: 3,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  separator: {
    height: 2,
    width: 12,
    backgroundColor: Colors.textTertiary,
    alignSelf: 'center',
    borderRadius: 1,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  verifyingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textTertiary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    gap: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default Page;