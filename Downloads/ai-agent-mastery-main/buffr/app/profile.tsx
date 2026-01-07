/**
 * Profile Screen (Settings)
 * 
 * Location: app/profile.tsx
 * Purpose: User profile and settings screen
 * 
 * Features:
 * - Display user profile information with Buffr ID
 * - Settings categories: Connected, Sound, Security, Support
 * - QR icon in header navigates to QR code screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SettingsItem, EmptyState } from '@/components/common';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  onPress?: () => void;
}

interface SettingsCategory {
  title: string;
  items: SettingsItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  const handleBack = () => {
    router.back();
  };

  const handleQRPress = () => {
    router.push('/qr-code');
  };

  const handleProfilePress = () => {
    // Navigate to detailed profile/edit screen
    // For now, just show alert
    console.log('Navigate to profile edit');
  };

  // Generate Buffr ID from user data
  const getBuffrId = () => {
    if (!user) return 'user@bfr';
    const email = user.email || user.phoneNumber || 'user';
    const username = email.split('@')[0] || email.replace(/[^a-zA-Z0-9]/g, '.');
    return `${username}@bfr`;
  };

  const settingsCategories: SettingsCategory[] = [
    {
      title: 'Connected',
      items: [
        {
          id: 'bank-accounts',
          title: 'Bank Accounts',
          icon: 'university',
          onPress: () => router.push('/add-bank'),
        },
        {
          id: 'cards',
          title: 'Cards',
          icon: 'credit-card',
          onPress: () => router.push('/add-card'),
        },
      ],
    },
    {
      title: 'Sound',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'bell',
          onPress: () => console.log('Notifications settings'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: '2fa',
          title: '2 Factor Authentication',
          icon: 'shield',
          onPress: () => console.log('2FA settings'),
        },
        {
          id: 'active-sessions',
          title: 'Active Sessions',
          icon: 'mobile',
          onPress: () => console.log('Active sessions'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'faqs',
          title: "FAQ's",
          icon: 'question-circle',
          onPress: () => console.log('FAQs'),
        },
        {
          id: 'contact-support',
          title: 'Contact Support',
          icon: 'headphones',
          onPress: () => console.log('Contact support'),
        },
      ],
    },
  ];

  if (!user) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader
          title="Settings"
          onBack={handleBack}
          showBackButton
          rightAction={
            <TouchableOpacity onPress={handleQRPress} style={styles.qrIconButton}>
              <FontAwesome name="qrcode" size={24} color={Colors.primary} />
            </TouchableOpacity>
          }
        />
        <EmptyState
          icon="user"
          title="User information not available"
        />
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader
        title="Settings"
        onBack={handleBack}
        showBackButton
        rightAction={
          <TouchableOpacity onPress={handleQRPress} style={styles.qrIconButton}>
            <FontAwesome name="qrcode" size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <TouchableOpacity
          style={styles.userProfileSection}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-circle" size={60} color={Colors.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.fullName || user.firstName || 'Buffr User'}
            </Text>
            <View style={styles.buffrIdContainer}>
              <Text style={styles.buffrId}>{getBuffrId()}</Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Colors.white} />
        </TouchableOpacity>

        {/* Settings Categories */}
        {settingsCategories.map((category, categoryIndex) => (
          <View key={category.title} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            {category.items.map((item, itemIndex) => (
              <SettingsItem
                key={item.id}
                title={item.title}
                icon={item.icon}
                onPress={item.onPress}
                isLast={itemIndex === category.items.length - 1}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  qrIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white, // White text on primaryMuted background for better contrast
    marginBottom: 8,
  },
  buffrIdContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buffrId: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
