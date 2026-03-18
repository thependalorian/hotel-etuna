/**
 * Account modal – User account / settings. Opened from header avatar.
 * Auth: Supabase (useSupabaseAuth).
 * Location: fintech/smartpay/app/(authenticated)/(modals)/account.tsx
 */
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export default function AccountModal() {
  const router = useRouter();
  const { signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
    router.dismissAll();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Account</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/(authenticated)/kyc')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color={Colors.ink} />
          <Text style={styles.rowText}>Verify identity (KYC)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={Colors.ink} />
          <Text style={styles.rowText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  header: { padding: 16, alignItems: 'flex-end' },
  closeBtn: { padding: 8 },
  content: { flex: 1, padding: 24, backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  rowText: { fontSize: 16, fontWeight: '600', color: Colors.ink },
});
