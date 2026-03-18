/**
 * Location Finder Example Screen
 * Location: fintech/smartpay/app/(authenticated)/location-finder-example.tsx
 * 
 * Example implementation of location services for finding agents, ATMs, and NamPost offices.
 * Demonstrates usage of all location components and services.
 * 
 * Usage:
 * - Navigate to this screen to see location services in action
 * - Grant location permission when prompted
 * - View nearby agents and ATMs on interactive maps
 * - Search for NamPost offices by name or region
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AgentMapCard, ATMMapCard, LocationCard } from '@/components/copilot/cards';
import {
  findNearbyAgents,
  findNearbyATMs,
  findNampostOffices,
  getCurrentLocation,
  requestLocationPermission,
  checkLocationPermission,
  AgentLocation,
  ATMLocation,
  NampostOffice,
} from '@/services/copilot/locationService';

export default function LocationFinderExampleScreen() {
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [atms, setATMs] = useState<ATMLocation[]>([]);
  const [nampostOffices, setNampostOffices] = useState<NampostOffice[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'atms' | 'nampost'>('agents');

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      setLoading(true);

      // Check permission first
      const permission = await checkLocationPermission();
      if (!permission.granted) {
        const result = await requestLocationPermission();
        if (!result.granted) {
          Alert.alert(
            'Location Permission Required',
            'SmartPay needs your location to find nearby agents, ATMs, and NamPost offices.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: () => initializeLocation() },
            ]
          );
          setLoading(false);
          return;
        }
      }

      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        setLoading(false);
        return;
      }

      setUserLocation(location);

      // Fetch data in parallel
      await loadLocationData(location.latitude, location.longitude);
    } catch (error) {
      console.error('Error initializing location:', error);
      Alert.alert('Error', 'Failed to load location data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationData = async (lat: number, lng: number) => {
    try {
      const [agentsData, atmsData, nampostData] = await Promise.all([
        findNearbyAgents(lat, lng, 10, 'cashout'),
        findNearbyATMs(lat, lng, 10),
        findNampostOffices('Windhoek', lat, lng),
      ]);

      setAgents(agentsData);
      setATMs(atmsData);
      setNampostOffices(nampostData);
    } catch (error) {
      console.error('Error loading location data:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    if (!userLocation) return;

    setRefreshing(true);
    try {
      await loadLocationData(userLocation.latitude, userLocation.longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh location data.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAgentPress = (agent: AgentLocation) => {
    Alert.alert(
      agent.agent_name,
      `Type: ${agent.agent_type.replace('_', ' ')}\n` +
        `Distance: ${agent.distance_km.toFixed(1)} km\n` +
        `Address: ${agent.address ?? 'N/A'}\n\n` +
        `Services:\n` +
        `${agent.supports_cashout ? '✓' : '✗'} Cash Out\n` +
        `${agent.supports_voucher_redeem ? '✓' : '✗'} Voucher Redemption\n` +
        `${agent.supports_namqr ? '✓' : '✗'} NAMQR Payments`,
      [{ text: 'OK' }]
    );
  };

  const handleATMPress = (atm: ATMLocation) => {
    Alert.alert(
      atm.bank_name,
      `Status: ${atm.status.toUpperCase()}\n` +
        `Distance: ${atm.distance_km.toFixed(1)} km\n` +
        `Address: ${atm.address ?? 'N/A'}\n\n` +
        `Features:\n` +
        `${atm.is_24_hour ? '✓' : '✗'} 24/7 Access\n` +
        `${atm.has_cash_out ? '✓' : '✗'} Cash Withdrawal\n` +
        `${atm.has_deposit ? '✓' : '✗'} Cash Deposit`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0029D6" />
          <Text style={styles.loadingText}>Loading location data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020617" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Finder</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#0029D6" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'agents' && styles.tabActive]}
          onPress={() => setActiveTab('agents')}
        >
          <Text style={[styles.tabText, activeTab === 'agents' && styles.tabTextActive]}>
            Agents ({agents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'atms' && styles.tabActive]}
          onPress={() => setActiveTab('atms')}
        >
          <Text style={[styles.tabText, activeTab === 'atms' && styles.tabTextActive]}>
            ATMs ({atms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nampost' && styles.tabActive]}
          onPress={() => setActiveTab('nampost')}
        >
          <Text style={[styles.tabText, activeTab === 'nampost' && styles.tabTextActive]}>
            NamPost ({nampostOffices.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Map View</Text>
              <AgentMapCard
                agents={agents}
                userLocation={userLocation ?? undefined}
                loading={false}
                onAgentPress={handleAgentPress}
                height={300}
                showUserLocation
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>List View</Text>
              {agents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No agents found nearby</Text>
                </View>
              ) : (
                agents.map((agent) => (
                  <LocationCard
                    key={agent.id}
                    name={agent.agent_name}
                    type="agent"
                    distance={agent.distance_km}
                    address={agent.address}
                    status="active"
                    operatingHours={agent.operating_hours}
                    services={[
                      agent.supports_cashout && 'Cash Out',
                      agent.supports_voucher_redeem && 'Vouchers',
                      agent.supports_namqr && 'NAMQR',
                    ].filter(Boolean) as string[]}
                    onPress={() => handleAgentPress(agent)}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* ATMs Tab */}
        {activeTab === 'atms' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Map View</Text>
              <ATMMapCard
                atms={atms}
                userLocation={userLocation ?? undefined}
                loading={false}
                onATMPress={handleATMPress}
                height={300}
                statusFilter="all"
                showUserLocation
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>List View</Text>
              {atms.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="cash-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No ATMs found nearby</Text>
                </View>
              ) : (
                atms.map((atm) => (
                  <LocationCard
                    key={atm.id}
                    name={atm.bank_name}
                    type="atm"
                    distance={atm.distance_km}
                    address={atm.address}
                    status={atm.status}
                    services={[
                      atm.has_cash_out && 'Cash Withdrawal',
                      atm.has_deposit && 'Cash Deposit',
                      atm.is_24_hour && '24/7 Access',
                    ].filter(Boolean) as string[]}
                    onPress={() => handleATMPress(atm)}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* NamPost Tab */}
        {activeTab === 'nampost' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NamPost Offices</Text>
              {nampostOffices.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="mail-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No NamPost offices found</Text>
                </View>
              ) : (
                nampostOffices.map((office) => (
                  <LocationCard
                    key={office.id}
                    name={office.branch_name}
                    type="nampost"
                    distance={office.distance_km}
                    address={office.address}
                    status="active"
                    operatingHours={office.operating_hours}
                    services={office.services}
                    phone={office.phone}
                    onPress={() =>
                      Alert.alert(
                        office.branch_name,
                        `Address: ${office.address}\nPhone: ${office.phone ?? 'N/A'}\nServices: ${office.services.join(', ')}`
                      )
                    }
                  />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0029D6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0029D6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 24,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});
