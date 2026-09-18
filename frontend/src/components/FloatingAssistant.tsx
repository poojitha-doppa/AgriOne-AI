import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, MessageCircle, Mic, Send, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { handleSendMessage, handleVoiceInput, handleVoiceOutput, type AssistantLanguage } from "@/lib/agriAssistant";

type WidgetMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export default function FloatingAssistant() {
  const { lang } = useI18n();
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const hiddenRoutes = ["/ai-assistant", "/login", "/signup", "/forgot-password"];

  const text = useMemo(() => {
    if (lang === "te") {
      return {
        title: "AgriOne AI చాట్",
        subtitle: "ఏ వ్యవసాయ ప్రశ్నైనా అడగండి",
        placeholder: "మీ ప్రశ్న టైప్ చేయండి...",
        askButton: "పంపండి",
        openFull: "పూర్తి AI సహాయకుడిని తెరవండి",
        loginHint: "చాట్ చేయడానికి దయచేసి లాగిన్ అవ్వండి.",
        loginButton: "లాగిన్",
        signupButton: "సైన్ అప్",
        welcome: "నమస్కారం రైతు గారూ. నేను AgriOne AI. మీ వ్యవసాయ సందేహం చెప్పండి.",
        launcher: "AI చాట్",
        voice: "వాయిస్",
        listening: "వింటోంది...",
      };
    }

    return {
      title: "AgriOne AI Chat",
      subtitle: "Ask any agriculture question",
      placeholder: "Type your question...",
      askButton: "Send",
      openFull: "Open full AI Assistant",
      loginHint: "Please login to start chatting.",
      loginButton: "Login",
      signupButton: "Sign up",
      welcome: "Hello farmer. I am AgriOne AI. Ask me any agriculture question.",
      launcher: "AI Chat",
      voice: "Voice",
      listening: "Listening...",
    };
  }, [lang]);

  const appLang = lang;
  const shouldHide = hiddenRoutes.includes(location.pathname);

  if (shouldHide) {
    return null;
  }

  const ensureWelcome = () => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [{ id: `m-${Date.now()}`, role: "bot", text: text.welcome }];
    });
  };

  const openWidget = () => {
    setOpen(true);
    ensureWelcome();
  };

  const runMessageFlow = async (rawText: string, withVoiceReadback: boolean) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading || !isLoggedIn) return;

    const userMessage: WidgetMessage = { id: `m-${Date.now()}-u`, role: "user", text: trimmed };
    const history: Array<{ role: "user" | "bot"; text: string }> = [...messages, userMessage]
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await handleSendMessage({
        message: trimmed,
        appLang,
        apiBaseUrl: API_BASE_URL,
        explicitLanguage: appLang as AssistantLanguage,
        token: token || undefined,
        history,
      });

      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}-b`, role: "bot", text: result.formattedText || text.welcome },
      ]);

      if (withVoiceReadback && result.formattedText) {
        setSpeaking(true);
        try {
          await handleVoiceOutput({
            text: result.formattedText,
            preferredLanguage: (result.language || appLang) as AssistantLanguage,
            apiBaseUrl: API_BASE_URL,
            token: token || undefined,
          });
        } finally {
          setSpeaking(false);
        }
      }

      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 20);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-e`,
          role: "bot",
          text: appLang === "te"
            ? "క్షమించండి, ప్రస్తుతం సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి మళ్లీ ప్రయత్నించండి."
            : "Sorry, I could not answer right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    await runMessageFlow(input, false);
  };

  const startVoiceMessage = async () => {
    if (!isLoggedIn || recognizing || loading) return;

    const preferredLanguage: AssistantLanguage = appLang as AssistantLanguage;

    try {
      setRecognizing(true);
      const transcript = await handleVoiceInput({
        preferredLanguage,
        apiBaseUrl: API_BASE_URL,
        token: token || undefined,
      });

      if (!transcript || !transcript.trim()) return;

      setInput(transcript);
      await sendMessageFromVoice(transcript);
    } catch {
      // If voice capture fails, keep the widget usable with text input.
    } finally {
      setRecognizing(false);
    }
  };

  const sendMessageFromVoice = async (voiceText: string) => {
    await runMessageFlow(voiceText, true);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[70] w-[min(92vw,360px)] rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{text.title}</p>
              <p className="text-[11px] text-muted-foreground">{text.subtitle}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isLoggedIn ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{text.loginHint}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium"
                >
                  {text.loginButton}
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="flex-1 rounded-xl border border-primary/30 text-primary py-2.5 text-sm font-medium"
                >
                  {text.signupButton}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={listRef} className="max-h-[360px] overflow-y-auto p-3 space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-xs text-muted-foreground px-1">Typing...</div>
                )}
              </div>

              <div className="border-t border-border/70 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void startVoiceMessage()}
                    disabled={loading || recognizing}
                    className={`h-10 w-10 rounded-xl border border-border flex items-center justify-center transition ${
                      recognizing ? "bg-primary/15 text-primary animate-pulse" : "hover:bg-muted"
                    } disabled:opacity-60`}
                    aria-label={text.voice}
                    title={recognizing ? text.listening : text.voice}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={text.placeholder}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={loading || !input.trim()}
                    className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                    aria-label={text.askButton}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {recognizing && (
                  <p className="text-[11px] text-muted-foreground px-1">{text.listening}</p>
                )}
                {speaking && (
                  <p className="text-[11px] text-muted-foreground px-1">
                    {appLang === "te" ? "సమాధానం చదువుతోంది..." : "Reading response..."}
                  </p>
                )}
                <button
                  onClick={() => navigate("/ai-assistant")}
                  className="w-full rounded-xl border border-border text-sm py-2 text-muted-foreground hover:bg-muted transition"
                >
                  {text.openFull}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={open ? () => setOpen(false) : openWidget}
        className="fixed bottom-6 right-4 z-[69] rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl px-4 py-3 flex items-center gap-2 hover:scale-105 transition"
        aria-label={text.launcher}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-semibold">{text.launcher}</span>
        <Bot className="h-4 w-4" />
      </button>
    </>
  );
}
