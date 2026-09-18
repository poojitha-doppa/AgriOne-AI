import fs from 'fs';
import axios from 'axios';

const CONFIDENCE_CONFIRMED = Number(process.env.ROBOFLOW_CONFIDENCE_CONFIRMED || 65);
const CONFIDENCE_LOW = Number(process.env.ROBOFLOW_CONFIDENCE_LOW || 35);

const normalizeLabel = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const toPrediction = (item) => {
  const label = normalizeLabel(item?.class || item?.label || item?.name || item?.predicted_class);
  const rawConfidence = Number(item?.confidence ?? item?.score ?? item?.probability ?? 0);
  const confidence = Number.isFinite(rawConfidence)
    ? (rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence)
    : 0;
  return {
    label,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0,
  };
};

const extractModelVersion = (data) => {
  const fromOutputs = (Array.isArray(data?.outputs) ? data.outputs : [])
    .map((o) => o?.model_version || o?.modelVersion || o?.version)
    .find(Boolean);

  return fromOutputs || data?.model_version || data?.modelVersion || '';
};

const pickDiagnosisFromResponse = (data) => {
  const candidates = [];

  const outputs = Array.isArray(data?.outputs) ? data.outputs : [];
  for (const output of outputs) {
    if (Array.isArray(output?.predictions)) {
      for (const pred of output.predictions) candidates.push(toPrediction(pred));
    }

    if (Array.isArray(output?.top_predictions)) {
      for (const pred of output.top_predictions) candidates.push(toPrediction(pred));
    }

    if (Array.isArray(output?.predicted_classes)) {
      for (const cls of output.predicted_classes) {
        candidates.push({ label: normalizeLabel(cls), confidence: 0 });
      }
    }
  }

  if (Array.isArray(data?.predictions)) {
    for (const pred of data.predictions) candidates.push(toPrediction(pred));
  }

  const merged = new Map();
  for (const candidate of candidates.filter((c) => c.label)) {
    const key = candidate.label.toLowerCase();
    const existing = merged.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      merged.set(key, candidate);
    }
  }

  const topPredictions = Array.from(merged.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  const best = topPredictions[0];
  const confidence = best?.confidence || 0;
  let diagnosisStatus = 'unknown';
  if (confidence >= CONFIDENCE_CONFIRMED) diagnosisStatus = 'confirmed';
  else if (confidence >= CONFIDENCE_LOW) diagnosisStatus = 'low_confidence';

  return {
    diseaseLabel: best?.label || 'Unknown crop condition',
    confidence,
    diagnosisStatus,
    topPredictions,
  };
};

const analyzeWithRoboflow = async (imagePath) => {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const workflowUrl = process.env.ROBOFLOW_URL;

  if (!apiKey) throw new Error('ROBOFLOW_API_KEY is not configured');
  if (!workflowUrl) throw new Error('ROBOFLOW_URL is not configured');

  const base64Image = fs.readFileSync(imagePath).toString('base64');

  let response;
  try {
    response = await axios.post(
      workflowUrl,
      { api_key: apiKey, inputs: { image: { type: 'base64', value: base64Image } } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const reason = body?.error || body?.message || body?.detail || err.message;
    throw new Error(`Roboflow request failed${status ? ` (${status})` : ''}: ${String(reason)}`);
  }

  const data = response?.data || {};
  const diagnosis = pickDiagnosisFromResponse(data);
  const modelVersion = extractModelVersion(data);

  console.log(
    `[Roboflow] label="${diagnosis.diseaseLabel}" confidence=${diagnosis.confidence.toFixed(1)} status=${diagnosis.diagnosisStatus}`
  );
  return {
    ...diagnosis,
    modelVersion,
    raw: data,
  };
};

export default analyzeWithRoboflow;
