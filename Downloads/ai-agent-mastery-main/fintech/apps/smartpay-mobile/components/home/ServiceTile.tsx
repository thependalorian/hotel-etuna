/**
 * ServiceTile - Smartpay Home Services Grid
 * 
 * Figma Specs:
 * - Size: 110×110px (square)
 * - Border Radius: 12px
 * - Icon Size: 28px
 * - Label: 13px weight 500, max 2 lines
 * - Background: Service color + 15% opacity
 * - Pressed state: opacity 0.7
 * 
 * @see Figma Node: ServiceCard Molecule
 * @location components/home/ServiceTile.tsx
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';

export interface Service {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  route: string;
}

export interface ServiceTileProps {
  /** Service configuration */
  service: Service;
  /** Tile width (calculated by parent grid) */
  width: number;
  /** Callback when tile is pressed */
  onPress: () => void;
}

/**
 * ServiceTile component - square tile for services grid
 * 
 * Figma: 110×110px square, 12px radius, service color background
 */
export function ServiceTile({ service, width, onPress }: ServiceTileProps) {
  // Background: service color + 15% opacity
  const backgroundColor = `${service.color}26`; // 26 = 15% in hex

  return (
    <TouchableOpacity
      style={[styles.tile, { width, height: width, backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${service.label} service`}
      accessibilityRole="button"
    >
      {/* Icon */}
      <Ionicons
        name={service.icon}
        size={DS.components.serviceTile.iconSize}
        color={service.color}
      />
      
      {/* Label */}
      <Text
        style={[styles.label, { color: DS.colors.text }]}
        numberOfLines={2}
      >
        {service.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: DS.components.serviceTile.labelSize,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
