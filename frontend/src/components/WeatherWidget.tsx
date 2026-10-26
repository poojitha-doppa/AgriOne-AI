import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, Wind, Droplets, RefreshCw, MapPin, AlertCircle, Loader } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWeather } from "@/hooks/useWeather";
import { weatherService } from "@/lib/weatherService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TELUGU_PLACE_NAME_MAP: Record<string, string> = {
  "andhra pradesh": "ఆంధ్ర ప్రదేశ్",
  "telangana": "తెలంగాణ",
  "hyderabad": "హైదరాబాద్",
  "vijayawada": "విజయవాడ",
  "visakhapatnam": "విశాఖపట్నం",
  "guntur": "గుంటూరు",
  "warangal": "వరంగల్",
  "tirupati": "తిరుపతి",
  "kurnool": "కర్నూలు",
  "nellore": "నెల్లూరు",
  "khammam": "ఖమ్మం",
  "karimnagar": "కరీంనగర్",
};

export function WeatherWidget() {
  const { t, lang } = useI18n();
  const {
    weather,
    loading,
    errorKey,
    location,
    manualCity,
    riskLevel,
    riskIcon,
    riskReasonKey,
    adviceKeys,
    conditionKey,
    isDayTime,
    refreshing,
    refreshWeather,
    setManualCity,
    clearError,
    requestGeolocation,
  } = useWeather();

  const [locationInput, setLocationInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [displayPlaceName, setDisplayPlaceName] = useState("");

  useEffect(() => {
    if (manualCity) {
      setLocationInput(manualCity);
    }
  }, [manualCity]);

  useEffect(() => {
    let active = true;
    const hasTeluguScript = (text: string) => /[\u0C00-\u0C7F]/.test(text);

    const localizePlaceName = async () => {
      const rawPlaceName = manualCity
        ? manualCity
        : location
          ? (location.city || "")
          : (weather?.name || "");

      if (!rawPlaceName) {
        setDisplayPlaceName("");
        return;
      }

      if (lang !== "te") {
        // English UI must show English place names.
        if (hasTeluguScript(rawPlaceName) && location && !manualCity) {
          const englishFromCoords = await weatherService.reverseGeocodeLocation(location, "en");
          if (!active) return;
          setDisplayPlaceName(englishFromCoords || weather?.name || rawPlaceName);
          return;
        }

        setDisplayPlaceName(rawPlaceName);
        return;
      }

      if (hasTeluguScript(rawPlaceName)) {
        setDisplayPlaceName(rawPlaceName);
        return;
      }

      const mapped = TELUGU_PLACE_NAME_MAP[rawPlaceName.trim().toLowerCase()];
      if (mapped) {
        setDisplayPlaceName(mapped);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/news/translate?text=${encodeURIComponent(rawPlaceName)}`
        );

        if (!response.ok) {
          setDisplayPlaceName(rawPlaceName);
          return;
        }

        const payload = await response.json();
        if (!active) return;
        setDisplayPlaceName(payload?.translated || rawPlaceName);
      } catch {
        if (active) {
          setDisplayPlaceName(rawPlaceName);
        }
      }
    };

    localizePlaceName();
    return () => {
      active = false;
    };
  }, [weather?.name, manualCity, location?.city, location?.lat, location?.lon, lang]);

  const handleLocationSubmit = () => {
    if (locationInput.trim()) {
      setManualCity(locationInput);
      setShowInput(false);
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="h-12 w-12 text-accent" />;

    const iconCode = weather.weather[0]?.icon;
    if (!iconCode) return <Sun className="h-12 w-12 text-accent" />;

    if (
      iconCode.includes("01") ||
      iconCode.includes("02") ||
      iconCode.includes("03")
    ) {
      return <Sun className="h-12 w-12 text-accent" />;
    }
    if (
      iconCode.includes("04") ||
      iconCode.includes("09") ||
      iconCode.includes("10")
    ) {
      return <CloudRain className="h-12 w-12 text-blue-400" />;
    }
    if (iconCode.includes("11")) {
      return <AlertCircle className="h-12 w-12 text-red-400" />;
    }
    if (iconCode.includes("13")) {
      return <Cloud className="h-12 w-12 text-gray-300" />;
    }

    return <Cloud className="h-12 w-12 text-muted-foreground" />;
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-300";
      case "caution":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "notSafe":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const observedAt = weather?.dt
    ? new Date(weather.dt * 1000).toLocaleString()
    : null;

  if (loading && !weather) {
    return (
      <div className="glass-card-hover p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("weather.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-hover p-6 space-y-4">
      {/* Header with Title and Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm text-muted-foreground">
          {t("dashboard.weather")}
        </h3>
        <button
          onClick={refreshWeather}
          disabled={refreshing || loading}
          className="p-1.5 hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-50"
          title={t("weather.refresh")}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing || loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Error Message */}
      {errorKey && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{t(errorKey)}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Location Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{t("weather.location")}:</span>
          <span className="font-medium text-foreground">
            {displayPlaceName || t("weather.unknownLocation")}
          </span>
          <button
            onClick={() => { void requestGeolocation(); }}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-50 transition"
          >
            <MapPin className="h-3 w-3" />
            {t("weather.detectLocation")}
          </button>
        </div>

        {location && !manualCity && (
          <p className="text-[11px] text-muted-foreground">
            {location.accuracy != null
              ? `GPS: ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
              : "Location resolved from weather API"}
            {location.accuracy != null ? ` (accuracy ±${Math.round(location.accuracy)}m)` : ""}
          </p>
        )}

        {!manualCity && !weather && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5 text-xs">
            <p className="text-accent-foreground font-medium mb-2">
              {t("weather.geoPermissionDenied")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { void requestGeolocation(); }}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition"
              >
                <MapPin className="h-3 w-3" />
                {t("weather.detectLocation")}
              </button>
              <button
                onClick={() => setShowInput(true)}
                className="text-accent hover:underline font-medium self-center"
              >
                {t("weather.manualLocation")} →
              </button>
            </div>
          </div>
        )}

        {showInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLocationSubmit();
              }}
              placeholder={t("weather.locationPlaceholder")}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-input border border-input text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleLocationSubmit}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              {t("btn.set")}
            </button>
          </div>
        )}
      </div>

      {weather && (
        <>
          {/* Main Weather Display */}
          <div className="flex items-center gap-4 py-2">
            {getWeatherIcon()}
            <div>
              <p className="text-3xl font-heading font-bold text-foreground">
                {Math.round(weather.main.temp)}°C
              </p>
              <p className="text-sm text-muted-foreground">{t(conditionKey)}</p>
              <p className="text-xs text-muted-foreground">
                {t("weather.feelsLike")}: {Math.round(weather.main.feels_like)}°C
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Live OpenWeather data
            {observedAt ? ` • observed ${observedAt}` : ""}
          </p>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span>{t("weather.humidity")}: {weather.main.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wind className="h-4 w-4 text-cyan-400" />
              <span>
                {t("weather.wind")}: {Math.round(weather.wind.speed)} {t("weather.unitKmh")}
              </span>
            </div>
            {weather.visibility && (
              <div className="text-muted-foreground text-xs col-span-1">
                {t("weather.visibility")}: {(weather.visibility / 1000).toFixed(1)} {t("weather.unitKm")}
              </div>
            )}
            {weather.main.pressure && (
              <div className="text-muted-foreground text-xs col-span-1">
                {t("weather.pressure")}: {weather.main.pressure} {t("weather.unitHpa")}
              </div>
            )}
          </div>

          {/* Risk Status Badge */}
          <div
            className={`rounded-lg border p-3 ${getRiskColor()}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {t("weather.getRisk")}: {t(`weather.risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`)}
              </span>
              <span className="text-lg">{riskIcon}</span>
            </div>
            <p className="text-xs mt-1 opacity-90">
              {riskReasonKey
                .split("|")
                .map((key) => t(key))
                .join("; ")}
            </p>
          </div>

          {/* Farming Advice Section */}
          {adviceKeys.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-foreground">
                {t("weather.farmingAdvice")}
              </h4>
              <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 space-y-1.5">
                {adviceKeys.map((item, idx) => (
                  <p
                    key={idx}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    {t(item)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Default Recommendation */}
          {adviceKeys.length === 0 && (
            <p className="mt-2 text-xs bg-accent/15 text-accent-foreground px-3.5 py-2 rounded-lg font-medium">
              💡 {t("weather.recommendation")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
