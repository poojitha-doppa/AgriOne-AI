export const WEATHER_CONFIG = {
  API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || "",
  BASE_URL: "https://api.openweathermap.org/data/2.5/weather",
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
  PERMISSION_KEY: "agrimitra-location",
  LOCATION_CACHE_KEY: "agrimitra-weather-location",
};

export interface WeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface CachedWeather {
  data: WeatherResponse;
  timestamp: number;
}

export interface LocationData {
  lat: number;
  lon: number;
  accuracy?: number;
  city?: string;
}
