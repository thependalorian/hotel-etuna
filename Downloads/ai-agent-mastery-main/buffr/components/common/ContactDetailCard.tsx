/**
 * Contact Detail Card Component
 * 
 * Location: components/common/ContactDetailCard.tsx
 * Purpose: Display contact information with profile image, name, and phone number
 * 
 * Used for: Contact detail screens
 * Reusable across: Any screen displaying detailed contact information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Colors from '@/constants/Colors';
import ProfileAvatar from '@/components/ProfileAvatar';

export interface ContactDetailCardData {
  name: string;
  phoneNumber: string;
  avatar?: string;
}

interface ContactDetailCardProps {
  contact: ContactDetailCardData;
  avatarSize?: number;
}

export default function ContactDetailCard({
  contact,
  avatarSize = 60,
}: ContactDetailCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground} />
      <View style={styles.content}>
        <ProfileAvatar
          size={avatarSize}
          imageUri={contact.avatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={styles.contactPhone} numberOfLines={1}>
            {contact.phoneNumber}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundGray,
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
