import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { generateTextWithLlm } from './llmService.js';

const buildFallback = ({ diseaseLabel, diagnosisStatus = 'unknown', topPredictions = [], confidence = 0, language = 'en' }) => {
  const normalizedLabel = diseaseLabel || 'Unknown crop condition';
  const d = normalizedLabel.toLowerCase();
  const isUnknown = diagnosisStatus === 'unknown';
  const alternatives = (topPredictions || [])
    .slice(1, 3)
    .map((p) => p?.label)
    .filter(Boolean)
    .join(', ');

  let pesticideOptions = [
    {
      name: 'Mancozeb 75% WP',
      useWhen: 'Early fungal leaf spots and blight symptoms',
      dosage: '2 to 2.5 g per liter of water',
      timing: 'Spray in morning/evening, repeat after 7 days if needed',
      safety: 'Wear gloves and mask. Do not spray during high wind or before rain.',
    },
    {
      name: 'Copper Oxychloride 50% WP',
      useWhen: 'Bacterial/fungal leaf lesions and wet weather outbreaks',
      dosage: '2.5 to 3 g per liter of water',
      timing: 'Spray at first visible spread, then monitor every 5 to 7 days',
      safety: 'Avoid over-spraying. Keep children and livestock away during spray.',
    },
  ];

  if (d.includes('powdery') || d.includes('mildew')) {
    pesticideOptions = [
      {
        name: 'Wettable Sulphur 80% WP',
        useWhen: 'Powdery mildew white patches',
        dosage: '2 g per liter of water',
        timing: 'Spray at first signs and repeat in 7 days if needed',
        safety: 'Do not spray in very hot afternoon. Use mask and gloves.',
      },
      {
        name: 'Hexaconazole 5% EC',
        useWhen: 'Moderate to severe powdery mildew spread',
        dosage: '1 ml per liter of water',
        timing: 'One spray, then reassess after 5 to 7 days',
        safety: 'Follow label waiting period before harvest.',
      },
    ];
  }

  const englishFallback = {
    diseaseLabel: normalizedLabel,
    whatIsHappening: isUnknown
      ? `The photo does not give a high-confidence disease match. Most likely class is ${normalizedLabel}${alternatives ? `, with close alternatives: ${alternatives}` : ''}.`
      : `Symptoms indicate ${normalizedLabel} and can spread quickly if moisture remains on leaves.`,
    whyItHappens: isUnknown
      ? 'This usually happens when the image is blurry/zoomed out, crop class is outside model training data, or symptoms are at very early stage.'
      : 'Usually linked to high humidity, prolonged leaf wetness, poor airflow, and delayed removal of infected leaves.',
    immediateActions: isUnknown
      ? [
          'Upload 2 to 3 clear close-up photos of affected leaves from different plants.',
          'Include one full-plant photo and one underside-leaf photo in daylight.',
          'Avoid spraying mixed chemicals until diagnosis is confirmed.',
          'Keep infected area separate and monitor spread daily.',
        ]
      : [
          'Remove clearly infected leaves and keep them outside the field (do not leave nearby).',
          'Stop overhead irrigation for 2 to 3 days; irrigate at root zone only.',
          'Separate badly affected plants where possible to reduce spread.',
          'Start a protective spray program based on label instructions.',
        ],
    weeklyPlan: isUnknown
      ? [
          'Day 1: collect better images and mark affected rows.',
          'Day 2 to 3: check if lesions spread to new leaves.',
          'Day 4 to 5: if spread increases, consult local agri officer with photos.',
          'Day 6 to 7: repeat scan with new photos before chemical escalation.',
        ]
      : [
          'Day 1: sanitation and first spray application.',
          'Day 2 to 3: monitor new spots on lower and middle leaves.',
          'Day 4 to 5: remove newly infected leaves, maintain drainage.',
          'Day 6 to 7: decide second spray only if spread continues.',
        ],
    preventionChecklist: [
      'Use disease-free seeds/seedlings from trusted source.',
      'Maintain proper spacing for airflow between plants.',
      'Use balanced fertilizer; avoid excess nitrogen.',
      'Scout crop every 3 to 4 days in humid weather.',
    ],
    lossReductionPlan: [
      'Prioritize treatment in healthy-to-mild zones first to protect yield.',
      'Avoid unnecessary sprays; target only where spread is active.',
      'Maintain moisture balance to reduce stress-related yield drop.',
      'Harvest mature unaffected produce on time to prevent additional losses.',
    ],
    warningSigns: [
      'Rapid increase in spots within 48 hours',
      'Wilting of new leaves despite irrigation',
      'Stem lesions or fruit infection starting',
    ],
    pesticideOptions,
    teluguSummary:
      'a��a��a��a��a��a�� a��a��a��a�+a��a�+ a��a��a��a�+a��a�+a�+a��a��a��a��a��a�+. a��a��a��a��a��a�� a��a�+a��a�+a�� a��a��a��a��a��a�� a��a��a��a��a�+a��a��a��a��a�+, a��a�� a��a��a��a��a�+ a��a��a��a�� a��a��a��a��a�� a��a��a��a��a�+, a�+a��a��a�� a��a��a��a��a��a�� a��a��a��a��a��a�� a��a��a��a��a�+a��a�� a��a�+a��a�+a��a�+a��a�� a��a��a��a��a��a�+. 7 a��a��a��a��a�� a��a�+a��a�� a��a��a��a��a��a�+a��a�� a��a��a��a��a��a��a��a��a�+a�� a��a��a��a��a��a�+.',
    disclaimer:
      isUnknown
        ? `Model confidence is low (${Number(confidence).toFixed(1)}%). Confirm with clearer photos or local agriculture officer before final spray decision.`
        : 'Final spray decision should follow the product label and local agriculture officer advice based on crop stage and local conditions.',
  };

  if (language !== 'te') {
    return englishFallback;
  }

  return {
    ...englishFallback,
    whatIsHappening: isUnknown
      ? `${normalizedLabel} పై నిర్ధారణ స్పష్టంగా లేదు. మరింత స్పష్టమైన ఫోటోలు అప్లోడ్ చేయండి.`
      : `${normalizedLabel} లక్షణాలు కనిపిస్తున్నాయి. తేమ ఎక్కువగా ఉంటే ఇది త్వరగా వ్యాపిస్తుంది.`,
    whyItHappens: isUnknown
      ? 'ఫోటో స్పష్టత తక్కువగా ఉండటం, ప్రారంభ దశ లక్షణాలు ఉండటం లేదా మోడల్‌కు పరిచయం లేని పరిస్థితి కారణం కావచ్చు.'
      : 'ఎక్కువ ఆర్ద్రత, ఆకులపై తేమ ఎక్కువసేపు ఉండటం మరియు గాలి ప్రసరణ తక్కువగా ఉండటం వల్ల సాధారణంగా ఇది వస్తుంది.',
    immediateActions: isUnknown
      ? [
          'ప్రభావిత ఆకుల 2 నుండి 3 క్లోజ్-అప్ ఫోటోలు వేర్వేరు మొక్కల నుంచి అప్లోడ్ చేయండి.',
          'ఒక పూర్తి మొక్క ఫోటో మరియు ఆకు క్రింద భాగం ఫోటోను పగటి వెలుతురులో తీసుకోండి.',
          'నిర్ధారణ అయ్యే వరకు కలిపిన మందులు వాడవద్దు.',
          'ప్రభావిత ప్రాంతాన్ని గుర్తించి ప్రతిరోజూ పర్యవేక్షించండి.',
        ]
      : [
          'తీవ్రంగా ప్రభావిత ఆకులను తొలగించి పొలానికి దూరంగా పారవేయండి.',
          '2 నుండి 3 రోజులు పై నుంచి నీరు పోయకుండా, వేర్ల వద్ద మాత్రమే నీరు ఇవ్వండి.',
          'వ్యాప్తి తగ్గించేందుకు ప్రభావిత మొక్కలను వీలైతే వేరుచేయండి.',
          'లేబుల్ సూచనల ప్రకారం రక్షణాత్మక పిచికారీ ప్రారంభించండి.',
        ],
    weeklyPlan: isUnknown
      ? [
          'రోజు 1: స్పష్టమైన ఫోటోలు తీసి ప్రభావిత వరుసలను గుర్తించండి.',
          'రోజు 2-3: కొత్త ఆకులకు వ్యాప్తి ఉందో లేదో చూడండి.',
          'రోజు 4-5: వ్యాప్తి పెరిగితే స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.',
          'రోజు 6-7: కొత్త ఫోటోలతో మళ్లీ స్కాన్ చేయండి.',
        ]
      : [
          'రోజు 1: శుభ్రత చర్యలు చేసి మొదటి పిచికారీ చేయండి.',
          'రోజు 2-3: దిగువ మరియు మధ్య ఆకులపై కొత్త మచ్చలు గమనించండి.',
          'రోజు 4-5: కొత్తగా ప్రభావిత ఆకులు తొలగించి నీటి నిల్వ లేకుండా చూడండి.',
          'రోజు 6-7: వ్యాప్తి కొనసాగితే రెండో పిచికారీపై నిర్ణయం తీసుకోండి.',
        ],
    preventionChecklist: [
      'నమ్మకమైన వనరుల నుంచి రోగరహిత విత్తనాలు/నాట్లు వాడండి.',
      'మొక్కల మధ్య సరైన దూరం ఉంచి గాలి ప్రసరణ పెంచండి.',
      'సమతుల్య ఎరువులు వాడి అధిక నత్రజని నివారించండి.',
      'తేమ ఉన్న వాతావరణంలో ప్రతి 3 నుండి 4 రోజులకు పంటను పరిశీలించండి.',
    ],
    lossReductionPlan: [
      'మొదట తక్కువ ప్రభావిత ప్రాంతాలను రక్షించేలా చర్యలు తీసుకోండి.',
      'వ్యాప్తి ఉన్న చోటే లక్ష్యంగా మందు వాడండి; అనవసర పిచికారీ నివారించండి.',
      'తేమ సమతుల్యం ఉంచి ఒత్తిడి వల్ల దిగుబడి తగ్గుదల తగ్గించండి.',
      'ప్రభావితం కాని పండిన దిగుబడిని సమయానికి కోయండి.',
    ],
    warningSigns: [
      '48 గంటల్లో మచ్చలు వేగంగా పెరగడం',
      'నీరు ఉన్నా కొత్త ఆకులు వాడిపోవడం',
      'కాండం లేదా పండ్లపై కొత్త లక్షణాలు కనిపించడం',
    ],
    pesticideOptions: [
      {
        name: 'Mancozeb 75% WP',
        useWhen: 'ఫంగల్ ఆకు మచ్చలు లేదా బ్లైట్ ప్రారంభ దశలో',
        dosage: 'లీటర్ నీటికి 2 నుండి 2.5 గ్రాములు',
        timing: 'ఉదయం లేదా సాయంత్రం పిచికారీ చేసి, అవసరమైతే 7 రోజులకు మళ్లీ చేయండి',
        safety: 'గ్లవ్స్, మాస్క్ ధరించండి. బలమైన గాలి లేదా వర్షానికి ముందు స్ప్రే చేయవద్దు.',
      },
      {
        name: 'Copper Oxychloride 50% WP',
        useWhen: 'బ్యాక్టీరియా/ఫంగల్ ఆకు గాయాల సమయంలో',
        dosage: 'లీటర్ నీటికి 2.5 నుండి 3 గ్రాములు',
        timing: 'లక్షణాలు కనిపించగానే పిచికారీ చేసి 5 నుండి 7 రోజులకు పర్యవేక్షించండి',
        safety: 'అధిక మోతాదు వాడవద్దు. స్ప్రే సమయంలో పిల్లలు, పశువులు దూరంగా ఉండాలి.',
      },
    ],
    teluguSummary:
      'ఆకులపై వ్యాధి వ్యాపించే అవకాశం ఉంది. బాధిత ఆకులను తొలగించండి, పై నుంచి నీరు పోయడం తగ్గించండి, సరైన మందును సూచించిన మోతాదులో పిచికారీ చేయండి మరియు 7 రోజుల పాటు పర్యవేక్షించండి.',
    disclaimer: isUnknown
      ? `నిర్ధారణ నమ్మక స్థాయి తక్కువగా ఉంది (${Number(confidence).toFixed(1)}%). తుది మందు నిర్ణయం ముందు స్పష్టమైన ఫోటోలతో లేదా స్థానిక వ్యవసాయ అధికారితో నిర్ధారించండి.`
      : 'తుది మందు నిర్ణయం పంట దశ, స్థానిక పరిస్థితులు, లేబుల్ సూచనలు మరియు వ్యవసాయ అధికారుల సలహా ఆధారంగా తీసుకోండి.',
  };
};

const buildPrompt = ({ diseaseLabel, diagnosisStatus, confidence, topPredictions, language = 'en' }) =>
  `You are an agriculture field advisor for Indian farmers.

Detected disease label: "${diseaseLabel}".
Diagnosis status: "${diagnosisStatus}".
Top prediction confidence: "${Number(confidence).toFixed(1)}%".
Top alternatives: ${JSON.stringify((topPredictions || []).slice(0, 3))}.

Return ONLY valid JSON with this exact schema:
{
  "whatIsHappening": "string, simple and clear",
  "whyItHappens": "string",
  "immediateActions": ["step1", "step2", "step3", "step4"],
  "weeklyPlan": ["day-wise step"],
  "preventionChecklist": ["tip1", "tip2", "tip3"],
  "lossReductionPlan": ["action1", "action2", "action3"],
  "warningSigns": ["sign1", "sign2"],
  "pesticideOptions": [
    {
      "name": "product or active ingredient",
      "useWhen": "when to use",
      "dosage": "dose per liter or per acre",
      "timing": "best time/frequency",
      "safety": "short safety instruction"
    }
  ],
  "teluguSummary": "short Telugu summary",
  "disclaimer": "short caution statement"
}

Rules:
- Use practical, non-technical farmer language.
- Give step-by-step actionable instructions.
- Mention safe pesticide options where appropriate.
- If diagnosisStatus is unknown or low_confidence, add conservative next steps and ask for better images.
- No confidence, probability, ML, or model terms.
- Output language for all user-facing values in JSON: ${language === 'te' ? 'Telugu (native Telugu script)' : 'English'}.
- No markdown.`.trim();

const containsTelugu = (value) => /[\u0C00-\u0C7F]/.test(String(value || ''));

const chooseLocalizedText = (candidate, fallbackText, language) => {
  if (!candidate || typeof candidate !== 'string') return fallbackText;
  if (language !== 'te') return candidate;
  return containsTelugu(candidate) ? candidate : fallbackText;
};

const chooseLocalizedList = (items, fallbackList, language) => {
  if (!Array.isArray(items)) return fallbackList;
  const cleaned = items.filter((x) => typeof x === 'string' && x.trim());
  if (cleaned.length === 0) return fallbackList;
  if (language !== 'te') return cleaned;
  const hasTelugu = cleaned.some((item) => containsTelugu(item));
  return hasTelugu ? cleaned : fallbackList;
};

const translateTextToTelugu = async (text) => {
  if (!text || !String(text).trim() || containsTelugu(text)) {
    return text;
  }

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=te&dt=t&q=${encodeURIComponent(String(text))}`,
    );

    if (!response.ok) {
      return text;
    }

    const payload = await response.json();
    const translated = Array.isArray(payload?.[0])
      ? payload[0].map((chunk) => chunk?.[0] || '').join('')
      : '';

    return translated || text;
  } catch {
    return text;
  }
};

const ensureTeluguAdvisory = async (advisory, language = 'en') => {
  if (language !== 'te' || !advisory) {
    return advisory;
  }

  const translateList = async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const translated = await Promise.all(items.map((item) => translateTextToTelugu(item)));
    return translated.filter((item) => typeof item === 'string' && item.trim());
  };

  const translatedOptions = Array.isArray(advisory.pesticideOptions)
    ? await Promise.all(
        advisory.pesticideOptions.map(async (option) => ({
          name: option?.name || '',
          useWhen: await translateTextToTelugu(option?.useWhen || ''),
          dosage: await translateTextToTelugu(option?.dosage || ''),
          timing: await translateTextToTelugu(option?.timing || ''),
          safety: await translateTextToTelugu(option?.safety || ''),
        }))
      )
    : [];

  return {
    ...advisory,
    whatIsHappening: await translateTextToTelugu(advisory.whatIsHappening),
    whyItHappens: await translateTextToTelugu(advisory.whyItHappens),
    immediateActions: await translateList(advisory.immediateActions),
    weeklyPlan: await translateList(advisory.weeklyPlan),
    preventionChecklist: await translateList(advisory.preventionChecklist),
    lossReductionPlan: await translateList(advisory.lossReductionPlan),
    warningSigns: await translateList(advisory.warningSigns),
    pesticideOptions: translatedOptions,
    teluguSummary: await translateTextToTelugu(advisory.teluguSummary),
    disclaimer: await translateTextToTelugu(advisory.disclaimer),
  };
};

const parseGeminiJson = (text, fallback, language = 'en') => {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    let pesticideOptions = Array.isArray(parsed.pesticideOptions)
      ? parsed.pesticideOptions
          .map((p) => ({
            name: p?.name || '',
            useWhen: p?.useWhen || '',
            dosage: p?.dosage || '',
            timing: p?.timing || '',
            safety: p?.safety || '',
          }))
          .filter((p) => p.name)
      : fallback.pesticideOptions;

    if (language === 'te' && pesticideOptions.length > 0) {
      const hasTeluguDetails = pesticideOptions.some((p) =>
        containsTelugu(p.useWhen) || containsTelugu(p.dosage) || containsTelugu(p.timing) || containsTelugu(p.safety)
      );
      if (!hasTeluguDetails) pesticideOptions = fallback.pesticideOptions;
    }

    return {
      ...fallback,
      whatIsHappening: chooseLocalizedText(parsed.whatIsHappening, fallback.whatIsHappening, language),
      whyItHappens: chooseLocalizedText(parsed.whyItHappens, fallback.whyItHappens, language),
      immediateActions: chooseLocalizedList(parsed.immediateActions, fallback.immediateActions, language),
      weeklyPlan: chooseLocalizedList(parsed.weeklyPlan, fallback.weeklyPlan, language),
      preventionChecklist: chooseLocalizedList(parsed.preventionChecklist, fallback.preventionChecklist, language),
      lossReductionPlan: chooseLocalizedList(parsed.lossReductionPlan, fallback.lossReductionPlan, language),
      warningSigns: chooseLocalizedList(parsed.warningSigns, fallback.warningSigns, language),
      pesticideOptions,
      teluguSummary: chooseLocalizedText(parsed.teluguSummary, fallback.teluguSummary, language),
      disclaimer: chooseLocalizedText(parsed.disclaimer, fallback.disclaimer, language),
    };
  } catch {
    return fallback;
  }
};

const GEMINI_VISION_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter(Boolean);

const OPENROUTER_VISION_MODELS = [
  process.env.OPENROUTER_VISION_MODEL,
  process.env.OPENROUTER_MODEL,
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
].filter(Boolean);

const extToMime = (filePath) => {
  const ext = path.extname(filePath || '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const parseDiseaseJson = (text) => {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const topPredictions = Array.isArray(parsed.topPredictions)
    ? parsed.topPredictions
        .map((item) => ({
          label: String(item?.label || '').trim(),
          confidence: Math.max(0, Math.min(100, Number(item?.confidence || 0))),
        }))
        .filter((item) => item.label)
    : [];

  const confidence = Number(parsed.confidence || topPredictions[0]?.confidence || 0);
  const normalizedConfidence = Math.max(0, Math.min(100, Number.isFinite(confidence) ? confidence : 0));

  let diagnosisStatus = String(parsed.diagnosisStatus || '').toLowerCase();
  if (!['confirmed', 'low_confidence', 'unknown'].includes(diagnosisStatus)) {
    if (normalizedConfidence >= 65) diagnosisStatus = 'confirmed';
    else if (normalizedConfidence >= 35) diagnosisStatus = 'low_confidence';
    else diagnosisStatus = 'unknown';
  }

  return {
    diseaseLabel: String(parsed.diseaseLabel || topPredictions[0]?.label || 'Unknown crop condition').trim(),
    cropType: String(parsed.cropType || parsed.crop || 'Unknown crop').trim(),
    cropConfidence: Math.max(0, Math.min(100, Number(parsed.cropConfidence || 0))),
    confidence: normalizedConfidence,
    diagnosisStatus,
    topPredictions: topPredictions.slice(0, 5),
    notes: String(parsed.notes || '').trim(),
  };
};

export const detectDiseaseWithGemini = async ({ imagePath }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error('Image file not found for Gemini disease detection fallback');
  }

  const base64Image = fs.readFileSync(imagePath).toString('base64');
  const mimeType = extToMime(imagePath);

  const prompt = `You are a plant pathology assistant.
Analyze this crop leaf/plant image and return ONLY valid JSON:
{
  "cropType": "most likely crop name",
  "cropConfidence": 0,
  "diseaseLabel": "most likely disease or deficiency name",
  "confidence": 0,
  "diagnosisStatus": "confirmed|low_confidence|unknown",
  "topPredictions": [
    { "label": "name", "confidence": 0 }
  ],
  "notes": "short explanation"
}
Rules:
- cropConfidence range: 0 to 100
- confidence range: 0 to 100
- include 3 to 5 topPredictions when possible
- if image quality is poor or diagnosis is unclear, set diagnosisStatus to unknown
- no markdown`;

  const errors = [];

  if (apiKey) {
    for (const model of GEMINI_VISION_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
        );

        const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`[GeminiVision] Empty response from ${model}`);
          continue;
        }

        const parsed = parseDiseaseJson(text);
        console.log(`[GeminiVision] Disease fallback from ${model}: ${parsed.diseaseLabel} (${parsed.confidence.toFixed(1)}%)`);
        return { ...parsed, model, provider: 'gemini' };
      } catch (err) {
        const message = err?.response?.data?.error?.message || err.message;
        console.error(`[GeminiVision] ${model} failed: ${message}`);
        errors.push(`Gemini(${model}): ${message}`);
      }
    }
  } else {
    errors.push('Gemini: GEMINI_API_KEY is not configured');
  }

  if (openRouterKey) {
    for (const model of OPENROUTER_VISION_MODELS) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 600,
          },
          {
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
              ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
            },
            timeout: 25000,
          }
        );

        const text = response?.data?.choices?.[0]?.message?.content;
        const normalizedText = typeof text === 'string'
          ? text
          : Array.isArray(text)
            ? text.map((p) => p?.text || '').join('\n')
            : '';
        if (!normalizedText) {
          console.warn(`[OpenRouterVision] Empty response from ${model}`);
          continue;
        }

        const parsed = parseDiseaseJson(normalizedText);
        console.log(`[OpenRouterVision] Disease fallback from ${model}: ${parsed.diseaseLabel} (${parsed.confidence.toFixed(1)}%)`);
        return { ...parsed, model, provider: 'openrouter' };
      } catch (err) {
        const message = err?.response?.data?.error?.message || err.message;
        console.error(`[OpenRouterVision] ${model} failed: ${message}`);
        errors.push(`OpenRouter(${model}): ${message}`);
      }
    }
  } else {
    errors.push('OpenRouter: OPENROUTER_API_KEY is not configured');
  }

  throw new Error(`AI fallback disease detection failed. ${errors.join(' | ')}`);
};

const generateCropAdvisory = async ({ diseaseLabel, diagnosisStatus, confidence, topPredictions, language = 'en' }) => {
  const fallback = buildFallback({ diseaseLabel, diagnosisStatus, confidence, topPredictions, language });
  const result = await generateTextWithLlm({
    prompt: buildPrompt({ diseaseLabel, diagnosisStatus, confidence, topPredictions, language }),
    temperature: 0.2,
    maxOutputTokens: 1200,
    logTag: 'CropAdvisory',
  });

  if (result?.text) {
    const parsed = parseGeminiJson(result.text, fallback, language);
    return ensureTeluguAdvisory(parsed, language);
  }

  return ensureTeluguAdvisory(fallback, language);
};

export default generateCropAdvisory;
