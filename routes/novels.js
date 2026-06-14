import express from 'express';
import novelApi from '../services/novelApi.js';
import cache from '../utils/cache.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* CACHE HELPER */
/* -------------------------------------------------------------------------- */

const getCachedOrFetch = async (key, fetchFn, ttl = 3600) => {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetchFn();
  cache.set(key, data, ttl);

  return data;
};

/* -------------------------------------------------------------------------- */
/* ERROR HANDLER */
/* -------------------------------------------------------------------------- */

const handleError = (res, error, context = 'Novel API Error') => {
  console.error(`🔥 ${context}:`, error.message);

  return res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

/* -------------------------------------------------------------------------- */
/* SEARCH NOVELS */
/* GET /api/novels/search?q=solo&page=1 */
/* -------------------------------------------------------------------------- */

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const data = await getCachedOrFetch(
      `search:${q}:${page}`,
      () => novelApi.search({ q, page })
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Search failed');
  }
});

/* -------------------------------------------------------------------------- */
/* FEATURED NOVELS */
/* -------------------------------------------------------------------------- */

router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const data = await getCachedOrFetch(
      `featured:${page}:${limit}`,
      () => novelApi.getFeatured({ page, limit }),
      1800
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Featured failed');
  }
});

/* -------------------------------------------------------------------------- */
/* CHAPTER LIST */
/* GET /api/novels/:id/chapters */
/* -------------------------------------------------------------------------- */

router.get('/:id/chapters', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, order = 'ASC' } = req.query;

    const data = await getCachedOrFetch(
      `chapters:${id}:${page}:${limit}:${order}`,
      () =>
        novelApi.getChapters({
          id,
          page,
          limit,
          order
        }),
      86400
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Chapter list failed');
  }
});

/* -------------------------------------------------------------------------- */
/* SINGLE CHAPTER (IMPORTANT FIXED FLOW) */
/*
IMPORTANT:
Your API actually returns chapterId-based content from:
novelApi.getChapter(id)
*/
/* -------------------------------------------------------------------------- */

router.get('/chapter/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'chapter id is required'
      });
    }

    const data = await getCachedOrFetch(
      `chapter:${id}`,
      () => novelApi.getChapter(id),
      86400
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Chapter fetch failed');
  }
});

/* -------------------------------------------------------------------------- */
/* RECOMMENDATIONS */
/* -------------------------------------------------------------------------- */

router.get('/:id/recommendations', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await getCachedOrFetch(
      `recommend:${id}:${page}:${limit}`,
      () =>
        novelApi.getRecommendations({
          novelId: id,
          page,
          limit
        }),
      3600
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Recommendations failed');
  }
});

/* -------------------------------------------------------------------------- */
/* RANKINGS */
/* -------------------------------------------------------------------------- */

router.get('/rankings/:rank', optionalAuth, async (req, res) => {
  try {
    const { rank } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const data = await getCachedOrFetch(
      `rankings:${rank}:${page}:${limit}`,
      () =>
        novelApi.getRankings({
          rank,
          page,
          limit
        }),
      3600
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Rankings failed');
  }
});

/* -------------------------------------------------------------------------- */
/* NOVEL DETAILS (KEEP LAST - IMPORTANT) */
/* -------------------------------------------------------------------------- */

router.get('/:detailPath', optionalAuth, async (req, res) => {
  try {
    const { detailPath } = req.params;

    const data = await getCachedOrFetch(
      `novel:${detailPath}`,
      () => novelApi.getNovel(detailPath),
      86400
    );

    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Novel details failed');
  }
});

export default router;
