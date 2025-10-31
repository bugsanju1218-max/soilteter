
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
  
  const handleAlertsChange = (field: string, value: any) => {
    const keys = field.split('.');
    setSettings(s => {
        const newAlerts = { ...s.alerts };
        let current: any = newAlerts;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return { ...s, alerts: newAlerts };
    });
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
       <div className="space-y-4 pt-4 border-t dark:border-slate-700">
            <h3 className="font-semibold">{t('smartAlerts')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{t('smartAlertsDesc')}</p>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={settings.alerts.enabled}
                    onChange={(e) => handleAlertsChange('enabled', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span>{t('enableAlerts')}</span>
            </label>
            <div className={`space-y-3 ${!settings.alerts.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div>
                    <label className="block mb-1 font-medium">{t('phRange')}</label>
                    <div className="flex items-center gap-2">
                        <input type="number" value={settings.alerts.ph.min} onChange={(e) => handleAlertsChange('ph.min', parseFloat(e.target.value))} className="w-full px-2 py-1 text-center border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300" step="0.1" />
                        <span>-</span>
                        <input type="number" value={settings.alerts.ph.max} onChange={(e) => handleAlertsChange('ph.max', parseFloat(e.target.value))} className="w-full px-2 py-1 text-center border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300" step="0.1" />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium">{t('moistureRange')}</label>
                     <div className="flex items-center gap-2">
                        <input type="number" value={settings.alerts.moisture.min} onChange={(e) => handleAlertsChange('moisture.min', parseFloat(e.target.value))} className="w-full px-2 py-1 text-center border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300" />
                        <span>-</span>
                        <input type="number" value={settings.alerts.moisture.max} onChange={(e) => handleAlertsChange('moisture.max', parseFloat(e.target.value))} className="w-full px-2 py-1 text-center border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300" />
                    </div>
                </div>
            </div>
       </div>

    </div>
  );
};

export default SettingsContent;