/**
 * CopilotConfirmationModal – Smartpay Agentic Copilot.
 * Modal dialog for confirming pending copilot actions.
 * Location: fintech/smartpay/mobile/components/copilot/CopilotConfirmationModal.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useCopilot } from '@/contexts/copilot/CopilotContext';

/**
 * CopilotConfirmationModal component that displays pending action confirmations.
 * Reads pendingAction from CopilotContext and shows modal when action is pending.
 */
export function CopilotConfirmationModal() {
  const { pendingAction, clearPendingAction } = useCopilot();

  /**
   * Handles confirmation button press.
   * Calls resolve(true) and clears the pending action.
   */
  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction.resolve(true);
      clearPendingAction();
    }
  };

  /**
   * Handles cancel button press.
   * Calls resolve(false) and clears the pending action.
   */
  const handleCancel = () => {
    if (pendingAction) {
      pendingAction.resolve(false);
      clearPendingAction();
    }
  };

  return (
    <Modal
      visible={pendingAction !== null}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 mx-6 w-full max-w-md">
          {/* Action Label */}
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            {pendingAction?.label}
          </Text>

          {/* Action Detail */}
          <Text className="text-base text-gray-600 mb-6">
            {pendingAction?.detail}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row justify-end gap-3">
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleCancel}
              className="px-6 py-3 rounded-lg"
              style={styles.cancelButton}
            >
              <Text className="text-base font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              className="px-6 py-3 rounded-lg bg-blue-600"
              style={styles.confirmButton}
            >
              <Text className="text-base font-medium text-white">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#0029D6',
  },
});
