/**
 * Dropdown – Simple dropdown menu (no Zeego). Options list in a modal or inline.
 * Enhanced with haptic feedback. Used for account actions, statement, etc.
 * Location: fintech/smartpay/components/Dropdown.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface DropdownOption {
  id: string;
  label: string;
  icon?: { ios: string; android: string; web: string };
  onSelect: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
}

export default function Dropdown({ trigger, options }: DropdownProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (opt: DropdownOption) => {
    Haptics.selectionAsync();
    opt.onSelect();
    setVisible(false);
  };
  
  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
  };

  return (
    <>
      <Pressable onPress={handleOpen}>{trigger}</Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.option}
                onPress={() => handleSelect(opt)}
                activeOpacity={0.7}
              >
                {opt.icon && (
                  <SymbolView
                    name={opt.icon}
                    size={20}
                    tintColor={ds.colors.neutral.textSecondary}
                    style={styles.optionIcon}
                  />
                )}
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: ds.spacing.lg,
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    minWidth: 200,
    ...ds.shadows.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
  },
  optionIcon: { marginRight: ds.spacing.sm },
  optionLabel: {
    fontSize: 16,
    color: ds.colors.neutral.text,
    fontWeight: '500',
  },
});
