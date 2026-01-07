/**
 * Select Recipient Screen - Step 1 of Send Money Flow
 * 
 * Location: app/send-money/select-recipient.tsx
 * Purpose: Select recipient for sending money
 * 
 * Based on actual design: Send To screen with Recents, Favorites, and Contacts
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, ContactCarousel, ContactListItem, type ContactCarouselItem, type ContactListItemData } from '@/components/common';
import { fetchDeviceContacts, requestContactsPermission, type DeviceContact } from '@/utils/contacts';

// Contact interface
interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

// Mock contacts data - expanded to match design
const mockContacts: Contact[] = [
  { id: '1', name: 'Elias', phoneNumber: '+264 61 234 5678', isRecent: true, isFavorite: false },
  { id: '2', name: 'Group of 5', phoneNumber: '', isRecent: true, isFavorite: false },
  { id: '3', name: 'Afroz', phoneNumber: '+264 81 345 6789', isRecent: true, isFavorite: false },
  { id: '4', name: 'Monica', phoneNumber: '+264 81 456 7890', isRecent: true, isFavorite: false },
  { id: '5', name: 'Clara', phoneNumber: '+264 81 567 8901', isRecent: false, isFavorite: true },
  { id: '6', name: 'Lukas', phoneNumber: '+264 81 678 9012', isRecent: false, isFavorite: true },
  { id: '7', name: 'Rachel', phoneNumber: '+264 81 789 0123', isRecent: false, isFavorite: true },
  { id: '8', name: 'Simon', phoneNumber: '+264 81 890 1234', isRecent: false, isFavorite: true },
  { id: '9', name: 'Aina Iishuulu', phoneNumber: '+264 81 901 2345', isRecent: false, isFavorite: false },
  { id: '10', name: 'Stephanie Nakale', phoneNumber: '+264 81 012 3456', isRecent: false, isFavorite: false },
  { id: '11', name: 'Florence Nandago', phoneNumber: '+264 81 123 4567', isRecent: false, isFavorite: false },
  { id: '12', name: 'Prudence Shapwa', phoneNumber: '+264 81 234 5678', isRecent: false, isFavorite: false },
];

export default function SelectRecipientScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(false);

  // Load device contacts on mount
  useEffect(() => {
    const loadDeviceContacts = async () => {
      try {
        setLoadingContacts(true);
        const hasPermission = await requestContactsPermission();
        setContactsPermissionGranted(hasPermission);
        
        if (hasPermission) {
          const contacts = await fetchDeviceContacts();
          setDeviceContacts(contacts);
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to access your phone contacts.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoadingContacts(false);
      }
    };

    loadDeviceContacts();
  }, []);

  // Merge mock contacts with device contacts
  const allAvailableContacts = useMemo(() => {
    // Combine mock contacts (recents/favorites) with device contacts
    const combined: Contact[] = [...mockContacts];
    
    // Add device contacts that aren't already in mock contacts
    deviceContacts.forEach((deviceContact) => {
      // Check if contact already exists (by phone number or name)
      const exists = mockContacts.some(
        (mock) =>
          mock.phoneNumber === deviceContact.phoneNumber ||
          mock.name.toLowerCase() === deviceContact.name.toLowerCase()
      );
      
      if (!exists && deviceContact.phoneNumber) {
        combined.push({
          id: `device-${deviceContact.id}`,
          name: deviceContact.name,
          phoneNumber: deviceContact.phoneNumber,
          avatar: deviceContact.avatar,
          isRecent: false,
          isFavorite: false,
        });
      }
    });
    
    return combined;
  }, [deviceContacts]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allAvailableContacts;
    }
    const query = searchQuery.toLowerCase();
    return allAvailableContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query)
    );
  }, [searchQuery, allAvailableContacts]);

  // Separate contacts by category
  const recentRecipients = filteredContacts.filter((c) => c.isRecent);
  const favoriteContacts = filteredContacts.filter((c) => c.isFavorite);
  const allContacts = filteredContacts.filter((c) => !c.isRecent && !c.isFavorite);

  const handleRecipientSelect = (contact: Contact) => {
    console.log('Selected contact:', contact.name);
    // Navigate to receiver details screen
    router.push({
      pathname: '/send-money/receiver-details',
      params: {
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phoneNumber || '',
      },
    } as any);
  };

  const handleAddContact = () => {
    // Navigate to add contact or manual entry
    console.log('Add contact pressed');
  };

  const handleQRScan = () => {
    router.push('/send-money/qr-scanner');
  };

  const handleManualEntry = () => {
    // Navigate to manual phone entry (to be implemented)
    console.log('Manual entry pressed');
  };

  // Convert contacts to carousel format
  const recentCarouselItems: ContactCarouselItem[] = recentRecipients.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
    isGroup: c.name === 'Group of 5',
    groupCount: c.name === 'Group of 5' ? 2 : undefined, // +2 overlay as shown in design
  }));

  const favoriteCarouselItems: ContactCarouselItem[] = favoriteContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
  }));

  // Convert contacts to list item format
  const contactListItems: ContactListItemData[] = allContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
  }));

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Send To"
        showBackButton
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddContact}
            activeOpacity={0.7}
          >
            <FontAwesome name="user-plus" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome
            name="search"
            size={18}
            color={Colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search via Phone, UPI, UID etc."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Recent Recipients Carousel */}
        {recentRecipients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recents</Text>
            <ContactCarousel
              contacts={recentCarouselItems}
              onContactPress={(contact) => {
                console.log('Carousel contact pressed:', contact.name);
                const fullContact = allAvailableContacts.find((c) => c.id === contact.id);
                if (fullContact) {
                  console.log('Found full contact, navigating...');
                  handleRecipientSelect(fullContact);
                } else {
                  console.log('Full contact not found for:', contact.id);
                }
              }}
              avatarSize={60}
            />
          </View>
        )}

        {/* Favorites Carousel */}
        {favoriteContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <ContactCarousel
              contacts={favoriteCarouselItems}
              onContactPress={(contact) => {
                console.log('Favorite contact pressed:', contact.name);
                const fullContact = allAvailableContacts.find((c) => c.id === contact.id);
                if (fullContact) {
                  console.log('Found full contact, navigating...');
                  handleRecipientSelect(fullContact);
                } else {
                  console.log('Full contact not found for:', contact.id);
                }
              }}
              avatarSize={60}
            />
          </View>
        )}

        {/* Contacts List */}
        {loadingContacts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : allContacts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <View style={styles.contactsList}>
              {contactListItems.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onPress={(c) => {
                    console.log('List contact pressed:', c.name);
                    const fullContact = allAvailableContacts.find((mc) => mc.id === c.id);
                    if (fullContact) {
                      console.log('Found full contact, navigating...');
                      handleRecipientSelect(fullContact);
                    } else {
                      console.log('Full contact not found for:', c.id);
                    }
                  }}
                  avatarSize={40}
                  showPhoneNumber={true}
                />
              ))}
            </View>
          </View>
        ) : !contactsPermissionGranted ? (
          <View style={styles.permissionContainer}>
            <FontAwesome name="address-book" size={48} color={Colors.textSecondary} />
            <Text style={styles.permissionText}>
              Grant contacts permission to see your phone contacts
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={async () => {
                const granted = await requestContactsPermission();
                if (granted) {
                  setContactsPermissionGranted(true);
                  const contacts = await fetchDeviceContacts();
                  setDeviceContacts(contacts);
                } else {
                  Alert.alert(
                    'Permission Denied',
                    'Please enable contacts permission in your device settings.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome name="search" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        )}

        {/* Manual Entry Button */}
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={handleManualEntry}
          activeOpacity={0.7}
        >
          <Text style={styles.manualEntryText}>Enter Phone Number Manually</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  contactsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  manualEntryButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  manualEntryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
