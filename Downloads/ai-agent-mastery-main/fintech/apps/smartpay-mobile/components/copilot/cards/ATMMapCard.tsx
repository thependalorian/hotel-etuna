/**
 * ATMMapCard - ATM locations map view with status indicators
 * Location: fintech/smartpay/components/copilot/cards/ATMMapCard.tsx
 * 
 * Interactive map showing nearby ATMs with status-based markers.
 * Shows operational status (online/offline/maintenance) and services available.
 * 
 * References:
 * - BUFFR_MOBILE_ANALYSIS.md §3.9 (Agent Finder)
 * - Design System: constants/designSystem.ts
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ATMLocation } from '@/services/copilot/locationService';
import { LocationCard } from './LocationCard';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;
let Callout: React.ComponentType<any> | null = null;
let PROVIDER_GOOGLE: string | undefined;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch {
  MapView = null;
  Marker = null;
  Callout = null;
}

// ========================================
// Types
// ========================================

export interface ATMMapCardProps {
  atms: ATMLocation[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  loading?: boolean;
  onATMPress?: (atm: ATMLocation) => void;
  height?: number;
  showUserLocation?: boolean;
  statusFilter?: 'online' | 'all';
}

// ========================================
// Component
// ========================================

export function ATMMapCard({
  atms,
  userLocation,
  loading = false,
  onATMPress,
  height = 400,
  showUserLocation = true,
  statusFilter = 'all',
}: ATMMapCardProps) {
  const mapRef = useRef<any>(null);
  const [selectedATM, setSelectedATM] = useState<ATMLocation | null>(null);
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | undefined>(undefined);

  if (!MapView || !Marker || !Callout) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.fallback}>
          <Ionicons name="map-outline" size={48} color="#94a3b8" />
          <Text style={styles.fallbackText}>Map unavailable. Rebuild the app with react-native-maps linked.</Text>
        </View>
      </View>
    );
  }

  // Filter ATMs by status
  const filteredATMs = statusFilter === 'online' ? atms.filter((a) => a.status === 'online') : atms;

  // Set initial region
  useEffect(() => {
    if (filteredATMs.length > 0) {
      const lats = filteredATMs.map((a) => a.latitude);
      const lngs = filteredATMs.map((a) => a.longitude);

      if (userLocation) {
        lats.push(userLocation.latitude);
        lngs.push(userLocation.longitude);
      }

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const deltaLat = (maxLat - minLat) * 1.5;
      const deltaLng = (maxLng - minLng) * 1.5;

      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(deltaLat, 0.05),
        longitudeDelta: Math.max(deltaLng, 0.05),
      });
    } else if (userLocation) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  }, [filteredATMs, userLocation]);

  const handleMarkerPress = (atm: ATMLocation) => {
    setSelectedATM(atm);
  };

  const handleCalloutPress = (atm: ATMLocation) => {
    if (onATMPress) {
      onATMPress(atm);
    }
  };

  const handleDirections = (atm: ATMLocation) => {
    const url = Platform.select({
      ios: `maps:?daddr=${atm.latitude},${atm.longitude}&dirflg=d`,
      android: `geo:${atm.latitude},${atm.longitude}?q=${atm.latitude},${atm.longitude}(${encodeURIComponent(atm.bank_name)})`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      });
    }
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'online':
        return '#22C55E';
      case 'offline':
        return '#EF4444';
      case 'maintenance':
        return '#F59E0B';
      default:
        return '#94A3B8';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0029D6" />
          <Text style={styles.loadingText}>Loading ATMs...</Text>
        </View>
      </View>
    );
  }

  if (filteredATMs.length === 0 && !userLocation) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {statusFilter === 'online' ? 'No online ATMs found' : 'No ATMs found in this area'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={[styles.map, { height }]}
        region={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton
        showsCompass
        loadingEnabled
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ATM markers */}
        {filteredATMs.map((atm) => (
          <Marker
            key={atm.id}
            coordinate={{
              latitude: atm.latitude,
              longitude: atm.longitude,
            }}
            onPress={() => handleMarkerPress(atm)}
            pinColor={getMarkerColor(atm.status)}
          >
            <Callout onPress={() => handleCalloutPress(atm)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{atm.bank_name}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getMarkerColor(atm.status) }]} />
                  <Text style={styles.statusText}>{atm.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.calloutDistance}>{atm.distance_km.toFixed(1)} km away</Text>
                {atm.address && <Text style={styles.calloutAddress}>{atm.address}</Text>}
                <View style={styles.features}>
                  {atm.is_24_hour && (
                    <View style={styles.featureTag}>
                      <Ionicons name="time-outline" size={12} color="#0029D6" />
                      <Text style={styles.featureText}>24/7</Text>
                    </View>
                  )}
                  {atm.has_deposit && (
                    <View style={styles.featureTag}>
                      <Ionicons name="arrow-down-circle-outline" size={12} color="#22C55E" />
                      <Text style={styles.featureText}>Deposit</Text>
                    </View>
                  )}
                  {atm.has_cash_out && (
                    <View style={styles.featureTag}>
                      <Ionicons name="cash-outline" size={12} color="#F59E0B" />
                      <Text style={styles.featureText}>Withdrawal</Text>
                    </View>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Status Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status:</Text>
        <View style={styles.legendItems}>
          <LegendItem color="#22C55E" label="Online" />
          <LegendItem color="#F59E0B" label="Maintenance" />
          <LegendItem color="#EF4444" label="Offline" />
        </View>
      </View>

      {/* Stats Badge */}
      <View style={styles.statsBadge}>
        <Text style={styles.statsText}>
          {filteredATMs.filter((a) => a.status === 'online').length} / {filteredATMs.length} Online
        </Text>
      </View>

      {/* Selected ATM Card */}
      {selectedATM && (
        <View style={styles.selectedCard}>
          <LocationCard
            name={selectedATM.bank_name}
            type="atm"
            distance={selectedATM.distance_km}
            address={selectedATM.address}
            status={selectedATM.status}
            services={getATMServices(selectedATM)}
            onPress={() => handleCalloutPress(selectedATM)}
            onDirections={() => handleDirections(selectedATM)}
          />
        </View>
      )}
    </View>
  );
}

// ========================================
// Helper Components
// ========================================

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ========================================
// Helper Functions
// ========================================

function getATMServices(atm: ATMLocation): string[] {
  const services: string[] = [];
  if (atm.has_cash_out) services.push('Cash Withdrawal');
  if (atm.has_deposit) services.push('Cash Deposit');
  if (atm.is_24_hour) services.push('24/7 Access');
  return services;
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  map: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 41, 214, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0029D6',
    borderWidth: 3,
    borderColor: '#fff',
  },
  callout: {
    width: 250,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  calloutDistance: {
    fontSize: 13,
    color: '#0029D6',
    fontWeight: '600',
    marginBottom: 8,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  legend: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 8,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#475569',
  },
  statsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0029D6',
  },
  selectedCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
