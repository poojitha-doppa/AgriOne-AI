import fetchAndSummarizeNews from '../services/newsService.js';

// GET /api/news
export const getNews = async (req, res) => {
  try {
    console.log('[News] Fetching agriculture news');
    const articles = await fetchAndSummarizeNews({ lang: req.query.lang });

    return res.json({
      success: true,
      message: 'News fetched successfully',
      requestId: req.requestId,
      data: articles,
    });
  } catch (err) {
    console.error('[News] Controller error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};

// GET /api/news/headlines
// Compatibility endpoint used by News/Dashboard pages.
export const getHeadlines = async (req, res) => {
  try {
    console.log('[News] Fetching headlines');
    const items = await fetchAndSummarizeNews({ lang: req.query.lang });

    const articles = (Array.isArray(items) ? items : []).map((item) => ({
      title: item.title || '',
      summary: item.summary || '',
      url: item.url || '',
      source: item.source || 'AgriNews',
      category: item.category || 'news.crops',
      publishedAt: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      articles,
      requestId: req.requestId,
    });
  } catch (err) {
    console.error('[News] Headlines error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};
