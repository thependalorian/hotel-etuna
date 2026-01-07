/**
 * Buffr Main Account Details Screen
 * 
 * Location: app/cards/buffr-account.tsx
 * Purpose: Display detailed information about the Buffr main account
 * 
 * Features:
 * - Account details (account number, balance)
 * - Account creation date
 * - Account status
 * - Management options
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SectionHeader } from '@/components/common';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function BuffrAccountDetailsScreen() {
  const router = useRouter();
  const { user } = useUser();

  const handleBack = () => {
    router.back();
  };

  // Generate Buffr account number (same as AccountQuickView)
  const getBuffrAccountNumber = (): string => {
    if (!user) return '018';
    const identifier = user.id || user.email || user.phoneNumber || '018';
    const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000).padStart(3, '0');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const accountNumber = getBuffrAccountNumber();
  const accountCreatedAt = user?.createdAt;

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Buffr Account" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Preview */}
        <View style={styles.accountPreview}>
          <View style={styles.accountVisual}>
            <View style={styles.accountGradient} />
            <View style={styles.accountInfo}>
              <View style={styles.logoContainer}>
                <FontAwesome name="credit-card" size={32} color={Colors.white} />
              </View>
              <Text style={styles.accountLabel}>Buffr Account</Text>
              <Text style={styles.accountNumberDisplay}>..{accountNumber}</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <SectionHeader title="Account Information" />
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>Main Buffr Account</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Number</Text>
              <Text style={styles.infoValue}>..{accountNumber}</Text>
            </View>
            {user?.buffrCardBalance !== undefined && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Current Balance</Text>
                  <Text style={styles.infoValue}>
                    {user.currency || 'N$'} {user.buffrCardBalance.toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <SectionHeader title="Account Details" />
          <View style={styles.infoCard}>
            {accountCreatedAt && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Account Created</Text>
                  <Text style={styles.infoValue}>{formatDate(accountCreatedAt)}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, styles.statusDotActive]} />
                <Text style={styles.infoValue}>Active</Text>
              </View>
            </View>
            {user?.email && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </>
            )}
            {user?.phoneNumber && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user.phoneNumber}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  accountPreview: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  accountVisual: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  accountGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    opacity: 0.9,
  },
  accountInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  logoContainer: {
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  accountNumberDisplay: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
