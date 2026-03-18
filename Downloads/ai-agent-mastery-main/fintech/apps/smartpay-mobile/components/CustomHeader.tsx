/**
 * CustomHeader – Smartpay.
 * Blurred header with avatar, search, and action icons. Reuse across authenticated tabs.
 * Location: fintech/smartpay/components/CustomHeader.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function CustomHeader() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  return (
    <BlurView intensity={80} tint="light" style={[styles.blur, { paddingTop: top }]}>
      <View style={styles.row}>
        <Link href="/(authenticated)/(modals)/account" asChild>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SP</Text>
          </View>
        </Link>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={Colors.ink} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search"
            placeholderTextColor={Colors.gray}
          />
        </View>
        <View style={styles.iconCircle}>
          <Ionicons name="stats-chart" size={20} color={Colors.ink} />
        </View>
        <View style={styles.iconCircle}>
          <Ionicons name="card" size={20} color={Colors.ink} />
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
  },
  searchIcon: { padding: 10 },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    paddingLeft: 0,
    fontSize: 16,
    color: Colors.ink,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
