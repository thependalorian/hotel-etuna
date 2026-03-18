/**
 * Cash Out Success - Generic success screen
 * 
 * Features:
 * - Animated checkmark
 * - Amount cashed out
 * - Method used
 * - Reference/code (if applicable)
 * - Receipt details
 * - "Done" CTA → Home
 * 
 * Location: app/(authenticated)/cash-out/success.tsx
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { designSystem as DS } from '@/constants/designSystem';

export default function CashOutSuccessScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    recipient?: string;
    code?: string;
    reference?: string;
    processingTime?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const handleShare = async () => {
    try {
      const message = `Cash Out Receipt\n\nAmount: N$${params.amount}\nMethod: ${params.method}\n${params.recipient ? `Recipient: ${params.recipient}\n` : ''}${params.code ? `Collection Code: ${params.code}\n` : ''}${params.reference ? `Reference: ${params.reference}\n` : ''}`;
      
      await Share.share({
        message,
        title: 'Cash Out Receipt',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleDone = () => {
    router.replace('/(authenticated)/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successSection}>
          <Animated.View style={[styles.checkmarkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark" size={48} color={DS.colors.background} />
          </Animated.View>

          <Text style={styles.successTitle}>Cash Out Successful!</Text>

          <Text style={styles.amount}>
            N${params.amount ? parseFloat(params.amount).toFixed(2) : '0.00'}
          </Text>

          <Text style={styles.subtitle}>
            {params.method || 'Cash out'} completed successfully
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Method</Text>
            <Text style={styles.detailsValue}>{params.method || 'N/A'}</Text>
          </View>

          {params.recipient && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Location/Agent</Text>
              <Text style={styles.detailsValue}>{params.recipient}</Text>
            </View>
          )}

          {params.code && (
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Collection Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{params.code}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Code Copied', 'Collection code copied to clipboard');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="copy-outline" size={20} color={DS.colors.brand.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.codeHint}>Show this code at the ATM to collect your cash</Text>
            </View>
          )}

          {params.reference && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Reference</Text>
              <Text style={styles.detailsValue}>{params.reference}</Text>
            </View>
          )}

          {params.processingTime && (
            <View style={styles.processingTimeSection}>
              <Ionicons name="time-outline" size={20} color={DS.colors.brand.primary} />
              <View style={styles.processingTimeInfo}>
                <Text style={styles.processingTimeLabel}>Processing Time</Text>
                <Text style={styles.processingTimeValue}>{params.processingTime}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Date & Time</Text>
            <Text style={styles.detailsValue}>
              {new Date().toLocaleString('en-NA', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
            accessibilityLabel="Share receipt"
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={20} color={DS.colors.brand.primary} />
            <Text style={styles.shareButtonText}>Share Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <Button
          title="Done"
          onPress={handleDone}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xl,
    paddingBottom: 100,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xl,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.lg,
  },
  successTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  amount: {
    fontSize: DS.typography.fontSize['4xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
    marginBottom: DS.spacing.xs,
  },
  subtitle: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    gap: DS.spacing.md,
    marginTop: DS.spacing.lg,
  },
  detailsTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailsLabel: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    flex: 1,
  },
  detailsValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  codeSection: {
    paddingVertical: DS.spacing.sm,
  },
  codeLabel: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    borderColor: DS.colors.brand.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.sm,
    lineHeight: 20,
  },
  processingTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.brand.primaryMuted,
    borderRadius: DS.radius.md,
  },
  processingTimeInfo: {
    flex: 1,
  },
  processingTimeLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.brand.primary,
    marginBottom: 2,
  },
  processingTimeValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
  },
  actionsSection: {
    marginTop: DS.spacing.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    borderRadius: DS.radius.lg,
    borderWidth: 2,
    borderColor: DS.colors.brand.primary,
  },
  shareButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
  },
});
