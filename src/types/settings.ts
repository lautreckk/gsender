export interface WhiteLabelSettings {
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
}

export interface APISettings {
  grupoSenaApiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  rateLimitPerMinute: number;
  timeout: number;
  retryAttempts: number;
}

export interface CampaignSettings {
  maxMessagesPerCampaign: number;
  maxContactsPerCampaign: number;
  defaultInterval: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  autoDeleteAfterDays: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  webhookNotifications: boolean;
  campaignStart: boolean;
  campaignComplete: boolean;
  instanceDisconnect: boolean;
  quotaAlert: boolean;
  errorAlert: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
  enableTwoFactor: boolean;
  ipWhitelist: string[];
  logRetentionDays: number;
}

export interface AllSettings {
  whiteLabel: WhiteLabelSettings;
  api: APISettings;
  campaigns: CampaignSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}