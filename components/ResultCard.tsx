import React, { useState, useEffect } from 'react';
import type { AnalysisResult, PlantRecommendation, Amendment, SoilData, HistoryEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useNotifications } from '../hooks/useNotifications';
import { translateAnalysis, translateText } from '../services/geminiService';
import { downloadReport } from '../services/reportGenerator';
import { LoadingIcon, PlantIcon, ScienceIcon, SpeakerIcon, BellIcon, CheckCircleIcon, GlobeIcon, StopIcon, DownloadIcon } from './Icons';

interface ResultCardProps {
  result: AnalysisResult | null;
  data: SoilData | null;
  isLoading: boolean;
}

const languageMap: { [key: string]: string } = {
    'en-US': 'English',
    'te-IN': 'Telugu',
    'hi-IN': 'Hindi',
    'es-ES': 'Spanish',
};


const ReminderSetter: React.FC<{ item: PlantRecommendation | Amendment }> = ({ item }) => {
    const { t } = useSettings();
    const { scheduleNotification, notificationPermission } = useNotifications();
    const [duration, setDuration] = useState(3600); // Default to 1 hour
    const [showThanks, setShowThanks] = useState(false);

    const handleSetReminder = () => {
        const task = t('reminderTask', {itemName: item.name});
        scheduleNotification(task, t('reminderBody'), duration);
        setShowThanks(true);
        setTimeout(() => setShowThanks(false), 3000);
    }
    
    if (notificationPermission === 'denied') {
        return <p className="text-xs text-gray-500 mt-1">{t('notificationsDenied')}</p>
    }
    
    if(showThanks) {
        return <p className="text-xs text-green-600 mt-1">{t('reminderSet')}</p>
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="text-xs border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300">
                <option value={3600}>{t('in1Hour')}</option>
                <option value={28800}>{t('in8Hours')}</option>
                <option value={86400}>{t('in1Day')}</option>
            </select>
            <button onClick={handleSetReminder} className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">{t('set')}</button>
        </div>
    )
}


const ResultCard: React.FC<ResultCardProps> = ({ result, data, isLoading }) => {
    const { settings, t, convertTemperature } = useSettings();
    const [activeReminder, setActiveReminder] = useState<string | null>(null);
    
    // State for translation
    const [translatedResult, setTranslatedResult] = useState<AnalysisResult | null>(null);
    const [translatedScorePrefix, setTranslatedScorePrefix] = useState<string | null>(null);
    const [displayLanguage, setDisplayLanguage] = useState<'original' | string>('original');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);
    
    const { isSpeaking, isGenerating, speak } = useVoiceAssistant();

    // Reset translation when the base result changes
    useEffect(() => {
        setTranslatedResult(null);
        setDisplayLanguage('original');
        setTranslationError(null);
        setActiveReminder(null);
        setTranslatedScorePrefix(null);
    }, [result]);

    const displayResult = displayLanguage !== 'original' && translatedResult ? translatedResult : result;

    const textToSpeak = (() => {
        if (!displayResult) return undefined;

        // Prevent speaking during intermediate render after language change but before translation is ready
        if (displayLanguage !== 'original' && (!translatedResult || !translatedScorePrefix)) {
            return undefined;
        }

        const scorePrefix = (displayLanguage !== 'original' && translatedScorePrefix)
            ? translatedScorePrefix
            : t('soilHealthScore', { score: displayResult.soil_health_score });

        return `${scorePrefix}. ${displayResult.interpretation}`;
    })();
    
    const toggleReminder = (itemId: string) => {
        setActiveReminder(prev => prev === itemId ? null : itemId);
    }

    const handleTranslate = async (targetLangCode: string) => {
        if (!result) return;
        
        if (targetLangCode === 'original') {
            setDisplayLanguage('original');
            setTranslatedResult(null);
            setTranslatedScorePrefix(null);
            return;
        }

        const targetLangName = languageMap[targetLangCode];
        
        setIsTranslating(true);
        setTranslationError(null);
        setDisplayLanguage(targetLangCode);

        // This uses the current UI language to get the phrase to be translated.
        const originalPrefixToTranslate = t('soilHealthScore', { score: result.soil_health_score });

        try {
            // Run both translations in parallel for efficiency
            const [translation, prefixTranslation] = await Promise.all([
                translateAnalysis(result, targetLangCode, targetLangName),
                translateText(originalPrefixToTranslate, targetLangName)
            ]);
            
            setTranslatedResult(translation);
            setTranslatedScorePrefix(prefixTranslation);
        } catch (error) {
            console.error(error);
            setTranslationError(t('translationError'));
            setDisplayLanguage('original'); // Revert on error
            setTranslatedScorePrefix(null);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSpeak = () => {
        let lang: 'en' | 'te' | 'hi' | 'es' = 'en'; // Default
        
        if (displayLanguage === 'original') {
            lang = settings.uiLanguage;
        } else if (displayLanguage.startsWith('te')) {
            lang = 'te';
        } else if (displayLanguage.startsWith('hi')) {
            lang = 'hi';
        } else if (displayLanguage.startsWith('es')) {
            lang = 'es';
        } else if (displayLanguage.startsWith('en')) {
            lang = 'en';
        }

        speak(textToSpeak, lang);
    };

    const handleDownload = () => {
        if (!result || !data || !displayResult) return;
        
        // Use the currently displayed result (which could be translated) for the report
        const entry: HistoryEntry = {
            id: new Date().toISOString(),
            data,
            result: displayResult
        };
        downloadReport(entry, settings, t, convertTemperature);
    };


    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200/80 dark:border-slate-700 flex flex-col items-center justify-center min-h-[300px]">
                <LoadingIcon className="h-12 w-12 text-green-600 dark:text-green-500"/>
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{t('analyzingYourSoil')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('thisMayTakeAMoment')}</p>
            </div>
        );
    }

    if (!result || !displayResult) {
        return (
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200/80 dark:border-slate-700 flex flex-col items-center justify-center min-h-[300px] text-center">
                <ScienceIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"/>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">{t('readyForAnalysis')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{t('enterSoilDataToStart')}</p>
            </div>
        );
    }
    
    const scoreColor = displayResult.soil_health_score > 75 ? 'text-green-600 dark:text-green-400' : displayResult.soil_health_score > 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

    return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200/80 dark:border-slate-700">
      <div className="flex justify-between items-start gap-2">
         <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4">{t('analysisResult')}</h2>
         <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
                <select
                    value={displayLanguage}
                    onChange={(e) => handleTranslate(e.target.value)}
                    disabled={isTranslating}
                    className="pl-8 pr-4 py-1 text-sm bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label={t('translate')}
                >
                    <option value="original">{t('original')} ({settings.uiLanguage.toUpperCase()})</option>
                    <option value="en-US">English</option>
                    <option value="te-IN">తెలుగు (Telugu)</option>
                    <option value="hi-IN">{t('hindi')}</option>
                    <option value="es-ES">{t('spanish')}</option>
                </select>
                <GlobeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            </div>

            <button onClick={handleSpeak} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('readAloud')}>
                {isGenerating ? <LoadingIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/> : isSpeaking ? <StopIcon className="h-6 w-6 text-red-500"/> : <SpeakerIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/>}
            </button>

            <button onClick={handleDownload} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('downloadReport')}>
                <DownloadIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/>
            </button>
         </div>
      </div>
      
      {isTranslating && <p className="text-sm text-center text-gray-500 dark:text-gray-400 my-2">{t('translating')}</p>}
      {translationError && <p className="text-sm text-center text-red-600 dark:text-red-500 my-2">{translationError}</p>}


      <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-slate-700">
        <div className={`text-5xl font-bold ${scoreColor}`}>{displayResult.soil_health_score}</div>
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{t('soilHealthScoreTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{t('soilQualityMeasure')}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{t('interpretation')}</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{displayResult.interpretation}</p>
        </div>

        <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2"><PlantIcon className="h-5 w-5"/>{t('plantRecommendations')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('plantRecommendationsDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayResult.recommendations.plants.map(plant => (
                <div key={plant.name} className="bg-green-50/70 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800/50 space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-green-900 dark:text-green-300">{plant.name}</h4>
                        <button onClick={() => toggleReminder(plant.name)} className="p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-900" title={t('setReminder')}>
                            <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{plant.reasoning}</p>
                    
                    {plant.care_tips?.length > 0 && (
                        <div>
                            <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('careTips')}</h5>
                            <ul className="mt-1 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {plant.care_tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {plant.ideal_conditions?.length > 0 && (
                        <div>
                            <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('idealConditions')}</h5>
                            <ul className="mt-1 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {plant.ideal_conditions.map((condition, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{condition}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeReminder === plant.name && <ReminderSetter item={plant}/>}
                </div>
            ))}
            </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">{t('amendmentRecommendations')}</h3>
          <ul className="list-none space-y-3 text-gray-700 dark:text-gray-300">
             {displayResult.recommendations.amendments.map(amendment => (
              <li key={amendment.name} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="font-semibold">{amendment.name}</span>: {amendment.reasoning} 
                        <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('application')}: {amendment.application_rate}
                        </span>
                    </div>
                     <button onClick={() => toggleReminder(amendment.name)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 flex-shrink-0 ml-2" title={t('setReminder')}>
                        <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                    </button>
                </div>
                 {activeReminder === amendment.name && <ReminderSetter item={amendment}/>}
              </li>
            ))}
            {displayResult.recommendations.amendments.length === 0 && (
                <li className="text-gray-500 dark:text-gray-400">{t('noAmendmentsNeeded')}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
    );
};

export default ResultCard;