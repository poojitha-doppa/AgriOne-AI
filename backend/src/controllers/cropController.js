import CropAnalysis from '../models/CropAnalysis.js';
import analyzeWithRoboflow from '../services/roboflowService.js';
import generateCropAdvisory, { detectDiseaseWithGemini } from '../services/geminiService.js';
import { cleanupFile } from '../middleware/uploadMiddleware.js';

const normalizeDiseaseLabel = (value = '') => String(value).toLowerCase().replace(/\s+/g, ' ').trim();

const statusRank = {
  unknown: 0,
  low_confidence: 1,
  confirmed: 2,
};

const pickBestDiagnosis = (roboflowDiagnosis, aiDiagnosis) => {
  if (!aiDiagnosis) {
    return {
      diagnosis: roboflowDiagnosis,
      source: 'roboflow',
      note: 'roboflow_only',
    };
  }

  const rfLabel = normalizeDiseaseLabel(roboflowDiagnosis?.diseaseLabel);
  const aiLabel = normalizeDiseaseLabel(aiDiagnosis?.diseaseLabel);
  const sameLabel = rfLabel && aiLabel && rfLabel === aiLabel;

  if (sameLabel) {
    const merged = {
      ...roboflowDiagnosis,
      cropType: aiDiagnosis.cropType || roboflowDiagnosis.cropType || 'Unknown crop',
      cropConfidence: Number.isFinite(aiDiagnosis.cropConfidence) ? aiDiagnosis.cropConfidence : (roboflowDiagnosis.cropConfidence || 0),
      confidence: Math.max(roboflowDiagnosis.confidence || 0, aiDiagnosis.confidence || 0),
      diagnosisStatus:
        (statusRank[aiDiagnosis.diagnosisStatus] || 0) > (statusRank[roboflowDiagnosis.diagnosisStatus] || 0)
          ? aiDiagnosis.diagnosisStatus
          : roboflowDiagnosis.diagnosisStatus,
      topPredictions:
        (Array.isArray(roboflowDiagnosis.topPredictions) && roboflowDiagnosis.topPredictions.length > 0)
          ? roboflowDiagnosis.topPredictions
          : aiDiagnosis.topPredictions || [],
      raw: {
        ...(roboflowDiagnosis.raw || {}),
        aiCrossCheck: {
          source: aiDiagnosis.provider || 'ai',
          model: aiDiagnosis.model || '',
          agreed: true,
        },
      },
    };

    return {
      diagnosis: merged,
      source: 'roboflow+ai',
      note: 'agreement',
    };
  }

  // Prefer a strong confirmed diagnosis over weaker alternatives.
  if (
    roboflowDiagnosis.diagnosisStatus === 'confirmed' &&
    Number(roboflowDiagnosis.confidence || 0) >= 80
  ) {
    return {
      diagnosis: {
        ...roboflowDiagnosis,
        cropType: aiDiagnosis.cropType || roboflowDiagnosis.cropType || 'Unknown crop',
        cropConfidence: Number.isFinite(aiDiagnosis.cropConfidence) ? aiDiagnosis.cropConfidence : (roboflowDiagnosis.cropConfidence || 0),
        raw: {
          ...(roboflowDiagnosis.raw || {}),
          aiCrossCheck: {
            source: aiDiagnosis.provider || 'ai',
            model: aiDiagnosis.model || '',
            agreed: false,
            aiLabel: aiDiagnosis.diseaseLabel,
            aiConfidence: aiDiagnosis.confidence,
          },
        },
      },
      source: 'roboflow',
      note: 'roboflow_strong_confirmed',
    };
  }

  // If AI diagnosis is materially stronger, upgrade to AI diagnosis.
  const aiIsStronger =
    (statusRank[aiDiagnosis.diagnosisStatus] || 0) > (statusRank[roboflowDiagnosis.diagnosisStatus] || 0) ||
    Number(aiDiagnosis.confidence || 0) - Number(roboflowDiagnosis.confidence || 0) >= 10;

  if (aiIsStronger) {
    return {
      diagnosis: {
        cropType: aiDiagnosis.cropType || roboflowDiagnosis.cropType || 'Unknown crop',
        cropConfidence: Number.isFinite(aiDiagnosis.cropConfidence) ? aiDiagnosis.cropConfidence : (roboflowDiagnosis.cropConfidence || 0),
        diseaseLabel: aiDiagnosis.diseaseLabel || roboflowDiagnosis.diseaseLabel,
        confidence: Number.isFinite(aiDiagnosis.confidence) ? aiDiagnosis.confidence : roboflowDiagnosis.confidence,
        diagnosisStatus: aiDiagnosis.diagnosisStatus || roboflowDiagnosis.diagnosisStatus,
        topPredictions: Array.isArray(aiDiagnosis.topPredictions) ? aiDiagnosis.topPredictions : roboflowDiagnosis.topPredictions,
        modelVersion: `${aiDiagnosis.provider || 'ai'}-vision:${aiDiagnosis.model || 'unknown'}`,
        raw: {
          ...(roboflowDiagnosis.raw || {}),
          aiCrossCheck: {
            source: aiDiagnosis.provider || 'ai',
            model: aiDiagnosis.model || '',
            agreed: false,
            picked: 'ai',
          },
        },
      },
      source: aiDiagnosis.provider || 'ai',
      note: 'ai_stronger',
    };
  }

  return {
    diagnosis: {
      ...roboflowDiagnosis,
      cropType: aiDiagnosis.cropType || roboflowDiagnosis.cropType || 'Unknown crop',
      cropConfidence: Number.isFinite(aiDiagnosis.cropConfidence) ? aiDiagnosis.cropConfidence : (roboflowDiagnosis.cropConfidence || 0),
      raw: {
        ...(roboflowDiagnosis.raw || {}),
        aiCrossCheck: {
          source: aiDiagnosis.provider || 'ai',
          model: aiDiagnosis.model || '',
          agreed: false,
          picked: 'roboflow',
        },
      },
    },
    source: 'roboflow',
    note: 'roboflow_kept',
  };
};

// ─── POST /api/crop/analyze ───────────────────────────────────────────────────

export const analyzeCrop = async (req, res) => {
  const filePath = req.file?.path;
  const startTime = Date.now();
  const language = String(req.body?.lang || '').toLowerCase() === 'te' ? 'te' : 'en';

  try {
    // Guard: no file uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required', requestId: req.requestId });
    }

    // Step 1: Roboflow — detect disease
    let diagnosis = {
      cropType: 'Unknown crop',
      cropConfidence: 0,
      diseaseLabel: 'Unknown crop condition',
      confidence: 0,
      diagnosisStatus: 'unknown',
      topPredictions: [],
      modelVersion: '',
      raw: {},
    };
    let detectionError = '';
    let geminiDetectionError = '';
    try {
      const result = await analyzeWithRoboflow(filePath);
      diagnosis = {
        cropType: result.cropType || diagnosis.cropType,
        cropConfidence: Number.isFinite(result.cropConfidence) ? result.cropConfidence : diagnosis.cropConfidence,
        diseaseLabel: result.diseaseLabel || diagnosis.diseaseLabel,
        confidence: Number.isFinite(result.confidence) ? result.confidence : 0,
        diagnosisStatus: result.diagnosisStatus || diagnosis.diagnosisStatus,
        topPredictions: Array.isArray(result.topPredictions) ? result.topPredictions : [],
        modelVersion: result.modelVersion || '',
        raw: result.raw || {},
      };
    } catch (err) {
      console.error('[Roboflow] Detection failed:', err.message);
      detectionError = err.message || 'Detection failed';
    }

    // Step 1B: AI vision cross-check/fallback — improves robustness for uncertain or conflicting cases
    if (diagnosis.diagnosisStatus !== 'confirmed' || diagnosis.confidence < 80) {
      try {
        const geminiDiagnosis = await detectDiseaseWithGemini({ imagePath: filePath });
        if (geminiDiagnosis) {
          const picked = pickBestDiagnosis(diagnosis, geminiDiagnosis);
          diagnosis = {
            ...picked.diagnosis,
            raw: {
              ...(picked.diagnosis.raw || {}),
              aiCrossCheck: {
                ...(picked.diagnosis.raw?.aiCrossCheck || {}),
                decision: picked.note,
                notes: geminiDiagnosis.notes || '',
              },
            },
          };
          if (picked.source !== 'roboflow') {
            detectionError = '';
          }
          console.log(
            `[Analyze] Detection fusion: source=${picked.source} note=${picked.note} label="${diagnosis.diseaseLabel}" confidence=${Number(diagnosis.confidence || 0).toFixed(1)}`
          );
        }
      } catch (err) {
        console.error('[GeminiVision] Detection fallback failed:', err.message);
        geminiDetectionError = err.message || 'Gemini fallback failed';
      }
    }

    // Step 2: Gemini — generate advisory
    const advisory = await generateCropAdvisory({
      diseaseLabel: diagnosis.diseaseLabel,
      diagnosisStatus: diagnosis.diagnosisStatus,
      confidence: diagnosis.confidence,
      topPredictions: diagnosis.topPredictions,
      language,
    });

    // Step 3: Build the final response payload
    const data = {
      disease: diagnosis.diseaseLabel,
      cropType: diagnosis.cropType,
      cropConfidence: Number(diagnosis.cropConfidence.toFixed(1)),
      confidence: Number(diagnosis.confidence.toFixed(1)),
      diagnosisStatus: diagnosis.diagnosisStatus,
      topPredictions: diagnosis.topPredictions,
      whatIsHappening: advisory.whatIsHappening,
      whyItHappens: advisory.whyItHappens,
      doThisNow: advisory.immediateActions,
      next7DaysPlan: advisory.weeklyPlan,
      preventNextTime: advisory.preventionChecklist,
      saveYourYield: advisory.lossReductionPlan,
      pesticideOptions: advisory.pesticideOptions,
      warningSigns: advisory.warningSigns,
      localLanguageAdvice: advisory.teluguSummary,
      importantNote: advisory.disclaimer,

      // Backward-compatible fields for existing clients
      explanation: advisory.whatIsHappening,
      solution: advisory.immediateActions?.join('\n') || '',
      prevention: advisory.preventionChecklist?.join(', ') || '',
    };

    if (diagnosis.diagnosisStatus === 'unknown') {
      const warnings = [detectionError, geminiDetectionError].filter(Boolean).join(' | ');
      if (warnings) {
        data.importantNote = `${advisory.disclaimer} Detection warning: ${warnings}`;
      }
    }

    // Respond immediately — do not block on DB
    res.status(200).json({ success: true, data });

    // Step 4: Persist to DB asynchronously (failure does NOT affect API response)
    CropAnalysis.create({
      user: req.user.userId,
      imagePath: req.file.filename,
      diseaseLabel: diagnosis.diseaseLabel,
      cropType: diagnosis.cropType,
      cropConfidence: Number(diagnosis.cropConfidence.toFixed(1)),
      confidence: Number(diagnosis.confidence.toFixed(1)),
      diagnosisStatus: diagnosis.diagnosisStatus,
      topPredictions: diagnosis.topPredictions,
      modelVersion: diagnosis.modelVersion,
      roboflowRaw: diagnosis.raw,
      explanation: advisory.whatIsHappening,
      immediateActions: advisory.immediateActions,
      weeklyPlan: advisory.weeklyPlan,
      preventionChecklist: advisory.preventionChecklist,
      solution: advisory.immediateActions?.join('\n') || '',
      prevention: advisory.preventionChecklist?.join(', ') || '',
      riskLevel: 'Unknown',
      teluguTranslation: advisory.teluguSummary,
      disclaimer: advisory.disclaimer,
      lossReductionPlan: advisory.lossReductionPlan,
      warningSigns: advisory.warningSigns,
      pesticideOptions: advisory.pesticideOptions,
    }).catch((err) => console.error('[DB] Save failed (non-fatal):', err.message));

    console.log(`[Analyze] Completed in ${Date.now() - startTime}ms for user=${req.user.userId}`);

  } catch (err) {
    cleanupFile(filePath);
    console.error('[Analyze] Fatal error:', err.message);
    // Only send error if headers not already sent
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Server error during analysis', requestId: req.requestId });
    }
  }
};

// ─── GET /api/crop/history ────────────────────────────────────────────────────

export const getCropHistory = async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const rawPage = parseInt(req.query.page, 10);

    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      CropAnalysis.find({ user: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('cropType cropConfidence diseaseLabel confidence diagnosisStatus topPredictions explanation immediateActions weeklyPlan preventionChecklist lossReductionPlan warningSigns pesticideOptions teluguTranslation disclaimer imagePath createdAt'),
      CropAnalysis.countDocuments({ user: req.user.userId }),
    ]);

    return res.json({
      success: true,
      pagination: { total, page, limit, hasNext: skip + analyses.length < total },
      data: analyses,
    });
  } catch (err) {
    console.error('[History] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};
