/**
 * Select Recipient Screen - Send Money Flow Step 1/5
 * 
 * Figma Node: 92:212
 * Location: app/send-money/select-recipient.tsx
 * 
 * Components:
 * - AppHeader with "Send Money" title + back button
 * - SearchBar: "Search phone, UPI, UID" (48px pill)
 * - RecentContactsCarousel (40px chips, horizontal scroll)
 * - Contacts List (72px ListItems with avatar, name, smartpayId)
 * - Scan QR Code button (secondary, bottom)
 * 
 * Navigation:
 * - onSelectRecipient → /send-money/amount?recipient=[data]
 * 
 * ASCII Diagram (Figma):
 * ┌─────────────────────────────────────────┐
 * │ [← Back]  Send Money                    │
 * ├─────────────────────────────────────────┤
 * │ [SearchBar: "Search phone, UPI, UID"]   │ ← 48px pill
 * │                                         │
 * │ Recent Contacts                         │
 * │ ○ ○ ○ ○ ○ ○ ○ →                       │ ← 40px chips
 * │                                         │
 * │ ┌─────────────────────────────────────┐│
 * │ │ [AB] Anna Johnson       SmartpayID  ││ ← 72px ListItem
 * │ │ SP-81234567                          ││
 * │ └─────────────────────────────────────┘│
 * │ ┌─────────────────────────────────────┐│
 * │ │ [CD] Bob Smith          Phone       ││
 * │ │ +264 81 345 6789                     ││
 * │ └─────────────────────────────────────┘│
 * │                                         │
 * │ [Scan QR Code]                          │ ← 56px Secondary
 * └─────────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout/AppHeader';
import { RecentContactsCarousel } from '@/components/home/RecentContactsCarousel';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getContacts, type Contact } from '@/services/send';

export default function SelectRecipientScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
      setRecentContacts(data.filter(c => c.isFavorite).slice(0, 8));
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.smartpayId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipient = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/send-money/amount',
      params: {
        recipientId: contact.id,
        recipientName: contact.name,
        recipientPhone: contact.phone,
        recipientSmartpayId: contact.smartpayId || '',
        recipientAvatar: contact.avatarUri || '',
      },
    });
  };

  const handleScanQR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/send-money/scan-qr');
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          showSearch={false}
          showBackButton
          onBackPress={() => router.back()}
          title="Send Money"
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar - 48px pill */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={DS.colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search phone, UPI, UID"
              placeholderTextColor={DS.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              accessibilityLabel="Search recipients"
            />
          </View>

          {/* Recent Contacts Carousel - 40px chips */}
          {recentContacts.length > 0 && (
            <RecentContactsCarousel
              contacts={recentContacts}
              onContactPress={handleSelectRecipient}
            />
          )}

          {/* Contacts List - 72px items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Contacts</Text>
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.listItem}
                  onPress={() => handleSelectRecipient(contact)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Send to ${contact.name}`}
                  accessibilityRole="button"
                >
                  {/* Avatar - 40px */}
                  <View style={styles.avatar}>
                    {contact.avatarUri ? (
                      <Image
                        source={{ uri: contact.avatarUri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarInitials}>
                        {contact.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </Text>
                    )}
                  </View>

                  {/* Contact Info */}
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactDetail}>
                      {contact.smartpayId || contact.phone}
                    </Text>
                  </View>

                  {/* Badge - SmartpayID or Phone */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {contact.smartpayId ? 'SmartpayID' : 'Phone'}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={DS.colors.textTertiary}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={DS.colors.textTertiary} />
                <Text style={styles.emptyText}>No contacts found</Text>
              </View>
            )}
          </View>

          {/* Bottom padding for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Scan QR Code Button - Fixed bottom */}
        <View style={styles.bottomContainer}>
          <Button
            variant="secondary"
            onPress={handleScanQR}
            accessibilityLabel="Scan QR code to send money"
          >
            <View style={styles.scanButtonContent}>
              <Ionicons name="qr-code-outline" size={20} color={DS.colors.text} />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.components.searchBar.borderRadius,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    marginHorizontal: DS.spacing.horizontalPadding,
    marginTop: DS.spacing.md,
    marginBottom: DS.spacing.lg,
    gap: DS.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingBottom: DS.spacing.lg,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingVertical: DS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DS.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  badge: {
    backgroundColor: DS.colors.brand50,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: 4,
    borderRadius: DS.radius.sm,
    marginRight: DS.spacing.sm,
  },
  badgeText: {
    fontSize: DS.typography.fontSize.xs,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.brand.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DS.spacing['3xl'],
  },
  emptyText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.md,
  },
  bottomContainer: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  scanButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
