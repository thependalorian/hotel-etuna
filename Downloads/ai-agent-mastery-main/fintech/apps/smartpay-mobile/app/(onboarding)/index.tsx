/**
 * Onboarding – welcome slides and Get started.
 * Location: fintech/smartpay/app/(onboarding)/index.tsx
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';
import { setSecureItem } from '@/services/secureStorage';
import { KEY_ONBOARDING_DONE } from '@/services/secureStorage';
import { SmartpayLogo } from '@/components/SmartpayLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ds = designSystem;

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Smartpay',
    subtitle: 'Your wallet, simplified. Send money, cash out, and manage your grant in one place.',
    icon: '💳',
  },
  {
    id: '2',
    title: 'Talk to your wallet',
    subtitle: 'Use the Copilot to check your balance, send money, or redeem vouchers—just ask in plain language.',
    icon: '💬',
  },
  {
    id: '3',
    title: 'You\'re in control',
    subtitle: 'Secure, transparent, and built for Namibia. We never store your bank login.',
    icon: '🔒',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const onNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finishOnboarding();
    }
  };

  const onSkip = () => finishOnboarding();

  const finishOnboarding = async () => {
    await setSecureItem(KEY_ONBOARDING_DONE, '1');
    router.replace('/(authenticated)/(tabs)');
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <SmartpayLogo size={64} useBrandColor />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{isLast ? 'Get started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ds.colors.neutral.background,
  },
  skipRow: {
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    alignItems: 'flex-end',
  },
  skipBtn: {},
  skipText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: ds.spacing.xl,
    paddingTop: ds.spacing.xxl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  logo: {
    marginBottom: ds.spacing.lg,
  },
  title: {
    ...ds.typography.textStyles.largeTitle,
    color: ds.colors.neutral.text,
    textAlign: 'center',
    marginBottom: ds.spacing.md,
  },
  subtitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    paddingHorizontal: ds.spacing.sm,
  },
  footer: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
    paddingTop: ds.spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: ds.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.neutral.border,
  },
  dotActive: {
    backgroundColor: ds.colors.brand.primary,
    width: 24,
  },
  primaryBtn: {
    backgroundColor: ds.colors.brand.primary,
    paddingVertical: 16,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    ...ds.shadows.md,
  },
  primaryBtnText: {
    ...ds.typography.textStyles.button,
    color: '#fff',
  },
});
