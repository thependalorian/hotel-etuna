/**
 * ListItemCard Component
 * 
 * Location: components/common/ListItemCard.tsx
 * Purpose: Reusable list item card with icon, content, and chevron
 * 
 * Features:
 * - Icon on the left
 * - Flexible content area
 * - Optional chevron indicator
 * - Consistent card styling
 * - Touchable for navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface ListItemCardProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  iconBackgroundColor?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ListItemCard({
  icon,
  iconColor = Colors.primary,
  iconBackgroundColor = Colors.primaryMuted,
  title,
  subtitle,
  description,
  rightContent,
  showChevron = false,
  onPress,
  style,
}: ListItemCardProps) {
  const CardContent = (
    <View style={[styles.card, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
          <FontAwesome name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
        {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      </View>
      {showChevron && (
        <FontAwesome name="chevron-right" size={18} color={Colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
});
