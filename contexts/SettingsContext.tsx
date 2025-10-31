import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Settings, TemperatureUnit } from '../types';
import { translations, TranslationKey } from '../i18n/locales';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  convertTemperature: (celsius: number) => number;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  unit: 'Celsius',
  language: 'te-IN', // Voice language default to Telugu
  uiLanguage: 'en', // UI language
  theme: 'system',
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = window.localStorage.getItem('soilAppSettings');
      return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    } catch (error) {
      console.error("Could not load settings from localStorage", error);
      return defaultSettings;
    }
  });

  React.useEffect(() => {
    try {
        window.localStorage.setItem('soilAppSettings', JSON.stringify(settings));
    } catch (error) {
        console.error("Could not save settings to localStorage", error);
    }
  }, [settings]);

  const convertTemperature = useCallback((celsius: number): number => {
    if (settings.unit === 'Fahrenheit') {
      return (celsius * 9/5) + 32;
    }
    return celsius;
  }, [settings.unit]);
  
  const t = useCallback((key: TranslationKey, replacements?: Record<string, string | number>): string => {
    let translation = translations[settings.uiLanguage][key] || translations['en'][key];
    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{{${placeholder}}}`, String(value));
        });
    }
    return translation;
  }, [settings.uiLanguage]);


  const value = useMemo(() => ({
    settings,
    setSettings,
    convertTemperature,
    t,
  }), [settings, convertTemperature, t]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};