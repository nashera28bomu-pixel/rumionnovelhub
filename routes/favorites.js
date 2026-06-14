import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------

ADD FAVORITE
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

// Check if already favorited
const { data: existing } = await supabase
  .from('favorites')
  .select('*')
  .eq('user_id', user_id)
  .eq('novel_id', novel_id)
  .single();

if (existing) {
  return res.status(200).json({
    success: true,
    message: 'Already in favorites'
  });
}

const { data, error } = await supabase
  .from('favorites')
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
  message: 'Added to favorites',
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

GET FAVORITES
*/

router.get('/', authenticate, async (req, res) => {
try {
const user_id = req.user.id;

const { data, error } = await supabase
  .from('favorites')
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

REMOVE FAVORITE
*/

router.delete('/:novel_id', authenticate, async (req, res) => {
try {
const user_id = req.user.id;
const { novel_id } = req.params;

const { error } = await supabase
  .from('favorites')
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
  message: 'Removed from favorites'
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

CHECK FAVORITE STATUS
*/

router.get('/check/:novel_id', authenticate, async (req, res) => {
try {
const user_id = req.user.id;
const { novel_id } = req.params;

const { data, error } = await supabase
  .from('favorites')
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
  favorited: !!data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
