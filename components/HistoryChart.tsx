import React from 'react';
import type { HistoryEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { LeafIcon } from './Icons';

interface HistoryChartProps {
  history: HistoryEntry[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const { settings, convertTemperature, t } = useSettings();
  
  // Chart dimensions
  const width = 500;
  const height = 200;
  const padding = 40;

  // We want the most recent data on the right, so we reverse the history
  const chartData = [...history].reverse().slice(-10); // show max 10 recent entries

  if (chartData.length < 2) {
    return null; // Don't render a chart for less than 2 data points
  }

  const getMinMax = (key: 'ph' | 'moisture' | 'temperature') => {
    const values = chartData.map(entry => 
      key === 'temperature' ? convertTemperature(entry.data[key]) : entry.data[key]
    );
    return [Math.min(...values), Math.max(...values)];
  };

  const [minPh, maxPh] = getMinMax('ph');
  const [minMoisture, maxMoisture] = getMinMax('moisture');
  const [minTemp, maxTemp] = getMinMax('temperature');

  const getCoords = (value: number, min: number, max: number, index: number) => {
    const x = padding + (index / (chartData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / (max - min === 0 ? 1 : max - min)) * (height - padding * 2);
    return { x, y };
  };

  const generatePath = (key: 'ph' | 'moisture' | 'temperature', min: number, max: number) => {
    return chartData
      .map((entry, index) => {
        const val = key === 'temperature' ? convertTemperature(entry.data[key]) : entry.data[key];
        const { x, y } = getCoords(val, min, max, index);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };
  
  const pathPh = generatePath('ph', minPh, maxPh);
  const pathMoisture = generatePath('moisture', minMoisture, maxMoisture);
  const pathTemp = generatePath('temperature', minTemp, maxTemp);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200/80 dark:border-slate-700">
      <h2 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4 flex items-center">
        <LeafIcon className="h-6 w-6 mr-3"/>
        {t('recentTrends')}
      </h2>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-labelledby="chartTitle">
            <title id="chartTitle">{t('chartTitle')}</title>
            {/* Y Axis */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" className="dark:stroke-slate-600" strokeWidth="1"/>
            {/* X Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" className="dark:stroke-slate-600" strokeWidth="1"/>
            
            <path d={pathPh} fill="none" stroke="#ef4444" strokeWidth="2" />
            <path d={pathMoisture} fill="none" stroke="#3b82f6" strokeWidth="2" />
            <path d={pathTemp} fill="none" stroke="#f97316" strokeWidth="2" />

            {/* Data points */}
            {chartData.map((entry, index) => (
                <g key={entry.id}>
                    <circle cx={getCoords(entry.data.ph, minPh, maxPh, index).x} cy={getCoords(entry.data.ph, minPh, maxPh, index).y} r="3" fill="#ef4444" />
                    <circle cx={getCoords(entry.data.moisture, minMoisture, maxMoisture, index).x} cy={getCoords(entry.data.moisture, minMoisture, maxMoisture, index).y} r="3" fill="#3b82f6" />
                    <circle cx={getCoords(convertTemperature(entry.data.temperature), minTemp, maxTemp, index).x} cy={getCoords(convertTemperature(entry.data.temperature), minTemp, maxTemp, index).y} r="3" fill="#f97316" />
                </g>
            ))}
        </svg>
      </div>
       <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>{t('ph')}</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span>{t('moisture')} (%)</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500"></span>{t('temp')} ({settings.unit === 'Celsius' ? '°C' : '°F'})</div>
        </div>
    </div>
  );
};

export default HistoryChart;