/**
 * Contact List Item Component
 * 
 * Location: components/common/ContactListItem.tsx
 * Purpose: Vertical list item for contacts (used in Contacts section)
 * 
 * Used for: Contacts list in Select Recipient screen
 * Reusable across: Any screen needing vertical contact list items
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import ProfileAvatar from '@/components/ProfileAvatar';

export interface ContactListItemData {
  id: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
}

interface ContactListItemProps {
  contact: ContactListItemData;
  onPress: (contact: ContactListItemData) => void;
  avatarSize?: number;
  showPhoneNumber?: boolean;
  showChevron?: boolean;
}

export default function ContactListItem({
  contact,
  onPress,
  avatarSize = 40,
  showPhoneNumber = false,
  showChevron = false,
}: ContactListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(contact)}
      activeOpacity={0.7}
    >
      <ProfileAvatar
        size={avatarSize}
        imageUri={contact.avatar}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {contact.name}
        </Text>
        {showPhoneNumber && contact.phoneNumber && (
          <Text style={styles.contactPhone} numberOfLines={1}>
            {contact.phoneNumber}
          </Text>
        )}
      </View>
      {showChevron && (
        <FontAwesome
          name="chevron-right"
          size={16}
          color={Colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
