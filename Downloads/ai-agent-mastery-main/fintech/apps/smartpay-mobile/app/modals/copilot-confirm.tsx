/**
 * Shared Copilot Confirmation + 2FA Modal – Smartpay.
 * Used by all Copilot-triggered financial actions. Location: fintech/smartpay/app/modals/copilot-confirm.tsx
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { useCopilotContext } from '@/contexts/copilot/CopilotContext';
import { designSystem } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

const PIN_LENGTH = 6;

export default function CopilotConfirmModal() {
  const { pendingAction, setPendingAction } = useCopilotContext();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  const ref = useBlurOnFulfill({ value: pin, cellCount: PIN_LENGTH });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value: pin, setValue: setPin });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinConfirm();
    }
  }, [pin]);

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometric(hasHardware && isEnrolled);
  };

  const handleBiometric = async () => {
    setIsVerifying(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm transaction',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (result.success) {
        handleConfirm();
      } else {
        Alert.alert('Authentication failed', 'Please try again or use your PIN.');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed. Please use your PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinConfirm = () => {
    if (pin.length === PIN_LENGTH) {
      handleConfirm();
    } else {
      Alert.alert('Invalid PIN', `Please enter your ${PIN_LENGTH}-digit PIN.`);
    }
  };

  const handleConfirm = () => {
    setPin('');
    if (pendingAction?.resolve) {
      pendingAction.resolve(true);
    }
    setPendingAction(null);
  };

  const handleCancel = () => {
    setPin('');
    if (pendingAction?.resolve) {
      pendingAction.resolve(false);
    }
    setPendingAction(null);
  };

  if (!pendingAction) return null;

  const toolNameFormatted = formatToolName(pendingAction.type);
  const rows = buildRowsFromAction(pendingAction);

  return (
    <Modal
      visible={!!pendingAction}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{toolNameFormatted}</Text>
          
          {pendingAction.detail && (
            <Text style={styles.summary}>{pendingAction.detail}</Text>
          )}

          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.twoFASection}>
            <Text style={styles.twoFATitle}>Confirm your identity</Text>
            
            {hasBiometric && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometric}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={designSystem.colors.neutral.text} />
                ) : (
                  <View style={styles.biometricContent}>
                    <Ionicons 
                      name="finger-print-outline" 
                      size={24} 
                      color={designSystem.colors.neutral.text} 
                    />
                    <Text style={styles.biometricText}>
                      {Platform.OS === 'ios' ? 'Use Face ID / Touch ID' : 'Use Fingerprint'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.orText}>— or enter PIN —</Text>
            
            <CodeField
              ref={ref}
              {...props}
              value={pin}
              onChangeText={setPin}
              cellCount={PIN_LENGTH}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus
              renderCell={({ index, symbol, isFocused }) => (
                <View 
                  key={index} 
                  onLayout={getCellOnLayoutHandler(index)} 
                  style={[styles.cell, isFocused && styles.cellFocused]}
                >
                  <Text style={styles.cellText}>
                    {symbol ? '•' : (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, pin.length !== PIN_LENGTH && styles.confirmButtonDisabled]}
              onPress={handlePinConfirm}
              disabled={pin.length !== PIN_LENGTH}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatToolName(toolName: string): string {
  const toolNames: Record<string, string> = {
    send_money: 'Send Money',
    cash_out: 'Cash Out',
    request_loan: 'Request Loan',
    pay_bill: 'Pay Bill',
    top_up: 'Top Up',
  };
  return toolNames[toolName] || toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function buildRowsFromAction(action: PendingAction): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const input = action.payload || {};

  if (input.amount) rows.push({ label: 'Amount', value: `NAD ${input.amount}` });
  if (input.counterparty) rows.push({ label: 'To', value: String(input.counterparty) });
  if (input.recipient) rows.push({ label: 'Recipient', value: String(input.recipient) });
  if (input.wallet) rows.push({ label: 'Wallet', value: String(input.wallet) });
  if (input.method) rows.push({ label: 'Method', value: String(input.method) });
  if (input.fee) rows.push({ label: 'Fee', value: `NAD ${input.fee}` });
  if (input.newBalance !== undefined) rows.push({ label: 'New Balance', value: `NAD ${input.newBalance}` });

  return rows;
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: designSystem.colors.neutral.surface,
    borderTopLeftRadius: designSystem.radius.lg,
    borderTopRightRadius: designSystem.radius.lg,
    padding: designSystem.spacing.lg,
    paddingBottom: 40,
    ...designSystem.shadows.lg,
  },
  title: {
    ...designSystem.typography.textStyles.h2,
    color: designSystem.colors.neutral.text,
    marginBottom: designSystem.spacing.md,
    textAlign: 'center',
  },
  summary: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: designSystem.spacing.md,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: designSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.neutral.border,
  },
  label: { 
    ...designSystem.typography.textStyles.body, 
    color: designSystem.colors.neutral.textSecondary 
  },
  value: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.text,
    fontWeight: '600',
  },
  twoFASection: { 
    marginTop: designSystem.spacing.lg 
  },
  twoFATitle: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: designSystem.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  biometricButton: {
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.neutral.muted,
    borderRadius: designSystem.radius.md,
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
  },
  biometricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  biometricText: { 
    ...designSystem.typography.textStyles.button, 
    color: designSystem.colors.neutral.text 
  },
  orText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing.md,
  },
  codeFieldRoot: { 
    marginVertical: designSystem.spacing.sm, 
    gap: designSystem.spacing.sm,
  },
  cell: { 
    flex: 1,
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: designSystem.colors.neutral.background, 
    borderRadius: designSystem.radius.sm,
    borderWidth: 1,
    borderColor: designSystem.colors.neutral.border,
  },
  cellFocused: { 
    borderWidth: 2, 
    borderColor: designSystem.colors.brand.primary,
    backgroundColor: designSystem.colors.neutral.surface,
  },
  cellText: { 
    color: designSystem.colors.neutral.text, 
    fontSize: 32,
    fontWeight: '600',
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: designSystem.spacing.md, 
    marginTop: designSystem.spacing.xl 
  },
  cancelButton: { 
    flex: 1,
    paddingHorizontal: designSystem.spacing.lg, 
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.radius.md,
    backgroundColor: designSystem.colors.neutral.muted,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.md,
    backgroundColor: designSystem.colors.brand.primary,
    borderRadius: designSystem.radius.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: designSystem.colors.brand.primaryMuted,
    opacity: 0.6,
  },
  cancelText: { 
    ...designSystem.typography.textStyles.button, 
    color: designSystem.colors.neutral.text 
  },
  confirmText: { 
    ...designSystem.typography.textStyles.button, 
    color: '#fff' 
  },
});
