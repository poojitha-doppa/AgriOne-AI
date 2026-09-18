import { useState, useEffect, useCallback } from "react";
import { weatherService } from "@/lib/weatherService";
import { WeatherResponse, LocationData, WEATHER_CONFIG } from "@/lib/weatherConfig";
import { useI18n } from "@/lib/i18n";

export interface UseWeatherState {
  weather: WeatherResponse | null;
  loading: boolean;
  errorKey: string | null;
  location: LocationData | null;
  manualCity: string | null;
  riskLevel: "safe" | "caution" | "notSafe";
  riskIcon: string;
  riskReasonKey: string;
  adviceKeys: string[];
  conditionKey: string;
  isDayTime: "day" | "night";
  refreshing: boolean;
}

export function useWeather(): UseWeatherState & {
  refreshWeather: () => Promise<void>;
  setManualCity: (city: string) => void;
  clearError: () => void;
  requestGeolocation: () => Promise<void>;
} {
  const { lang } = useI18n();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualCity, setManualCity] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const riskData = weather
    ? weatherService.calculateRisk(weather)
    : { level: "safe" as const, icon: "🟢", reasonKey: "weather.loading" };

  const adviceKeys = weather ? weatherService.generateAdvice(weather) : [];

  const conditionKey =
    weather && weather.weather[0]
      ? weatherService.getWeatherCondition(
          weather.weather[0].description,
          weather.weather[0].icon,
          weather.main.temp
        )
      : "weather.loading";

  const isDayTime =
    weather && weather.sys
      ? weatherService.isDayNightFromIcon(weather.weather[0]?.icon || "d")
      : "day";

  const loadWeather = useCallback(async (cityOverride?: string) => {
    setLoading(true);
    setErrorKey(null);

    const cityToLoad = cityOverride !== undefined ? cityOverride : manualCity;

    // When loading by geolocation, clear previous data first so stale
    // city/weather from an older session is never shown as current.
    if (!cityToLoad) {
      setWeather(null);
      setLocation(null);
    }

    try {
      let weatherData: WeatherResponse | null = null;

      if (cityToLoad) {
        weatherData = await weatherService.fetchWeatherByCity(cityToLoad);
        if (weatherData) {
          setLocation({
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon,
            city: weatherData.name,
          });
        } else {
          setErrorKey("weather.invalidLocation");
        }
      } else {
        // Try to get geolocation
        const loc = await weatherService.getLocationWithPermission();

        if (loc) {
          const resolvedCity = await weatherService.reverseGeocodeLocation(loc, lang === "te" ? "te" : "en");
          setLocation({ ...loc, city: resolvedCity || undefined });
          weatherData = await weatherService.fetchWeather(loc, { forceRefresh: true });
        } else {
          setErrorKey("weather.geoPermissionDenied");
        }
      }

      if (weatherData) {
        setWeather(weatherData);
      } else {
        setWeather(null);
        if (!cityToLoad) setErrorKey("weather.fetchError");
      }
    } catch {
      setWeather(null);
      setErrorKey("weather.fetchError");
    } finally {
      setLoading(false);
    }
  }, [manualCity, lang]);

  // Initial load — wipe both the saved location AND the weather data
  // cache so the browser always requests a fresh GPS fix and fetches
  // current-city data.  This prevents stale data from a previous
  // session in a different city from ever being shown.
  useEffect(() => {
    // Reset manual-city mode on first mount so stale HMR/session state
    // cannot lock the widget to an older city like "Razam".
    setManualCity(null);
    setWeather(null);
    setLocation(null);
    localStorage.removeItem(WEATHER_CONFIG.PERMISSION_KEY);
    localStorage.removeItem("agrimitra-weather-cache");
    loadWeather("");
  }, []);

  const refreshWeather = useCallback(async () => {
    setRefreshing(true);
    weatherService.clearCache();
    await loadWeather();
    setRefreshing(false);
  }, [loadWeather]);

  const handleSetManualCity = useCallback((city: string) => {
    setManualCity(city);
    if (city.trim()) {
      weatherService.clearCache();
      loadWeather(city);
    }
  }, [loadWeather]);

  const requestGeolocation = useCallback(async () => {
    // Clear saved location so the browser prompts for permission again
    localStorage.removeItem(WEATHER_CONFIG.PERMISSION_KEY);
    weatherService.clearCache();
    setManualCity(null);
    setWeather(null);
    setErrorKey(null);
    setLoading(true);

    try {
      const loc = await weatherService.getLocationWithPermission();
      if (loc) {
        const resolvedCity = await weatherService.reverseGeocodeLocation(loc, lang === "te" ? "te" : "en");
        setLocation({ ...loc, city: resolvedCity || undefined });
        const weatherData = await weatherService.fetchWeather(loc, { forceRefresh: true });
        if (weatherData) {
          setWeather(weatherData);
        } else {
          setErrorKey("weather.fetchError");
        }
      } else {
        setErrorKey("weather.geoPermissionDenied");
      }
    } catch {
      setErrorKey("weather.fetchError");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const clearError = useCallback(() => {
    setErrorKey(null);
  }, []);

  return {
    weather,
    loading,
    errorKey,
    location,
    manualCity,
    riskLevel: riskData.level,
    riskIcon: riskData.icon,
    riskReasonKey: riskData.reasonKey,
    adviceKeys,
    conditionKey,
    isDayTime,
    refreshing,
    refreshWeather,
    setManualCity: handleSetManualCity,
    clearError,
    requestGeolocation,
  };
}
