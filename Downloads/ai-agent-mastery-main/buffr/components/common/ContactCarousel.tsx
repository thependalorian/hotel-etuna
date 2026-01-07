/**
 * Contact Carousel Component
 * 
 * Location: components/common/ContactCarousel.tsx
 * Purpose: Horizontal scrollable carousel of contacts with circular avatars
 * 
 * Used for: Recents, Favorites sections in Select Recipient screen
 * Reusable across: Any screen needing horizontal contact selection
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import ProfileAvatar from '@/components/ProfileAvatar';

export interface ContactCarouselItem {
  id: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
  isGroup?: boolean;
  groupCount?: number;
}

interface ContactCarouselProps {
  contacts: ContactCarouselItem[];
  onContactPress: (contact: ContactCarouselItem) => void;
  avatarSize?: number;
  showPhoneNumber?: boolean;
}

export default function ContactCarousel({
  contacts,
  onContactPress,
  avatarSize = 60,
  showPhoneNumber = false,
}: ContactCarouselProps) {
  const renderContact = (contact: ContactCarouselItem) => (
    <TouchableOpacity
      key={contact.id}
      style={[styles.contactContainer, { width: avatarSize + 20 }]}
      onPress={() => onContactPress(contact)}
      activeOpacity={0.7}
    >
      {contact.isGroup ? (
        <View style={[styles.groupAvatar, { width: avatarSize, height: avatarSize }]}>
          <View style={styles.groupAvatarInner}>
            <FontAwesome name="users" size={avatarSize * 0.4} color={Colors.primary} />
            {contact.groupCount && contact.groupCount > 0 && (
              <View style={styles.groupCountBadge}>
                <Text style={styles.groupCountText}>+{contact.groupCount}</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <ProfileAvatar
          size={avatarSize}
          imageUri={contact.avatar}
        />
      )}
      <Text style={styles.contactName} numberOfLines={1}>
        {contact.name}
      </Text>
      {showPhoneNumber && contact.phoneNumber && (
        <Text style={styles.contactPhone} numberOfLines={1}>
          {contact.phoneNumber}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (contacts.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContent}
    >
      {contacts.map(renderContact)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carouselContent: {
    paddingRight: 20,
    gap: 16,
  },
  contactContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  groupAvatar: {
    borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  groupAvatarInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  groupCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 80,
  },
  contactPhone: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 80,
  },
});
