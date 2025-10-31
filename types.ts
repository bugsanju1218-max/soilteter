
export interface SensorData {
  temperature: number | null;
  moisture: number | null;
  ph: number | null;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}

// FIX: Define and export all missing types to resolve import errors across the application.
export interface SoilData {
  ph: number;
  moisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
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
  soil_health_score: number;
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
  language: string; // e.g., 'te-IN', 'en-US'
  uiLanguage: 'en' | 'te';
  theme: 'light' | 'dark' | 'system';
  alerts: {
    enabled: boolean;
    ph: { min: number; max: number };
    moisture: { min: number; max: number };
  };
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}
