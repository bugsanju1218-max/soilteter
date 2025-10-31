import React from 'react';
import { LeafIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

const HelpContent: React.FC = () => {
  const { t } = useSettings();
  return (
    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
      <div className="flex items-center gap-3">
        <LeafIcon className="h-8 w-8 text-green-600 dark:text-green-500" />
        <h2 className="text-xl font-bold text-green-800 dark:text-green-400">{t('welcomeToSoilSage')}</h2>
      </div>
      <p>
       {t('welcomeMessage')}
      </p>
      
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 pt-2">{t('howToUse')}</h3>
      <ol className="list-decimal list-inside space-y-2">
        <li>{t('guideStep1')}</li>
        <li>{t('guideStep2')}</li>
        <li>{t('guideStep3')}</li>
        <li>{t('guideStep4')}</li>
        <li>{t('guideStep5')}</li>
      </ol>
      
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 pt-2">{t('features')}</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>{t('feature1')}</li>
        <li>{t('feature2')}</li>
        <li>{t('feature3')}</li>
        <li>{t('feature4')}</li>
        <li>{t('feature5')}</li>
      </ul>
      
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 pt-2">{t('teluguSupportTitle')}</h3>
      <p>{t('teluguSupportDesc')}</p>


       <p className="text-xs text-gray-500 dark:text-gray-400 pt-4">
        {t('disclaimer')}
      </p>
    </div>
  );
};

export default HelpContent;