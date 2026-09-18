import axios from 'axios';

const toUniqueList = (items = []) => Array.from(new Set(items.filter(Boolean)));

const getProviderOrder = () => {
  const provider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  if (provider === 'openrouter') return ['openrouter', 'gemini'];
  if (provider === 'gemini') return ['gemini', 'openrouter'];
  return ['openrouter', 'gemini'];
};

const getOpenRouterModels = () =>
  toUniqueList([
    process.env.OPENROUTER_MODEL,
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-001',
  ]);

const getGeminiModels = () =>
  toUniqueList([
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]);

const callOpenRouter = async ({ prompt, temperature, maxOutputTokens, logTag }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  for (const model of getOpenRouterModels()) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxOutputTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
            ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
          },
          timeout: 20000,
        }
      );

      const text = response?.data?.choices?.[0]?.message?.content;
      if (!text) {
        console.warn(`[${logTag}] OpenRouter empty response from ${model}`);
        continue;
      }

      console.log(`[${logTag}] Generated with OpenRouter model=${model}`);
      return { text, provider: 'openrouter', model };
    } catch (err) {
      const message = err?.response?.data?.error?.message || err.message;
      console.error(`[${logTag}] OpenRouter ${model} failed: ${message}`);
    }
  }

  return null;
};

const callGemini = async ({ prompt, temperature, maxOutputTokens, logTag }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  for (const model of getGeminiModels()) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
      );

      const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[${logTag}] Gemini empty response from ${model}`);
        continue;
      }

      console.log(`[${logTag}] Generated with Gemini model=${model}`);
      return { text, provider: 'gemini', model };
    } catch (err) {
      const message = err?.response?.data?.error?.message || err.message;
      console.error(`[${logTag}] Gemini ${model} failed: ${message}`);
    }
  }

  return null;
};

export const generateTextWithLlm = async ({ prompt, temperature = 0.2, maxOutputTokens = 1024, logTag = 'LLM' }) => {
  for (const provider of getProviderOrder()) {
    const result = provider === 'openrouter'
      ? await callOpenRouter({ prompt, temperature, maxOutputTokens, logTag })
      : await callGemini({ prompt, temperature, maxOutputTokens, logTag });

    if (result?.text) return result;
  }

  return null;
};
