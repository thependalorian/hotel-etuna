/**
 * Card Details Screen
 * 
 * Location: app/cards/[id].tsx
 * Purpose: Display detailed information about a linked card/account
 * 
 * Features:
 * - Card details (number, expiry, holder name)
 * - Account creation/linking date
 * - Last used date
 * - Verification status
 * - Management options (set default, remove)
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCards, Card } from '@/contexts/CardsContext';
import { ScreenHeader, PillButton, SectionHeader, ListItemCard } from '@/components/common';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function CardDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCardById, setDefaultCard, deleteCard } = useCards();

  const card = useMemo(() => {
    return id ? getCardById(id) : null;
  }, [id, getCardById]);

  const handleBack = () => {
    router.back();
  };

  const handleSetDefault = async () => {
    if (!card) return;
    try {
      await setDefaultCard(card.id);
      Alert.alert('Success', 'Card set as default payment method');
    } catch (error) {
      Alert.alert('Error', 'Failed to set default card');
    }
  };

  const handleRemoveCard = () => {
    if (!card) return;
    Alert.alert(
      'Remove Card',
      `Are you sure you want to remove card ending in ${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove card');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (!card) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Card Details" onBack={handleBack} showBackButton />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Card not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Card Details" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <View style={styles.cardVisual}>
            <View style={styles.cardGradient} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardNetwork}>
                {card.network === 'visa' ? 'VISA' : card.network === 'mastercard' ? 'MASTERCARD' : 'CARD'}
              </Text>
              <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
              <Text style={styles.cardholderName}>{card.cardholderName}</Text>
              <Text style={styles.expiryDate}>{card.expiryDate}</Text>
            </View>
          </View>
        </View>

        {/* Card Information */}
        <View style={styles.section}>
          <SectionHeader title="Card Information" />
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Card Type</Text>
              <Text style={styles.infoValue}>
                {card.cardType === 'credit' ? 'Credit Card' : 'Debit Card'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <Text style={styles.infoValue}>
                {card.network.charAt(0).toUpperCase() + card.network.slice(1)}
              </Text>
            </View>
            {card.bankName && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bank</Text>
                  <Text style={styles.infoValue}>{card.bankName}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <SectionHeader title="Account Details" />
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Linked On</Text>
              <Text style={styles.infoValue}>{formatDate(card.createdAt)}</Text>
            </View>
            {card.lastUsedAt && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Used</Text>
                  <Text style={styles.infoValue}>{formatDate(card.lastUsedAt)}</Text>
                </View>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    card.isVerified && card.isActive
                      ? styles.statusDotActive
                      : styles.statusDotInactive,
                  ]}
                />
                <Text style={styles.infoValue}>
                  {card.isVerified && card.isActive
                    ? 'Active'
                    : card.isVerified
                    ? 'Verified'
                    : 'Pending'}
                </Text>
              </View>
            </View>
            {card.isDefault && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Default Payment</Text>
                  <FontAwesome name="check-circle" size={16} color={Colors.success} />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!card.isDefault && (
            <PillButton
              label="Set as Default"
              variant="outline"
              onPress={handleSetDefault}
              style={styles.actionButton}
            />
          )}
          <PillButton
            label="Remove Card"
            variant="outline"
            onPress={handleRemoveCard}
            style={[styles.actionButton, styles.removeButton]}
            textStyle={{ color: Colors.error }}
          />
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardPreview: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  cardVisual: {
    height: 200,
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
  cardGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    opacity: 0.9,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardNetwork: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 20,
    letterSpacing: 2,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardholderName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
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
  statusDotInactive: {
    backgroundColor: Colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  removeButton: {
    borderColor: Colors.error,
  },
});
