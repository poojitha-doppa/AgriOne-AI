import { Globe } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_OPTIONS, useI18n } from "@/lib/i18n";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export function TopNavbar() {
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const titleByPath: Record<string, string> = {
    "/dashboard": "nav.dashboard",
    "/assistant": "nav.assistant",
    "/schemes": "nav.schemes",
    "/scheme-results": "nav.schemes",
    "/news": "nav.news",
    "/ai-assistant": "nav.aiAssistant",
    "/admin": "nav.admin",
  };

  const pageTitleKey = titleByPath[location.pathname] || "brand.name";

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 md:hidden cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-xs">AO</span>
        </div>
        <span className="font-heading font-semibold text-foreground">{t("brand.name")}</span>
      </div>

      <button
        type="button"
        className="hidden md:flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-sm">AO</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("brand.name")}</p>
          <p className="text-sm font-semibold text-foreground leading-tight">{t(pageTitleKey)}</p>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select language</span>
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as typeof lang)}
            className="cursor-pointer bg-transparent outline-none"
            aria-label="Select language"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <ProfileDropdown />
      </div>
    </header>
  );
}
