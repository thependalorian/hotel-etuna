/**
 * SettingsScreen Component
 * 
 * Location: components/settings/SettingsScreen.tsx
 * Purpose: Main settings screen with options
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import SettingsItem from '@/components/common/SettingsItem';

interface SettingsOption {
  id: string;
  title: string;
  icon: string;
  onPress?: () => void;
  showChevron?: boolean;
}

interface SettingsScreenProps {
  onOptionPress?: (optionId: string) => void;
}

const settingsOptions: SettingsOption[] = [
  { id: 'profile', title: 'Profile', icon: 'user', showChevron: true },
  { id: 'security', title: 'Security', icon: 'lock', showChevron: true },
  { id: 'notifications', title: 'Notifications', icon: 'bell', showChevron: true },
  { id: 'cards', title: 'Cards & Wallets', icon: 'credit-card', showChevron: true },
  { id: 'privacy', title: 'Privacy', icon: 'shield', showChevron: true },
  { id: 'help', title: 'Help & Support', icon: 'question-circle', showChevron: true },
  { id: 'about', title: 'About', icon: 'info-circle', showChevron: true },
  { id: 'logout', title: 'Log Out', icon: 'sign-out', showChevron: false },
];

export default function SettingsScreen({ onOptionPress }: SettingsScreenProps) {
  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Settings</Text>

      <View style={styles.optionsList}>
        {settingsOptions.map((option, index) => (
          <View key={option.id} style={styles.optionItemWrapper}>
            <SettingsItem
              title={option.title}
              icon={option.icon}
              onPress={() => onOptionPress?.(option.id)}
              isLast={!option.showChevron || index === settingsOptions.length - 1}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  optionsList: {
    marginTop: 24,
    gap: 8,
  },
  optionItemWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
