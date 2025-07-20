import { useState, useEffect } from 'react';
import { useWhiteLabelSettings } from '@/contexts/SettingsContext';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const whiteLabelSettings = useWhiteLabelSettings();
  const [theme, setTheme] = useState<Theme>(() => {
    // Carregar tema salvo do localStorage - aplicação do tema é feita no HTML
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Se dark mode não está habilitado nas configurações, forçar light
    if (!whiteLabelSettings.darkMode) {
      root.classList.remove('dark');
      root.classList.add('light');
      // Não sobrescrever o localStorage aqui para preservar a preferência do usuário
      return;
    }

    // Aplicar tema normalmente
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, whiteLabelSettings.darkMode]);

  const setThemeAndSave = (newTheme: Theme) => {
    // Só permitir mudança se dark mode estiver habilitado
    if (!whiteLabelSettings.darkMode && newTheme !== 'light') {
      return;
    }
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    // Só permitir toggle se dark mode estiver habilitado
    if (!whiteLabelSettings.darkMode) {
      return;
    }
    
    if (theme === 'light') {
      setThemeAndSave('dark');
    } else if (theme === 'dark') {
      setThemeAndSave('system');
    } else {
      setThemeAndSave('light');
    }
  };

  return {
    theme,
    setTheme: setThemeAndSave,
    toggleTheme,
    isDarkModeEnabled: whiteLabelSettings.darkMode
  };
}