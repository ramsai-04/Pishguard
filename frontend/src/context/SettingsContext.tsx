import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  detectionSensitivity: 'low' | 'medium' | 'high';
  showConfidenceScore: boolean;
  enableXAI: boolean;
  saveHistory: boolean;
  doNotStoreUrls: boolean;
  alertOnHighRisk: boolean;
  apiUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const defaultSettings: Settings = {
  theme: 'dark',
  detectionSensitivity: 'medium',
  showConfidenceScore: true,
  enableXAI: true,
  saveHistory: true,
  doNotStoreUrls: false,
  alertOnHighRisk: true,
  apiUrl: apiBaseUrl ? `${apiBaseUrl}/scan` : '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('phishguard_settings');
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('phishguard_settings', JSON.stringify(settings));
    
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('phishguard_settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
