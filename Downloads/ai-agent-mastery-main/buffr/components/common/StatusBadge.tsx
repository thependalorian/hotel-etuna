/**
 * Status Badge Component
 * 
 * Location: components/common/StatusBadge.tsx
 * Purpose: Reusable status badge component for displaying loan/wallet status
 * 
 * Features:
 * - Color-coded status display
 * - Optional icon
 * - Consistent styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface StatusBadgeProps {
  status: string;
  label?: string;
  showIcon?: boolean;
  iconName?: string;
  customColor?: string;
}

export default function StatusBadge({
  status,
  label,
  showIcon = true,
  iconName = 'flag',
  customColor,
}: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    if (customColor) return customColor;
    
    switch (status.toLowerCase()) {
      case 'starting':
      case 'active':
      case 'paid':
        return '#10B981'; // Green
      case 'rejected':
      case 'failed':
        return '#EF4444'; // Red
      case 'pending':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    if (label) return label;
    
    switch (status.toLowerCase()) {
      case 'starting':
        return 'Starting';
      case 'active':
        return 'Active';
      case 'paid':
        return 'Paid';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
      {showIcon && (
        <FontAwesome name={iconName as any} size={12} color={statusColor} />
      )}
      <Text style={[styles.badgeText, { color: statusColor }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
