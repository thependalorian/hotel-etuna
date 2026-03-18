import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

export default function AgentsScreen() {
  const agents = [
    { id: '1', name: 'Agent Store 1', address: '123 Main St', distance: '0.5 km', services: ['Cash In', 'Cash Out'] },
    { id: '2', name: 'Agent Store 2', address: '456 Oak Ave', distance: '1.2 km', services: ['Cash In', 'Cash Out', 'Bill Payment'] },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Find Agent</Text>
          <TouchableOpacity>
            <Ionicons name="map-outline" size={24} color={designSystem.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Agents</Text>
            {agents.map(agent => (
              <TouchableOpacity key={agent.id} style={styles.agentCard}>
                <View style={styles.agentIcon}>
                  <Ionicons name="business" size={24} color={designSystem.colors.primary} />
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentAddress}>{agent.address}</Text>
                  <View style={styles.services}>
                    {agent.services.map(service => (
                      <View key={service} style={styles.serviceBadge}>
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.agentRight}>
                  <Text style={styles.distance}>{agent.distance}</Text>
                  <Ionicons name="navigate-outline" size={20} color={designSystem.colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: designSystem.colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
  },
  scrollView: { flex: 1 },
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.lg,
  },
  sectionTitle: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
    marginBottom: designSystem.spacing.md,
  },
  agentCard: {
    flexDirection: 'row',
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designSystem.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  agentInfo: { flex: 1 },
  agentName: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  agentAddress: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textSecondary,
    marginBottom: 8,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
  },
  serviceText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.info,
    fontWeight: '600',
  },
  agentRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  distance: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textSecondary,
    marginBottom: 8,
  },
});
