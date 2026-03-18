/**
 * Groups list screen – Smartpay.
 * Shows all groups with TanStack Query, empty state, and create group CTA.
 * Location: mobile/app/(authenticated)/groups/index.tsx
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { designSystem } from '@/constants/designSystem';
import { getGroups } from '@/services/groups';

const ds = designSystem;

export default function GroupsScreen() {
  const router = useRouter();
  
  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color={ds.colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Groups</Text>
      <TouchableOpacity
        onPress={() => router.push('/groups/create' as any)}
        style={styles.addButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="add-circle-outline" size={24} color={ds.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color={ds.colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptyDescription}>
        Create or join a group to split bills and manage shared expenses with friends and family
      </Text>
      <TouchableOpacity 
        style={styles.ctaButton}
        onPress={() => router.push('/groups/create' as any)}
      >
        <Ionicons name="add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.ctaButtonText}>Create Your First Group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroupCard = (group: any) => {
    const initials = group.name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        key={group.id}
        style={styles.groupCard}
        onPress={() => router.push(`/groups/${group.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.groupCardContent}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>{initials}</Text>
          </View>
          
          <View style={styles.groupInfo}>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.name}
            </Text>
            <View style={styles.groupMeta}>
              <Ionicons name="people" size={14} color={ds.colors.textSecondary} />
              <Text style={styles.groupMetaText}>
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          <View style={styles.groupRight}>
            <Text style={styles.groupBalance}>
              {group.currency} {group.walletBalance.toFixed(2)}
            </Text>
            {group.unpaidSplitsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {group.unpaidSplitsCount} unpaid
                </Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={ds.colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={ds.colors.error} />
          <Text style={styles.errorText}>Failed to load groups</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!groups || groups.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={ds.colors.primary}
          />
        }
      >
        <View style={styles.groupsList}>
          {groups.map(renderGroupCard)}
        </View>

        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => router.push('/groups/create' as any)}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        {renderContent()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: ds.colors.background 
  },
  safe: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.smartpay.horizontalPadding,
    paddingVertical: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...ds.typography.textStyles.titleSm,
    color: ds.colors.text,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.smartpay.horizontalPadding,
  },
  loadingText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.md,
  },
  errorText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.error,
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
  },
  retryButtonText: {
    ...ds.typography.textStyles.button,
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.spacing.smartpay.horizontalPadding,
    paddingTop: 80,
  },
  emptyTitle: {
    ...ds.typography.textStyles.titleLg,
    color: ds.colors.text,
    marginTop: ds.spacing.lg,
    marginBottom: ds.spacing.sm,
  },
  emptyDescription: {
    ...ds.typography.textStyles.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.xl,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    backgroundColor: ds.colors.primary,
    borderRadius: ds.borderRadius.pill,
    ...ds.shadows.md,
  },
  ctaButtonText: {
    ...ds.typography.textStyles.button,
    color: '#FFF',
  },
  groupsList: {
    paddingHorizontal: ds.spacing.smartpay.horizontalPadding,
    paddingTop: ds.spacing.md,
    gap: ds.spacing.md,
  },
  groupCard: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.border,
    padding: ds.spacing.md,
    ...ds.shadows.sm,
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconText: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  groupInfo: {
    flex: 1,
    gap: 4,
  },
  groupName: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.text,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMetaText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.textSecondary,
  },
  groupRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  groupBalance: {
    ...ds.typography.textStyles.body,
    fontWeight: '700',
    color: ds.colors.text,
  },
  badge: {
    backgroundColor: ds.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ds.radius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadows.lg,
  },
});
