import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredToken } from '@/services/auth';
import { LoadingState } from '@/components/ui';

export default function AppEntry() {
  const [destination, setDestination] = useState<'home' | 'sign-in' | 'onboarding' | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('smartpay_onboarding_complete');
      
      if (onboardingComplete !== 'true') {
        setDestination('onboarding');
        return;
      }
      
      const token = await getStoredToken();
      if (!token) {
        setDestination('sign-in');
      } else {
        setDestination('home');
      }
    } catch (error) {
      console.error('Session check error:', error);
      setDestination('onboarding');
    }
  };

  if (!destination) {
    return <LoadingState />;
  }

  if (destination === 'home') return <Redirect href="/(tabs)/home" />;
  if (destination === 'sign-in') return <Redirect href="/onboarding/phone" />;
  return <Redirect href="/onboarding" />;
}
