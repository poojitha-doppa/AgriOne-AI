import mongoose from 'mongoose';

const topPredictionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false }
);

const pesticideOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    useWhen: { type: String, default: '' },
    dosage: { type: String, default: '' },
    timing: { type: String, default: '' },
    safety: { type: String, default: '' },
  },
  { _id: false }
);

const cropAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },

    // ── Detection fields ──────────────────────────────────────────────────────
    cropType: { type: String, default: 'Unknown crop' },
    cropConfidence: { type: Number, default: 0, min: 0, max: 100 },
    diseaseLabel: { type: String, default: 'Unknown' },
    confidence: { type: Number, default: 0, min: 0, max: 100 },

    /** confirmed | low_confidence | unknown */
    diagnosisStatus: {
      type: String,
      default: 'unknown',
      enum: ['confirmed', 'low_confidence', 'unknown'],
    },
    /** Top-N predictions sorted by confidence descending */
    topPredictions: { type: [topPredictionSchema], default: [] },

    /** Roboflow model version tag, for traceability */
    modelVersion: { type: String, default: '' },

    /** Raw Roboflow API response — excluded from history reads */
    roboflowRaw: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Advisory fields ───────────────────────────────────────────────────────
    explanation: { type: String, default: '' },

    /** Rich immediate actions (new) */
    immediateActions: { type: [String], default: [] },
    /** 7-day action plan (new) */
    weeklyPlan: { type: [String], default: [] },
    /** Prevention tips array (new) */
    preventionChecklist: { type: [String], default: [] },
    /** Yield-loss reduction actions */
    lossReductionPlan: { type: [String], default: [] },
    /** Red-flag warning signs */
    warningSigns: { type: [String], default: [] },
    /** Suggested pesticide options */
    pesticideOptions: { type: [pesticideOptionSchema], default: [] },

    /** Backward-compat alias for immediateActions */
    solution: { type: String, default: '' },
    /** Backward-compat alias for preventionChecklist joined */
    prevention: { type: String, default: '' },

    riskLevel: {
      type: String,
      default: 'Unknown',
      enum: ['Low', 'Medium', 'High', 'Unknown'],
    },
    teluguTranslation: { type: String, default: '' },

    /** Safety disclaimer surfaced to the farmer */
    disclaimer: { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary history query: user's analyses newest-first
cropAnalysisSchema.index({ user: 1, createdAt: -1 });

// Support filtering by diagnosisStatus per user
cropAnalysisSchema.index({ user: 1, diagnosisStatus: 1 });

const CropAnalysis = mongoose.model('CropAnalysis', cropAnalysisSchema);
export default CropAnalysis;
