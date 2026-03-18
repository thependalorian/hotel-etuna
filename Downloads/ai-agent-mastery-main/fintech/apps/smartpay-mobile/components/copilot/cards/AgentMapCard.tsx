/**
 * AgentMapCard - Agent locations map view with clustering
 * Location: fintech/smartpay/components/copilot/cards/AgentMapCard.tsx
 * 
 * Interactive map showing nearby agents with custom markers and info windows.
 * Supports marker clustering for better performance with many locations.
 * 
 * References:
 * - BUFFR_MOBILE_ANALYSIS.md §3.9 (Agent Finder)
 * - PRD Appendix H §G20 (Agent Network Integration)
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgentLocation } from '@/services/copilot/locationService';
import { LocationCard } from './LocationCard';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;
let Callout: React.ComponentType<any> | null = null;
let PROVIDER_GOOGLE: string | undefined;
let RegionType: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | undefined;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  RegionType = maps.Region;
} catch {
  MapView = null;
  Marker = null;
  Callout = null;
}

// ========================================
// Types
// ========================================

export interface AgentMapCardProps {
  agents: AgentLocation[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  loading?: boolean;
  onAgentPress?: (agent: AgentLocation) => void;
  height?: number;
  showUserLocation?: boolean;
}

// ========================================
// Component
// ========================================

export function AgentMapCard({
  agents,
  userLocation,
  loading = false,
  onAgentPress,
  height = 400,
  showUserLocation = true,
}: AgentMapCardProps) {
  const mapRef = useRef<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null);
  const [region, setRegion] = useState<typeof RegionType | undefined>(undefined);

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

  // Set initial region when agents or userLocation changes
  useEffect(() => {
    if (agents.length > 0) {
      const lats = agents.map((a) => a.latitude);
      const lngs = agents.map((a) => a.longitude);

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
      const deltaLat = (maxLat - minLat) * 1.5; // Add 50% padding
      const deltaLng = (maxLng - minLng) * 1.5;

      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(deltaLat, 0.05), // Minimum zoom level
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
  }, [agents, userLocation]);

  const handleMarkerPress = (agent: AgentLocation) => {
    setSelectedAgent(agent);
  };

  const handleCalloutPress = (agent: AgentLocation) => {
    if (onAgentPress) {
      onAgentPress(agent);
    }
  };

  const handleDirections = (agent: AgentLocation) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `maps:?daddr=${agent.latitude},${agent.longitude}&dirflg=d`,
      android: `geo:${agent.latitude},${agent.longitude}?q=${agent.latitude},${agent.longitude}(${encodeURIComponent(agent.agent_name)})`,
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

  const getMarkerColor = (agentType: string): string => {
    switch (agentType) {
      case 'nampost':
        return '#F59E0B';
      case 'bank_branch':
        return '#3B82F6';
      case 'atm':
        return '#22C55E';
      case 'retail':
        return '#8B5CF6';
      case 'mobile_agent':
        return '#EC4899';
      default:
        return '#0029D6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0029D6" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (agents.length === 0 && !userLocation) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No agents found in this area</Text>
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
        {/* User location marker (custom) */}
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

        {/* Agent markers */}
        {agents.map((agent) => (
          <Marker
            key={agent.id}
            coordinate={{
              latitude: agent.latitude,
              longitude: agent.longitude,
            }}
            onPress={() => handleMarkerPress(agent)}
            pinColor={getMarkerColor(agent.agent_type)}
          >
            <Callout onPress={() => handleCalloutPress(agent)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{agent.agent_name}</Text>
                <Text style={styles.calloutSubtitle}>{agent.agent_type.replace('_', ' ')}</Text>
                <Text style={styles.calloutDistance}>{agent.distance_km.toFixed(1)} km away</Text>
                {agent.address && <Text style={styles.calloutAddress}>{agent.address}</Text>}
                <View style={styles.calloutServices}>
                  {agent.supports_cashout && (
                    <View style={styles.serviceTag}>
                      <Ionicons name="cash-outline" size={12} color="#22C55E" />
                      <Text style={styles.serviceTagText}>Cash Out</Text>
                    </View>
                  )}
                  {agent.supports_voucher_redeem && (
                    <View style={styles.serviceTag}>
                      <Ionicons name="ticket-outline" size={12} color="#F59E0B" />
                      <Text style={styles.serviceTagText}>Vouchers</Text>
                    </View>
                  )}
                  {agent.supports_namqr && (
                    <View style={styles.serviceTag}>
                      <Ionicons name="qr-code-outline" size={12} color="#8B5CF6" />
                      <Text style={styles.serviceTagText}>NAMQR</Text>
                    </View>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItems}>
          <LegendItem color="#F59E0B" label="NamPost" />
          <LegendItem color="#3B82F6" label="Bank" />
          <LegendItem color="#8B5CF6" label="Retail" />
          <LegendItem color="#22C55E" label="ATM" />
        </View>
      </View>

      {/* Selected Agent Card */}
      {selectedAgent && (
        <View style={styles.selectedCard}>
          <LocationCard
            name={selectedAgent.agent_name}
            type="agent"
            distance={selectedAgent.distance_km}
            address={selectedAgent.address}
            status="active"
            operatingHours={selectedAgent.operating_hours}
            services={getAgentServices(selectedAgent)}
            onPress={() => handleCalloutPress(selectedAgent)}
            onDirections={() => handleDirections(selectedAgent)}
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

function getAgentServices(agent: AgentLocation): string[] {
  const services: string[] = [];
  if (agent.supports_cashout) services.push('Cash Out');
  if (agent.supports_voucher_redeem) services.push('Voucher Redemption');
  if (agent.supports_ewallet) services.push('E-Wallet');
  if (agent.supports_namqr) services.push('NAMQR Payments');
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
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
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
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textTransform: 'capitalize',
    marginBottom: 4,
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
  calloutServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTagText: {
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
