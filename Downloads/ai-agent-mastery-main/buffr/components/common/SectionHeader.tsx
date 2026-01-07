/**
 * SectionHeader Component
 * 
 * Location: components/common/SectionHeader.tsx
 * Purpose: Reusable section header/title component
 * 
 * Features:
 * - Consistent section title styling
 * - Optional description text
 * - Consistent spacing and typography
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface SectionHeaderProps {
  title: string;
  description?: string;
  style?: object;
}

export default function SectionHeader({
  title,
  description,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
