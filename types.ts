export interface SoilData {
  ph: number;
  moisture: number; // as a percentage
  temperature: number; // in Celsius
  nitrogen: number; // in ppm
  phosphorus: number; // in ppm
  potassium: number; // in ppm
}

export interface PlantRecommendation {
  name: string;
  reasoning: string;
  care_tips: string[];
  ideal_conditions: string[];
}

export interface Amendment {
    name: string;
    reasoning: string;
    application_rate: string;
}

export interface AnalysisResult {
  soil_health_score: number; // 0-100
  interpretation: string;
  recommendations: {
    plants: PlantRecommendation[];
    amendments: Amendment[];
  };
}

export interface HistoryEntry {
  id: string;
  data: SoilData;
  result: AnalysisResult;
}

export type TemperatureUnit = 'Celsius' | 'Fahrenheit';

export interface Settings {
  unit: TemperatureUnit;
  language: string; // Voice language
  uiLanguage: 'en' | 'te'; // UI language
  theme: 'light' | 'dark' | 'system';
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}