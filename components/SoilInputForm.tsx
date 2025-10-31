import React, { useState, FormEvent, useCallback } from 'react';
import type { SoilData } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchWeather } from '../services/weatherService';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useSettings } from '../contexts/SettingsContext';
import { LoadingIcon, LocationIcon, MicIcon, ImageIcon, CloseIcon } from './Icons';
import type { TranslationKey } from '../i18n/locales';
import { parseSoilDataFromText } from '../services/geminiService';

interface SoilInputFormProps {
  onAnalyze: (data: SoilData, image?: {data: string, mimeType: string} | null, location?: {latitude: number | null, longitude: number | null} | null) => void;
  isLoading: boolean;
}

const SoilInputForm: React.FC<SoilInputFormProps> = ({ onAnalyze, isLoading }) => {
  const { settings, t } = useSettings();
  const [formData, setFormData] = useState<SoilData>({
    ph: 7.0,
    moisture: 50,
    temperature: 20,
    nitrogen: 15,
    phosphorus: 15,
    potassium: 15,
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { latitude, longitude, error: geoError, getLocation } = useGeolocation();
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const { isListening, stopListening, startListening } = useVoiceInput({
    onResult: async (command) => {
      if (!command) return;
      setIsParsingVoice(true);
      setVoiceError(null);
      try {
        const parsedData = await parseSoilDataFromText(command, settings.uiLanguage);
        if (Object.keys(parsedData).length === 0 && command.length > 0) {
            setVoiceError(t('couldNotParseVoice'));
        } else {
            // Clamp values to min/max to prevent errors
            const clampedData: Partial<SoilData> = {};
            for (const key in parsedData) {
                const field = inputFields.find(f => f.name === key);
                const value = parsedData[key as keyof SoilData];
                if (field && typeof value === 'number') {
                    clampedData[key as keyof SoilData] = Math.max(field.min, Math.min(field.max, value));
                }
            }
            setFormData(d => ({ ...d, ...clampedData }));
        }
      } catch (error) {
        console.error("Failed to parse voice command:", error);
        setVoiceError(t('voiceCommandError'));
      } finally {
        setIsParsingVoice(false);
      }
    }
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleSliderChange = (name: keyof SoilData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (file) {
        if (!file.type.startsWith('image/')) {
            setImageError('Please select an image file.');
            return;
        }
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setImageError('Image size cannot exceed 4MB.');
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setImageFile(null);
      setImagePreview(null);
      setImageError(null);
      const fileInput = document.getElementById('soil-image-input') as HTMLInputElement;
      if (fileInput) {
          fileInput.value = '';
      }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let imagePayload: {data: string, mimeType: string} | null = null;
    if (imageFile && imagePreview) {
        const base64Data = imagePreview.split(',')[1];
        imagePayload = { data: base64Data, mimeType: imageFile.type };
    }
    const locationPayload = (latitude && longitude) ? { latitude, longitude } : null;
    onAnalyze(formData, imagePayload, locationPayload);
  };
  
  const handleGetWeather = useCallback(async () => {
    setIsFetchingWeather(true);
    setWeatherError(null);

    try {
        let currentLatitude = latitude;
        let currentLongitude = longitude;

        if (!currentLatitude || !currentLongitude) {
            await getLocation();
            // Since getLocation updates state, we can't get the value immediately.
            // This is a simplification; a better way would use useEffect.
            // For this app, we'll refetch it.
            if (navigator.geolocation) {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
                currentLatitude = pos.coords.latitude;
                currentLongitude = pos.coords.longitude;
            }
        }
    
        if (currentLatitude && currentLongitude) {
            const weatherData = await fetchWeather(currentLatitude, currentLongitude);
            setFormData(prev => ({
                ...prev,
                temperature: Math.round(weatherData.temperature),
            }));
        } else {
             setWeatherError(geoError || 'Could not get location.');
        }

    } catch (err) {
        setWeatherError(err instanceof Error ? err.message : 'Could not fetch weather.');
    } finally {
        setIsFetchingWeather(false);
    }
  }, [latitude, longitude, getLocation, geoError]);
  
  const inputFields: { name: keyof SoilData; labelKey: TranslationKey; min: number; max: number; step: number; unit: string }[] = [
    { name: 'ph', labelKey: 'soilPh', min: 0, max: 14, step: 0.1, unit: '' },
    { name: 'moisture', labelKey: 'moisture', min: 0, max: 100, step: 1, unit: '%' },
    { name: 'temperature', labelKey: 'temperature', min: -20, max: 50, step: 1, unit: '°C' },
    { name: 'nitrogen', labelKey: 'nitrogen', min: 0, max: 100, step: 1, unit: 'ppm' },
    { name: 'phosphorus', labelKey: 'phosphorus', min: 0, max: 100, step: 1, unit: 'ppm' },
    { name: 'potassium', labelKey: 'potassium', min: 0, max: 100, step: 1, unit: 'ppm' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200/80 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-start">
             <h2 className="text-xl font-bold text-green-800 dark:text-green-400 mt-1">{t('soilDataInput')}</h2>
             <div className="flex flex-col items-end">
                <button
                    type="button"
                    onClick={() => {
                        if (isListening) {
                            stopListening();
                        } else {
                            setVoiceError(null);
                            startListening();
                        }
                    }}
                    disabled={isParsingVoice}
                    className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                    title={isListening ? t('stopListening') : t('startVoiceInput')}
                >
                    {isParsingVoice ? <LoadingIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
                </button>
                {voiceError && <p className="text-xs text-red-600 mt-1 max-w-xs text-right">{voiceError}</p>}
             </div>
        </div>
        
        {inputFields.map(({ name, labelKey, min, max, step, unit }) => (
          <div key={name}>
            <label htmlFor={name} className="flex justify-between items-baseline text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>{t(labelKey)}</span>
                <span className="font-mono text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50 px-2 py-0.5 rounded-full text-xs">
                    {formData[name]} {unit}
                </span>
            </label>
            <input
              type="range"
              id={name}
              name={name}
              min={min}
              max={max}
              step={step}
              value={formData[name]}
              onChange={(e) => handleSliderChange(name, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-green-600 dark:bg-slate-700 dark:accent-green-500"
            />
          </div>
        ))}

        <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('uploadSoilPhoto')} <span className="text-xs text-gray-500">({t('optional')})</span></h3>
            {imagePreview ? (
                <div className="relative group w-full h-32">
                    <img src={imagePreview} alt={t('soilPreview')} className="object-cover w-full h-full rounded-lg" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-opacity rounded-lg">
                        <button type="button" onClick={handleRemoveImage} className="p-2 bg-white/80 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t('removeImage')}>
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <label htmlFor="soil-image-input" className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-green-600 dark:text-green-500 font-semibold">{t('chooseImage')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('pngJpgUpTo4MB')}</p>
                    </div>
                    <input id="soil-image-input" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" />
                </label>
            )}
            {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
        </div>
        
        <div>
            <button
                type="button"
                onClick={handleGetWeather}
                disabled={isFetchingWeather}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 transition-all"
            >
                {isFetchingWeather ? <LoadingIcon className="h-5 w-5" /> : <LocationIcon className="h-5 w-5" />}
                <span>{isFetchingWeather ? t('fetchingWeather') : t('useCurrentLocationTemp')}</span>
            </button>
            {weatherError && <p className="text-xs text-red-600 mt-1">{weatherError}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? <><LoadingIcon className="h-5 w-5" /> {t('analyzing')}</> : t('analyzeSoil')}
        </button>
      </form>
    </div>
  );
};

export default SoilInputForm;