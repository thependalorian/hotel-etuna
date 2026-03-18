import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { designSystem } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { useUser } from '@/contexts/UserContext';
import { clearSession } from '@/services/auth';

export default function ProfileScreen() {
  const { profile, smartpayId, clearUser } = useUser();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            await clearUser();
            await AsyncStorage.removeItem('smartpay_onboarding_complete');
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 'account', label: 'Account Details', icon: 'person-outline', route: '/account' },
    { id: 'security', label: 'Security', icon: 'shield-outline', route: '/security' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: '/notifications-settings' },
    { id: 'language', label: 'Language', icon: 'language-outline', route: '/language' },
    { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: '/help' },
    { id: 'about', label: 'About SmartPay', icon: 'information-circle-outline', route: '/about' },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />

        <ScrollView style={styles.scrollView}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || ''}
              </Text>
            </View>
            <Text style={styles.name}>
              {profile?.firstName && profile?.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : 'User'}
            </Text>
            <Text style={styles.phone}>{profile?.phone || 'No phone'}</Text>
            {smartpayId && <Text style={styles.smartpayId}>ID: {smartpayId}</Text>}
          </View>

          <View style={styles.section}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={designSystem.colors.text} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={designSystem.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={designSystem.colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: designSystem.colors.background },
  safe: { flex: 1 },
  scrollView: { flex: 1 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xl,
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
  },
  avatarText: {
    ...designSystem.typography.textStyles.heading,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  name: {
    ...designSystem.typography.textStyles.titleLg,
    color: designSystem.colors.text,
    marginBottom: 4,
  },
  phone: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    marginBottom: 4,
  },
  smartpayId: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textTertiary,
  },
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    marginBottom: designSystem.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: designSystem.colors.error,
  },
  logoutText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.error,
    fontWeight: '600',
  },
  version: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textTertiary,
    textAlign: 'center',
    paddingBottom: 100,
  },
});
