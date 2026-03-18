/**
 * Sign-in with Supabase (Buffr Connect) – email + password, no OTP.
 * Location: fintech/smartpay/components/auth/SignInSupabaseScreen.tsx
 */
import React from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';
import { authScreenStyles as styles } from '@/constants/authScreenStyles';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const { neutral } = designSystem.colors;

export function SignInSupabaseScreen() {
  const { signInWithPassword } = useSupabaseAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signInWithPassword(email, password);
      if (err) {
        setError(err.message ?? 'Sign in failed');
        return;
      }
      router.replace('/(authenticated)/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.accent} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Link href="/" asChild>
            <Pressable style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </Pressable>
          </Link>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your email and password.</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            placeholder="your@email.com"
            placeholderTextColor={neutral.textSecondary}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            placeholder="••••••••"
            placeholderTextColor={neutral.textSecondary}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={({ pressed }) => [styles.button, loading && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={handleSubmit}
            disabled={loading || !email || !password}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </Pressable>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={styles.link}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
