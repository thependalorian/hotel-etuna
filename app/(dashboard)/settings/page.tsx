/**
 * Settings Page
 * 
 * Purpose: Application settings management with tabbed interface
 * Location: /app/(dashboard)/settings/page.tsx
 * 
 * Features:
 * - Tabbed settings interface
 * - General settings
 * - Notification preferences
 * - Security settings
 * - Appearance settings
 * - Save functionality
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Tab navigation with ARIA
 * - Form labels
 * 
 * @module SettingsPage
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Shield, Palette, Globe } from 'lucide-react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SettingsTabs from '@/components/features/settings/SettingsTabs';
import GeneralSettingsForm from '@/components/features/settings/GeneralSettingsForm';
import NotificationSettingsForm from '@/components/features/settings/NotificationSettingsForm';
import SecuritySettingsForm from '@/components/features/settings/SecuritySettingsForm';
import AppearanceSettingsForm from '@/components/features/settings/AppearanceSettingsForm';
import { apiUrl } from '@/lib/utils/api-url';

interface SettingsData {
  siteName: string;
  siteEmail: string;
  defaultLanguage: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingNotifications: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  theme: string;
  primaryColor: string;
  accentColor: string;
}

export default function SettingsPage() {
  useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<SettingsData>({
    siteName: 'Buffr Host',
    siteEmail: '',
    defaultLanguage: 'en',
    timezone: 'Africa/Windhoek',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingNotifications: true,
    twoFactorAuth: false,
    sessionTimeout: 24,
    passwordExpiry: 90,
    theme: 'light',
    primaryColor: 'nude',
    accentColor: 'nude',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(apiUrl('/api/settings'));
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({ ...prev, ...data }));
        } else {
          // Handle non-OK responses - use defaults
          console.warn('[SettingsPage] API returned non-OK status:', response.status);
        }
      } catch (error) {
        console.error('[SettingsPage] Error fetching settings:', error);
        // Continue with default form data
      } finally {
        setFetching(false);
      }
    }
    fetchSettings();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleFieldChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }

      const successMessage = document.createElement('div');
      successMessage.className = 'alert alert-success fixed top-4 right-4 z-50 animate-slide-down';
      successMessage.textContent = 'Settings saved successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'alert alert-error fixed top-4 right-4 z-50 animate-slide-down';
      errorMessage.textContent = error instanceof Error ? error.message : 'Failed to save settings';
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsForm formData={formData} onChange={handleFieldChange} />;
      case 'notifications':
        return <NotificationSettingsForm formData={formData} onChange={handleFieldChange} />;
      case 'security':
        return <SecuritySettingsForm formData={formData} onChange={handleFieldChange} />;
      case 'appearance':
        return <AppearanceSettingsForm formData={formData} onChange={handleFieldChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="buffr-page-title">Settings</h1>
        <p className="buffr-page-desc mt-2">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body">
          <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="min-h-[400px]">
            {renderTabContent()}
          </div>

          <div className="divider"></div>
          <div className="flex justify-end">
            <button
              className="btn btn-primary min-h-[44px]"
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
