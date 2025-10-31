export const fetchWeather = async (latitude: number, longitude: number): Promise<{ temperature: number }> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data && data.current && typeof data.current.temperature_2m === 'number') {
            return {
                temperature: data.current.temperature_2m
            };
        } else {
            throw new Error("Invalid weather data format received");
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw new Error("Could not fetch weather data. Please try again later.");
    }
};
