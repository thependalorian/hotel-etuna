/**
 * RecentContactsCarousel - Smartpay Home Contacts
 * 
 * Figma Specs:
 * - Horizontal scroll of ContactChips
 * - Avatar size: 40px circular
 * - Gap: 12px between contacts
 * - Name: 12px weight 500
 * 
 * @see Figma Node: ContactChip Carousel
 * @location components/home/RecentContactsCarousel.tsx
 */
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';
import type { Contact } from '@/services/send';

export interface RecentContactsCarouselProps {
  /** Array of contacts to display */
  contacts?: Contact[];
  /** Callback when contact is pressed */
  onContactPress?: (contact: Contact) => void;
  /** Callback when send button is pressed */
  onSendPress?: () => void;
}

const AVATAR_SIZE = 40; // Figma ContactChip size

/**
 * RecentContactsCarousel component - horizontal scrollable contact chips
 * 
 * Figma: 40px circular avatars, 12px name text
 */
export function RecentContactsCarousel({
  contacts = [],
  onContactPress,
  onSendPress,
}: RecentContactsCarouselProps) {
  if (contacts.length === 0 && !onSendPress) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Contacts</Text>
        {onSendPress && (
          <TouchableOpacity
            onPress={onSendPress}
            activeOpacity={0.7}
            accessibilityLabel="Send money"
            accessibilityRole="button"
          >
            <Text style={styles.headerAction}>Send</Text>
          </TouchableOpacity>
        )}
      </View>

      {contacts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
        >
          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactChip}
              onPress={() => onContactPress && onContactPress(contact)}
              activeOpacity={0.8}
              accessibilityLabel={`Send to ${contact.name}`}
              accessibilityRole="button"
            >
              {/* Avatar - 40px circular (Figma ContactChip) */}
              <View style={styles.avatar}>
                {contact.avatarUri ? (
                  <Image source={{ uri: contact.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {(contact.name?.[0] ?? '?').toUpperCase()}
                  </Text>
                )}
              </View>
              
              {/* Name - 12px weight 500 */}
              <Text style={styles.name} numberOfLines={1}>
                {contact.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recent contacts yet</Text>
        </View>
      )}
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
  headerAction: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.brand.primary,
  },
  emptyState: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: DS.colors.textSecondary,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: 4,
  },
  contactChip: {
    alignItems: 'center',
    minWidth: 56,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: `${DS.colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: DS.colors.brand.primary,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.text,
    textAlign: 'center',
  },
});
