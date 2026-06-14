import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------

ADD BOOKMARK
*/

router.post('/', authenticate, async (req, res) => {
try {
const { novel_id, novel_title, cover } = req.body;

if (!novel_id) {
  return res.status(400).json({
    success: false,
    message: 'novel_id is required'
  });
}

const user_id = req.user.id;

// Check if already bookmarked
const { data: existing } = await supabase
  .from('bookmarks')
  .select('*')
  .eq('user_id', user_id)
  .eq('novel_id', novel_id)
  .single();

if (existing) {
  return res.status(200).json({
    success: true,
    message: 'Already bookmarked'
  });
}

const { data, error } = await supabase
  .from('bookmarks')
  .insert([
    {
      user_id,
      novel_id,
      novel_title,
      cover,
      created_at: new Date().toISOString()
    }
  ])
  .select()
  .single();

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'Bookmark added',
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

GET USER BOOKMARKS
*/

router.get('/', authenticate, async (req, res) => {
try {
const user_id = req.user.id;

const { data, error } = await supabase
  .from('bookmarks')
  .select('*')
  .eq('user_id', user_id)
  .order('created_at', { ascending: false });

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

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

REMOVE BOOKMARK
*/

router.delete('/:novel_id', authenticate, async (req, res) => {
try {
const user_id = req.user.id;
const { novel_id } = req.params;

const { error } = await supabase
  .from('bookmarks')
  .delete()
  .eq('user_id', user_id)
  .eq('novel_id', novel_id);

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'Bookmark removed'
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

CHECK IF BOOKMARKED
*/

router.get('/check/:novel_id', authenticate, async (req, res) => {
try {
const user_id = req.user.id;
const { novel_id } = req.params;

const { data, error } = await supabase
  .from('bookmarks')
  .select('id')
  .eq('user_id', user_id)
  .eq('novel_id', novel_id)
  .single();

if (error && error.code !== 'PGRST116') {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  bookmarked: !!data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
