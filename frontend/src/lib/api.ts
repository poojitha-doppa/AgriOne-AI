const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

// Default timeout: 15s for normal requests, 120s for file uploads (crop analysis)
const DEFAULT_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 120_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
};

type JsonMap = Record<string, unknown>;
type ChatAttachment = { name: string; type: string };
type ChatMessage = { role: string; text: string; attachments?: ChatAttachment[] };
type ChatSessionPayload = { sessionId: string; title: string; messages: ChatMessage[] };
type CropPrediction = { label: string; confidence: number };
type PesticideOption = {
  name: string;
  useWhen?: string;
  dosage?: string;
  timing?: string;
  safety?: string;
};
type CropAnalysisData = {
  cropType?: string;
  cropConfidence?: number;
  disease?: string;
  diseaseLabel?: string;
  diagnosisStatus?: "confirmed" | "low_confidence" | "unknown";
  confidence?: number;
  topPredictions?: CropPrediction[];
  whatIsHappening?: string;
  explanation?: string;
  whyItHappens?: string;
  doThisNow?: string[];
  next7DaysPlan?: string[];
  preventNextTime?: string[];
  saveYourYield?: string[];
  warningSigns?: string[];
  pesticideOptions?: PesticideOption[];
  localLanguageAdvice?: string;
  importantNote?: string;
};
type CropHistoryItem = {
  _id: string;
  cropType?: string;
  cropConfidence?: number;
  diseaseLabel?: string;
  confidence?: number;
  diagnosisStatus?: "confirmed" | "low_confidence" | "unknown";
  topPredictions?: CropPrediction[];
  explanation?: string;
  immediateActions?: string[];
  weeklyPlan?: string[];
  preventionChecklist?: string[];
  lossReductionPlan?: string[];
  warningSigns?: string[];
  pesticideOptions?: PesticideOption[];
  teluguTranslation?: string;
  disclaimer?: string;
  imagePath?: string;
  createdAt?: string;
};
type CropHistoryResponse = {
  success: boolean;
  pagination?: { total: number; page: number; limit: number; hasNext: boolean };
  data: CropHistoryItem[];
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", token, body, formData, timeoutMs } = options;

  const effectiveTimeout = timeoutMs ?? (formData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!formData) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData ? formData : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }

    return payload as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

export const api = {
  baseUrl: API_BASE_URL,

  auth: {
    signup: (data: { name: string; phone: string; password: string }) =>
      request<{ success: boolean; data: { token: string; user: { id: string; name: string; phone: string; isAdmin?: boolean } } }>("/api/auth/signup", {
        method: "POST",
        body: data,
      }),

    login: (data: { phone: string; password: string }) =>
      request<{ success: boolean; data: { token: string; user: { id: string; name: string; phone: string; isAdmin?: boolean } } }>("/api/auth/login", {
        method: "POST",
        body: data,
      }),

    me: (token: string) =>
      request<{ success: boolean; data: { user: { id: string; name: string; phone: string; isAdmin?: boolean } } }>("/api/auth/me", {
        token,
        timeoutMs: 10_000,
      }),
  },

  crop: {
    analyze: (token: string, file: File, lang: "en" | "te" | "ta" | "kn" | "ml" = "en") => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("lang", lang);
      return request<{ success: boolean; data: CropAnalysisData }>("/api/crop/analyze", {
        method: "POST",
        token,
        formData,
      });
    },

    history: (token: string) =>
      request<CropHistoryResponse>("/api/crop/history", { token }),
  },

  schemes: {
    find: (token: string, data: { land: number; crop: string; income: number; state?: string }) =>
      request<{ success: boolean; data: JsonMap[] }>("/api/schemes", {
        method: "POST",
        token,
        body: data,
      }),
  },

  news: {
    list: (token: string) => request<{ success: boolean; data: JsonMap[] }>("/api/news", { token }),
  },

  chat: {
    listSessions: (token: string) =>
      request<{ success: boolean; data: Array<{ sessionId: string; title: string; updatedAt: string }> }>(
        "/api/chat/sessions",
        { token }
      ),

    getSession: (token: string, sessionId: string) =>
      request<{ success: boolean; data: { sessionId: string; title: string; messages: ChatMessage[] } }>(
        `/api/chat/sessions/${sessionId}`,
        { token }
      ),

    saveSession: (
      token: string,
      data: ChatSessionPayload
    ) =>
      request<{ success: boolean; data: { sessionId: string; title: string } }>("/api/chat/sessions", {
        method: "POST",
        token,
        body: data,
      }),

    deleteSession: (token: string, sessionId: string) =>
      request<{ success: boolean }>(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        token,
      }),
  },
};
