/**
 * Verify – Legacy OTP entry; redirects to onboarding OTP screen.
 * PRD §4.7.1 / Appendix G. Auth: backend verifyOtp via /onboarding/otp.
 * Location: fintech/smartpay/mobile/app/verify/[phone].tsx
 */
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { defaultStyles } from '@/constants/Styles';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, signin } = useLocalSearchParams<{ phone: string; signin?: string }>();

  useEffect(() => {
    if (!phone) return;
    const decoded = decodeURIComponent(phone);
    router.replace({ pathname: '/onboarding/otp', params: { phone: decoded, ...(signin ? { signin } : {}) } });
  }, [phone, signin]);

  if (!phone) {
    return (
      <View style={defaultStyles.container}>
        <Text style={defaultStyles.header}>Invalid link</Text>
        <Text style={defaultStyles.descriptionText}>Phone number is missing. Please start again from sign up or log in.</Text>
        <Link href="/login" replace asChild>
          <TouchableOpacity><Text style={defaultStyles.textLink}>Go to log in</Text></TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ActivityIndicator size="large" />
      <Text style={[defaultStyles.descriptionText, { marginTop: 16 }]}>Taking you to verification…</Text>
    </View>
  );
}
