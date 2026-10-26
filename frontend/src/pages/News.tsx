import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Tags } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const categories = ["news.all", "news.crops", "news.market", "news.policy", "news.technology"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type NewsCategory = "news.crops" | "news.market" | "news.policy" | "news.technology";

type NewsArticle = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
};

const normalizeExternalUrl = (rawUrl?: string): string => {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  return `https://${rawUrl}`;
};

const getArticleUrl = (article: NewsArticle): string => normalizeExternalUrl(article.url);

const inferCategory = (text: string): NewsCategory => {
  const normalized = text.toLowerCase();
  if (/(policy|government|scheme|subsidy|msp)/.test(normalized)) return "news.policy";
  if (/(price|market|mandi|export|import)/.test(normalized)) return "news.market";
  if (/(technology|ai|drone|sensor|innovation)/.test(normalized)) return "news.technology";
  return "news.crops";
};

const getRelativeTime = (isoDate: string, t: (key: string, values?: Record<string, string | number>) => string): string => {
  const publishedMs = new Date(isoDate).getTime();
  if (Number.isNaN(publishedMs)) return t("news.time_unknown");

  const diffMs = Date.now() - publishedMs;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return t("news.min_ago", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("news.hr_ago", { count: hours });
  const days = Math.floor(hours / 24);
  return days > 1 ? t("news.days_ago", { count: days }) : t("news.day_ago", { count: days });
};

export default function News() {
  const { t, lang } = useI18n();
  const [active, setActive] = useState("news.all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiLang = lang === "te" ? "te" : "en";
        const region = apiLang === "te" ? "ap" : "global";

        const response = await fetch(`${API_BASE_URL}/api/news/headlines?limit=30&lang=${apiLang}&region=${region}`);

        if (!response.ok) {
          throw new Error(`News API request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const liveArticles = payload.articles ?? [];
        setArticles(liveArticles);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message || "Unable to fetch live news");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    const refreshHandle = window.setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(refreshHandle);
    };
  }, [lang]);

  const filtered = useMemo(() => {
    return active === "news.all" ? articles : articles.filter((a) => a.category === active);
  }, [active, articles]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 min-w-0">
      <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">{t("news.title")}</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 inline-flex items-center gap-1.5 ${
              active === cat
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                : "bg-white/70 backdrop-blur-lg shadow-md text-muted-foreground hover:bg-white hover:scale-[1.02]"
            }`}
          >
            <Tags className="h-3.5 w-3.5" />
            {t(cat)}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">{t("news.loading")}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("news.no_results")}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
        {filtered.map((article, i) => (
          <motion.article
            key={`${article.title}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="group overflow-hidden cursor-pointer border border-white/40 rounded-2xl bg-white/75 backdrop-blur-md shadow-md transition-all md:hover:border-primary/30 md:hover:shadow-lg"
            onClick={() => {
              const articleUrl = getArticleUrl(article);
              if (articleUrl) window.open(articleUrl, "_blank", "noopener,noreferrer");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              const articleUrl = getArticleUrl(article);
              if (articleUrl) window.open(articleUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <div className="p-4 sm:p-5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                {t(article.category || "news.crops")}
              </span>
              <h3 className="font-heading font-semibold text-foreground mt-2 text-sm sm:text-[15px] leading-snug md:group-hover:text-primary transition">
                {article.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-4 sm:line-clamp-3">{article.summary}</p>
              <p className="text-[11px] text-muted-foreground mt-2 break-words">
                {article.source || t("news.source_unknown")} • {getRelativeTime(article.publishedAt, t)}
              </p>
              {getArticleUrl(article) && (
                <a
                  href={getArticleUrl(article)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1.5 md:hover:scale-[1.05] transition-transform"
                  onClick={(event) => event.stopPropagation()}
                >
                  {t("news.read_more")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
