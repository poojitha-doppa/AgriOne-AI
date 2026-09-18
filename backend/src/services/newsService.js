import axios from 'axios';
import { withRetry } from '../utils/retry.js';
import { generateTextWithLlm } from './llmService.js';

const buildNewsSearchUrl = (title) => {
	const query = encodeURIComponent(`${title || 'agriculture news india'} agriculture india`);
	return `https://news.google.com/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
};

const FALLBACK_NEWS = [
	{
		title: 'Government increases MSP for Kharif crops',
		summary: 'The government raised Minimum Support Prices for major Kharif crops to support farmer income.',
		category: 'Policy',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=Government%20increases%20MSP%20for%20Kharif%20crops%20agriculture%20india&hl=en-IN&gl=IN&ceid=IN:en',
	},
	{
		title: 'New drought-resistant rice variety released',
		summary: 'Scientists developed a rice variety requiring 30% less water with higher yields in dry conditions.',
		category: 'Crops',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=New%20drought-resistant%20rice%20variety%20released%20agriculture%20india&hl=en-IN&gl=IN&ceid=IN:en',
	},
	{
		title: 'Onion prices rise in major markets',
		summary: 'Onion prices increased due to lower supply from producing states. Farmers advised to plan accordingly.',
		category: 'Market',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=Onion%20prices%20rise%20in%20major%20markets%20agriculture%20india&hl=en-IN&gl=IN&ceid=IN:en',
	},
];

const FALLBACK_NEWS_TE = [
	{
		title: 'ఖరీఫ్ పంటల MSPలను ప్రభుత్వం పెంచింది',
		summary: 'రైతుల ఆదాయానికి మద్దతుగా ప్రధాన ఖరీఫ్ పంటల కనీస మద్దతు ధరలను ప్రభుత్వం పెంచింది.',
		category: 'Policy',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=%E0%B0%96%E0%B0%B0%E0%B1%80%E0%B0%AB%E0%B1%8D%20MSP%20%E0%B0%B5%E0%B0%BE%E0%B0%B0%E0%B1%8D%E0%B0%A4%E0%B0%B2%E0%B1%81%20agriculture%20india&hl=te&gl=IN&ceid=IN:te',
	},
	{
		title: 'తక్కువ నీటితో పెరిగే కొత్త వరి రకం విడుదల',
		summary: 'శాస్త్రవేత్తలు 30% తక్కువ నీటితో మంచి దిగుబడి ఇచ్చే కొత్త వరి విత్తన రకాన్ని అభివృద్ధి చేశారు.',
		category: 'Crops',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=%E0%B0%95%E0%B1%8A%E0%B0%A4%E0%B1%8D%E0%B0%A4%20%E0%B0%B5%E0%B0%B0%E0%B0%BF%20%E0%B0%B0%E0%B0%95%E0%B0%82%20agriculture%20india&hl=te&gl=IN&ceid=IN:te',
	},
	{
		title: 'ప్రధాన మార్కెట్లలో ఉల్లిపాయ ధరలు పెరిగాయి',
		summary: 'ఉత్పత్తి రాష్ట్రాల నుంచి సరఫరా తగ్గడంతో ఉల్లిపాయ ధరలు పెరిగాయి. రైతులు మార్కెట్ ప్రణాళికపై దృష్టి పెట్టాలి.',
		category: 'Market',
		source: 'AgriNews',
		url: 'https://news.google.com/search?q=%E0%B0%89%E0%B0%B2%E0%B1%8D%E0%B0%B2%E0%B0%BF%E0%B0%AA%E0%B0%BE%E0%B0%AF%20%E0%B0%A7%E0%B0%B0%E0%B0%B2%E0%B1%81%20agriculture%20india&hl=te&gl=IN&ceid=IN:te',
	},
];

const buildSummaryPrompt = (articles) =>
	`Summarize these agriculture news articles for Indian farmers in simple English.
Respond ONLY with a valid JSON array (no markdown):
${JSON.stringify(
		articles.map((a) => ({ title: a.title, description: a.description || '' })),
		null,
		2
	)}
Format: [{ "title": "...", "summary": "1-2 sentence farmer-friendly summary", "category": "Crops|Market|Policy|Technology|General" }]`.trim();

const toRawNewsItems = (articles) =>
	articles.slice(0, 6).map((a) => ({
		title: a.title || '',
		summary: a.description || 'No summary available.',
		category: 'General',
		source: a.source?.name || '',
		url: a.url || buildNewsSearchUrl(a.title || ''),
	}));

const parseLang = (lang) => {
	const value = String(lang || 'en').toLowerCase();
	return value.startsWith('te') ? 'te' : 'en';
};

const translateTextToTelugu = async (text) => {
	if (!text || !text.trim()) return text;
	if (/[\u0C00-\u0C7F]/.test(text)) return text;

	try {
		const response = await fetch(
			`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(text)}`,
		);

		if (!response.ok) return text;

		const payload = await response.json();
		const translated = Array.isArray(payload?.[0])
			? payload[0].map((chunk) => chunk?.[0] || '').join('')
			: '';

		return translated || text;
	} catch {
		return text;
	}
};

const localizeForLanguage = async (items, lang) => {
	if (lang !== 'te') return items;

	return Promise.all(
		(items || []).map(async (item) => ({
			...item,
			title: await translateTextToTelugu(item.title || ''),
			summary: await translateTextToTelugu(item.summary || ''),
		})),
	);
};

const fetchAndSummarizeNews = async (options = {}) => {
	const lang = parseLang(options.lang);
	const newsApiKey = process.env.NEWS_API_KEY;
	let rawArticles = [];

	if (newsApiKey) {
		try {
			const res = await withRetry(
				() =>
					axios.get('https://newsapi.org/v2/everything', {
						params: {
							q: 'agriculture India farming crops',
							language: 'en',
							sortBy: 'publishedAt',
							pageSize: 6,
							apiKey: newsApiKey,
						},
						timeout: 10000,
					}),
				{ retries: 1, baseDelayMs: 500 }
			);
			rawArticles = res.data?.articles || [];
		} catch (err) {
			console.error('[News] NewsAPI error:', err.message);
		}
	} else {
		console.warn('[News] NEWS_API_KEY not set');
	}

	if (rawArticles.length === 0) {
		console.warn('[News] No articles - returning fallback');
		return lang === 'te' ? FALLBACK_NEWS_TE : FALLBACK_NEWS;
	}

	try {
		const result = await generateTextWithLlm({
			prompt: buildSummaryPrompt(rawArticles),
			temperature: 0.2,
			maxOutputTokens: 1024,
			logTag: 'News',
		});

		if (result?.text) {
			const cleaned = result.text.replace(/```json|```/g, '').trim();
			const summaries = JSON.parse(cleaned);

			if (Array.isArray(summaries) && summaries.length > 0) {
				const normalized = summaries.map((s, i) => ({
					title: s.title || rawArticles[i]?.title || '',
					summary: s.summary || rawArticles[i]?.description || 'No summary available.',
					category: s.category || 'General',
					source: rawArticles[i]?.source?.name || '',
					url: rawArticles[i]?.url || buildNewsSearchUrl(s.title || rawArticles[i]?.title || ''),
				}));

				return localizeForLanguage(normalized, lang);
			}
		}
	} catch (err) {
		console.error('[News] Summarization error:', err.message);
	}

	// Fail-open: always return usable articles instead of bubbling a 500.
	const rawItems = toRawNewsItems(rawArticles);
	return localizeForLanguage(rawItems, lang);
};

export default fetchAndSummarizeNews;