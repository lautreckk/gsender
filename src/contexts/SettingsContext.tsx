import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSettings, AppSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;
  updateWhiteLabel: (whiteLabel: Partial<AppSettings['whiteLabel']>) => Promise<boolean>;
  updateApiSettings: (api: Partial<AppSettings['api']>) => Promise<boolean>;
  updateCampaignSettings: (campaigns: Partial<AppSettings['campaigns']>) => Promise<boolean>;
  updateNotifications: (notifications: Partial<AppSettings['notifications']>) => Promise<boolean>;
  updateSecurity: (security: Partial<AppSettings['security']>) => Promise<boolean>;
  applyTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  // Apply theme automatically when settings change
  useEffect(() => {
    if (!settingsHook.loading) {
      settingsHook.applyTheme();
    }
  }, [settingsHook.settings.whiteLabel, settingsHook.loading]);

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}

// Hook to get just the settings values (read-only)
export function useAppSettings() {
  const context = useSettingsContext();
  return {
    settings: context.settings,
    loading: context.loading
  };
}

// Hook to get specific setting categories
export function useWhiteLabelSettings() {
  const { settings } = useAppSettings();
  return settings.whiteLabel;
}

export function useApiSettingsValues() {
  const { settings } = useAppSettings();
  return settings.api;
}

export function useCampaignSettingsValues() {
  const { settings } = useAppSettings();
  return settings.campaigns;
}

export function useNotificationSettingsValues() {
  const { settings } = useAppSettings();
  return settings.notifications;
}

export function useSecuritySettingsValues() {
  const { settings } = useAppSettings();
  return settings.security;
}