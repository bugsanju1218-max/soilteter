import React, { useState, useCallback } from 'react';
import SoilInputForm from './components/SoilInputForm';
import ResultCard from './components/ResultCard';
import HistoryTable from './components/HistoryTable';
import HistoryChart from './components/HistoryChart';
import ChatInterface from './components/ChatInterface';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { analyzeSoil } from './services/geminiService';
import type { SoilData, HistoryEntry, AnalysisResult } from './types';
import { LeafIcon, HelpIcon, SettingsIcon, HistoryIcon } from './components/Icons';
import Modal from './components/Modal';
import SettingsContent from './components/SettingsContent';
import HelpContent from './components/HelpContent';

const AppContent = () => {
  const { settings, t } = useSettings();
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const savedHistory = localStorage.getItem('soilAnalysisHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Could not load history from localStorage", error);
      return [];
    }
  });
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);


  React.useEffect(() => {
    try {
      localStorage.setItem('soilAnalysisHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
    }
  }, [history]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    if (settings.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        root.classList.toggle('dark', mediaQuery.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const handleAnalysis = useCallback(async (data: SoilData, image?: {data: string, mimeType: string} | null) => {
    setIsLoading(true);
    setError(null);
    setCurrentResult(null);
    try {
      const result = await analyzeSoil(data, settings.uiLanguage, image);
      const newEntry: HistoryEntry = {
        id: new Date().toISOString(),
        data,
        result,
      };
      setCurrentResult(result);
      setHistory(prevHistory => [newEntry, ...prevHistory]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [settings.uiLanguage]);
  
  const clearHistory = () => {
    setHistory([]);
    setCurrentResult(null);
    setHistoryModalOpen(false);
  }

  return (
      <div className="bg-green-50 dark:bg-slate-900 min-h-screen font-sans text-gray-800 dark:text-gray-300">
        <header className="bg-white/80 dark:bg-slate-800/80 dark:border-b dark:border-slate-700 backdrop-blur-sm shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
             <div className="flex items-center gap-3">
              <LeafIcon className="h-8 w-8 text-green-600 dark:text-green-500"/>
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">{t('soilSage')}</h1>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setHistoryModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('viewHistory')}><HistoryIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/></button>
               <button onClick={() => setHelpModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('help')}><HelpIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/></button>
               <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('settings')}><SettingsIcon className="h-6 w-6 text-gray-600 dark:text-gray-400"/></button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SoilInputForm onAnalyze={handleAnalysis} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
            <ResultCard result={currentResult} isLoading={isLoading} />
            {currentResult && history.length > 0 && <ChatInterface soilData={history[0].data} analysisResult={currentResult} language={settings.uiLanguage} />}
          </div>
        </main>
        
        <Modal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} title={t('settings')}>
            <SettingsContent />
        </Modal>

        <Modal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} title={t('aboutSoilSage')}>
            <HelpContent />
        </Modal>

        <Modal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} title={t('analysisHistory')}>
            <div className="space-y-4">
              <HistoryChart history={history} />
              <HistoryTable history={history} />
              {history.length > 0 && (
                <div className="text-right">
                    <button onClick={clearHistory} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">{t('clearHistory')}</button>
                </div>
              )}
            </div>
        </Modal>

      </div>
  );
}


function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}

export default App;