/**
 * AppHeader - Smartpay Copilot
 * 
 * Figma Specs: 64px height
 * Two variants:
 * 1. Search pill mode (Home) - 48px pill with icon
 * 2. Title mode (Stack screens) - Back button + title
 * 
 * Components:
 * - SearchBar: 48px pill with 20px icon
 * - Notification bell: 24px with 8px badge
 * - Avatar: 36px circular with hitSlop for 44px touch target
 * - Back button: 24px icon with 44px touch target
 * 
 * Location: components/layout/AppHeader.tsx
 */
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { designSystem as DS } from '@/constants/designSystem';

export interface AppHeaderProps {
  /** Show search pill (Home mode) or title (Stack mode) */
  showSearch?: boolean;
  
  /** Search props */
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  
  /** Title props (Stack screens) */
  title?: string;
  
  /** Right side actions */
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  avatarUri?: string | null;
  avatarInitials?: string | null;
  notificationBadge?: boolean;
  rightContent?: React.ReactNode;
  
  /** Back button (Stack screens) */
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const SEARCH_PLACEHOLDER = 'Search or ask Copilot...';

export function AppHeader({
  showSearch = true,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = SEARCH_PLACEHOLDER,
  title,
  onNotificationPress,
  onAvatarPress,
  avatarUri,
  avatarInitials,
  notificationBadge = false,
  rightContent,
  showBackButton = false,
  onBackPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 80 : 100}
      tint="light"
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.header}>
        {showBackButton && onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={DS.components.header.iconSize} color={DS.colors.text} />
          </TouchableOpacity>
        )}
        
        {showSearch && !showBackButton ? (
          <View style={styles.searchWrap}>
            <Ionicons
              name="search-outline"
              size={20}
              color={DS.colors.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={DS.colors.textTertiary}
              value={searchValue}
              onChangeText={onSearchChange}
              accessibilityLabel="Search"
            />
          </View>
        ) : !showSearch && title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <View style={styles.rightGroup}>
          {rightContent ? (
            rightContent
          ) : (
            <>
              {onNotificationPress && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={onNotificationPress}
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="notifications-outline" 
                    size={DS.components.header.iconSize} 
                    color={DS.colors.text} 
                  />
                  {notificationBadge && <View style={styles.badge} />}
                </TouchableOpacity>
              )}

              {onAvatarPress && (
                <TouchableOpacity
                  style={styles.avatarWrap}
                  onPress={onAvatarPress}
                  accessibilityLabel="Profile"
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      {avatarInitials ? (
                        <Text style={styles.avatarInitials} numberOfLines={1}>
                          {avatarInitials}
                        </Text>
                      ) : (
                        <Ionicons name="person-outline" size={18} color={DS.colors.textSecondary} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: DS.radius.lg,
    borderBottomRightRadius: DS.radius.lg,
    ...Platform.select({
      ios: {
        ...DS.shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing[3],
    paddingHorizontal: DS.spacing[4],
    paddingBottom: DS.spacing[3],
    height: DS.components.header.height - 8,
    overflow: 'visible',
  },
  backButton: {
    width: DS.components.header.iconSize,
    height: DS.components.header.iconSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: DS.components.searchBar.height,
    minWidth: 0,
    maxWidth: '100%',
    backgroundColor: DS.colors.surface,
    borderRadius: DS.components.searchBar.borderRadius,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing[4],
  },
  searchIcon: {
    marginRight: DS.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
    paddingVertical: 0,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'flex-end',
    gap: DS.spacing[1],
  },
  iconBtn: {
    padding: DS.spacing[2],
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: DS.components.header.notificationBadge,
    height: DS.components.header.notificationBadge,
    backgroundColor: DS.colors.error,
    borderRadius: DS.components.header.notificationBadge / 2,
  },
  avatarWrap: {
    width: DS.components.header.avatarSize,
    height: DS.components.header.avatarSize,
    minWidth: DS.components.header.avatarSize,
    minHeight: DS.components.header.avatarSize,
    borderRadius: DS.components.header.avatarSize / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: DS.components.header.avatarSize,
    height: DS.components.header.avatarSize,
    borderRadius: DS.components.header.avatarSize / 2,
  },
  avatarPlaceholder: {
    width: DS.components.header.avatarSize,
    height: DS.components.header.avatarSize,
    minWidth: DS.components.header.avatarSize,
    minHeight: DS.components.header.avatarSize,
    borderRadius: DS.components.header.avatarSize / 2,
    backgroundColor: DS.colors.brand50,
    borderWidth: 1,
    borderColor: DS.colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
    letterSpacing: 0.5,
  },
});
