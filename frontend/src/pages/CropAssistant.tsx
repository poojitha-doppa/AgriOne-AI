import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Upload, Mic, Leaf, AlertTriangle, CheckCircle2, RotateCcw, Shield, X, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Phase = "upload" | "analyzing" | "result";

type AnalysisResult = {
  cropType?: string;
  cropConfidence?: number;
  diseaseLabel: string;
  diagnosisStatus?: "confirmed" | "low_confidence" | "unknown";
  confidence?: number;
  topPredictions?: Array<{ label: string; confidence: number }>;
  whatIsHappening: string;
  whyItHappens: string;
  doThisNow: string[];
  next7DaysPlan: string[];
  preventNextTime: string[];
  saveYourYield: string[];
  warningSigns: string[];
  pesticideOptions: Array<{
    name: string;
    useWhen?: string;
    dosage?: string;
    timing?: string;
    safety?: string;
  }>;
};

type AnalysisPayload = {
  cropType?: string;
  cropConfidence?: number;
  disease?: string;
  diseaseLabel?: string;
  diagnosisStatus?: "confirmed" | "low_confidence" | "unknown";
  confidence?: number;
  topPredictions?: Array<{ label: string; confidence: number }>;
  whatIsHappening?: string;
  explanation?: string;
  whyItHappens?: string;
  doThisNow?: string[];
  next7DaysPlan?: string[];
  preventNextTime?: string[];
  saveYourYield?: string[];
  warningSigns?: string[];
  pesticideOptions?: AnalysisResult["pesticideOptions"];
};

type CropHistoryItem = {
  _id: string;
  cropType?: string;
  cropConfidence?: number;
  diseaseLabel?: string;
  diagnosisStatus?: "confirmed" | "low_confidence" | "unknown";
  confidence?: number;
  topPredictions?: Array<{ label: string; confidence: number }>;
  explanation?: string;
  immediateActions?: string[];
  weeklyPlan?: string[];
  preventionChecklist?: string[];
  lossReductionPlan?: string[];
  warningSigns?: string[];
  pesticideOptions?: AnalysisResult["pesticideOptions"];
  createdAt?: string;
};

const mapPayloadToResult = (payload: AnalysisPayload, fallbackUnknown: string): AnalysisResult => ({
  cropType: payload.cropType,
  cropConfidence: typeof payload.cropConfidence === "number" ? payload.cropConfidence : undefined,
  diseaseLabel: payload.disease || payload.diseaseLabel || fallbackUnknown,
  diagnosisStatus: payload.diagnosisStatus,
  confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
  topPredictions: Array.isArray(payload.topPredictions) ? payload.topPredictions : [],
  whatIsHappening: payload.whatIsHappening || payload.explanation || "",
  whyItHappens: payload.whyItHappens || "",
  doThisNow: payload.doThisNow || [],
  next7DaysPlan: payload.next7DaysPlan || [],
  preventNextTime: payload.preventNextTime || [],
  saveYourYield: payload.saveYourYield || [],
  warningSigns: payload.warningSigns || [],
  pesticideOptions: payload.pesticideOptions || [],
});

const mapHistoryToResult = (item: CropHistoryItem, fallbackUnknown: string): AnalysisResult => ({
  cropType: item.cropType,
  cropConfidence: typeof item.cropConfidence === "number" ? item.cropConfidence : undefined,
  diseaseLabel: item.diseaseLabel || fallbackUnknown,
  diagnosisStatus: item.diagnosisStatus,
  confidence: typeof item.confidence === "number" ? item.confidence : undefined,
  topPredictions: Array.isArray(item.topPredictions) ? item.topPredictions : [],
  whatIsHappening: item.explanation || "",
  whyItHappens: "",
  doThisNow: Array.isArray(item.immediateActions) ? item.immediateActions : [],
  next7DaysPlan: Array.isArray(item.weeklyPlan) ? item.weeklyPlan : [],
  preventNextTime: Array.isArray(item.preventionChecklist) ? item.preventionChecklist : [],
  saveYourYield: Array.isArray(item.lossReductionPlan) ? item.lossReductionPlan : [],
  warningSigns: Array.isArray(item.warningSigns) ? item.warningSigns : [],
  pesticideOptions: Array.isArray(item.pesticideOptions) ? item.pesticideOptions : [],
});

export default function CropAssistant() {
  const { t, lang } = useI18n();
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<CropHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const hasImage = useMemo(() => !!selectedFile, [selectedFile]);

  const applyFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("assistant.invalid_file"));
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("assistant.file_too_large"));
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setError("");
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl, t]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setHistory([]);
      return;
    }

    let active = true;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await api.crop.history(token);
        if (!active) return;
        const rows = Array.isArray(response.data) ? response.data : [];
        setHistory(rows);
      } catch {
        if (!active) return;
        setHistory([]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      active = false;
    };
  }, [isLoggedIn, token]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-4">{t("assistant.login_required")}</p>
          <p className="text-muted-foreground mb-6">{t("assistant.login_prompt")}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:scale-105 transition"
          >
            {t("assistant.go_login")}
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !token) {
      setError(t("assistant.no_image"));
      return;
    }

    setPhase("analyzing");
    setError("");

    try {
      const response = await api.crop.analyze(token, selectedFile, lang);
      const payload: AnalysisPayload = response.data || {};
      setResult(mapPayloadToResult(payload, t("assistant.unknown")));
      setPhase("result");

      // Refresh saved history so the new advisory is visible when user returns.
      const refreshed = await api.crop.history(token);
      setHistory(Array.isArray(refreshed.data) ? refreshed.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("assistant.failed");
      setError(message || t("assistant.failed"));
      setPhase("upload");
    }
  };

  const handleReset = () => {
    setPhase("upload");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openHistoryResult = (item: CropHistoryItem) => {
    setResult(mapHistoryToResult(item, t("assistant.unknown")));
    setPhase("result");
    setError("");
  };

  const formatHistoryDate = (iso?: string) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(lang === "te" ? "te-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-1 sm:px-0">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">{t("assistant.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("assistant.upload")}</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-card-hover p-6 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer border-2 border-dashed transition-colors min-h-[220px] sm:min-h-[260px] relative ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : hasImage
                    ? "border-primary/60"
                    : "border-primary/30 hover:border-primary/60"
              }`}
            >
              {previewUrl ? (
                <>
                  <div className="relative w-full max-h-56 overflow-hidden rounded-xl">
                    <img
                      src={previewUrl}
                      alt="Selected crop"
                      className="w-full h-full object-contain max-h-56"
                    />
                    <button
                      onClick={clearFile}
                      aria-label="Remove image"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center truncate max-w-[200px]">
                    {selectedFile?.name}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center hover:scale-110 transition">
                    {isDragging ? (
                      <ImageIcon className="h-7 w-7 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{t("assistant.upload_prompt")}</p>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {t("assistant.file_hint")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                      {t("assistant.tapToCapture")}
                    </p>
                  </div>
                </>
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive text-center mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!hasImage}
              className={`mt-3 w-full py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition duration-300 active:scale-[0.98] ${
                hasImage
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:scale-[1.02]"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
            >
              <Leaf className="h-4 w-4" />
              {t("assistant.analyze")}
            </button>

            <button
              onClick={() => navigate("/ai-assistant")}
              className="mt-2 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-white/70 backdrop-blur-lg shadow-md text-foreground font-medium text-sm hover:shadow-lg hover:scale-[1.01] transition duration-300 active:scale-[0.98]"
            >
              <Mic className="h-4 w-4" />
              {t("assistant.voice")}
            </button>
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-10 flex flex-col items-center gap-4 min-h-[250px] justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center pulse-gentle">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("assistant.analyzing")}</p>
            <div className="w-48 h-2 rounded-full overflow-hidden bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shimmer" />
            </div>
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="glass-card p-4 sm:p-6 flex items-start gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                {result.cropType && (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">{t("assistant.cropType")}</p>
                    <p className="text-base font-semibold text-foreground">{result.cropType}</p>
                    {typeof result.cropConfidence === "number" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("assistant.confidence")}: {result.cropConfidence.toFixed(1)}%
                      </p>
                    )}
                    <div className="h-px bg-border/60 my-3" />
                  </>
                )}
                <p className="text-xs text-muted-foreground font-medium">{t("assistant.disease")}</p>
                <p className="text-base sm:text-lg font-heading font-bold text-foreground break-words">{result.diseaseLabel}</p>
                {typeof result.confidence === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("assistant.confidence")}: {result.confidence.toFixed(1)}%
                  </p>
                )}
                {result.diagnosisStatus && (
                  <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    result.diagnosisStatus === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : result.diagnosisStatus === "low_confidence"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {result.diagnosisStatus === "confirmed"
                      ? t("assistant.status_confirmed")
                      : result.diagnosisStatus === "low_confidence"
                        ? t("assistant.status_low")
                        : t("assistant.status_unknown")}
                  </span>
                )}
              </div>
            </div>

            {result.topPredictions && result.topPredictions.length > 1 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.alternatives")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.topPredictions.slice(1, 4).map((pred, idx) => (
                    <li key={`alt-${idx}`} className="flex justify-between gap-3">
                      <span className="break-words">{pred.label}</span>
                      <span className="font-medium whitespace-nowrap">{Number(pred.confidence || 0).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass-card p-4 sm:p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("assistant.what_happening")}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.whatIsHappening || t("assistant.not_available")}</p>
              </div>
              {result.whyItHappens && (
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("assistant.why_happens")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.whyItHappens}</p>
                </div>
              )}
            </div>

            {result.doThisNow?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.now")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.doThisNow.map((step, idx) => (
                    <li key={`now-${idx}`} className="flex gap-2">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.next7DaysPlan?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.next7")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.next7DaysPlan.map((step, idx) => (
                    <li key={`week-${idx}`} className="flex gap-2">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.preventNextTime?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.prevent")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.preventNextTime.map((tip, idx) => (
                    <li key={`prev-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.saveYourYield?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.loss_reduce")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.saveYourYield.map((tip, idx) => (
                    <li key={`loss-${idx}`} className="flex gap-2">
                      <Shield className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.pesticideOptions?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.pesticides")}</p>
                <div className="space-y-3">
                  {result.pesticideOptions.map((p, idx) => (
                    <div key={`pest-${idx}`} className="rounded-xl bg-white/60 p-3 border border-white/50">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      {p.useWhen && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">{t("assistant.when")}:</span> {p.useWhen}</p>}
                      {p.dosage && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">{t("assistant.dose")}:</span> {p.dosage}</p>}
                      {p.timing && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">{t("assistant.timing")}:</span> {p.timing}</p>}
                      {p.safety && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">{t("assistant.safety")}:</span> {p.safety}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warningSigns?.length > 0 && (
              <div className="glass-card p-4 sm:p-6">
                <p className="text-sm font-semibold text-foreground mb-3">{t("assistant.warning_signs")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.warningSigns.map((w, idx) => (
                    <li key={`warn-${idx}`} className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm hover:shadow-lg hover:scale-[1.02] transition duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("assistant.scan_another")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card p-4 sm:p-6 space-y-3">
        <p className="text-sm font-semibold text-foreground">{t("assistant.recent_checks")}</p>

        {historyLoading && (
          <p className="text-xs text-muted-foreground">{t("assistant.analyzing")}</p>
        )}

        {!historyLoading && history.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("assistant.no_recent_checks")}</p>
        )}

        {!historyLoading && history.length > 0 && (
          <div className="space-y-2">
            {history.slice(0, 6).map((item) => (
              <button
                key={item._id}
                onClick={() => openHistoryResult(item)}
                className="w-full text-left rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {item.diseaseLabel || t("assistant.unknown")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.cropType || t("assistant.unknown")}
                  {typeof item.confidence === "number" ? ` • ${item.confidence.toFixed(1)}%` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("assistant.checked_on")}: {formatHistoryDate(item.createdAt)}
                </p>
                <p className="text-[11px] text-primary mt-1 font-medium">{t("assistant.open_saved_plan")}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
