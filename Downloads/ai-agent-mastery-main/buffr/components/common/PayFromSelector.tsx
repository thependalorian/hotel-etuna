/**
 * PayFromSelector Component
 * 
 * Location: components/common/PayFromSelector.tsx
 * Purpose: Modal component for selecting payment source (Buffr Account, Cards, Banks, Wallets)
 * 
 * Used in:
 * - Send Money flow
 * - Add Wallet (Auto Pay setup)
 * - Loan payments
 * - Add Money to Wallet
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useCards } from '@/contexts/CardsContext';
import { useBanks } from '@/contexts/BanksContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import PaymentMethodTypeModal, { PaymentMethodType } from './PaymentMethodTypeModal';

export interface PaymentSource {
  id: string;
  name: string;
  displayName: string;
  type: 'buffr' | 'card' | 'bank' | 'wallet';
  icon?: string;
  color?: string;
  last4?: string;
  balance?: number;
  currency?: string;
}

interface PayFromSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedSourceId?: string;
  onSelectSource: (source: PaymentSource) => void;
  title?: string;
  subtitle?: string;
  onAddNew?: () => void;
}

export default function PayFromSelector({
  visible,
  onClose,
  selectedSourceId,
  onSelectSource,
  title = 'Pay From',
  subtitle = 'Choose profile to make the payment from.',
  onAddNew,
}: PayFromSelectorProps) {
  const router = useRouter();
  const { user } = useUser();
  const { wallets } = useWallets();
  const { cards } = useCards();
  const { banks } = useBanks();
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // Build list of available payment sources
  const paymentSources = useMemo<PaymentSource[]>(() => {
    const sources: PaymentSource[] = [];

    // 1. Buffr Account (always first)
    if (user) {
      sources.push({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user.buffrCardBalance,
        currency: user.currency || 'N$',
      });
    }

    // 2. Wallets
    wallets.forEach((wallet) => {
      sources.push({
        id: `wallet-${wallet.id}`,
        name: wallet.name,
        displayName: wallet.name,
        type: 'wallet',
        icon: wallet.icon,
        color: Colors.primary, // Use primary color for wallets
        balance: wallet.balance,
        currency: wallet.currency || 'N$',
      });
    });

    // 3. Cards
    cards.forEach((card) => {
      sources.push({
        id: `card-${card.id}`,
        name: `${card.network.charAt(0).toUpperCase() + card.network.slice(1)} Card`,
        displayName: `${card.network.charAt(0).toUpperCase() + card.network.slice(1)} •••• ${card.last4}`,
        type: 'card',
        last4: card.last4,
        color: card.network === 'visa' ? '#1A1F71' : card.network === 'mastercard' ? '#EB001B' : Colors.primary,
      });
    });

    // 4. Banks
    banks.forEach((bank) => {
      sources.push({
        id: `bank-${bank.id}`,
        name: `${bank.bankName} •••• ${bank.last4}`,
        displayName: `${bank.bankName} •••• ${bank.last4}`,
        type: 'bank',
        last4: bank.last4,
        color: Colors.info, // Use info color for banks
      });
    });

    console.log('Payment sources built:', sources.length, sources);
    return sources;
  }, [user, wallets, cards, banks]);

  const handleSelect = (source: PaymentSource) => {
    onSelectSource(source);
    onClose();
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      setShowPaymentMethodModal(true);
    }
  };

  const handlePaymentMethodTypeSelected = (type: PaymentMethodType) => {
    if (type === 'card') {
      router.push('/add-card');
    } else if (type === 'bank') {
      router.push('/add-bank');
    }
    onClose();
  };

  const getSourceIcon = (source: PaymentSource) => {
    if (source.type === 'wallet' && source.icon) {
      return source.icon as React.ComponentProps<typeof FontAwesome>['name'];
    }
    if (source.type === 'card') {
      return 'credit-card';
    }
    if (source.type === 'bank') {
      return 'bank';
    }
    return 'credit-card'; // Default for Buffr Account
  };

  const getSourceInitial = (source: PaymentSource) => {
    if (source.type === 'buffr') {
      return 'U'; // Buffr logo initial
    }
    return source.name.charAt(0).toUpperCase();
  };

  const getSourceDisplayText = (source: PaymentSource) => {
    if (source.type === 'card' && source.last4) {
      return `${source.name} •••• ${source.last4}`;
    }
    if (source.type === 'bank') {
      return source.displayName;
    }
    if (source.balance !== undefined) {
      return `${source.displayName} (${source.currency || 'N$'} ${source.balance.toLocaleString()})`;
    }
    return source.displayName;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <FontAwesome name="times" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Payment Sources List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {paymentSources.map((source) => {
              const isSelected = selectedSourceId === source.id;
              const iconName = getSourceIcon(source);
              const initial = getSourceInitial(source);
              const displayText = getSourceDisplayText(source);

              return (
                <TouchableOpacity
                  key={source.id}
                  style={[
                    styles.sourceItem,
                    isSelected && styles.sourceItemSelected,
                  ]}
                  onPress={() => handleSelect(source)}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.sourceIcon,
                      { backgroundColor: source.color || Colors.primary },
                    ]}
                  >
                    {source.type === 'wallet' && source.icon ? (
                      <FontAwesome
                        name={iconName}
                        size={20}
                        color={Colors.white}
                      />
                    ) : (
                      <Text style={styles.sourceIconText}>
                        {source.type === 'buffr' ? 'U' : initial}
                      </Text>
                    )}
                  </View>

                  {/* Name and Details */}
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>{source.name}</Text>
                    {source.type === 'card' && source.last4 && (
                      <Text style={styles.sourceDetails}>•••• {source.last4}</Text>
                    )}
                    {source.type === 'bank' && (
                      <Text style={styles.sourceDetails}>{source.displayName}</Text>
                    )}
                    {source.balance !== undefined && (
                      <Text style={styles.sourceDetails}>
                        {source.currency || 'N$'} {source.balance.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  {/* Selection Indicator (Diamond) */}
                  <View style={styles.indicatorContainer}>
                    {isSelected ? (
                      <View style={styles.indicatorFilled} />
                    ) : (
                      <View style={styles.indicatorHollow} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Add New Payment Method Button */}
            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus-circle" size={24} color={Colors.primary} />
              <Text style={styles.addMethodText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Payment Method Type Selection Modal */}
      <PaymentMethodTypeModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSelectType={handlePaymentMethodTypeSelected}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    gap: 12,
  },
  sourceItemSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryMuted + '20',
  },
  sourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  sourceInfo: {
    flex: 1,
    gap: 4,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sourceDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  indicatorContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorFilled: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  indicatorHollow: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 50, // Fixed height for pill shape
    gap: 12,
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
