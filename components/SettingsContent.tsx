
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { Settings, TemperatureUnit } from '../types';

const SettingsContent: React.FC = () => {
  const { settings, setSettings, t } = useSettings();

  const handleUnitChange = (unit: TemperatureUnit) => {
    setSettings(s => ({ ...s, unit }));
  };
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(s => ({ ...s, theme }));
  };
  
  const handleUiLanguageChange = (lang: 'en' | 'te') => {
    setSettings(s => ({ ...s, uiLanguage: lang }));
  };

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
       <div>
        <label className="font-semibold block mb-2">{t('theme')}</label>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => handleThemeChange('light')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-md w-1/3 ${settings.theme === 'light' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            {t('light')}
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`px-4 py-2 text-sm font-medium border w-1/3 -ml-px ${settings.theme === 'dark' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            {t('dark')}
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`px-4 py-2 text-sm font-medium border rounded-r-md w-1/3 -ml-px ${settings.theme === 'system' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            {t('system')}
          </button>
        </div>
      </div>
       <div>
        <label className="font-semibold block mb-2">{t('appLanguage')}</label>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => handleUiLanguageChange('en')}
            className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md w-1/2 ${settings.uiLanguage === 'en' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            English
          </button>
          <button
            onClick={() => handleUiLanguageChange('te')}
            className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md w-1/2 -ml-px ${settings.uiLanguage === 'te' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>
      <div>
        <label className="font-semibold block mb-2">{t('temperatureUnit')}</label>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => handleUnitChange('Celsius')}
            className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md w-1/2 ${settings.unit === 'Celsius' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            {t('celsius')}
          </button>
          <button
            onClick={() => handleUnitChange('Fahrenheit')}
            className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md w-1/2 -ml-px ${settings.unit === 'Fahrenheit' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600'}`}
          >
            {t('fahrenheit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
