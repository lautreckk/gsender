import { useApiSettingsValues } from '@/contexts/SettingsContext';
import { getEvolutionApiConfig } from '@/config/evolutionApi';

/**
 * Hook to get API configuration with user settings applied
 */
export function useApiConfig() {
  const apiSettings = useApiSettingsValues();
  
  return getEvolutionApiConfig({
    evolutionApiUrl: apiSettings.evolutionApiUrl,
    evolutionApiKey: apiSettings.evolutionApiKey,
    timeout: apiSettings.timeout,
    retryAttempts: apiSettings.retryAttempts
  });
}

/**
 * Helper function to get API config outside of React components
 * This loads settings from localStorage as fallback
 */
export function getApiConfigFromStorage() {
  try {
    const storedSettings = localStorage.getItem('app_settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      return getEvolutionApiConfig({
        evolutionApiUrl: settings.api?.evolutionApiUrl,
        evolutionApiKey: settings.api?.evolutionApiKey,
        timeout: settings.api?.timeout,
        retryAttempts: settings.api?.retryAttempts
      });
    }
  } catch (error) {
    console.warn('Error loading API settings from storage:', error);
  }
  
  // Return default config if no stored settings
  return getEvolutionApiConfig();
}