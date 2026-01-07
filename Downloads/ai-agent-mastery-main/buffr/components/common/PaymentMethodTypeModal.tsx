/**
 * PaymentMethodTypeModal Component
 * 
 * Location: components/common/PaymentMethodTypeModal.tsx
 * Purpose: Modal for selecting payment method type (Card or Bank Account)
 * 
 * Used when user clicks "Add New Payment Method" to choose between adding a card or bank account
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

export type PaymentMethodType = 'card' | 'bank';

interface PaymentMethodTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: PaymentMethodType) => void;
  title?: string;
  subtitle?: string;
}

export default function PaymentMethodTypeModal({
  visible,
  onClose,
  onSelectType,
  title = 'Add Payment Method',
  subtitle = 'Choose how you want to add a payment method',
}: PaymentMethodTypeModalProps) {
  const handleSelect = (type: PaymentMethodType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="times" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <ScrollView
                style={styles.optionsContainer}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {/* Card Option */}
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect('card')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: Colors.primary }]}>
                    <FontAwesome name="credit-card" size={24} color={Colors.white} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Add Card</Text>
                    <Text style={styles.optionDescription}>
                      Link a debit or credit card
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Bank Account Option */}
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect('bank')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: Colors.info }]}>
                    <FontAwesome name="bank" size={24} color={Colors.white} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Add Bank Account</Text>
                    <Text style={styles.optionDescription}>
                      Link a checking or savings account
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '60%',
    minHeight: 200,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 70, // Fixed height
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
