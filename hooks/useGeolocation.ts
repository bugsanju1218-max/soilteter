import { useState, useCallback } from 'react';
import type { GeolocationState } from '../types';

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
  });

  const getLocation = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
            const errorMsg = 'Geolocation is not supported by your browser.';
            setState(s => ({ ...s, error: errorMsg }));
            reject(new Error(errorMsg));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setState({
                    latitude,
                    longitude,
                    error: null,
                });
                resolve(position);
            },
            (error) => {
                const errorMsg = error.message;
                setState(s => ({ ...s, latitude: null, longitude: null, error: errorMsg }));
                reject(error);
            },
            options
        );
    });
  }, [options]);

  return { ...state, getLocation };
};
