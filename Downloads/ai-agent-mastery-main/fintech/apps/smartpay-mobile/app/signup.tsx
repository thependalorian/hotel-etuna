/**
 * Sign up – Phone OTP. PRD §4.7.1 / Appendix G.
 * Uses backend requestOtp then /onboarding/otp (full onboarding flow).
 * Location: fintech/smartpay/mobile/app/signup.tsx
 */
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { validatePhoneNumber } from '@/utils/phoneValidation';
import { requestOtp } from '@/services/auth';

export default function SignUpScreen() {
  const [countryCode, setCountryCode] = useState('+264');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSignUp = async () => {
    const validation = validatePhoneNumber(countryCode, phoneNumber);
    if (!validation.isValid) {
      Alert.alert('Invalid Phone Number', validation.error || 'Please check your phone number and try again.');
      return;
    }
    const full = validation.formatted!;
    setLoading(true);
    try {
      const result = await requestOtp(full);
      if (result.success) {
        if (__DEV__ && result.devCode) {
          Alert.alert('Dev Mode', `OTP Code: ${result.devCode}`, [
            { text: 'OK', onPress: () => router.push({ pathname: '/onboarding/otp', params: { phone: full } }) },
          ]);
        } else {
          router.push({ pathname: '/onboarding/otp', params: { phone: full } });
        }
      } else {
        Alert.alert('Sign Up Failed', result.error ?? 'Unable to create account. Please try again.');
      }
    } catch (e) {
      console.error('Sign up error:', e);
      Alert.alert('Sign Up Failed', 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <View style={defaultStyles.container}>
        <Text style={defaultStyles.header}>Let's get started</Text>
        <Text style={defaultStyles.descriptionText}>Enter your phone number. We'll send you a confirmation code.</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Code" placeholderTextColor={Colors.gray} value={countryCode} onChangeText={setCountryCode} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mobile number" placeholderTextColor={Colors.gray} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
        </View>
        <Link href="/login" replace asChild>
          <TouchableOpacity><Text style={defaultStyles.textLink}>Already have an account? Log in</Text></TouchableOpacity>
        </Link>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[defaultStyles.pillButton, phoneNumber && !loading ? styles.enabled : styles.disabled]} onPress={onSignUp} disabled={!phoneNumber || loading}>
          <Text style={defaultStyles.buttonText}>{loading ? 'Sending…' : 'Sign up'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', marginVertical: 24, gap: 10 },
  input: { backgroundColor: Colors.lightGray, padding: 16, borderRadius: 12, fontSize: 16 },
  enabled: { backgroundColor: Colors.primary },
  disabled: { backgroundColor: Colors.primaryMuted },
});
