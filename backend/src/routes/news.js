import { Router } from 'express';
import fetchAndSummarizeNews from '../services/newsService.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

const AGRI_TERMS = [
  'agriculture',
  'agricultural',
  'farming',
  'farmer',
  'farmers',
  'crop',
  'crops',
  'harvest',
  'irrigation',
  'soil',
  'fertilizer',
  'pesticide',
  'seed',
  'mandi',
  'msp',
  'kharif',
  'rabi',
  'agri',
  'livestock',
  'dairy',
  'horticulture',
  'aquaculture',
  'sericulture',
  'agronomy',
  'soymeal',
  'soybean',
  'oilseed',
  'poultry',
  'fodder',
  'grain',
  'millet',
  'millets',
  'pulse',
  'pulses',
  'produce',
  'yield',
  'commodity',
  'export',
  'import',
];

const STRONG_TERMS = [
  'agriculture',
  'agricultural',
  'farming',
  'farmer',
  'farmers',
  'crop',
  'crops',
  'harvest',
  'irrigation',
  'livestock',
  'dairy',
  'horticulture',
  'aquaculture',
  'sericulture',
  'agronomy',
  'msp',
  'kharif',
  'rabi',
  'agri',
];

const IRRELEVANT_TERMS = [
  'crypto',
  'bitcoin',
  'fifa',
  'world cup',
  'movie',
  'netflix',
  'honeymoon',
  'celebrity',
  'spacex ipo',
  'prediction market',
  'video game',
  'gaming',
  'football',
  'baseball',
  'basketball',
  'tennis',
  'horoscope',
  'astrology',
  'zodiac',
  'murder',
  'suicide',
  'crime',
  'arrest',
  'celeb',
  'entertainment',
  'bollywood',
  'theft',
  'dies',
  'death',
  'killed',
  'hanged',
  'daughter',
  'complaint',
  'custody',
  'assault',
  'rape',
];

const IRRELEVANT_TITLE_PATTERNS = [
  /\bhoroscope\b/i,
  /\bzodiac\b/i,
  /\bcrime\b/i,
  /\bmurder\b/i,
  /\barrest(ed)?\b/i,
  /\btheft\b/i,
  /\bhanged\b/i,
  /\bdeath\b/i,
  /\bdies\b/i,
  /\bdaughter\b/i,
  /\bcelebrity\b/i,
  /\bmatch\b/i,
  /\bmovie\b/i,
  /\bipl\b/i,
];

const TRUSTED_AGRI_DOMAINS = [
  'agriculture.com',
  'agriland.ie',
  'farmprogress.com',
  'agri-pulse.com',
  'thecattlesite.com',
  'fao.org',
  'usda.gov',
  'agrifarming.in',
  'krishijagran.com',
  'downtoearth.org.in',
];

const CREDIBLE_NEWS_DOMAINS = [
  ...TRUSTED_AGRI_DOMAINS,
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'thehindu.com',
  'indianexpress.com',
  'timesofindia.indiatimes.com',
  'economictimes.indiatimes.com',
  'aljazeera.com',
  'cbc.ca',
  'theconversation.com',
  'business-standard.com',
  'financialexpress.com',
  'theprint.in',
  'pib.gov.in',
];

const AP_TELUGU_DOMAINS = [
  'eenadu.net',
  'sakshi.com',
  'andhrajyothy.com',
  'andhraprabha.com',
  'ap7am.com',
  'v6velugu.com',
  'ntvtelugu.com',
  'tv9telugu.com',
  'hmtv.in',
  'telugusamayam.com',
  '10tv.in',
  'greatandhra.com',
];

const AP_TELUGU_SOURCE_NAMES = [
  'Eenadu',
  'Sakshi',
  'Andhra Jyothy',
  'Andhra Prabha',
  'V6 Velugu',
  'NTV Telugu',
  'TV9 Telugu',
  'HMTV',
  'Telugu Samayam',
  '10TV',
  'Greatandhra',
];

const TELUGU_SOURCE_NAME_MAP = {
  'Sakshi': 'సాక్షి',
  'Andhra Jyothy': 'ఆంధ్ర జ్యోతి',
  'Andhrajyothy': 'ఆంధ్ర జ్యోతి',
  'Andhra Prabha': 'ఆంధ్ర ప్రభ',
  'Eenadu': 'ఈనాడు',
  'eenadu pratibha': 'ఈనాడు ప్రతిభ',
  'V6 Velugu': 'వి6 వెలుగు',
  'NTV Telugu': 'ఎన్టీవీ తెలుగు',
  'TV9 Telugu': 'టీవీ9 తెలుగు',
  'HMTV': 'హెచ్ఎంటీవీ',
  'Telugu Samayam': 'తెలుగు సమయం',
  '10TV': '10టీవీ',
  'Greatandhra': 'గ్రేట్ ఆంధ్ర',
  'AgriNews': 'వ్యవసాయ వార్తలు',
  'Unknown source': 'తెలియని మూలం',
};

const localizeSourceName = (sourceName, lang) => {
  const source = sourceName || 'Unknown source';
  if (lang !== 'te') return source;

  const exact = TELUGU_SOURCE_NAME_MAP[source];
  if (exact) return exact;

  const matchKey = Object.keys(TELUGU_SOURCE_NAME_MAP).find((key) =>
    source.toLowerCase().includes(key.toLowerCase())
  );
  return matchKey ? TELUGU_SOURCE_NAME_MAP[matchKey] : source;
};

const AP_TELUGU_TERMS = [
  'వ్యవసాయం',
  'వ్యవసాయ',
  'రైతు',
  'రైతులు',
  'పంట',
  'పంటలు',
  'పంటల',
  'ఎరువులు',
  'ఎరువు',
  'నీటిపారుదల',
  'సాగు',
  'సేద్యం',
  'పొలం',
  'వరి',
  'మిర్చి',
  'పప్పు ధాన్యాలు',
  'నూనె గింజలు',
  'పొగాకు',
  'ప్రభుత్వ పథకం',
  'సబ్సిడీ',
  'చెరకు',
  'పాల ఉత్పత్తి',
  'వ్యవసాయ శాఖ',
  'సేంద్రియ',
  'ప్రకృతి',
];

const AP_TELUGU_AGRI_TERMS = [
  'వ్యవసాయం',
  'వ్యవసాయ',
  'రైతు',
  'రైతులు',
  'పంట',
  'పంటలు',
  'పంటల',
  'ఎరువు',
  'ఎరువులు',
  'సాగు',
  'సేద్యం',
  'పొలం',
  'నీటిపారుదల',
  'వరి',
  'మిర్చి',
  'పప్పు',
  'ధాన్యం',
  'నూనె గింజలు',
  'చెరకు',
  'సేంద్రియ',
  'వ్యవసాయ శాఖ',
  'మద్దతు ధర',
  'agriculture',
  'farmer',
  'farming',
  'crop',
  'harvest',
  'irrigation',
  'fertilizer',
  'seed',
  'mandi',
  'msp',
  'horticulture',
  'dairy',
  'livestock',
];

const AP_TELUGU_NON_AGRI_TERMS = [
  'రాజకీయ',
  'ఎన్నిక',
  'మంత్రి',
  'ముఖ్యమంత్రి',
  'సీఎం',
  'ఎమ్మెల్యే',
  'ఎంపీ',
  'కాంగ్రెస్',
  'బీజేపీ',
  'వైసీపీ',
  'టిడిపి',
  'నేరం',
  'హత్య',
  'అరెస్ట్',
  'సినిమా',
  'హీరో',
  'నటి',
  'క్రీడ',
  'క్రికెట్',
  'టెస్ట్ మ్యాచ్',
  'ipl',
  'politics',
  'election',
  'crime',
  'murder',
  'arrest',
  'movie',
  'cinema',
  'actor',
  'actress',
  'sports',
  'cricket',
];

const AP_TELUGU_STRONG_TERMS = [
  'వ్యవసాయం',
  'వ్యవసాయ',
  'రైతు',
  'రైతులు',
  'పంట',
  'పంటల',
  'ఎరువులు',
  'ఎరువు',
  'నీటిపారుదల',
  'సాగు',
  'సేద్యం',
  'వరి',
  'మిర్చి',
  'సబ్సిడీ',
  'సేంద్రియ',
  'మద్దతు ధర',
];

const normalize = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const countMatches = (text, terms) => terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

const isIrrelevant = (text) => hasAny(text, IRRELEVANT_TERMS);

const isTeluguScript = (text) => /[\u0C00-\u0C7F]/.test(text);

const isApAgricultureArticle = (article) => {
  const combined = normalize(`${article?.title ?? ''} ${article?.description ?? ''} ${article?.content ?? ''}`);
  const agriHits = countMatches(combined, AP_TELUGU_AGRI_TERMS);
  const hasNonAgriNoise = hasAny(combined, AP_TELUGU_NON_AGRI_TERMS);

  return agriHits >= 1 && !hasNonAgriNoise;
};

const isGlobalAgricultureArticle = (article) => {
  const combined = normalize(`${article?.title ?? ''} ${article?.description ?? ''} ${article?.content ?? ''}`);
  const strongHits = countMatches(combined, STRONG_TERMS);
  const agriHits = countMatches(combined, AGRI_TERMS);
  return (strongHits > 0 || agriHits >= 2) && !isIrrelevant(combined);
};

const getRegionConfig = (region) => {
  const normalized = normalize(region);
  if (normalized === 'ap' || normalized === 'andhra' || normalized === 'telugu') {
    return {
      region: 'ap',
      domains: AP_TELUGU_DOMAINS,
      queryTerms: ['వ్యవసాయం', 'రైతు', 'పంట', 'agriculture', 'farmer', 'crop'],
      strongTerms: [...AP_TELUGU_STRONG_TERMS, ...STRONG_TERMS],
      language: null,
      minimumScore: 4,
    };
  }

  return {
    region: 'global',
    domains: CREDIBLE_NEWS_DOMAINS,
    queryTerms: ['agriculture', 'farming', 'farmer', 'crop', 'harvest', 'irrigation'],
    strongTerms: STRONG_TERMS,
    language: 'en',
    minimumScore: 4,
  };
};

const isTrustedSource = (articleUrl) => {
  try {
    const hostname = new URL(articleUrl).hostname.toLowerCase().replace(/^www\./, '');
    return TRUSTED_AGRI_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const isCredibleSource = (articleUrl) => {
  try {
    const hostname = new URL(articleUrl).hostname.toLowerCase().replace(/^www\./, '');
    return CREDIBLE_NEWS_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const looksLikeVersionOrPackageTitle = (title) => {
  const normalized = normalize(title);
  const hasVersionPattern = /\b(v?\d+\.\d+(?:\.\d+)*)\b/.test(normalized);
  const packageLikeWords = ['pypi', 'release notes', 'download', 'apk', 'iso'];
  return hasVersionPattern && hasAny(normalized, packageLikeWords);
};

const inferCategory = (text) => {
  const normalized = normalize(text);

  if (hasAny(normalized, ['policy', 'scheme', 'subsidy', 'insurance', 'msp', 'ministry', 'government'])) {
    return 'news.policy';
  }
  if (hasAny(normalized, ['price', 'market', 'mandi', 'export', 'import', 'commodity', 'trade'])) {
    return 'news.market';
  }
  if (hasAny(normalized, ['technology', 'ai', 'drone', 'sensor', 'startup', 'innovation', 'agritech'])) {
    return 'news.technology';
  }
  return 'news.crops';
};

const scoreArticle = (article, allowedDomains, strongTerms, minimumScore, allowedSourceNames = []) => {
  const title = normalize(article.title);
  const description = normalize(article.description);
  const content = normalize(article.content);
  const sourceName = normalize(article.source?.name);
  const sourceUrl = article.source?.url || article.url || '';
  const combined = `${title} ${description} ${content} ${sourceName}`.trim();
  const strongAgriHits = countMatches(combined, STRONG_TERMS);

  if (!title || !article.url) {
    return -100;
  }

  if (IRRELEVANT_TITLE_PATTERNS.some((p) => p.test(title))) {
    return -100;
  }

  if (isIrrelevant(combined) && strongAgriHits < 2) {
    return -100;
  }
  const isAllowedDomain = allowedDomains.some((domain) => {
    try {
      const hostname = new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, '');
      return hostname === domain || hostname.endsWith(`.${domain}`);
    } catch {
      return false;
    }
  });

  const isAllowedSourceName = allowedSourceNames.some((sourceNameCandidate) => {
    const normalizedSourceName = normalize(sourceNameCandidate);
    return normalizedSourceName && sourceName.includes(normalizedSourceName);
  });

  if (!isAllowedDomain && !isAllowedSourceName) {
    return -100;
  }
  if (isIrrelevant(combined)) {
    return -100;
  }
  if (looksLikeVersionOrPackageTitle(title)) {
    return -100;
  }

  const strongTitleHits = countMatches(title, strongTerms);
  const titleHits = countMatches(title, AGRI_TERMS);
  const bodyHits = countMatches(`${description} ${content}`, AGRI_TERMS);
  const trustedBoost = isTrustedSource(sourceUrl) ? 3 : 0;

  if (strongTitleHits === 0 && titleHits < 2) {
    return -100;
  }

  let score = 0;
  score += strongTitleHits * 4;
  score += titleHits * 2;
  score += Math.min(bodyHits, 4);
  score += trustedBoost;

  if (titleHits === 0 && bodyHits === 0 && trustedBoost === 0) {
    score -= 3;
  }

  return score >= minimumScore ? score : -100;
};

const fetchNewsApi = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`News API request failed with status ${response.status}: ${errorBody}`);
  }
  return response.json();
};

const chunkArray = (values, size) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const fetchArticlesForDomains = async (apiKey, config) => {
  const query = encodeURIComponent(config.queryTerms.join(' OR '));
  const languageQuery = config.language ? `&language=${config.language}` : '';
  const domainGroups = chunkArray(config.domains, config.region === 'ap' ? 4 : config.domains.length);
  const articles = [];

  for (const domainGroup of domainGroups) {
    if (domainGroup.length === 0) {
      continue;
    }

    const domainList = encodeURIComponent(domainGroup.join(','));
    const url = `https://newsapi.org/v2/everything?q=${query}&domains=${domainList}&searchIn=title,description${languageQuery}&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`;
    try {
      const payload = await fetchNewsApi(url);
      articles.push(...(payload.articles ?? []));
    } catch (error) {
      // Avoid hard-failing the endpoint when NewsAPI quota is exceeded.
      // The caller can still use Google News RSS fallback for AP/Telugu.
      if (String(error?.message || '').includes('status 429')) {
        break;
      }
    }
  }

  return articles;
};

const decodeXmlEntities = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractXmlTag = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return match ? decodeXmlEntities(match[1].trim()) : '';
};

const fetchGoogleNewsRss = async (config, lang) => {
  const hl = lang === 'te' ? 'te' : 'en';
  const ceid = lang === 'te' ? 'IN:te' : 'IN:en';
  const queryTerms = config.queryTerms.slice(0, 4).join(' ');
  const domainGroups = chunkArray(config.domains, 3);
  const articles = [];

  for (const domainGroup of domainGroups) {
    const siteQuery = domainGroup.map((domain) => `site:${domain}`).join(' OR ');
    const query = encodeURIComponent(`${queryTerms} ${siteQuery}`.trim());
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=${hl}&gl=IN&ceid=${ceid}`;
    const response = await fetch(rssUrl);

    if (!response.ok) {
      continue;
    }

    const xml = await response.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

    for (const item of itemMatches) {
      const title = extractXmlTag(item, 'title');
      const link = extractXmlTag(item, 'link');
      const sourceMatch = item.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);
      const sourceUrl = sourceMatch ? decodeXmlEntities(sourceMatch[1].trim()) : '';
      const source = sourceMatch ? decodeXmlEntities(sourceMatch[2].trim()) : 'Google News';
      const publishedAt = extractXmlTag(item, 'pubDate');

      if (!title || !link || !publishedAt) {
        continue;
      }

      articles.push({
        title,
        description: title,
        content: title,
        url: link,
        urlToImage: undefined,
        source: { name: source, url: sourceUrl },
        publishedAt,
      });
    }
  }

  return articles;
};

const buildArticle = (article, lang = 'en') => ({
  title: article.title,
  summary: article.description || 'No summary available.',
  url: article.url,
  image: article.urlToImage,
  source: localizeSourceName(article.source?.name || 'Unknown source', lang),
  publishedAt: article.publishedAt,
  category: inferCategory(`${article.title ?? ''} ${article.description ?? ''} ${article.content ?? ''}`),
});

const maybeTranslateArticle = async (article, lang) => {
  if (lang !== 'te') {
    return article;
  }

  const translateIfNeeded = async (text) => {
    if (!text || isTeluguScript(text)) {
      return text;
    }

    return translateTextToTelugu(text);
  };

  return {
    ...article,
    title: await translateIfNeeded(article.title),
    summary: await translateIfNeeded(article.summary),
    source: localizeSourceName(article.source, lang),
  };
};

const translateTextToTelugu = async (text) => {
  if (!text || !text.trim()) {
    return text;
  }

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(text)}`,
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

const localizeArticles = async (articles, lang) => {
  if (lang !== 'te') {
    return articles;
  }

  return Promise.all(articles.map((article) => maybeTranslateArticle(article, lang)));
};

const buildScopedRssArticles = (rssArticles, lang, config, limit) => {
  const scoped = (rssArticles || [])
    .filter((article) => article?.title && article?.url && article?.publishedAt)
    .filter((article) => (config.region === 'ap' ? isApAgricultureArticle(article) : isGlobalAgricultureArticle(article)))
    .sort(compareByNewestPublishedAt)
    .slice(0, limit)
    .map((article) => buildArticle(article, lang));

  return scoped;
};

const compareByNewestPublishedAt = (left, right) => {
  const rightTime = new Date(right.article?.publishedAt || right.publishedAt || 0).getTime();
  const leftTime = new Date(left.article?.publishedAt || left.publishedAt || 0).getTime();
  return rightTime - leftTime;
};

router.get('/headlines', async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 50));
    const rawLang = String(req.query.lang || 'en').toLowerCase();
    const lang = rawLang.startsWith('te') ? 'te' : 'en';
    const region = String(req.query.region || (lang === 'te' ? 'ap' : 'global')).toLowerCase();
    const config = getRegionConfig(region);

    // Prefer domain-focused RSS fallback when NewsAPI key is missing.
    if (!apiKey) {
      const rssArticles = await fetchGoogleNewsRss(config, lang);
      const rssScoped = buildScopedRssArticles(rssArticles, lang, config, limit);
      const localizedRss = await localizeArticles(rssScoped, lang);

      if (localizedRss.length > 0) {
        return res.json({
          count: localizedRss.length,
          articles: localizedRss,
        });
      }
    }

    if (!apiKey) {
      const fallbackItems = await fetchAndSummarizeNews({ lang });
      return res.json({
        count: Math.min(limit, fallbackItems.length),
        articles: fallbackItems.slice(0, limit).map((item) => ({
          title: item.title || '',
          summary: item.summary || '',
          url: item.url || '',
          source: localizeSourceName(item.source || 'AgriNews', lang),
          publishedAt: new Date().toISOString(),
          category: inferCategory(`${item.title || ''} ${item.summary || ''}`),
        })),
      });
    }

    let combined = [];
    try {
      combined = await fetchArticlesForDomains(apiKey, config);
    } catch (error) {
      console.warn(`[News] NewsAPI primary fetch failed (${config.region}/${lang}): ${error.message}`);
      combined = [];
    }
    const seen = new Set();

    const scoreAndBuild = (articles) => {
      seen.clear();

      return articles
        .filter((article) => article?.title && article?.url && article?.publishedAt)
        .filter((article) => {
          if (lang !== 'te') {
            const text = `${article?.title ?? ''} ${article?.description ?? ''}`;
            return !isTeluguScript(text);
          }
          return true;
        })
        .filter((article) => {
          if (seen.has(article.url)) {
            return false;
          }
          seen.add(article.url);
          return true;
        })
        .map((article) => ({
          article,
          score: scoreArticle(
            article,
            config.domains,
            config.strongTerms,
            config.minimumScore,
            config.region === 'ap' ? AP_TELUGU_SOURCE_NAMES : [],
          ),
        }))
        .filter((item) => item.score >= 4)
        .sort((left, right) => right.score - left.score)
        .sort(compareByNewestPublishedAt)
        .slice(0, limit)
        .map(({ article }) => buildArticle(article, lang));
    };

    let scored = scoreAndBuild(combined);

    if (scored.length === 0) {
      try {
        const rssArticles = await fetchGoogleNewsRss(config, lang);
        scored = buildScopedRssArticles(rssArticles, lang, config, limit);
      } catch {
        scored = [];
      }
    }

    if (scored.length === 0) {
      const fallbackItems = await fetchAndSummarizeNews({ lang });
      return res.json({
        count: Math.min(limit, fallbackItems.length),
        articles: fallbackItems.slice(0, limit).map((item) => ({
          title: item.title || '',
          summary: item.summary || '',
          url: item.url || '',
          source: localizeSourceName(item.source || 'AgriNews', lang),
          publishedAt: new Date().toISOString(),
          category: inferCategory(`${item.title || ''} ${item.summary || ''}`),
        })),
      });
    }

    const localizedArticles = await localizeArticles(scored, lang);

    return res.json({
      count: localizedArticles.length,
      articles: localizedArticles,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to fetch agriculture news',
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const lang = String(req.query.lang || 'en').toLowerCase().startsWith('te') ? 'te' : 'en';
    const articles = await fetchAndSummarizeNews({ lang });

    return res.json({
      success: true,
      message: 'News fetched successfully',
      requestId: req.requestId,
      data: (Array.isArray(articles) ? articles : []).map((item) => ({
        ...item,
        category: item.category || inferCategory(`${item.title || ''} ${item.summary || ''}`),
        publishedAt: item.publishedAt || new Date().toISOString(),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch agriculture news',
      requestId: req.requestId,
    });
  }
});

router.get('/translate', async (req, res) => {
  try {
    const text = typeof req.query.text === 'string' ? req.query.text : '';
    if (!text.trim()) {
      return res.status(400).json({ error: 'text query parameter is required' });
    }

    const translated = await translateTextToTelugu(text);
    return res.json({ translated });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

export default router;
