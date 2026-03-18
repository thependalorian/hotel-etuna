/**
 * LocationCard - Generic location display component
 * Location: fintech/smartpay/components/copilot/cards/LocationCard.tsx
 * 
 * Displays a single location (agent, ATM, or office) with key information.
 * Used in list views and as callout content in map views.
 * 
 * References:
 * - BUFFR_MOBILE_ANALYSIS.md §9.6 (Common Components)
 * - Design System: constants/designSystem.ts
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ========================================
// Types
// ========================================

export interface LocationCardProps {
  name: string;
  type: 'agent' | 'atm' | 'nampost';
  distance?: number;
  address?: string | null;
  status?: 'online' | 'offline' | 'maintenance' | 'active';
  operatingHours?: Record<string, string>;
  services?: string[];
  phone?: string | null;
  onPress?: () => void;
  onDirections?: () => void;
  compact?: boolean;
}

// ========================================
// Component
// ========================================

export function LocationCard({
  name,
  type,
  distance,
  address,
  status,
  operatingHours,
  services,
  phone,
  onPress,
  onDirections,
  compact = false,
}: LocationCardProps) {
  const typeIcon = getTypeIcon(type);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: typeIcon.color }]}>
            <Ionicons name={typeIcon.icon} size={20} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {distance !== undefined && (
              <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>
            )}
          </View>
        </View>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        )}
      </View>

      {/* Address */}
      {!compact && address && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{address}</Text>
        </View>
      )}

      {/* Operating Hours */}
      {!compact && operatingHours && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{getCurrentDayHours(operatingHours)}</Text>
        </View>
      )}

      {/* Services */}
      {!compact && services && services.length > 0 && (
        <View style={styles.servicesContainer}>
          {services.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceChip}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {services.length > 3 && (
            <Text style={styles.moreServices}>+{services.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Actions */}
      {!compact && (
        <View style={styles.actions}>
          {onDirections && (
            <TouchableOpacity style={styles.actionButton} onPress={onDirections}>
              <Ionicons name="navigate-outline" size={18} color="#0029D6" />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
          )}
          {phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={18} color="#0029D6" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ========================================
// Helper Functions
// ========================================

function getTypeIcon(type: 'agent' | 'atm' | 'nampost'): { icon: any; color: string } {
  switch (type) {
    case 'agent':
      return { icon: 'storefront-outline', color: '#0029D6' };
    case 'atm':
      return { icon: 'cash-outline', color: '#22C55E' };
    case 'nampost':
      return { icon: 'mail-outline', color: '#F59E0B' };
    default:
      return { icon: 'location-outline', color: '#64748B' };
  }
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'online':
    case 'active':
      return '#22C55E';
    case 'offline':
      return '#EF4444';
    case 'maintenance':
      return '#F59E0B';
    default:
      return '#94A3B8';
  }
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'maintenance':
      return 'Maintenance';
    case 'active':
      return 'Active';
    default:
      return 'Unknown';
  }
}

function getCurrentDayHours(hours: Record<string, string>): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[new Date().getDay()];

  // Try exact match
  if (hours[today]) {
    return `Today: ${hours[today]}`;
  }

  // Try day ranges
  const rangeKeys = Object.keys(hours).filter((key) => key.includes('-'));
  for (const range of rangeKeys) {
    const [start, end] = range.split('-');
    const startIdx = days.indexOf(start);
    const endIdx = days.indexOf(end);
    const todayIdx = new Date().getDay();
    if (startIdx <= todayIdx && todayIdx <= endIdx) {
      return `Today: ${hours[range]}`;
    }
  }

  // Default to first available hours
  const firstKey = Object.keys(hours)[0];
  return hours[firstKey] || 'Hours not available';
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerCompact: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
  },
  serviceChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  moreServices: {
    fontSize: 12,
    color: '#94A3B8',
    alignSelf: 'center',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#0029D6',
    fontWeight: '600',
  },
});
