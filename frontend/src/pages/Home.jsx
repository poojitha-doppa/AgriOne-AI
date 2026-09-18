import { useNavigate } from "react-router-dom";
import { Languages, Sprout, ScrollText, Newspaper, ScanLine, Landmark, MessageSquareText, LayoutDashboard, Bot, ShieldCheck } from "lucide-react";
import { LANGUAGE_OPTIONS, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AnimatedHero } from "@/components/AnimatedHero";

const copy = {
  en: {
    heroTitle: "AgriOne AI 🌾",
    heroSubtitle: "AI-powered farming assistant in Telugu & English",
    getStarted: "Get Started",
    tryDemo: "Explore Preview",
    demoHint: "Login required for full access.",
    gatedHint: "Sign up to save, personalize, or continue.",
    featuresTitle: "Core Features",
    cropAssistant: "Crop Assistant",
    cropText: "Upload crop photos and receive disease detection, confidence score, and actionable first-step treatment guidance.",
    schemeFinder: "Scheme Finder",
    schemeText: "Find matching central and state schemes based on crop, land profile, and farmer eligibility details.",
    newsSummarizer: "News Summarizer",
    newsText: "Get local agricultural headlines with simple AI summaries, key impact, and practical next-step recommendations.",
    languageTitle: "Choose Your Language",
    languageText: "Switch between English and Telugu across the full UI.",
    english: "English",
    telugu: "Telugu",
    benefitsTitle: "Why Farmers Choose AgriOne AI",
    b1: "Instant crop diagnosis",
    b2: "Government scheme guidance",
    b3: "Local news in simple language",
    footer: "AgriOne AI - AI support for every field."
  },
  te: {
    heroTitle: "AgriOne AI 🌾",
    heroSubtitle: "తెలుగు & ఇంగ్లీష్‌లో AI ఆధారిత వ్యవసాయ సహాయకుడు",
    getStarted: "ప్రారంభించండి",
    tryDemo: "ప్రీవ్యూ చూడండి",
    demoHint: "పూర్తి యాక్సెస్ కోసం లాగిన్ అవసరం.",
    gatedHint: "సేవ్ చేయడానికి, వ్యక్తిగతీకరించడానికి లేదా కొనసాగడానికి సైన్ అప్ చేయండి.",
    featuresTitle: "ప్రధాన ఫీచర్లు",
    cropAssistant: "పంట సహాయకుడు",
    cropText: "పంట ఫోటోలు అప్‌లోడ్ చేసి వ్యాధి గుర్తింపు, కాన్ఫిడెన్స్ స్కోర్ మరియు ప్రారంభ చికిత్స సూచనలు పొందండి.",
    schemeFinder: "పథకాల శోధకుడు",
    schemeText: "పంట, భూమి వివరాలు, అర్హత ఆధారంగా మీకు సరిపడే కేంద్ర మరియు రాష్ట్ర పథకాలు తెలుసుకోండి.",
    newsSummarizer: "న్యూస్ సమ్మరైజర్",
    newsText: "స్థానిక వ్యవసాయ వార్తలను AI సమ్మరీతో, ప్రభావం మరియు తదుపరి చర్యలతో సులభంగా తెలుసుకోండి.",
    languageTitle: "మీ భాషను ఎంచుకోండి",
    languageText: "మొత్తం UI ను ఇంగ్లీష్ మరియు తెలుగు మధ్య మార్చండి.",
    english: "ఇంగ్లీష్",
    telugu: "తెలుగు",
    benefitsTitle: "రైతులు AgriOne AI ని ఎందుకు ఎంచుకుంటున్నారు",
    b1: "తక్షణ పంట నిర్ధారణ",
    b2: "ప్రభుత్వ పథకాల మార్గదర్శకం",
    b3: "సులభమైన భాషలో స్థానిక వార్తలు",
    footer: "AgriOne AI - ప్రతి పొలానికి AI తోడ్పాటు."
  },
  ta: {
    heroTitle: "AgriOne AI 🌾",
    heroSubtitle: "தமிழில் AI விவசாய உதவியாளர்",
    getStarted: "தொடங்குங்கள்",
    tryDemo: "முன்னோட்டத்தைப் பார்க்க",
    demoHint: "முழு அணுகலுக்கு உள்நுழைய வேண்டும்.",
    gatedHint: "சேமிக்கவும் தனிப்பயனாக்கவும் பதிவு செய்யுங்கள்.",
    featuresTitle: "முக்கிய அம்சங்கள்",
    cropAssistant: "பயிர் உதவியாளர்",
    cropText: "பயிர் படங்களைப் பதிவேற்றி நோய் அறிகுறிகளையும் சிகிச்சை வழிகாட்டுதலையும் பெறுங்கள்.",
    schemeFinder: "திட்ட தேடல்",
    schemeText: "உங்கள் பயிர் மற்றும் விவசாயி விவரங்களுக்கு ஏற்ற அரசு திட்டங்களைக் கண்டறியுங்கள்.",
    newsSummarizer: "செய்தி சுருக்கம்",
    newsText: "உள்ளூர் விவசாய செய்திகளை எளிய AI சுருக்கங்களுடன் அறியுங்கள்.",
    languageTitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    languageText: "முழு தளத்தையும் உங்கள் விருப்ப மொழியில் பயன்படுத்துங்கள்.",
    english: "ஆங்கிலம்",
    telugu: "தெலுங்கு",
    benefitsTitle: "விவசாயிகள் AgriOne AI ஐ தேர்வு செய்வது ஏன்",
    b1: "உடனடி பயிர் கண்டறிதல்",
    b2: "அரசுத் திட்ட வழிகாட்டுதல்",
    b3: "எளிய மொழியில் உள்ளூர் செய்திகள்",
    footer: "AgriOne AI - ஒவ்வொரு வயலுக்கும் AI ஆதரவு."
  },
  kn: {
    heroTitle: "AgriOne AI 🌾",
    heroSubtitle: "ಕನ್ನಡದಲ್ಲಿ AI ಕೃಷಿ ಸಹಾಯಕ",
    getStarted: "ಪ್ರಾರಂಭಿಸಿ",
    tryDemo: "ಪೂರ್ವವೀಕ್ಷಣೆ ನೋಡಿ",
    demoHint: "ಪೂರ್ಣ ಪ್ರವೇಶಕ್ಕಾಗಿ ಲಾಗಿನ್ ಮಾಡಿ.",
    gatedHint: "ಉಳಿಸಲು ಮತ್ತು ವೈಯಕ್ತೀಕರಿಸಲು ಸೈನ್ ಅಪ್ ಮಾಡಿ.",
    featuresTitle: "ಮುಖ್ಯ ವೈಶಿಷ್ಟ್ಯಗಳು",
    cropAssistant: "ಬೆಳೆ ಸಹಾಯಕ",
    cropText: "ಬೆಳೆ ಚಿತ್ರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ರೋಗದ ಮಾಹಿತಿ ಮತ್ತು ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.",
    schemeFinder: "ಯೋಜನೆ ಹುಡುಕಾಟ",
    schemeText: "ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ರೈತರ ವಿವರಗಳಿಗೆ ಹೊಂದುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ.",
    newsSummarizer: "ಸುದ್ದಿ ಸಾರಾಂಶ",
    newsText: "ಸ್ಥಳೀಯ ಕೃಷಿ ಸುದ್ದಿಗಳನ್ನು ಸರಳ AI ಸಾರಾಂಶಗಳೊಂದಿಗೆ ತಿಳಿಯಿರಿ.",
    languageTitle: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    languageText: "ಸಂಪೂರ್ಣ ವೇದಿಕೆಯನ್ನು ನಿಮ್ಮ ಆಯ್ಕೆಯ ಭಾಷೆಯಲ್ಲಿ ಬಳಸಿ.",
    english: "ಇಂಗ್ಲಿಷ್",
    telugu: "ತೆಲುಗು",
    benefitsTitle: "ರೈತರು AgriOne AI ಅನ್ನು ಏಕೆ ಆಯ್ಕೆಮಾಡುತ್ತಾರೆ",
    b1: "ತಕ್ಷಣದ ಬೆಳೆ ರೋಗನಿರ್ಣಯ",
    b2: "ಸರ್ಕಾರಿ ಯೋಜನೆ ಮಾರ್ಗದರ್ಶನ",
    b3: "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಸ್ಥಳೀಯ ಸುದ್ದಿ",
    footer: "AgriOne AI - ಪ್ರತಿಯೊಂದು ಹೊಲಕ್ಕೂ AI ಬೆಂಬಲ."
  },
  ml: {
    heroTitle: "AgriOne AI 🌾",
    heroSubtitle: "മലയാളത്തിലുള്ള AI കൃഷി സഹായി",
    getStarted: "ആരംഭിക്കുക",
    tryDemo: "മുൻകാഴ്ച കാണുക",
    demoHint: "പൂർണ്ണ പ്രവേശനത്തിന് ലോഗിൻ ചെയ്യുക.",
    gatedHint: "സംരക്ഷിക്കാനും വ്യക്തിഗതമാക്കാനും സൈൻ അപ്പ് ചെയ്യുക.",
    featuresTitle: "പ്രധാന സവിശേഷതകൾ",
    cropAssistant: "വിള സഹായി",
    cropText: "വിളയുടെ ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്ത് രോഗവിവരങ്ങളും ചികിത്സാ നിർദേശങ്ങളും നേടുക.",
    schemeFinder: "പദ്ധതി കണ്ടെത്തൽ",
    schemeText: "നിങ്ങളുടെ വിളയ്ക്കും കർഷക വിവരങ്ങൾക്കും അനുയോജ്യമായ സർക്കാർ പദ്ധതികൾ കണ്ടെത്തുക.",
    newsSummarizer: "വാർത്താ സംഗ്രഹം",
    newsText: "പ്രാദേശിക കാർഷിക വാർത്തകൾ ലളിതമായ AI സംഗ്രഹങ്ങളോടെ അറിയുക.",
    languageTitle: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    languageText: "മുഴുവൻ പ്ലാറ്റ്‌ഫോമും നിങ്ങളുടെ ഇഷ്ട ഭാഷയിൽ ഉപയോഗിക്കുക.",
    english: "ഇംഗ്ലീഷ്",
    telugu: "തെലുങ്ക്",
    benefitsTitle: "കർഷകർ AgriOne AI തിരഞ്ഞെടുക്കുന്നത് എന്തുകൊണ്ട്",
    b1: "തൽക്ഷണ വിള രോഗനിർണയം",
    b2: "സർക്കാർ പദ്ധതി മാർഗനിർദേശം",
    b3: "ലളിതമായ ഭാഷയിലെ പ്രാദേശിക വാർത്തകൾ",
    footer: "AgriOne AI - എല്ലാ കൃഷിയിടങ്ങൾക്കും AI പിന്തുണ."
  }
};

export default function Home() {
  const { lang, setLang, t: tr } = useI18n();
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const homeCopy = copy[lang] || copy.en;

  const navItems = [
    { key: "nav.dashboard", path: "/dashboard", gated: false, icon: LayoutDashboard },
    { key: "nav.assistant", path: "/assistant", gated: true, icon: ScanLine },
    { key: "nav.schemes", path: "/schemes", gated: true, icon: Landmark },
    { key: "nav.news", path: "/news", gated: true, icon: Newspaper },
    { key: "nav.aiAssistant", path: "/ai-assistant", gated: true, icon: Bot },
    ...(isAdmin ? [{ key: "nav.admin", path: "/admin", gated: true, icon: ShieldCheck }] : []),
  ];

  const handleNavClick = (item) => {
    if (isLoggedIn) {
      navigate(item.path);
      return;
    }

    if (item.path === "/dashboard") {
      navigate("/preview");
      return;
    }

    if (item.gated) {
      navigate("/signup");
      return;
    }

    navigate(item.path);
  };

  const handleModuleClick = (path) => {
    if (!isLoggedIn) {
      navigate("/signup");
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5fff6] via-[#f8fbf7] to-[#eef7f0] text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/65 backdrop-blur-xl">
        <div className="w-full px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 md:gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-heading font-bold text-sm">AO</span>
            </div>
            <span className="font-heading font-semibold text-foreground text-base sm:text-lg">{tr("brand.name")}</span>
          </button>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-2 py-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-foreground/85 hover:text-foreground hover:bg-white transition flex items-center gap-1.5"
              >
                <item.icon className="h-3.5 w-3.5" />
                {tr(item.key)}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {!isLoggedIn && (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border border-primary/30 bg-white/80 text-primary hover:bg-white transition-all duration-300"
                >
                  {tr("btn.login")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="rounded-full px-4 py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {tr("btn.signup")}
                </button>
              </>
            )}

            <label className="inline-flex items-center rounded-full border border-primary/20 bg-white/70 backdrop-blur px-3 py-2 text-xs font-semibold text-foreground shrink-0">
              <span className="sr-only">Select language</span>
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value)}
                className="cursor-pointer bg-transparent outline-none"
                aria-label="Select language"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="lg:hidden border-t border-white/60 bg-white/55 px-3 py-2">
          <div className="grid grid-cols-5 gap-1">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={`mobile-${item.path}`}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-foreground/70 hover:text-primary hover:bg-white/60 transition"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[10px] font-medium leading-tight text-center">{tr(item.key)}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Hero Section with Animated Component */}
        <section className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-lg p-7 shadow-md md:p-10 hover:shadow-lg transition duration-300 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {homeCopy.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                {homeCopy.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(isLoggedIn ? "/dashboard" : "/signup")}
                  className="inline-flex items-center rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  {homeCopy.getStarted}
                </button>
                <button
                  onClick={() => navigate("/preview")}
                  className="inline-flex items-center rounded-2xl border-2 border-primary/30 bg-white/50 backdrop-blur px-6 py-3.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-white hover:border-primary hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  {homeCopy.tryDemo}
                </button>
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">{homeCopy.demoHint}</p>
            </div>
            <div className="flex justify-center">
              <AnimatedHero />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-10 animate-slide-up">
          <h2 className="mb-6 font-heading text-3xl font-bold">{homeCopy.featuresTitle}</h2>
          {!isLoggedIn && <p className="mb-4 text-sm text-muted-foreground">{homeCopy.gatedHint}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ScanLine, title: homeCopy.cropAssistant, text: homeCopy.cropText, path: "/assistant" },
              { icon: Landmark, title: homeCopy.schemeFinder, text: homeCopy.schemeText, path: "/schemes" },
              { icon: MessageSquareText, title: homeCopy.newsSummarizer, text: homeCopy.newsText, path: "/news" },
            ].map((feature, i) => (
              <button
                key={i}
                onClick={() => handleModuleClick(feature.path)}
                className="group rounded-2xl border border-white/40 bg-white/70 backdrop-blur p-6 text-left transition-all duration-300 hover:border-primary/30 hover:bg-white hover:shadow-lg hover:scale-[1.02] cursor-pointer"
              >
                <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Language Section */}
        <section className="mb-10 animate-slide-up rounded-3xl border border-white/50 bg-white/70 backdrop-blur-lg p-6 md:p-8 hover:shadow-lg transition duration-300">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold">{homeCopy.languageTitle}</h2>
              <p className="mt-2 text-muted-foreground">{homeCopy.languageText}</p>
            </div>
            <label className="inline-flex items-center rounded-full border border-primary/20 bg-white/50 backdrop-blur px-4 py-2.5 text-sm font-semibold text-foreground">
              <span className="sr-only">Select language</span>
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value)}
                className="cursor-pointer bg-transparent outline-none"
                aria-label="Select language"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-6 animate-slide-up">
          <h2 className="mb-6 font-heading text-3xl font-bold">{homeCopy.benefitsTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sprout, text: homeCopy.b1 },
              { icon: ScrollText, text: homeCopy.b2 },
              { icon: Newspaper, text: homeCopy.b3 },
            ].map((benefit, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/40 bg-white/70 backdrop-blur p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-[1.02]"
              >
                <benefit.icon className="h-7 w-7 text-primary group-hover:scale-110 transition" />
                <p className="mt-4 text-sm font-medium text-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/50 backdrop-blur px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
          <Languages className="h-4 w-4" />
          <span>{homeCopy.footer}</span>
        </div>
      </footer>
    </div>
  );
}
