import React from 'react';
import type { HistoryEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface HistoryTableProps {
  history: HistoryEntry[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
    const { settings, convertTemperature, t } = useSettings();
    if (history.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('noHistory')}</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-4 py-3">{t('date')}</th>
                        <th scope="col" className="px-4 py-3">{t('ph')}</th>
                        <th scope="col" className="px-4 py-3">{t('moisture')}</th>
                        <th scope="col" className="px-4 py-3">{t('temp')} ({settings.unit === 'Celsius' ? '°C' : '°F'})</th>
                        <th scope="col" className="px-4 py-3">{t('n')}</th>
                        <th scope="col" className="px-4 py-3">{t('p')}</th>
                        <th scope="col" className="px-4 py-3">{t('k')}</th>
                        <th scope="col" className="px-4 py-3">{t('score')}</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(entry => (
                        <tr key={entry.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{new Date(entry.id).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{entry.data.ph.toFixed(1)}</td>
                            <td className="px-4 py-3">{entry.data.moisture}%</td>
                            <td className="px-4 py-3">{convertTemperature(entry.data.temperature).toFixed(1)}</td>
                            <td className="px-4 py-3">{entry.data.nitrogen}</td>
                            <td className="px-4 py-3">{entry.data.phosphorus}</td>
                            <td className="px-4 py-3">{entry.data.potassium}</td>
                            <td className="px-4 py-3 font-bold">{entry.result.soil_health_score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HistoryTable;