import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SchemeCard {
  name: string;
  level?: string;
  summary: string;
  reason: string;
  sources: string[];
  applySteps: string[];
}

interface EligibilityResponse {
  profile: {
    state: string;
    landHectares: number;
    annualIncome: number | null;
  };
  eligibleSchemes: SchemeCard[];
  eligibleCount: number;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function SchemeResults() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const enteredAnnualIncome = location.state?.profileData?.enteredAnnualIncome as string | undefined;

  useEffect(() => {
    const profileData = location.state?.profileData;
    if (!profileData) {
      navigate("/schemes");
      return;
    }

    const checkEligibility = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/schemes/eligibility`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...profileData,
              language: lang,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: EligibilityResponse = await response.json();
        setResult(data);
      } catch {
        setError(t("schemes.error"));
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [location.state, navigate, t]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <button
          onClick={() => navigate("/schemes")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("schemes.back")}
        </button>
        <div className="flex items-center justify-center min-h-96 gap-3 rounded-2xl border border-border bg-card p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">
            {t("schemes.checking")}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <button
          onClick={() => navigate("/schemes")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("schemes.back")}
        </button>
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive mb-1">{t("schemes.error_title")}</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const landInHectares = Number(result.profile.landHectares || 0);
  const landInAcres = landInHectares / 0.404686;
  const localizedState =
    result.profile.state === "Andhra Pradesh"
      ? t("states.andhra_pradesh")
      : result.profile.state === "Telangana"
        ? t("states.telangana")
        : result.profile.state === "Karnataka"
          ? t("states.karnataka")
          : result.profile.state === "Tamil Nadu"
            ? t("states.tamil_nadu")
            : result.profile.state === "Maharashtra"
              ? t("states.maharashtra")
              : result.profile.state === "Other"
                ? t("states.other")
                : result.profile.state;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <button
        onClick={() => navigate("/schemes")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("schemes.back_to_form")}
      </button>

      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          {t("schemes.title")}
        </h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{t("schemes.state")}: <span className="font-medium text-foreground">{localizedState}</span></span>
          <span className="text-border hidden sm:inline">·</span>
          <span>{t("schemes.land")}: <span className="font-medium text-foreground">{landInHectares.toFixed(2)} {t("schemes.unit_hectares")} ({landInAcres.toFixed(2)} {t("schemes.unit_acres")})</span></span>
          <span className="text-border hidden sm:inline">·</span>
          <span>
            {enteredAnnualIncome
              ? `₹${Number(enteredAnnualIncome.replace(/,/g, "")).toLocaleString("en-IN")}`
              : result.profile.annualIncome
                ? `₹${Number(result.profile.annualIncome).toLocaleString("en-IN")}`
                : t("schemes.not_entered")}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-foreground font-medium">
            {result.eligibleCount > 0 ? t("schemes.schemes_found") : t("schemes.no_schemes")}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {result.eligibleCount} {t("schemes.found")}
          </p>
        </div>

        {result.eligibleSchemes.length > 0 ? (
          <div className="space-y-4">
            {result.eligibleSchemes.map((scheme, idx) => (
              <motion.div
                key={scheme.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-xl font-semibold text-foreground break-words">
                      {scheme.name}
                    </h2>
                    {scheme.level && (
                      <span className="inline-block mt-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                        {scheme.level}
                      </span>
                    )}
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                </div>

                <p className="text-sm text-muted-foreground">
                  {scheme.summary}
                </p>

                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    {t("schemes.why_match")}:
                  </p>
                  <p className="text-sm text-muted-foreground">{scheme.reason}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    {t("schemes.steps")}:
                  </p>
                  <ol className="space-y-2">
                    {scheme.applySteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="font-semibold text-primary flex-shrink-0">
                          {i + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {scheme.sources && scheme.sources.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {t("schemes.official_sources")}:
                    </p>
                    <div className="space-y-1">
                      {scheme.sources.map((source) => (
                        <a
                          key={source}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline break-all"
                        >
                          {source}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t("schemes.no_schemes")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
