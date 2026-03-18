/**
 * OBS Consent Review Screen
 * 
 * Shows consent details and allows Account Holder to:
 * - Review what data will be shared
 * - Select which accounts to share
 * - Approve or reject consent
 * 
 * Implements UX Standards from OBS 9.6.3
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ConsentDetails {
  consentId: string;
  tppName: string;
  tppParticipantId: string;
  dpName: string;
  scopes: string[];
  expirationDate: string;
  accounts: Array<{
    id: string;
    name: string;
    number: string;
    type: string;
  }>;
}

export default function ConsentReviewScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [consent, setConsent] = useState<ConsentDetails | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    loadConsentDetails();
  }, []);

  async function loadConsentDetails() {
    try {
      // In production, fetch from API using consentId from params
      const mockConsent: ConsentDetails = {
        consentId: params.consentId as string,
        tppName: 'SmartBudget App',
        tppParticipantId: 'API123456',
        dpName: 'FNB Namibia',
        scopes: [
          'banking:accounts.basic.read',
          'banking:payments.write',
        ],
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        accounts: [
          { id: '1', name: 'Savings Account', number: '****4532', type: 'savings' },
          { id: '2', name: 'Current Account', number: '****8901', type: 'current' },
        ],
      };

      setConsent(mockConsent);
      // Pre-select all accounts
      setSelectedAccounts(mockConsent.accounts.map(a => a.id));
    } catch (error) {
      Alert.alert('Error', 'Failed to load consent details');
    } finally {
      setLoading(false);
    }
  }

  function toggleAccountSelection(accountId: string) {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  }

  async function handleApprove() {
    if (selectedAccounts.length === 0) {
      Alert.alert('No Accounts Selected', 'Please select at least one account to share');
      return;
    }

    setProcessing(true);
    try {
      // Call backend to authorize consent
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/obs/v1/authorize/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: consent!.consentId,
          approved: true,
          accountIds: selectedAccounts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        Alert.alert(
          'Success',
          'Consent has been approved. Redirecting...',
          [{
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home'),
          }]
        );
      } else {
        throw new Error('Failed to approve consent');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve consent. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    Alert.alert(
      'Reject Consent',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/obs/v1/authorize/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  consentId: consent!.consentId,
                  approved: false,
                }),
              });

              router.replace('/(tabs)/home');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject consent');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  }

  function getScopeDescription(scope: string): string {
    const descriptions: Record<string, string> = {
      'banking:accounts.basic.read': 'View your account information, balances, and transactions',
      'banking:payments.write': 'Initiate payments from your accounts',
      'banking:payments.read': 'View status of payments made on your behalf',
    };
    return descriptions[scope] || scope;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!consent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Consent not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Authorization Request</Text>
        <Text style={styles.headerSubtitle}>{consent.dpName}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* TPP Information */}
        <View style={styles.section}>
          <View style={styles.tppHeader}>
            <View style={styles.tppIcon}>
              <Ionicons name="business" size={32} color="#4CAF50" />
            </View>
            <View>
              <Text style={styles.tppName}>{consent.tppName}</Text>
              <Text style={styles.tppId}>ID: {consent.tppParticipantId}</Text>
            </View>
          </View>
          <Text style={styles.requestText}>
            is requesting access to your {consent.dpName} account
          </Text>
        </View>

        {/* OBS Mandatory Text (9.6.3) */}
        <View style={styles.schemeNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.schemeNoticeText}>
            This service is made within the rules of the Namibia Open Banking Standards
          </Text>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions Requested</Text>
          {consent.scopes.map((scope, index) => (
            <View key={index} style={styles.permissionItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.permissionText}>{getScopeDescription(scope)}</Text>
            </View>
          ))}
        </View>

        {/* Expiration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valid Until</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>
              {new Date(consent.expirationDate).toLocaleDateString('en-NA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Accounts to Share</Text>
          {consent.accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountItem,
                selectedAccounts.includes(account.id) && styles.accountItemSelected,
              ]}
              onPress={() => toggleAccountSelection(account.id)}
            >
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountNumber}>{account.number}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedAccounts.includes(account.id) && styles.checkboxSelected,
              ]}>
                {selectedAccounts.includes(account.id) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={24} color="#ff9800" />
          <Text style={styles.warningText}>
            By approving, you authorize {consent.tppName} to access your account information 
            through {consent.dpName}. You can revoke this access at any time from your account settings.
          </Text>
        </View>

        {/* Link to scheme info */}
        <TouchableOpacity style={styles.infoLink}>
          <Text style={styles.infoLinkText}>
            Learn more about Namibia Open Banking
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
        </TouchableOpacity>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
          disabled={processing}
        >
          <Text style={styles.rejectButtonText}>
            {processing ? 'Processing...' : 'Reject'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
          disabled={processing || selectedAccounts.length === 0}
        >
          <Text style={styles.approveButtonText}>
            {processing ? 'Processing...' : 'Approve'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  tppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tppIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tppName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  tppId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  requestText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  schemeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
  },
  schemeNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  accountItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  accountNumber: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#f57c00',
    lineHeight: 18,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
  },
  infoLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 5,
  },
  actions: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 30,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
