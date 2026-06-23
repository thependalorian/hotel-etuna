/**
 * Platform Settings Component
 * 
 * Purpose: Component for managing platform-wide settings
 * Location: components/features/admin/platform/PlatformSettings.tsx
 * 
 * Features:
 * - General platform settings
 * - Security settings
 * - Notification settings
 * - Feature flags
 * - System maintenance
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/copy/brand';
import { apiUrl } from '@/lib/utils/api-url';
import { getPublicAppUrl } from '@/lib/utils/public-app-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import {
  Settings,
  Shield,
  Bell,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  Database,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  Lock
} from 'lucide-react';

interface PlatformSettingsProps {
  userRole: string;
}

interface PlatformSettingsState {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  maintenanceMode: boolean;
  requireEmailVerification: boolean;
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  emailNotifications: boolean;
  adminAlerts: boolean;
  newTenantNotification: boolean;
  criticalAlertsOnly: boolean;
  allowPublicRegistration: boolean;
  enableRestaurantFeatures: boolean;
  enablePaymentGateway: boolean;
  enableAIConcierge: boolean;
}

export default function PlatformSettings({ userRole }: PlatformSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState<PlatformSettingsState>({
    // General
    platformName: brand.name,
    platformUrl: getPublicAppUrl(),
    supportEmail: brand.emailSupport,
    maintenanceMode: false,
    
    // Security
    requireEmailVerification: true,
    twoFactorRequired: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    
    // Notifications
    emailNotifications: true,
    adminAlerts: true,
    newTenantNotification: true,
    criticalAlertsOnly: false,
    
    // Features
    allowPublicRegistration: false,
    enableRestaurantFeatures: true,
    enablePaymentGateway: true,
    enableAIConcierge: true,
  });


  const isSuperAdmin = userRole === 'super-admin';

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // In a real implementation, save to a platform_settings table
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      securityLogger.error('Error saving settings:', error);
    }

    setLoading(false);
  };

  const handleMaintenanceToggle = async () => {
    const newState = !settings.maintenanceMode;
    setSettings({ ...settings, maintenanceMode: newState });

    try {
      await fetch(apiUrl('/api/admin/platform/audit'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          resourceType: 'platform_settings',
          newValues: { maintenance_mode: newState },
        }),
      });
    } catch (e) {
      securityLogger.error('Failed to record platform audit', e);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'features', label: 'Features', icon: <ToggleLeft className="w-4 h-4" /> },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="alert alert-warning">
        <AlertTriangle className="w-5 h-5" />
        <span>You do not have permission to modify platform settings.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle className="w-5 h-5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Maintenance Mode Alert */}
      {settings.maintenanceMode && (
        <div className="alert alert-warning">
          <AlertTriangle className="w-5 h-5" />
          <span>
            <strong>Maintenance Mode Active</strong> - The platform is currently in maintenance mode. 
            Only admins can access the system.
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="tabs tabs-boxed bg-base-100 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab w-full justify-start ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-base-100 rounded-etuna-input shadow p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">General Settings</h3>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Platform Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Platform URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={settings.platformUrl}
                  onChange={(e) => setSettings({ ...settings, platformUrl: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Support Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.maintenanceMode}
                    onChange={handleMaintenanceToggle}
                  />
                  <span className="label-text">
                    <span className="font-medium">Maintenance Mode</span>
                    <span className="block text-sm text-base-content/60">
                      When enabled, only admins can access the platform
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Security Settings</h3>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Require Email Verification</span>
                    <span className="block text-sm text-base-content/60">
                      Users must verify their email before accessing the platform
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.twoFactorRequired}
                    onChange={(e) => setSettings({ ...settings, twoFactorRequired: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Require Two-Factor Authentication</span>
                    <span className="block text-sm text-base-content/60">
                      Admins must use 2FA to access the platform
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Session Timeout (minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-32"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Login Attempts</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-32"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Minimum Password Length</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-32"
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Notification Settings</h3>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Email Notifications</span>
                    <span className="block text-sm text-base-content/60">
                      Send email notifications for important events
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.adminAlerts}
                    onChange={(e) => setSettings({ ...settings, adminAlerts: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Admin Alerts</span>
                    <span className="block text-sm text-base-content/60">
                      Receive alerts for admin activity
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.newTenantNotification}
                    onChange={(e) => setSettings({ ...settings, newTenantNotification: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Partner onboarding alerts</span>
                    <span className="block text-sm text-base-content/60">
                      Notify platform operators when a referral partner accepts an invite
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.criticalAlertsOnly}
                    onChange={(e) => setSettings({ ...settings, criticalAlertsOnly: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Critical Alerts Only</span>
                    <span className="block text-sm text-base-content/60">
                      Only receive notifications for critical issues
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Feature Flags */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Feature Flags</h3>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.allowPublicRegistration}
                    onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Public registration</span>
                    <span className="block text-sm text-base-content/60">
                      Disabled for single-property OS — onboard referral partners via invite only
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.enableRestaurantFeatures}
                    onChange={(e) => setSettings({ ...settings, enableRestaurantFeatures: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Restaurant Features</span>
                    <span className="block text-sm text-base-content/60">
                      Enable restaurant and menu management features
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.enablePaymentGateway}
                    onChange={(e) => setSettings({ ...settings, enablePaymentGateway: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">Payment Gateway</span>
                    <span className="block text-sm text-base-content/60">
                      Enable payment processing features
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.enableAIConcierge}
                    onChange={(e) => setSettings({ ...settings, enableAIConcierge: e.target.checked })}
                  />
                  <span className="label-text">
                    <span className="font-medium">AI Concierge</span>
                    <span className="block text-sm text-base-content/60">
                      Enable Sofia AI concierge features
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t flex justify-end">
            <Button type="button" onClick={handleSave} isLoading={loading}>
              {!loading ? <Save className="w-4 h-4 mr-2" aria-hidden /> : null}
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-base-100 rounded-etuna-input shadow p-6">
        <h3 className="font-bold text-lg mb-4">System Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache
          </button>
          <button className="btn btn-outline">
            <Database className="w-4 h-4 mr-2" />
            Database Stats
          </button>
          <button className="btn btn-outline btn-error">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
