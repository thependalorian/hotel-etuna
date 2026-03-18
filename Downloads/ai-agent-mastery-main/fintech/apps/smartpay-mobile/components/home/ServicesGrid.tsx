/**
 * ServicesGrid - Smartpay Home Services
 * 
 * Figma Specs:
 * - 3×3 grid layout (9 tiles)
 * - Tile size: 110×110px (calculated from screen width)
 * - Gap: 16px between tiles
 * - Calculation: (screenWidth - padding - gaps) / 3
 * - Services array from designSystem.colors.services
 * 
 * @see Figma Node: ServiceCard Grid
 * @location components/home/ServicesGrid.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';
import { ServiceTile, Service } from './ServiceTile';

export interface ServicesGridProps {
  /** Array of services to display */
  services?: Service[];
  /** Callback when a service is pressed */
  onServicePress?: (service: Service) => void;
  /** Callback for navigation with route string */
  onNavigate?: (route: string) => void;
}

// Calculate tile width based on screen dimensions
// Formula: (screenWidth - horizontalPadding*2 - gap*(columns-1)) / columns
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = DS.spacing.horizontalPadding;
const GAP = 16;
const NUM_COLUMNS = 3;
const TILE_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

// Default services if none provided
const DEFAULT_SERVICES: Service[] = [
  {
    id: 'proof-of-life',
    label: 'Proof of Life',
    icon: 'shield-checkmark-outline',
    color: '#FFB800',
    route: '/(authenticated)/proof-of-life/intro',
  },
  {
    id: 'receive',
    label: 'Receive',
    icon: 'arrow-down-circle-outline',
    color: '#22C55E',
    route: '/(authenticated)/receive',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: 'wallet-outline',
    color: '#0029D6',
    route: '/(authenticated)/wallets',
  },
  {
    id: 'cash-out',
    label: 'Cash Out',
    icon: 'cash-outline',
    color: '#F59E0B',
    route: '/(authenticated)/cash-out',
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    icon: 'gift-outline',
    color: '#E11D48',
    route: '/voucher',
  },
  {
    id: 'find-agent',
    label: 'Find Agent',
    icon: 'location-outline',
    color: '#2563EB',
    route: '/agents',
  },
  {
    id: 'loans',
    label: 'Loans',
    icon: 'business-outline',
    color: '#7C3AED',
    route: '/loans',
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: 'people-outline',
    color: '#EC4899',
    route: '/(authenticated)/groups',
  },
  {
    id: 'bills',
    label: 'Bills',
    icon: 'document-text-outline',
    color: '#8B5CF6',
    route: '/bills',
  },
];

/**
 * ServicesGrid component - 3×3 grid of service tiles
 * 
 * Figma: 3 columns, 16px gap, ~110px tiles
 */
export function ServicesGrid({ 
  services = DEFAULT_SERVICES, 
  onServicePress,
  onNavigate,
}: ServicesGridProps) {
  const handleServicePress = (service: Service) => {
    if (onServicePress) {
      onServicePress(service);
    } else if (onNavigate) {
      onNavigate(service.route);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
      </View>

      {/* 3×3 Grid */}
      <View style={styles.grid}>
        {services.map((service) => (
          <View key={service.id} style={styles.tileWrapper}>
            <ServiceTile
              service={service}
              width={TILE_WIDTH}
              onPress={() => handleServicePress(service)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DS.spacing.sectionSpacing,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.horizontalPadding,
    marginBottom: DS.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DS.colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DS.spacing.horizontalPadding,
    gap: GAP,
  },
  tileWrapper: {
    // Width and height calculated dynamically
  },
});
