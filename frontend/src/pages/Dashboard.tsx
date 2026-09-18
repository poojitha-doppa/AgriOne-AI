import { useEffect, useState } from "react";
import { Scan, Search, Newspaper, ExternalLink, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { useIsMobile } from "@/hooks/use-mobile";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AGRI_KEYWORDS = [
  "agriculture",
  "agricultural",
  "farming",
  "farmer",
  "farmers",
  "crop",
  "crops",
  "harvest",
  "irrigation",
  "soil",
  "fertilizer",
  "pesticide",
  "seed",
  "mandi",
  "msp",
  "kharif",
  "rabi",
  "agri",
  "livestock",
  "dairy",
  "horticulture",
  "aquaculture",
  "sericulture",
  "agronomy",
];

const IRRELEVANT_KEYWORDS = [
  "crypto",
  "bitcoin",
  "fifa",
  "world cup",
  "movie",
  "netflix",
  "honeymoon",
  "celebrity",
  "spacex ipo",
  "prediction market",
];

const isAgricultureRelated = (text: string): boolean => {
  const normalized = text.toLowerCase();
  const matchedKeywords = AGRI_KEYWORDS.filter((keyword) => normalized.includes(keyword));
  const strongSignal = ["agriculture", "farming", "crop", "irrigation", "livestock", "horticulture", "aquaculture", "dairy", "agri"]
    .some((keyword) => normalized.includes(keyword));

  return strongSignal || matchedKeywords.length >= 2;
};

const isIrrelevant = (text: string): boolean => {
  const normalized = text.toLowerCase();
  return IRRELEVANT_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const normalizeExternalUrl = (rawUrl?: string): string => {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  return `https://${rawUrl}`;
};

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const welcomeHeading = user?.name
    ? t("dashboard.greetingName", { name: user.name })
    : t("dashboard.greetingFallback");

  const quickActions = [
    { key: "dashboard.scan_crop", icon: Scan, color: "bg-primary/10 text-primary", to: "/assistant" },
    { key: "dashboard.find_scheme", icon: Search, color: "bg-secondary/10 text-secondary", to: "/schemes" },
    { key: "dashboard.view_news", icon: Newspaper, color: "bg-accent/10 text-accent", to: "/news" },
  ];

  const featureCards = [
    {
      key: "dashboard.scan_crop",
      descKey: "dashboard.scanCropDesc",
      icon: Scan,
      color: "from-primary/45 via-primary/25 to-primary/10",
      to: "/assistant",
    },
    {
      key: "dashboard.find_scheme",
      descKey: "dashboard.findSchemeDesc",
      icon: Search,
      color: "from-secondary/45 via-secondary/25 to-secondary/10",
      to: "/schemes",
    },
    {
      key: "dashboard.view_news",
      descKey: "dashboard.viewNewsDesc",
      icon: Newspaper,
      color: "from-accent/50 via-accent/30 to-accent/15",
      to: "/news",
    },
  ];

  const [activeFeature, setActiveFeature] = useState(0);

  const [headlines, setHeadlines] = useState<Array<{ title: string; source: string; url: string }>>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [headlinesError, setHeadlinesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestTopHeadlines = async () => {
      try {
        setHeadlinesLoading(true);
        setHeadlinesError(null);

        const apiLang = lang === "te" ? "te" : "en";
        const region = apiLang === "te" ? "ap" : "global";

        const response = await fetch(`${API_BASE_URL}/api/news/headlines?limit=5&lang=${apiLang}&region=${region}`);
        if (!response.ok) {
          throw new Error(`News API request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const top5 = payload.articles ?? [];

        setHeadlines(top5);
      } catch (err) {
        setHeadlinesError((err as Error).message || "Unable to load headlines");
      } finally {
        setHeadlinesLoading(false);
      }
    };

    fetchLatestTopHeadlines();
  }, [lang]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureCards.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [featureCards.length]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 sm:space-y-7 pb-8 min-w-0">
      {/* Header with logout */}
      <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {welcomeHeading} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t("dashboard.logout")}</span>
        </button>
      </motion.div>

      {/* Weather + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial="hidden" animate="show" custom={1} variants={fadeUp} className="md:col-span-1">
          <WeatherWidget />
        </motion.div>

        <motion.div initial="hidden" animate="show" custom={2} variants={fadeUp} className="md:col-span-2">
          <div className="glass-card p-4 sm:p-6">
            <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-5">{t("dashboard.quick_actions")}</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => navigate(action.to)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 hover:bg-white hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight">{t(action.key)}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white/90 to-slate-50/80 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("dashboard.featureSpotlightTitle")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.featureSpotlightSubtitle")}</p>
                </div>
              </div>

              {isMobile ? (
                <div className="relative h-48 overflow-hidden">
                  {featureCards.map((card, idx) => {
                    const Icon = card.icon;
                    const isActive = idx === activeFeature;

                    return (
                      <button
                        key={card.key}
                        onClick={() => {
                          setActiveFeature(idx);
                          navigate(card.to);
                        }}
                        className={`absolute inset-0 w-full h-44 rounded-2xl border border-slate-200/70 bg-gradient-to-br ${card.color} p-4 text-left shadow-lg transition-all duration-500 ${
                          isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 pointer-events-none"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center mb-3">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                        <p className="font-semibold text-foreground text-base">{t(card.key)}</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t(card.descKey)}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="relative h-56 [perspective:1000px] [transform-style:preserve-3d] overflow-hidden">
                  {featureCards.map((card, idx) => {
                    const Icon = card.icon;
                    const offset = (idx - activeFeature + featureCards.length) % featureCards.length;
                    const position = offset === 0 ? 0 : offset === 1 ? 1 : -1;
                    const isActive = position === 0;

                    return (
                      <button
                        key={card.key}
                        onClick={() => {
                          setActiveFeature(idx);
                          navigate(card.to);
                        }}
                        className={`absolute inset-0 m-auto w-[74%] h-48 rounded-2xl border border-slate-200/70 bg-gradient-to-br ${card.color} p-5 text-left shadow-lg transition-all duration-500 ${
                          isActive ? "z-30" : "z-20"
                        }`}
                        style={{
                          transform:
                            position === 0
                              ? "translateX(0) rotateY(0deg) scale(1)"
                              : position > 0
                                ? "translateX(52%) rotateY(-26deg) scale(0.86)"
                                : "translateX(-52%) rotateY(26deg) scale(0.86)",
                          opacity: isActive ? 1 : 0.2,
                          filter: isActive ? "none" : "saturate(0.85) brightness(0.95)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          willChange: "transform, opacity",
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center mb-3">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                        <p className="font-semibold text-foreground text-base">{t(card.key)}</p>
                        {isActive && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t(card.descKey)}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mt-3">
                {featureCards.map((card, idx) => (
                  <button
                    key={`dot-${card.key}`}
                    onClick={() => setActiveFeature(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === activeFeature ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                    aria-label={`${t(card.key)} ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Latest Headlines Section */}
      <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp}>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-semibold text-sm text-muted-foreground">{t("dashboard.latestHeadlines")}</h3>
            <button
              onClick={() => navigate("/news")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition"
            >
              {t("dashboard.view_news")}
            </button>
          </div>

          {headlinesLoading ? (
            <p className="text-sm text-muted-foreground">{t("dashboard.loadingHeadlines")}</p>
          ) : headlinesError ? (
            <p className="text-sm text-destructive">{t("dashboard.noHeadlines")}</p>
          ) : headlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dashboard.noHeadlines")}</p>
          ) : (
            <div className="space-y-3">
              {headlines.map((headline, index) => (
                <div
                  key={headline.url || `${headline.title}-${index}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 hover:bg-white hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    const articleUrl = normalizeExternalUrl(headline.url);
                    if (articleUrl) window.open(articleUrl, "_blank", "noopener,noreferrer");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    const articleUrl = normalizeExternalUrl(headline.url);
                    if (articleUrl) window.open(articleUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      {(() => {
                        const articleUrl = normalizeExternalUrl(headline.url);
                        return (
                      <a
                        href={articleUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
                        onClick={(event) => {
                          if (!articleUrl) {
                            event.preventDefault();
                            return;
                          }
                          event.stopPropagation();
                        }}
                      >
                        {index + 1}. {headline.title}
                      </a>
                        );
                      })()}
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{headline.source}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
