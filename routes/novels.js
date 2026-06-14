import express from 'express';
import novelApi from '../services/novelApi.js';
import cache from '../utils/cache.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------

CACHE HELPER
*/

const getCachedOrFetch = async (key, fetchFn, ttl = 3600) => {
const cached = cache.get(key);
if (cached) return cached;

const data = await fetchFn();
cache.set(key, data, ttl);
return data;
};

/*
|--------------------------------------------------------------------------

SEARCH NOVELS
*/

router.get('/search', optionalAuth, async (req, res) => {
try {
const { q, page = 1 } = req.query;

if (!q) {
  return res.status(400).json({
    success: false,
    message: 'Search query is required'
  });
}

const cacheKey = `search:${q}:${page}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.search({ q, page })
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

FEATURED NOVELS
*/

router.get('/featured', optionalAuth, async (req, res) => {
try {
const { page = 1, limit = 20 } = req.query;

const cacheKey = `featured:${page}:${limit}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getFeatured({ page, limit }),
  1800
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

NOVEL DETAILS
*/

router.get('/:detailPath', optionalAuth, async (req, res) => {
try {
const { detailPath } = req.params;

const cacheKey = `novel:${detailPath}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getNovel(detailPath),
  86400
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

CHAPTER LIST
*/

router.get('/:id/chapters', optionalAuth, async (req, res) => {
try {
const { id } = req.params;
const { page = 1, limit = 50, order = 'ASC' } = req.query;

const cacheKey = `chapters:${id}:${page}:${order}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getChapters({ id, page, limit, order }),
  86400
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

SINGLE CHAPTER
*/

router.get('/chapter/:id', optionalAuth, async (req, res) => {
try {
const { id } = req.params;

const cacheKey = `chapter:${id}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getChapter(id),
  86400
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

RECOMMENDATIONS
*/

router.get('/:id/recommendations', optionalAuth, async (req, res) => {
try {
const { id } = req.params;
const { page = 1, limit = 10 } = req.query;

const cacheKey = `recommend:${id}:${page}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getRecommendations({
    novelId: id,
    page,
    limit
  }),
  3600
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

RANKINGS
*/

router.get('/rankings/:rank', optionalAuth, async (req, res) => {
try {
const { rank } = req.params;
const { page = 1, limit = 20 } = req.query;

const cacheKey = `rankings:${rank}:${page}`;

const data = await getCachedOrFetch(
  cacheKey,
  () => novelApi.getRankings({ rank, page, limit }),
  3600
);

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
