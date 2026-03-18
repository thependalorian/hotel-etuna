/**
 * ContactChip – Circular contact avatar with selection state
 * Figma spec: 40px circular avatar, 2px border when selected
 * Touch target: 44px (using hitSlop)
 * Location: mobile/components/shared/ContactChip.tsx
 * 
 * USAGE:
 * ```tsx
 * <ContactChip
 *   contact={{ id: '1', name: 'John Doe', avatarUri: '...' }}
 *   selected={false}
 *   onPress={(contact) => handleSelect(contact)}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';
import type { Contact } from '@/services/send';

export interface ContactChipProps {
  contact: Contact;
  selected?: boolean;
  onPress?: (contact: Contact) => void;
}

export function ContactChip({
  contact,
  selected = false,
  onPress,
}: ContactChipProps) {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(contact)}
      activeOpacity={0.7}
      hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      accessibilityLabel={`${contact.name}${selected ? ', selected' : ''}`}
      accessibilityRole="button"
    >
      <View style={[styles.avatar, selected && styles.avatarSelected]}>
        {contact.avatarUri ? (
          <Image source={{ uri: contact.avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: DS.components.contactChip.size,
    height: DS.components.contactChip.size,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: DS.components.contactChip.size,
    height: DS.components.contactChip.size,
    borderRadius: DS.components.contactChip.borderRadius,
    borderWidth: 1,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  avatarSelected: {
    borderWidth: 2,
    borderColor: DS.colors.figmaPrimary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 14,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
