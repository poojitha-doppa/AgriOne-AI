import {
  WEATHER_CONFIG,
  WeatherResponse,
  CachedWeather,
  LocationData,
} from "@/lib/weatherConfig";

class WeatherService {
  private static readonly TARGET_ACCURACY_METERS = 120;
  private static readonly LOCATION_NAME_CACHE_KEY = "agrimitra-location-name-cache";
  private static readonly LOCATION_NAME_CACHE_TTL = 24 * 60 * 60 * 1000;

  private async getBestEffortPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      let bestPosition: GeolocationPosition | null = null;
      let settled = false;

      const finalize = () => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timeoutId);
        resolve(bestPosition);
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // End early if we already have a sufficiently accurate fix.
          if (position.coords.accuracy <= WeatherService.TARGET_ACCURACY_METERS) {
            finalize();
          }
        },
        (error) => {
          console.warn("Geolocation watch error:", error.code, error.message);
          finalize();
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );

      const timeoutId = window.setTimeout(finalize, 20000);
    });
  }

  /**
   * Request location permission and get coordinates
   */
  async getLocationWithPermission(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        resolve(null);
        return;
      }

      this.getBestEffortPosition()
        .then((position) => {
          if (!position) {
            resolve(null);
            return;
          }

          const { latitude, longitude, accuracy } = position.coords;

          resolve({ lat: latitude, lon: longitude, accuracy });
        })
        .catch(() => resolve(null));
    });
  }

  /**
   * Resolve a human-readable place from coordinates.
   * Uses cached value first, then reverse geocoding providers.
   */
  async reverseGeocodeLocation(location: LocationData, language: "en" | "te" = "en"): Promise<string | null> {
    const cachedName = this.getCachedLocationName(location, language);
    if (cachedName) return cachedName;

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=jsonv2&zoom=18&addressdetails=1&accept-language=${language}`;
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (nominatimResponse.ok) {
        const nominatimPayload = await nominatimResponse.json();
        const addr = nominatimPayload?.address;
        const nominatimLocality =
          addr?.village ||
          addr?.hamlet ||
          addr?.suburb ||
          addr?.town ||
          addr?.city ||
          addr?.county ||
          addr?.state_district ||
          addr?.state;

        if (typeof nominatimLocality === "string" && nominatimLocality.trim()) {
          const normalized = nominatimLocality.trim();
          this.cacheLocationName(location, normalized, language);
          return normalized;
        }
      }
    } catch {
      // fall through to secondary provider
    }

    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lon}&localityLanguage=${language}`;
      const bdcResponse = await fetch(bdcUrl);
      if (!bdcResponse.ok) return null;

      const payload = await bdcResponse.json();
      const locality = payload?.locality || payload?.city || payload?.principalSubdivision || payload?.countryName;
      if (typeof locality === "string" && locality.trim()) {
        const normalized = locality.trim();
        this.cacheLocationName(location, normalized, language);
        return normalized;
      }

      return null;
    } catch {
      return null;
    }
  }

  private cacheLocationName(location: LocationData, name: string, language: "en" | "te"): void {
    try {
      const entry = {
        lat: location.lat,
        lon: location.lon,
        name,
        language,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${WeatherService.LOCATION_NAME_CACHE_KEY}:${language}`, JSON.stringify(entry));
    } catch {
      // ignore storage errors
    }
  }

  private getCachedLocationName(location: LocationData, language: "en" | "te"): string | null {
    try {
      const raw = localStorage.getItem(`${WeatherService.LOCATION_NAME_CACHE_KEY}:${language}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as { lat?: number; lon?: number; name?: string; language?: string; timestamp?: number };
      if (!parsed?.name || parsed.lat == null || parsed.lon == null || parsed.timestamp == null || parsed.language !== language) {
        return null;
      }

      if (Date.now() - parsed.timestamp > WeatherService.LOCATION_NAME_CACHE_TTL) {
        localStorage.removeItem(WeatherService.LOCATION_NAME_CACHE_KEY);
        return null;
      }

      const latDiff = Math.abs(parsed.lat - location.lat);
      const lonDiff = Math.abs(parsed.lon - location.lon);
      if (latDiff > 0.01 || lonDiff > 0.01) {
        return null;
      }

      return parsed.name;
    } catch {
      return null;
    }
  }

  /**
   * Fetch weather data with location-aware caching.
   * The cache is only used when the stored coordinates are within ~1 km
   * of the requested location so that moving to a different city never
   * serves stale data from the previous place.
   */
  async fetchWeather(
    location: LocationData,
    options?: { forceRefresh?: boolean }
  ): Promise<WeatherResponse | null> {
    try {
      // Only use cache when it matches the current location and caller
      // did not explicitly request a fresh API response.
      if (!options?.forceRefresh) {
        const cached = this.getFromCache(location);
        if (cached) {
          return cached.data;
        }
      }

      const url = `${WEATHER_CONFIG.BASE_URL}?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_CONFIG.API_KEY}&units=metric`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherResponse = await response.json();

      // Cache the result together with the coordinates used
      this.saveToCache(data, location);

      return data;
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      return null;
    }
  }

  /**
   * Get weather by city name as fallback
   */
  async fetchWeatherByCity(
    city: string
  ): Promise<WeatherResponse | null> {
    try {
      const url = `${WEATHER_CONFIG.BASE_URL}?q=${encodeURIComponent(city)}&appid=${WEATHER_CONFIG.API_KEY}&units=metric`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherResponse = await response.json();
      this.saveToCache(data);
      
      return data;
    } catch (error) {
      console.error("Failed to fetch weather by city:", error);
      return null;
    }
  }

  /**
   * Check if it's night based on sunset time
   */
  isNight(sunrise: number, sunset: number, currentTime: number): boolean {
    return currentTime < sunrise || currentTime > sunset;
  }

  /**
   * Determine if it's day or night using icon
   */
  isDayNightFromIcon(icon: string): "day" | "night" {
    return icon.includes("n") ? "night" : "day";
  }

  /**
   * Get human-readable weather condition with day/night awareness
   */
  getWeatherCondition(
    description: string,
    icon: string,
    temp: number
  ): string {
    const isDayTime = this.isDayNightFromIcon(icon);
    const desc = description.toLowerCase();

    if (desc.includes("clear")) {
      return isDayTime === "night" ? "weather.clearweatherNight" : "weather.clearweather";
    }
    if (desc.includes("cloud")) {
      return isDayTime === "night" ? "weather.cloudyNight" : "weather.cloudy";
    }
    if (desc.includes("rain")) {
      return isDayTime === "night" ? "weather.rainyNight" : "weather.rainy";
    }
    if (desc.includes("snow")) {
      return "weather.snowy";
    }
    if (desc.includes("thunderstorm")) {
      return "weather.thunderstorm";
    }
    if (desc.includes("mist") || desc.includes("fog")) {
      return isDayTime === "night" ? "weather.mistyNight" : "weather.misty";
    }

    return "weather.conditionUnknown";
  }

  /**
   * Calculate risk level based on weather conditions
   */
  calculateRisk(weather: WeatherResponse): {
    level: "safe" | "caution" | "notSafe";
    icon: string;
    reasonKey: string;
  } {
    const { main, wind, weather: weatherArray, sys, dt } = weather;
    const now = Math.floor(Date.now() / 1000);
    const isNightTime = this.isNight(sys.sunrise, sys.sunset, now);

    // Night time is not safe
    if (isNightTime) {
      return {
        level: "notSafe",
        icon: "🌙",
        reasonKey: "weatherRisk.night",
      };
    }

    // Rain > 60%
    const rainProbability =
      weatherArray.some((w) => w.main === "Rain" || w.main === "Thunderstorm") 
        ? 80 
        : 0;
    
    if (rainProbability > 60) {
      return {
        level: "notSafe",
        icon: "🔴",
        reasonKey: "weatherRisk.rain",
      };
    }

    // Check multiple caution conditions
    const cautionReasons: string[] = [];

    if (main.temp > 35) {
      cautionReasons.push("weatherRisk.highTemp");
    }

    if (main.humidity > 80) {
      cautionReasons.push("weatherRisk.highHumidity");
    }

    if (wind.speed > 20) {
      cautionReasons.push("weatherRisk.strongWinds");
    }

    if (cautionReasons.length > 0) {
      return {
        level: "caution",
        icon: "🟡",
        reasonKey: cautionReasons.join("|"),
      };
    }

    // All conditions good
    return {
      level: "safe",
      icon: "🟢",
      reasonKey: "weatherRisk.optimal",
    };
  }

  /**
   * Generate farmer-friendly advice based on weather
   */
  generateAdvice(weather: WeatherResponse): string[] {
    const { main, wind, weather: weatherArray, sys, dt } = weather;
    const now = Math.floor(Date.now() / 1000);
    const isNightTime = this.isNight(sys.sunrise, sys.sunset, now);

    const advice: string[] = [];

    // Night advice
    if (isNightTime) {
      advice.push("weatherAdvice.rest");
      return advice;
    }

    // Rain advice
    const hasRain = weatherArray.some(
      (w) => w.main === "Rain" || w.main === "Thunderstorm"
    );
    if (hasRain) {
      advice.push("weatherAdvice.rain");
    }

    // Wind advice
    if (wind.speed > 20) {
      advice.push("weatherAdvice.windStrong");
    } else if (wind.speed < 5) {
      advice.push("weatherAdvice.windCalm");
    }

    // Humidity advice
    if (main.humidity > 80) {
      advice.push("weatherAdvice.humidityHigh");
    } else if (main.humidity < 40) {
      advice.push("weatherAdvice.humidityLow");
    }

    // Temperature advice
    if (main.temp > 35) {
      advice.push("weatherAdvice.tempHigh");
    } else if (main.temp < 15) {
      advice.push("weatherAdvice.tempLow");
    } else {
      advice.push("weatherAdvice.tempGood");
    }

    // General good conditions
    if (
      !hasRain &&
      wind.speed <= 20 &&
      main.humidity <= 80 &&
      main.temp <= 35 &&
      main.temp >= 15
    ) {
      advice.push("weatherAdvice.good");
    }

    return advice;
  }

  /**
   * Cache management — location-aware
   */
  private saveToCache(data: WeatherResponse, location?: LocationData): void {
    const entry = {
      data,
      timestamp: Date.now(),
      lat: location?.lat ?? data.coord?.lat,
      lon: location?.lon ?? data.coord?.lon,
    };
    localStorage.setItem("agrimitra-weather-cache", JSON.stringify(entry));
  }

  /** Returns cache only if it is fresh AND within ~1 km of the requested location */
  private getFromCache(requestedLocation?: LocationData): CachedWeather | null {
    try {
      const raw = localStorage.getItem("agrimitra-weather-cache");
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CachedWeather & { lat?: number; lon?: number };

      const isExpired = Date.now() - parsed.timestamp > WEATHER_CONFIG.CACHE_DURATION;
      if (isExpired) {
        localStorage.removeItem("agrimitra-weather-cache");
        return null;
      }

      // If a location was requested we MUST verify the cache is for the
      // same place. If the stored entry has no coordinates (old format)
      // or the coordinates differ by more than ~1 km, bust the cache.
      if (requestedLocation) {
        if (parsed.lat == null || parsed.lon == null) {
          // Old cache entry with no coordinates — cannot verify location, discard it
          localStorage.removeItem("agrimitra-weather-cache");
          return null;
        }
        const latDiff = Math.abs(parsed.lat - requestedLocation.lat);
        const lonDiff = Math.abs(parsed.lon - requestedLocation.lon);
        if (latDiff > 0.01 || lonDiff > 0.01) {
          // Different location — bust the cache
          localStorage.removeItem("agrimitra-weather-cache");
          return null;
        }
      }

      return { data: parsed.data, timestamp: parsed.timestamp };
    } catch {
      return null;
    }
  }

  clearCache(): void {
    localStorage.removeItem("agrimitra-weather-cache");
    localStorage.removeItem(WEATHER_CONFIG.PERMISSION_KEY);
    localStorage.removeItem(`${WeatherService.LOCATION_NAME_CACHE_KEY}:en`);
    localStorage.removeItem(`${WeatherService.LOCATION_NAME_CACHE_KEY}:te`);
  }
}

export const weatherService = new WeatherService();
