import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  whiteLabel: {
    companyName: string;
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    domain: string;
    supportEmail: string;
    supportPhone: string;
    termsUrl: string;
    privacyUrl: string;
    footerText: string;
    darkMode: boolean;
  };
  api: {
    evolutionApiUrl: string;
    evolutionApiKey: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
    webhookUrl: string;
    webhookSecret: string;
    rateLimitPerMinute: number;
    timeout: number;
    retryAttempts: number;
  };
  campaigns: {
    maxMessagesPerCampaign: number;
    maxContactsPerCampaign: number;
    defaultInterval: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    autoDeleteAfterDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    webhookNotifications: boolean;
    campaignStart: boolean;
    campaignComplete: boolean;
    instanceDisconnect: boolean;
    quotaAlert: boolean;
    errorAlert: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireStrongPassword: boolean;
    enableTwoFactor: boolean;
    ipWhitelist: string[];
    logRetentionDays: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  whiteLabel: {
    companyName: 'Disparamator',
    logo: '',
    favicon: '',
    primaryColor: '#25D366',
    secondaryColor: '#128C7E',
    accentColor: '#075E54',
    domain: '',
    supportEmail: '',
    supportPhone: '',
    termsUrl: '',
    privacyUrl: '',
    footerText: 'Powered by Disparamator',
    darkMode: true
  },
  api: {
    evolutionApiUrl: 'https://api.gruposena.club',
    evolutionApiKey: '3ac318ab976bc8c75dfe827e865a576c',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
    webhookUrl: '',
    webhookSecret: '',
    rateLimitPerMinute: 60,
    timeout: 30000,
    retryAttempts: 3
  },
  campaigns: {
    maxMessagesPerCampaign: 5,
    maxContactsPerCampaign: 10000,
    defaultInterval: 30,
    maxFileSize: 50,
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
    autoDeleteAfterDays: 90
  },
  notifications: {
    emailNotifications: true,
    webhookNotifications: false,
    campaignStart: true,
    campaignComplete: true,
    instanceDisconnect: true,
    quotaAlert: true,
    errorAlert: true
  },
  security: {
    sessionTimeout: 480, // 8 horas em minutos
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    enableTwoFactor: false,
    ipWhitelist: [],
    logRetentionDays: 30
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar configurações do localStorage e/ou Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Primeiro, tentar carregar do localStorage
      const localSettings = localStorage.getItem('app_settings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        // Merge deeply to ensure all nested properties have defaults
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          whiteLabel: { ...DEFAULT_SETTINGS.whiteLabel, ...parsedSettings.whiteLabel },
          api: { ...DEFAULT_SETTINGS.api, ...parsedSettings.api },
          campaigns: { ...DEFAULT_SETTINGS.campaigns, ...parsedSettings.campaigns },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsedSettings.notifications },
          security: { ...DEFAULT_SETTINGS.security, ...parsedSettings.security }
        };
        setSettings(mergedSettings);
      }

      // Carregar do Supabase (novo formato key-value) - apenas para usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for settings');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('settings')
        .select('key, value');
      
      if (data && !error && data.length > 0) {
        // Converter array de key-value para objeto aninhado
        const settingsFromDB = convertKeyValueToSettings(data);
        // Deep merge to ensure all nested properties have defaults
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          whiteLabel: { ...DEFAULT_SETTINGS.whiteLabel, ...settingsFromDB.whiteLabel },
          api: { ...DEFAULT_SETTINGS.api, ...settingsFromDB.api },
          campaigns: { ...DEFAULT_SETTINGS.campaigns, ...settingsFromDB.campaigns },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...settingsFromDB.notifications },
          security: { ...DEFAULT_SETTINGS.security, ...settingsFromDB.security }
        };
        setSettings(mergedSettings);
        // Sincronizar com localStorage
        localStorage.setItem('app_settings', JSON.stringify(mergedSettings));
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Manter configurações padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      setSaving(true);
      
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Salvar no localStorage
      localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

      // Converter configurações para formato key-value e salvar no Supabase
      const keyValuePairs = convertSettingsToKeyValue(updatedSettings);
      
      // Usar upsert para cada configuração
      for (const { key, value, category } of keyValuePairs) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value,
            category,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) {
          console.error(`Erro ao salvar configuração ${key}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('app_settings');
    return true;
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `disparamator-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    return true;
  };

  const importSettings = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          
          if (importData.settings) {
            const mergedSettings = { ...DEFAULT_SETTINGS, ...importData.settings };
            setSettings(mergedSettings);
            localStorage.setItem('app_settings', JSON.stringify(mergedSettings));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao importar configurações:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  };

  // Funções de conveniência para seções específicas
  const updateWhiteLabel = (whiteLabel: Partial<AppSettings['whiteLabel']>) => {
    return saveSettings({ whiteLabel: { ...settings.whiteLabel, ...whiteLabel } });
  };

  const updateApiSettings = (api: Partial<AppSettings['api']>) => {
    return saveSettings({ api: { ...settings.api, ...api } });
  };

  const updateCampaignSettings = (campaigns: Partial<AppSettings['campaigns']>) => {
    return saveSettings({ campaigns: { ...settings.campaigns, ...campaigns } });
  };

  const updateNotifications = (notifications: Partial<AppSettings['notifications']>) => {
    return saveSettings({ notifications: { ...settings.notifications, ...notifications } });
  };

  const updateSecurity = (security: Partial<AppSettings['security']>) => {
    return saveSettings({ security: { ...settings.security, ...security } });
  };

  // Converter hex para HSL
  const hexToHsl = (hex: string): string => {
    // Remove o # se existir
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number;

    l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    // Converter para formato HSL CSS
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  // Helpers para aplicar configurações em tempo real
  const applyTheme = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Aplicar cores personalizadas convertidas para HSL
      try {
        if (settings.whiteLabel.primaryColor) {
          const primaryHsl = hexToHsl(settings.whiteLabel.primaryColor);
          root.style.setProperty('--primary', primaryHsl);
          
          // Calcular foreground baseado na luminosidade
          const luminance = parseInt(primaryHsl.split(' ')[2]) > 50 ? '0 0% 9%' : '0 0% 98%';
          root.style.setProperty('--primary-foreground', luminance);
        }
        
        if (settings.whiteLabel.secondaryColor) {
          const secondaryHsl = hexToHsl(settings.whiteLabel.secondaryColor);
          root.style.setProperty('--secondary', secondaryHsl);
          
          // Calcular foreground baseado na luminosidade
          const luminance = parseInt(secondaryHsl.split(' ')[2]) > 50 ? '0 0% 9%' : '0 0% 98%';
          root.style.setProperty('--secondary-foreground', luminance);
        }
        
        if (settings.whiteLabel.accentColor) {
          const accentHsl = hexToHsl(settings.whiteLabel.accentColor);
          root.style.setProperty('--accent', accentHsl);
          
          // Calcular foreground baseado na luminosidade
          const luminance = parseInt(accentHsl.split(' ')[2]) > 50 ? '0 0% 9%' : '0 0% 98%';
          root.style.setProperty('--accent-foreground', luminance);
        }
      } catch (error) {
        console.error('Erro ao aplicar cores do tema:', error);
      }

      // Atualizar favicon se configurado
      if (settings.whiteLabel.favicon) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = settings.whiteLabel.favicon;
        }
      }

      // Atualizar título da página
      document.title = settings.whiteLabel.companyName || 'Disparamator';
    }
  };

  // Aplicar tema sempre que as configurações mudarem
  useEffect(() => {
    if (!loading) {
      applyTheme();
    }
  }, [settings.whiteLabel, loading]);

  // Funções auxiliares para conversão key-value
  const convertKeyValueToSettings = (keyValueData: { key: string; value: any }[]): Partial<AppSettings> => {
    const result: any = {
      whiteLabel: {},
      api: {},
      campaigns: {},
      notifications: {},
      security: {}
    };

    keyValueData.forEach(({ key, value }) => {
      // Parse JSON value safely
      let parsedValue = value;
      if (typeof value === 'string') {
        try {
          // Only try to parse if it looks like JSON (starts with " or { or [)
          if (value.startsWith('"') || value.startsWith('{') || value.startsWith('[')) {
            parsedValue = JSON.parse(value);
          } else {
            parsedValue = value;
          }
        } catch (error) {
          // If parsing fails, use the raw value
          parsedValue = value;
        }
      }
      
      switch (key) {
        // White Label settings
        case 'company_name':
          result.whiteLabel.companyName = parsedValue;
          break;
        case 'company_logo':
          result.whiteLabel.logo = parsedValue;
          break;
        case 'company_favicon':
          result.whiteLabel.favicon = parsedValue;
          break;
        case 'footer_text':
          result.whiteLabel.footerText = parsedValue;
          break;
        case 'primary_color':
          result.whiteLabel.primaryColor = parsedValue;
          break;
        case 'secondary_color':
          result.whiteLabel.secondaryColor = parsedValue;
          break;
        case 'accent_color':
          result.whiteLabel.accentColor = parsedValue;
          break;
        case 'dark_mode':
          result.whiteLabel.darkMode = parsedValue === true || parsedValue === 'true';
          break;
        
        // API settings
        case 'evolution_api_url':
          result.api.evolutionApiUrl = parsedValue;
          break;
        case 'evolution_api_key':
          result.api.evolutionApiKey = parsedValue;
          break;
        case 'supabase_url':
          result.api.supabaseUrl = parsedValue;
          break;
        case 'supabase_anon_key':
          result.api.supabaseAnonKey = parsedValue;
          break;
        case 'supabase_service_role_key':
          result.api.supabaseServiceRoleKey = parsedValue;
          break;
          
        // Campaign settings
        case 'default_message_interval':
          result.campaigns.defaultInterval = parseInt(parsedValue);
          break;
        case 'max_contacts_per_campaign':
          result.campaigns.maxContactsPerCampaign = parseInt(parsedValue);
          break;
        case 'allow_media_messages':
          result.campaigns.allowMediaMessages = parsedValue === true || parsedValue === 'true';
          break;
          
        // Security settings
        case 'require_2fa':
          result.security.enableTwoFactor = parsedValue === true || parsedValue === 'true';
          break;
        case 'session_timeout':
          result.security.sessionTimeout = parseInt(parsedValue) / 60; // Convert seconds to minutes
          break;
        case 'max_login_attempts':
          result.security.maxLoginAttempts = parseInt(parsedValue);
          break;
          
        // Notification settings
        case 'email_notifications':
          result.notifications.emailNotifications = parsedValue === true || parsedValue === 'true';
          break;
        case 'webhook_notifications':
          result.notifications.webhookNotifications = parsedValue === true || parsedValue === 'true';
          break;
        case 'notify_campaign_start':
          result.notifications.campaignStart = parsedValue === true || parsedValue === 'true';
          break;
        case 'notify_campaign_complete':
          result.notifications.campaignComplete = parsedValue === true || parsedValue === 'true';
          break;
        case 'notify_campaign_errors':
          result.notifications.errorAlert = parsedValue === true || parsedValue === 'true';
          break;
      }
    });

    return result;
  };

  const convertSettingsToKeyValue = (settings: AppSettings) => {
    return [
      // White Label
      { key: 'company_name', value: JSON.stringify(settings.whiteLabel.companyName), category: 'white_label' },
      { key: 'company_logo', value: JSON.stringify(settings.whiteLabel.logo), category: 'white_label' },
      { key: 'company_favicon', value: JSON.stringify(settings.whiteLabel.favicon), category: 'white_label' },
      { key: 'footer_text', value: JSON.stringify(settings.whiteLabel.footerText), category: 'white_label' },
      { key: 'primary_color', value: JSON.stringify(settings.whiteLabel.primaryColor), category: 'white_label' },
      { key: 'secondary_color', value: JSON.stringify(settings.whiteLabel.secondaryColor), category: 'white_label' },
      { key: 'accent_color', value: JSON.stringify(settings.whiteLabel.accentColor), category: 'white_label' },
      { key: 'dark_mode', value: settings.whiteLabel.darkMode ? 'true' : 'false', category: 'white_label' },
      
      // API - only if they exist in the settings object
      ...(settings.api.evolutionApiUrl ? [{ key: 'evolution_api_url', value: JSON.stringify(settings.api.evolutionApiUrl), category: 'api' }] : []),
      ...(settings.api.evolutionApiKey ? [{ key: 'evolution_api_key', value: JSON.stringify(settings.api.evolutionApiKey), category: 'api' }] : []),
      ...(settings.api.supabaseUrl ? [{ key: 'supabase_url', value: JSON.stringify(settings.api.supabaseUrl), category: 'api' }] : []),
      ...(settings.api.supabaseAnonKey ? [{ key: 'supabase_anon_key', value: JSON.stringify(settings.api.supabaseAnonKey), category: 'api' }] : []),
      ...(settings.api.supabaseServiceRoleKey ? [{ key: 'supabase_service_role_key', value: JSON.stringify(settings.api.supabaseServiceRoleKey), category: 'api' }] : []),
      
      // Campaign
      { key: 'default_message_interval', value: settings.campaigns.defaultInterval.toString(), category: 'campaign' },
      { key: 'max_contacts_per_campaign', value: settings.campaigns.maxContactsPerCampaign.toString(), category: 'campaign' },
      { key: 'allow_media_messages', value: settings.campaigns.allowedFileTypes ? 'true' : 'false', category: 'campaign' },
      
      // Security
      { key: 'require_2fa', value: settings.security.enableTwoFactor ? 'true' : 'false', category: 'security' },
      { key: 'session_timeout', value: ((settings.security.sessionTimeout || 480) * 60).toString(), category: 'security' }, // Convert minutes to seconds
      { key: 'max_login_attempts', value: (settings.security.maxLoginAttempts || 5).toString(), category: 'security' },
      
      // Notifications
      { key: 'email_notifications', value: settings.notifications.emailNotifications ? 'true' : 'false', category: 'notifications' },
      { key: 'webhook_notifications', value: settings.notifications.webhookNotifications ? 'true' : 'false', category: 'notifications' },
      { key: 'notify_campaign_start', value: settings.notifications.campaignStart ? 'true' : 'false', category: 'notifications' },
      { key: 'notify_campaign_complete', value: settings.notifications.campaignComplete ? 'true' : 'false', category: 'notifications' },
      { key: 'notify_campaign_errors', value: settings.notifications.errorAlert ? 'true' : 'false', category: 'notifications' }
    ];
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    updateWhiteLabel,
    updateApiSettings,
    updateCampaignSettings,
    updateNotifications,
    updateSecurity,
    applyTheme
  };
}