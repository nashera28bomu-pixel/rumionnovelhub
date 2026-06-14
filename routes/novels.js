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

  if (cached) {
    return cached;
  }

  const data = await fetchFn();

  cache.set(key, data, ttl);

  return data;
};

const handleError = (res, error) => {
  console.error('Novel Route Error:', error.message);

  return res.status(500).json({
    success: false,
    message: error.message
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

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* FEATURED NOVELS */
/* GET /api/novels/featured */
/* -------------------------------------------------------------------------- */

router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const data = await getCachedOrFetch(
      `featured:${page}:${limit}`,
      () => novelApi.getFeatured({ page, limit }),
      1800
    );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* SINGLE CHAPTER */
/* GET /api/novels/chapter/:id */
/* -------------------------------------------------------------------------- */

router.get('/chapter/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getCachedOrFetch(
      `chapter:${id}`,
      () => novelApi.getChapter(id),
      86400
    );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* CHAPTER LIST */
/* GET /api/novels/:id/chapters */
/* -------------------------------------------------------------------------- */

router.get('/:id/chapters', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      order = 'ASC'
    } = req.query;

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

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* RECOMMENDATIONS */
/* GET /api/novels/:id/recommendations */
/* -------------------------------------------------------------------------- */

router.get('/:id/recommendations', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await getCachedOrFetch(
      `recommendations:${id}:${page}:${limit}`,
      () =>
        novelApi.getRecommendations({
          novelId: id,
          page,
          limit
        }),
      3600
    );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* RANKINGS */
/* GET /api/novels/rankings/:rank */
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

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

/* -------------------------------------------------------------------------- */
/* NOVEL DETAILS */
/* IMPORTANT: MUST BE LAST */
/* GET /api/novels/:detailPath */
/* -------------------------------------------------------------------------- */

router.get('/:detailPath', optionalAuth, async (req, res) => {
  try {
    const { detailPath } = req.params;

    const data = await getCachedOrFetch(
      `novel:${detailPath}`,
      () => novelApi.getNovel(detailPath),
      86400
    );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;
