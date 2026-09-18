import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, Landmark, Newspaper, ScanLine } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const previewCopy = {
  en: {
    title: "Explore AgriOne AI Preview",
    subtitle:
      "This is a read-only guest preview. You can explore how each module works before creating an account.",
    ctaLine: "Sign up to save, personalize, or continue.",
    signup: "Sign Up",
    login: "Login",
    backHome: "Back to Home",
    dashboardTitle: "Dashboard Preview",
    dashboardDesc:
      "View weather, advisory, and quick farm insights in one place. In full mode, data is personalized to your location and crops.",
    assistantTitle: "Crop Assistant Preview",
    assistantDesc:
      "Upload crop images for disease analysis and treatment guidance. In guest mode, sample analysis cards are shown.",
    schemesTitle: "Scheme Finder Preview",
    schemesDesc:
      "Check matching government schemes by crop, location, and farmer profile. Full mode enables saved filters and reminders.",
    newsTitle: "News Preview",
    newsDesc:
      "Get localized agriculture headlines and AI summaries in simple language. Full mode supports language preference and continuity.",
    highIntent: "High-intent actions like uploads, chat history, and saved preferences require login.",
  },
  te: {
    title: "AgriOne AI ప్రీవ్యూ చూడండి",
    subtitle:
      "ఇది రీడ్-ఒన్లీ గెస్ట్ ప్రీవ్యూ. ఖాతా సృష్టించే ముందు ప్రతి మాడ్యూల్ ఎలా పనిచేస్తుందో చూడండి.",
    ctaLine: "సేవ్ చేయడానికి, వ్యక్తిగతీకరించడానికి లేదా కొనసాగడానికి సైన్ అప్ చేయండి.",
    signup: "సైన్ అప్",
    login: "లాగిన్",
    backHome: "హోమ్ కు వెళ్లండి",
    dashboardTitle: "డాష్‌బోర్డ్ ప్రీవ్యూ",
    dashboardDesc:
      "వాతావరణం, సలహాలు, ఫార్మ్ ఇన్‌సైట్స్ ఒకే చోట చూడండి. పూర్తి మోడ్‌లో ఇది మీ ప్రాంతం మరియు పంటల ఆధారంగా వ్యక్తిగతీకరించబడుతుంది.",
    assistantTitle: "పంట సహాయకుడు ప్రీవ్యూ",
    assistantDesc:
      "పంట ఫోటోలు అప్‌లోడ్ చేసి వ్యాధి విశ్లేషణ పొందండి. గెస్ట్ మోడ్‌లో నమూనా విశ్లేషణ కార్డులు చూపబడతాయి.",
    schemesTitle: "పథకాల శోధకుడు ప్రీవ్యూ",
    schemesDesc:
      "పంట, ప్రాంతం, రైతు వివరాల ఆధారంగా ప్రభుత్వ పథకాలు చూడండి. పూర్తి మోడ్‌లో ఫిల్టర్ సేవ్ మరియు రిమైండర్లు అందుబాటులో ఉంటాయి.",
    newsTitle: "న్యూస్ ప్రీవ్యూ",
    newsDesc:
      "స్థానిక వ్యవసాయ వార్తలు మరియు AI సమ్మరీలను సులభంగా చదవండి. పూర్తి మోడ్‌లో భాష అభిరుచులు మరియు నిరంతర అనుభవం ఉంటుంది.",
    highIntent: "ఇమేజ్ అప్‌లోడ్, చాట్ హిస్టరీ, సేవ్ చేసిన అభిరుచులు వంటి హై-ఇంటెంట్ చర్యలకు లాగిన్ అవసరం.",
  },
};

const sampleBlocks = [
  {
    icon: ScanLine,
    score: "Leaf Disease Match: 92%",
    detail: "Possible early blight detected. Suggested first-step care and preventive spray schedule.",
  },
  {
    icon: Landmark,
    score: "Schemes Matched: 4",
    detail: "2 subsidy programs and 2 training schemes fit your profile in this sample region.",
  },
  {
    icon: Newspaper,
    score: "Local Headlines: 6",
    detail: "Rainfall advisory, mandi trends, and pest alerts summarized in easy language.",
  },
  {
    icon: Bot,
    score: "Assistant Ready",
    detail: "Ask multilingual farming questions and get step-by-step practical guidance.",
  },
];

export default function GuestPreview() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const t = previewCopy[lang] || previewCopy.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4fff6] via-[#f8fbf7] to-[#edf7ef] text-foreground">
      <header className="border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backHome}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary"
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t.signup}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="rounded-3xl border border-white/50 bg-white/70 p-7 shadow-sm md:p-10">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">{t.subtitle}</p>
          <p className="mt-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t.ctaLine}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t.highIntent}</p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/50 bg-white/70 p-6">
            <h2 className="font-semibold text-lg">{t.dashboardTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.dashboardDesc}</p>
          </article>
          <article className="rounded-2xl border border-white/50 bg-white/70 p-6">
            <h2 className="font-semibold text-lg">{t.assistantTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.assistantDesc}</p>
          </article>
          <article className="rounded-2xl border border-white/50 bg-white/70 p-6">
            <h2 className="font-semibold text-lg">{t.schemesTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.schemesDesc}</p>
          </article>
          <article className="rounded-2xl border border-white/50 bg-white/70 p-6">
            <h2 className="font-semibold text-lg">{t.newsTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.newsDesc}</p>
          </article>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {sampleBlocks.map((block) => (
            <div key={block.score} className="rounded-2xl border border-white/50 bg-white/70 p-5">
              <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5">
                <block.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{block.score}</p>
              <p className="mt-1 text-sm text-muted-foreground">{block.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
