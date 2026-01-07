/**
 * Icon Picker Component
 * 
 * Location: components/common/IconPicker.tsx
 * Purpose: Reusable icon picker modal for selecting icons (wallets, loans, etc.)
 * 
 * Features:
 * - Grid layout for icons
 * - FontAwesome icon support
 * - Customizable icon list
 * - Selected state indication
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

export interface IconOption {
  name: string;
  label: string;
}

interface IconPickerProps {
  visible: boolean;
  onClose: () => void;
  icons: IconOption[];
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  title?: string;
}

export default function IconPicker({
  visible,
  onClose,
  icons,
  selectedIcon,
  onSelectIcon,
  title = 'Choose Icon',
}: IconPickerProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={icons}
            numColumns={4}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  selectedIcon === item.name && styles.iconOptionSelected,
                ]}
                onPress={() => {
                  onSelectIcon(item.name);
                  onClose();
                }}
              >
                <FontAwesome
                  name={item.name as any}
                  size={24}
                  color={selectedIcon === item.name ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.iconOptionLabel,
                    selectedIcon === item.name && styles.iconOptionLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.iconsList}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconsList: {
    paddingBottom: 10,
  },
  iconOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 100,
  },
  iconOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconOptionLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  iconOptionLabelSelected: {
    color: Colors.white,
  },
});
