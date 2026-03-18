/**
 * Log in – Phone OTP. PRD §4.7.1 / Appendix G.
 * Uses backend requestOtp then /onboarding/otp with signin=1.
 * Location: fintech/smartpay/mobile/app/login.tsx
 */
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { validatePhoneNumber } from '@/utils/phoneValidation';
import { requestOtp } from '@/services/auth';

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState('+264');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onLogin = async () => {
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
            { text: 'OK', onPress: () => router.push({ pathname: '/onboarding/otp', params: { phone: full, signin: '1' } }) },
          ]);
        } else {
          router.push({ pathname: '/onboarding/otp', params: { phone: full, signin: '1' } });
        }
      } else {
        Alert.alert('Error', result.error ?? 'Something went wrong');
      }
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <View style={defaultStyles.container}>
        <Text style={defaultStyles.header}>Welcome back</Text>
        <Text style={defaultStyles.descriptionText}>Enter the phone number associated with your account.</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Code" placeholderTextColor={Colors.gray} value={countryCode} onChangeText={setCountryCode} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mobile number" placeholderTextColor={Colors.gray} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
        </View>
        <TouchableOpacity style={[defaultStyles.pillButton, phoneNumber && !loading ? styles.enabled : styles.disabled]} onPress={onLogin} disabled={!phoneNumber || loading}>
          <Text style={defaultStyles.buttonText}>{loading ? 'Sending…' : 'Continue'}</Text>
        </TouchableOpacity>
        <Link href="/signup" replace asChild>
          <TouchableOpacity style={{ marginTop: 16 }}><Text style={defaultStyles.textLink}>Don't have an account? Sign up</Text></TouchableOpacity>
        </Link>
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
