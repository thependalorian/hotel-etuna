/**
 * Contacts Utility
 * 
 * Location: utils/contacts.ts
 * Purpose: Helper functions for accessing device contacts
 * 
 * Uses expo-contacts to access phone contacts
 */

import * as Contacts from 'expo-contacts';

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
}

/**
 * Request contacts permission and fetch contacts from device
 */
export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if contacts permission is granted
 */
export async function checkContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Fetch all contacts from device
 */
export async function fetchDeviceContacts(): Promise<DeviceContact[]> {
  try {
    // Check permission first
    const hasPermission = await checkContactsPermission();
    if (!hasPermission) {
      const granted = await requestContactsPermission();
      if (!granted) {
        throw new Error('Contacts permission denied');
      }
    }

    // Fetch contacts
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    // Transform to our format
    return data.map((contact) => ({
      id: contact.id,
      name: contact.name || 'Unknown',
      phoneNumber: contact.phoneNumbers?.[0]?.number,
      email: contact.emails?.[0]?.email,
      avatar: contact.imageUri,
    }));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

/**
 * Search contacts by name or phone number
 */
export async function searchDeviceContacts(query: string): Promise<DeviceContact[]> {
  try {
    const hasPermission = await checkContactsPermission();
    if (!hasPermission) {
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
      ],
      name: query,
      sort: Contacts.SortTypes.FirstName,
    });

    return data.map((contact) => ({
      id: contact.id,
      name: contact.name || 'Unknown',
      phoneNumber: contact.phoneNumbers?.[0]?.number,
      email: contact.emails?.[0]?.email,
      avatar: contact.imageUri,
    }));
  } catch (error) {
    console.error('Error searching contacts:', error);
    return [];
  }
}
