import { generateTextWithLlm } from './llmService.js';

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are AgriMithra, a knowledgeable and friendly agricultural assistant for Indian farmers. You are multilingual and always respond in the same language the farmer uses.

YOUR EXPERTISE:
- Crop selection and variety recommendations
- Soil preparation and soil health management
- Sowing, transplanting, spacing, and nursery management
- Fertilizers (organic and chemical) with specific quantities and timing
- Irrigation methods (drip, sprinkler, flood) and scheduling
- Pest and disease identification, prevention, and treatment
- Weed management and herbicide guidance
- Weather adaptation and climate-smart farming
- Harvesting, post-harvest storage, and grading
- Market guidance and price trends
- Government schemes, subsidies, and PM-KISAN
- Farm economics and input cost management

LANGUAGE RULES — THIS IS CRITICAL:
- If the farmer writes in Telugu script → respond entirely in Telugu
- If the farmer writes in Hindi → respond entirely in Hindi
- If the farmer writes in Tamil → respond entirely in Tamil
- If the farmer writes in Kannada → respond entirely in Kannada
- If the farmer writes in English → respond entirely in English
- If you see Telugu words like vari, panta, raithu, nenu → respond in Telugu

STRICT LANGUAGE CONSISTENCY (for voice output compatibility):
- When responding in Telugu: every JSON field value must be written fully in Telugu script
  - Use "రోజు 1-2:" instead of "Day 1-2:"
  - Use "హెచ్చరిక:" instead of "Warning:"
  - Use "మొదటి చర్య:" instead of "Step 1:"
  - Chemical names like Mancozeb → write as "మాంకోజెబ్ (Mancozeb)" — Telugu pronunciation first
  - Urea → "యూరియా", DAP → "డి.ఎ.పి.", Carbendazim → "కార్బెండాజిమ్"
- When responding in Hindi: every value must be Devanagari script, no English words
- When responding in Tamil: every value must be Tamil script
- When responding in Kannada: every value must be Kannada script
- NEVER write "Day 1-2", "Step", "Warning", "Note" in an Indian-language response — use the native equivalent

ANSWER QUALITY — MOST IMPORTANT RULES:
- ALWAYS answer the question directly and completely. NEVER refuse to answer or say "I need more info first."
- If any detail is missing (crop name, location, stage), make a reasonable assumption, state it briefly, then give the full answer.
- Do NOT ask the farmer to clarify before answering. Give the best answer possible right now.
- Include practical and safe guidance with timing and sequencing.
- Use chemical/product names common in Indian markets (Mancozeb, Chlorpyrifos, DAP, Urea, etc.)
- Always include safety precautions when mentioning pesticides.
- Never provide exact pesticide dosage unless the farmer has provided crop, stage, and product label context.
- Prefer: "follow label dose and local agriculture officer guidance" when details are incomplete.
- Never promise specific yield numbers or profits.
- For greetings or non-farming questions: respond warmly and briefly, skip farming sections.

RESPONSE FORMAT — Return ONLY a valid JSON object, no markdown, no extra text:
{
  "quickSummary": "1-2 sentences that directly answer the question. For greetings just say hello warmly.",
  "whyThisAdvice": "2-3 sentences explaining the reasoning. Leave empty string for greetings.",
  "whatToDoNow": [
    "Specific step with quantities and timing. Keep empty [] when the query is informational and no action list is needed."
  ],
  "next7DaysPlan": [
    "Use native language equivalent of 'Day' for non-English. Keep empty [] unless a day-wise plan is genuinely useful."
  ],
  "warningSigns": [
    "What to watch for. Empty array [] when not relevant."
  ],
  "confidenceLevel": "High",
  "oneNextBestQuestion": "ONLY include a follow-up question if it would genuinely help give better advice next time. Leave as empty string if the answer is already complete."
}

CRITICAL:
- Do NOT limit array length when actionable guidance is needed.
- For informational questions (market trend, scheme eligibility concept, crop variety comparison, weather interpretation), avoid forced templates and keep irrelevant sections empty.
- Do not repeat the same wording from previous assistant responses unless the farmer explicitly asks to repeat.`;

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const getFallback = (language = 'en') => {
  if (language === 'te') {
    return {
      quickSummary: 'AI సహాయకుడు తాత్కాలికంగా అందుబాటులో లేడు. దయచేసి కొంత సేపటిలో మళ్ళీ ప్రయత్నించండి.',
      whyThisAdvice: 'సాంకేతిక సమస్య కారణంగా సమాధానం ఇవ్వలేకపోతున్నాను.',
      whatToDoNow: [
        'మీ దగ్గర్లోని కృషి విజ్ఞాన కేంద్రం (KVK) సంప్రదించండి',
        'స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి',
        'రైతు హెల్ప్‌లైన్ 1800-180-1551 కి కాల్ చేయండి',
      ],
      next7DaysPlan: [],
      warningSigns: [],
      confidenceLevel: 'Low',
      oneNextBestQuestion: 'మీరు ఏ పంట గురించి సమాచారం కావాలి?',
    };
  }
  return {
    quickSummary: 'AI assistant is temporarily unavailable. Please try again shortly.',
    whyThisAdvice: 'There is a temporary technical issue.',
    whatToDoNow: [
      'Contact your nearest Krishi Vigyan Kendra (KVK)',
      'Call Kisan Call Centre: 1800-180-1551 (free)',
      'Try your question again in a few minutes',
    ],
    next7DaysPlan: [],
    warningSigns: [],
    confidenceLevel: 'Low',
    oneNextBestQuestion: 'Which crop are you asking about?',
  };
};

// ─── Parse LLM JSON response ──────────────────────────────────────────────────

const parseLlmResponse = (text, language) => {
  const fallback = getFallback(language);
  if (!text || typeof text !== 'string') return fallback;

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON braces found');

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));

    const toStringList = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    };

    const rawConfidence = String(parsed.confidenceLevel || '').toLowerCase();
    const confidenceLevel = rawConfidence === 'high'
      ? 'High'
      : rawConfidence === 'low'
        ? 'Low'
        : 'Medium';

    return {
      quickSummary: String(parsed.quickSummary || '').trim() || fallback.quickSummary,
      whyThisAdvice: String(parsed.whyThisAdvice || '').trim(),
      whatToDoNow: toStringList(parsed.whatToDoNow),
      next7DaysPlan: toStringList(parsed.next7DaysPlan),
      warningSigns: toStringList(parsed.warningSigns),
      confidenceLevel,
      oneNextBestQuestion: String(parsed.oneNextBestQuestion || '').trim(),
    };
  } catch {
    // If JSON parse fails, try to build a plain-text response
    return {
      ...fallback,
      quickSummary: text.slice(0, 200).trim() || fallback.quickSummary,
    };
  }
};

const dosagePattern = /(\b\d+(?:\.\d+)?\s*(?:ml|l|litre|liter|kg|g|gm)\s*(?:\/|per)\s*(?:acre|hectare)\b)/i;

const enforceSafetyGuardrails = (response, language = 'en') => {
  const out = { ...response };
  const allLines = [
    out.quickSummary || '',
    out.whyThisAdvice || '',
    ...(Array.isArray(out.whatToDoNow) ? out.whatToDoNow : []),
    ...(Array.isArray(out.next7DaysPlan) ? out.next7DaysPlan : []),
    ...(Array.isArray(out.warningSigns) ? out.warningSigns : []),
  ].map((line) => String(line));

  const hasExplicitDose = allLines.some((line) => dosagePattern.test(line));
  if (!hasExplicitDose) return out;

  const safetyLine = language === 'te'
    ? 'పురుగు మందు ఖచ్చితమైన మోతాదు కోసం ప్యాకెట్ లేబుల్ సూచనలు మరియు స్థానిక వ్యవసాయ అధికారుల మార్గదర్శకాలు తప్పనిసరిగా అనుసరించండి.'
    : 'For exact pesticide dose, follow product label instructions and local agriculture officer guidance.';

  const deEmphasizeDose = (line) => (
    dosagePattern.test(line)
      ? `${line} (${safetyLine})`
      : line
  );

  out.whatToDoNow = (Array.isArray(out.whatToDoNow) ? out.whatToDoNow : []).map((line) => deEmphasizeDose(String(line)));
  out.warningSigns = Array.isArray(out.warningSigns) ? out.warningSigns : [];
  if (!out.warningSigns.some((line) => String(line).includes(safetyLine))) {
    out.warningSigns = [safetyLine, ...out.warningSigns];
  }
  if (out.confidenceLevel === 'High') {
    out.confidenceLevel = 'Medium';
  }
  return out;
};

// ─── Build prompt with conversation history ───────────────────────────────────

const LANGUAGE_LABELS = {
  te: 'Telugu (తెలుగు)',
  hi: 'Hindi (हिंदी)',
  ta: 'Tamil (தமிழ்)',
  kn: 'Kannada (ಕನ್ನಡ)',
  en: 'English',
};

const buildPromptWithHistory = (currentMessage, language, history, weatherHint, fileMeta) => {
  const historyLines = (history || [])
    .slice(-12) // keep up to last 12 messages for better multi-turn continuity
    .map((m) => `${m.role === 'user' ? 'Farmer' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const langLabel = LANGUAGE_LABELS[language] || 'English';

  const contextParts = [
    SYSTEM_PROMPT,
    `\n=== MANDATORY LANGUAGE INSTRUCTION ===`,
    `The farmer's selected UI language is: ${langLabel}`,
    `YOU MUST respond ENTIRELY in ${langLabel}.`,
    `Every JSON field value — quickSummary, whyThisAdvice, every item in whatToDoNow, next7DaysPlan, warningSigns, and oneNextBestQuestion — MUST be written in ${langLabel} script only.`,
    language !== 'en'
      ? `Do NOT use English words or sentences anywhere in the JSON values. If the farmer wrote in English, still respond in ${langLabel}.`
      : '',
    historyLines ? `\n=== PREVIOUS CONVERSATION ===\n${historyLines}` : '',
    weatherHint ? `Current weather context: ${weatherHint}` : '',
    fileMeta ? `Farmer uploaded file: ${fileMeta.originalname || fileMeta.filename} (${fileMeta.mimetype})` : '',
    `\n=== FARMER'S CURRENT QUESTION ===\n${currentMessage}`,
  ];

  return contextParts.filter(Boolean).join('\n');
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateAgricultureAssistantReply = async ({
  prompt,
  language = 'en',
  weatherHint,
  fileMeta,
  history = [],
}) => {
  const fullPrompt = buildPromptWithHistory(prompt, language, history, weatherHint, fileMeta);

  const result = await generateTextWithLlm({
    prompt: fullPrompt,
    temperature: 0.3,
    maxOutputTokens: 2048,
    logTag: 'AgriAssistant',
  });

  if (!result?.text) {
    console.warn('[AgriAssistant] LLM returned no text — using fallback');
    return getFallback(language);
  }

  return enforceSafetyGuardrails(parseLlmResponse(result.text, language), language);
};
