import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { designSystem } from '@/constants/designSystem';
import { removeSecureItem } from '@/services/secureStorage';
import { KEY_ONBOARDING_DONE } from '@/services/secureStorage';

const ds = designSystem;

export default function ModalScreen() {
  const router = useRouter();

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset onboarding',
      'You will see the welcome slides again next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await removeSecureItem(KEY_ONBOARDING_DONE);
            router.replace('/(onboarding)');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Smartpay</Text>
      <TouchableOpacity style={styles.button} onPress={handleResetOnboarding} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Reset onboarding</Text>
      </TouchableOpacity>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.neutral.background,
  },
  title: {
    ...ds.typography.textStyles.h1,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.xs,
  },
  subtitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xl,
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: ds.spacing.lg,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.neutral.surface,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  buttonText: {
    ...ds.typography.textStyles.button,
    color: ds.colors.brand.primary,
  },
});
