import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/* ============================================================
   VIEWS
   ============================================================ */

// POST /api/interactions/view  { novel_id, novel_type }
router.post('/view', async (req, res) => {
  try {
    const { novel_id, novel_type = 'external' } = req.body;
    if (!novel_id) return res.status(400).json({ success: false, message: 'novel_id required' });

    const { error } = await supabase.rpc('increment_novel_views', {
      p_novel_id: novel_id,
      p_novel_type: novel_type
    });

    // If RPC doesn't exist yet, do a manual upsert
    if (error) {
      await supabase
        .from('novel_views')
        .upsert({ novel_id, novel_type, views: 1 }, { onConflict: 'novel_id', ignoreDuplicates: false });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interactions/view/:novel_id
router.get('/view/:novel_id', async (req, res) => {
  try {
    const { novel_id } = req.params;
    const { data } = await supabase
      .from('novel_views')
      .select('views')
      .eq('novel_id', novel_id)
      .single();

    res.json({ success: true, views: data?.views || 0 });
  } catch (error) {
    res.json({ success: true, views: 0 });
  }
});

/* ============================================================
   RATINGS
   ============================================================ */

// GET /api/interactions/rating/:novel_id
router.get('/rating/:novel_id', optionalAuth, async (req, res) => {
  try {
    const { novel_id } = req.params;

    // Average rating
    const { data: rows } = await supabase
      .from('novel_ratings')
      .select('rating')
      .eq('novel_id', novel_id);

    const ratings = rows || [];
    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;

    // User's own rating if logged in
    let userRating = null;
    if (req.user) {
      const { data: mine } = await supabase
        .from('novel_ratings')
        .select('rating')
        .eq('novel_id', novel_id)
        .eq('user_id', req.user.id)
        .single();
      userRating = mine?.rating || null;
    }

    res.json({ success: true, average: avg, count: ratings.length, userRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interactions/rating  { novel_id, novel_type, rating (1-5) }
router.post('/rating', authenticate, async (req, res) => {
  try {
    const { novel_id, novel_type = 'external', rating } = req.body;

    if (!novel_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'novel_id and rating (1-5) required' });
    }

    const { data, error } = await supabase
      .from('novel_ratings')
      .upsert({
        user_id: req.user.id,
        novel_id,
        novel_type,
        rating: Number(rating)
      }, { onConflict: 'user_id,novel_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   COMMENTS
   ============================================================ */

// GET /api/interactions/comments/:novel_id/:chapter_id
router.get('/comments/:novel_id/:chapter_id', async (req, res) => {
  try {
    const { novel_id, chapter_id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    const { data, error } = await supabase
      .from('chapter_comments')
      .select('*')
      .eq('novel_id', novel_id)
      .eq('chapter_id', chapter_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interactions/comments  { novel_id, chapter_id, novel_type, content }
router.post('/comments', authenticate, async (req, res) => {
  try {
    const { novel_id, chapter_id, novel_type = 'external', content } = req.body;

    if (!novel_id || !chapter_id || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'novel_id, chapter_id and content required' });
    }

    // Fetch username from users table
    const { data: userRow } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', req.user.id)
      .single();

    const username = userRow?.username || userRow?.email?.split('@')[0] || 'Reader';

    const { data, error } = await supabase
      .from('chapter_comments')
      .insert([{
        user_id: req.user.id,
        username,
        novel_id,
        chapter_id,
        novel_type,
        content: content.trim()
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/interactions/comments/:id  (own comments only)
router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('chapter_comments')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
